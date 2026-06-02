import type { Entry } from '../types';

function escapeCsv(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const HEADER = 'id,created_at,entry_mode,prompt_text,response_text,location_label,location_lat,location_lng';

export function entriesToCsv(entries: Entry[]): string {
  const rows = entries.map(e =>
    [
      escapeCsv(e.id),
      escapeCsv(e.created_at),
      escapeCsv(e.entry_mode),
      escapeCsv(e.prompt_text),
      escapeCsv(e.response_text),
      escapeCsv(e.location_label),
      escapeCsv(e.location_lat),
      escapeCsv(e.location_lng),
    ].join(',')
  );
  return [HEADER, ...rows].join('\n');
}
