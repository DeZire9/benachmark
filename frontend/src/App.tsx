import { useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import './App.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);
const bucket = import.meta.env.VITE_STORAGE_BUCKET || 'uploads';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'overview'>('upload');
  const [overview, setOverview] = useState<{ filename: string; rows: string[][] }[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchOverview = async () => {
      if (activeTab !== 'overview' || !user) return;
      setLoadingOverview(true);
      setError(null);
      const { data, error } = await supabase
        .from('file_uploads')
        .select('path, filename')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });
      if (error) {
        setError(`Fehler beim Laden: ${error.message}`);
        setLoadingOverview(false);
        return;
      }
      const files = data || [];
      const result: { filename: string; rows: string[][] }[] = [];
      for (const f of files) {
        const { data: blob, error: dErr } = await supabase.storage
          .from(bucket)
          .download(f.path);
        if (dErr || !blob) continue;
        const fileObj = new File([blob], f.filename);
        try {
          let rows: string[][] = [];
          if (f.filename.endsWith('.csv')) {
            rows = await parseCsvFile(fileObj);
          } else if (f.filename.endsWith('.xls') || f.filename.endsWith('.xlsx')) {
            rows = await parseExcelFile(fileObj);
          }
          if (rows.length) {
            result.push({ filename: f.filename, rows });
          }
        } catch (e) {
          // ignore parse errors
        }
      }
      setOverview(result);
      setLoadingOverview(false);
    };
    fetchOverview();
  }, [activeTab, user]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.signUp({ email, password });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const parseCsvFile = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(file, {
        complete: results => {
          if (results.errors.length) {
            reject(results.errors[0].message);
          } else {
            resolve(results.data as string[][]);
          }
        },
        skipEmptyLines: true,
      });
    });
  };

  const parseExcelFile = async (file: File): Promise<string[][]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
    return data as string[][];
  };

  const validateRows = (data: string[][]): boolean => {
    if (data.length === 0) {
      setError('Die Datei ist leer.');
      return false;
    }
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    if (headers[0] !== 'manufacturer' || headers[1] !== 'part no') {
      setError('Die erste Zeile muss "manufacturer" und "part no" enthalten.');
      return false;
    }
    for (let i = 1; i < data.length; i++) {
      const row = data[i] || [];
      const cells = row.map(cell => String(cell).trim());
      if (cells.every(c => c === '')) continue;
      if (cells[0] === '' || cells[1] === '') {
        setError(`Zeile ${i + 1} muss Werte in Spalte 1 und 2 haben.`);
        return false;
      }
    }
    return true;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);

    let data: string[][];
    try {
      if (file.name.endsWith('.csv')) {
        data = await parseCsvFile(file);
      } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
        data = await parseExcelFile(file);
      } else {
        setError('Nur CSV oder Excel Dateien erlaubt.');
        return;
      }
    } catch (err) {
      setError(`Fehler beim Parsen: ${err}`);
      return;
    }

    if (!validateRows(data)) return;
    setRows(data);

    if (!user) return;
    const uploadPath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(uploadPath, file);
    if (uploadError) {
      setError(`Upload fehlgeschlagen: ${uploadError.message}`);
      return;
    }
    await supabase.from('file_uploads').insert({
      user_id: user.id,
      path: uploadPath,
      filename: file.name,
      uploaded_at: new Date().toISOString(),
    });
    setMessage('Datei erfolgreich hochgeladen.');
  };

  const downloadFile = async (filePath: string, downloadName: string) => {
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) {
      setError(`Download fehlgeschlagen: ${error.message}`);
      return;
    }
    if (!data) return;
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => downloadFile('sample.csv', 'sample.csv');

  const downloadXlsx = () => downloadFile('sample.xlsx', 'sample.xlsx');

  if (!user) {
    return (
      <form onSubmit={signIn}>
        <h1>Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit">Sign In</button>
        <button type="button" onClick={signUp}>Sign Up</button>
      </form>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <button onClick={signOut}>Sign Out</button>
      </div>
      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload
        </button>
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
      </div>
      {activeTab === 'upload' && (
        <div>
          <h1>Datei Upload</h1>
          <input type="file" accept=".csv,.xls,.xlsx" onChange={handleFile} />
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
          <div className="sample-buttons">
            <button onClick={downloadCsv}>Sample CSV herunterladen</button>
            <button onClick={downloadXlsx}>Sample XLSX herunterladen</button>
          </div>
          {rows.length > 0 && (
            <table>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div>
          {loadingOverview && <p>Loading...</p>}
          {overview.map((file, idx) => (
            <div key={idx} className="file-section">
              <h3>{file.filename}</h3>
              <table>
                <tbody>
                  {file.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
