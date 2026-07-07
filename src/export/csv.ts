import type { Entry } from '../types';
import { parseRankData, renderRankResponseText } from '../games/rank';

function escapeCsv(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const HEADER =
  'id,created_at,entry_mode,prompt_text,response_text,location_label,location_lat,location_lng,category,entry_kind,game_data';

// Rank entries normally store a plain-text rendering in response_text at save
// time; if that's ever missing, rebuild it from game_data so the export stays
// readable without a JSON parser.
function responseTextForExport(e: Entry): string {
  if (e.response_text) return e.response_text;
  if (e.entry_kind === 'rank') {
    const data = parseRankData(e.game_data);
    if (data) return renderRankResponseText(data);
  }
  return '';
}

export function entriesToCsv(entries: Entry[]): string {
  const rows = entries.map(e =>
    [
      escapeCsv(e.id),
      escapeCsv(e.created_at),
      escapeCsv(e.entry_mode),
      escapeCsv(e.prompt_text),
      escapeCsv(responseTextForExport(e)),
      escapeCsv(e.location_label),
      escapeCsv(e.location_lat),
      escapeCsv(e.location_lng),
      escapeCsv(e.category),
      escapeCsv(e.entry_kind),
      escapeCsv(e.game_data),
    ].join(',')
  );
  return [HEADER, ...rows].join('\n');
}
