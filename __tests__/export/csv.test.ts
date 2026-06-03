import { entriesToCsv } from '../../src/export/csv';
import type { Entry } from '../../src/types';

const base: Entry = {
  id: 1,
  created_at: '2026-01-15T10:30:00.000Z',
  entry_mode: 'prompted',
  prompt_text: 'What did you notice today?',
  response_text: 'A red door.',
  location_label: null,
  location_lat: null,
  location_lng: null,
  place_id: null,
};

describe('entriesToCsv', () => {
  it('returns only the header row when given an empty array', () => {
    const result = entriesToCsv([]);
    expect(result).toBe(
      'id,created_at,entry_mode,prompt_text,response_text,location_label,location_lat,location_lng'
    );
  });

  it('returns header + one data row for a single entry', () => {
    const result = entriesToCsv([base]);
    const lines = result.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toBe(
      '1,2026-01-15T10:30:00.000Z,prompted,What did you notice today?,A red door.,,,'
    );
  });

  it('wraps values containing commas in double quotes', () => {
    const entry: Entry = { ...base, response_text: 'Coffee, tea, and boredom.' };
    const row = entriesToCsv([entry]).split('\n')[1];
    expect(row).toContain('"Coffee, tea, and boredom."');
  });

  it('escapes double quotes by doubling them', () => {
    const entry: Entry = { ...base, response_text: 'She said "hello".' };
    const row = entriesToCsv([entry]).split('\n')[1];
    expect(row).toContain('"She said ""hello""."');
  });

  it('wraps values containing newlines in double quotes', () => {
    const entry: Entry = { ...base, response_text: 'Line one\nLine two' };
    const result = entriesToCsv([entry]);
    expect(result).toContain('"Line one\nLine two"');
  });

  it('outputs numeric lat/lng without quotes', () => {
    const entry: Entry = { ...base, location_label: 'London', location_lat: 51.5074, location_lng: -0.1278 };
    const row = entriesToCsv([entry]).split('\n')[1];
    expect(row).toContain('London,51.5074,-0.1278');
  });
});
