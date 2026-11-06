import { useState, type ChangeEvent } from 'react';
import { parseGuestCsv, type ImportedGuest } from '../utils/parseGuestCSV';
export function CSVImporter({ onImport }: { onImport: (guests: ImportedGuest[]) => void }) {
  const [error, setError] = useState('');
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { onImport(parseGuestCsv(String(reader.result ?? ''))); setError(''); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not read this CSV.'); }
    };
    reader.onerror = () => setError('The selected file could not be read.');
    reader.readAsText(file);
    event.currentTarget.value = '';
  };
  return <div className="csv-importer"><label>Import guests from CSV<input type="file" accept=".csv,text/csv" onChange={handleFile} /></label>{error && <p role="alert">{error}</p>}</div>;
}
