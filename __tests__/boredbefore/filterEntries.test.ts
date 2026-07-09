import {
  EMPTY_FILTERS,
  FORMAT_OPTIONS,
  formatOf,
  filterEntries,
  activeFilterCount,
  type FeedFilters,
} from '../../src/boredbefore/filterEntries';
import type { Entry } from '../../src/types';

function makeEntry(over: Partial<Entry>): Entry {
  return {
    id: 1,
    prompt_text: '',
    response_text: '',
    entry_kind: 'text',
    game_data: null,
    created_at: '2026-06-15T12:00:00.000Z',
    location_label: null,
    location_lat: null,
    location_lng: null,
    entry_mode: 'prompted',
    place_id: null,
    category: 'reflective',
    ...over,
  };
}

describe('formatOf', () => {
  it('maps loveHate kind before anything else', () => {
    expect(formatOf(makeEntry({ entry_kind: 'loveHate', entry_mode: 'freeform' }))).toBe('loveHate');
  });
  it('maps rank kind', () => {
    expect(formatOf(makeEntry({ entry_kind: 'rank' }))).toBe('rank');
  });
  it('maps freeform text to brainDump', () => {
    expect(formatOf(makeEntry({ entry_mode: 'freeform', category: null }))).toBe('brainDump');
  });
  it('maps prompted categories to their tokens', () => {
    expect(formatOf(makeEntry({ category: 'observational' }))).toBe('observe');
    expect(formatOf(makeEntry({ category: 'reflective' }))).toBe('reflect');
    expect(formatOf(makeEntry({ category: 'personal' }))).toBe('confess');
    expect(formatOf(makeEntry({ category: 'creative' }))).toBe('imagine');
  });
  it('falls back to observe for a prompted entry with no category', () => {
    expect(formatOf(makeEntry({ category: null }))).toBe('observe');
  });
});

describe('FORMAT_OPTIONS', () => {
  it('lists all seven tokens in order', () => {
    expect(FORMAT_OPTIONS.map(o => o.token)).toEqual([
      'brainDump', 'observe', 'reflect', 'confess', 'imagine', 'rank', 'loveHate',
    ]);
  });
});

describe('filterEntries', () => {
  const brain = makeEntry({ id: 1, entry_mode: 'freeform', category: null, created_at: '2026-05-01T09:00:00.000Z' });
  const reflect = makeEntry({ id: 2, category: 'reflective', created_at: '2026-06-15T09:00:00.000Z' });
  const rank = makeEntry({ id: 3, entry_kind: 'rank', created_at: '2026-07-20T09:00:00.000Z' });
  const all = [brain, reflect, rank];

  it('returns everything with empty filters', () => {
    expect(filterEntries(all, EMPTY_FILTERS)).toEqual(all);
  });
  it('keeps only entries whose format is selected (formats OR within section)', () => {
    const f: FeedFilters = { formats: ['brainDump', 'rank'], startDate: null, endDate: null };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([1, 3]);
  });
  it('filters by start date inclusive', () => {
    const f: FeedFilters = { formats: [], startDate: '2026-06-15', endDate: null };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([2, 3]);
  });
  it('filters by end date inclusive', () => {
    const f: FeedFilters = { formats: [], startDate: null, endDate: '2026-06-15' };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([1, 2]);
  });
  it('filters by a closed range', () => {
    const f: FeedFilters = { formats: [], startDate: '2026-05-15', endDate: '2026-07-01' };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([2]);
  });
  it('combines format and date with AND', () => {
    const f: FeedFilters = { formats: ['reflect', 'rank'], startDate: '2026-07-01', endDate: null };
    expect(filterEntries(all, f).map(e => e.id)).toEqual([3]);
  });
});

describe('activeFilterCount', () => {
  it('counts selected formats', () => {
    expect(activeFilterCount({ formats: ['brainDump', 'rank'], startDate: null, endDate: null })).toBe(2);
  });
  it('adds one when a range bound is set', () => {
    expect(activeFilterCount({ formats: ['rank'], startDate: '2026-01-01', endDate: null })).toBe(2);
    expect(activeFilterCount({ formats: [], startDate: null, endDate: '2026-01-01' })).toBe(1);
  });
  it('is zero for empty filters', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });
});
