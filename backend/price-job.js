import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const bucket = process.env.STORAGE_BUCKET || 'uploads';

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    Papa.parse(buffer.toString(), {
      complete: results => {
        if (results.errors.length) reject(results.errors[0].message);
        else resolve(results.data);
      },
      skipEmptyLines: true,
    });
  });
}

async function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
  return data;
}

function validateRows(rows) {
  if (!rows.length) throw new Error('No rows');
  const headers = rows[0].map(h => String(h).trim().toLowerCase());
  if (headers[0] !== 'manufacturer' || headers[1] !== 'part no') {
    throw new Error('Invalid header row');
  }
  return rows.slice(1).filter(r => r[0] && r[1]);
}

async function fetchPrices(query) {
  const response = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.products) ? data.products.slice(0, 3) : [];
}

export async function run(userId, filePath, fileName) {
  const { data: blob, error } = await supabase.storage.from(bucket).download(filePath);
  if (error || !blob) throw new Error(`Download failed: ${error?.message}`);
  const buffer = await blob.arrayBuffer();
  let rows;
  if (fileName.endsWith('.csv')) rows = await parseCsv(Buffer.from(buffer));
  else rows = await parseExcel(Buffer.from(buffer));

  const dataRows = validateRows(rows);

  const jobResults = [];

  for (const row of dataRows) {
    const manufacturer = String(row[0]);
    const partNo = String(row[1]);
    const products = await fetchPrices(`${manufacturer} ${partNo}`);

    if (products.length) {
      for (const p of products) {
        await supabase.from('price_results').insert({
          user_id: userId,
          manufacturer,
          part_no: partNo,
          shop: p.brand || p.title || 'unknown',
          price: p.price,
          currency: 'EUR',
        });
      }
      jobResults.push({ manufacturer, partNo, price: products[0].price });
    } else {
      jobResults.push({ manufacturer, partNo, price: null });
    }
  }

  return jobResults;
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const [userId, path, name] = process.argv.slice(2);
  if (!userId || !path || !name) {
    console.error('Usage: node price-job.js <userId> <filePath> <fileName>');
    process.exit(1);
  }

  run(userId, path, name).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
