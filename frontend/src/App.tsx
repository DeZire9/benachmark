import { useState } from 'react';

export default function App() {
  const [manufacturer, setManufacturer] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch('/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manufacturer, part_number: partNumber })
      });
      const data = await res.json();
      setMessage(data.status);
    } catch (err) {
      setMessage('Fehler beim Upload');
    }
  };

  return (
    <div>
      <h1>Benachmark Upload</h1>
      <form onSubmit={submit}>
        <input
          placeholder="Hersteller"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
        />
        <input
          placeholder="Teilenummer"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
        />
        <button type="submit">Upload</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
