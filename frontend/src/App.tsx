import { useEffect, useState } from 'react';
import { createClient, User } from '@supabase/supabase-js';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState<any[][]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const validate = (data: any[][]) => {
      if (data.length === 0) {
        setError('Die Datei ist leer.');
        return;
      }
      const headers = data[0].map(h => String(h).trim().toLowerCase());
      if (headers[0] !== 'manufacturer' || headers[1] !== 'part no') {
        setError('Die erste Zeile muss "manufacturer" und "part no" enthalten.');
        return;
      }
      for (let i = 1; i < data.length; i++) {
        if (!data[i][0] || !data[i][1]) {
          setError(`Zeile ${i + 1} muss Werte in Spalte 1 und 2 haben.`);
          return;
        }
      }
      setRows(data);
    };

    if (file.name.endsWith('.csv')) {
      Papa.parse<string[]>(file, {
        complete: result => validate(result.data as any[][]),
        skipEmptyLines: true,
      });
    } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
      validate(json as any[][]);
    }
  };

  const downloadCsv = () => {
    window.location.href = '/sample.csv';
  };

  const downloadXlsx = async () => {
    const response = await fetch('/sample.csv');
    const text = await response.text();
    const { data } = Papa.parse<string[]>(text, { header: false });
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([arrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

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
    <div>
      <button onClick={signOut}>Sign Out</button>
      <h1>Datei Upload</h1>
      <input type="file" accept=".csv,.xls,.xlsx" onChange={handleFile} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
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
  );
}
