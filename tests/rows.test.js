import { describe, expect, it } from 'vitest';
import { buildRowModel } from '../src/core/rows.js';
import { getColumnText, headersToExportColumns } from '../src/core/columns.js';
import { rowsToCsv } from '../src/exports.js';
import { sortData } from '../src/util.js';
import { formatDate } from '../src/utils/formatDate.js';

const headers = [{ field: 'name', label: 'Name', fields: ['first', 'last'], separator: ' ' },
  { field: 'profile.score', label: 'Score' }];
const data = [{ id: 1, first: 'Ada', last: 'Lovelace', profile: { score: 100 } },
  { id: 2, first: 'Grace', last: 'Hopper', profile: { score: 2 } },
  { id: 3, first: 'Alan', last: 'Turing', profile: { score: 12 } }];
const model = options => buildRowModel({ data, headers, ...options });

describe('independent row model', () => {
  it('searches composite fields and shares their values with exports', () => {
    const result = model({ searchText: 'ada lovelace' });
    expect(result.rows.map(row => row.id)).toEqual([1]);
    expect(rowsToCsv({ rows: result.rows, columns: headersToExportColumns(headers) }))
      .toBe('Name,Score\r\nAda Lovelace,100');
  });
  it('sorts nested numeric fields without interpreting numeric strings as dates', () => {
    expect(model({ sorting: [{ field: 'profile.score', order: 'asc' }] }).rows.map(row => row.id)).toEqual([2, 3, 1]);
    expect(sortData([{ n: '12' }, { n: '2' }, { n: '100' }], { orderBy: 'n' }).map(row => row.n))
      .toEqual(['2', '12', '100']);
    expect(data.map(row => row.id)).toEqual([1, 2, 3]);
  });
  it('supports All and clamps pages after data shrinks', () => {
    expect(model({ rowsPerPage: -1, page: 3 }).rows).toEqual(data);
    expect(model({ rowsPerPage: 2, page: 9 }).page).toBe(1);
    expect(model({ data: [] })).toMatchObject({ rows: [], count: 0, page: 0 });
  });
  it('combines column filters, respects opt-outs, and supports computed values', () => {
    expect(model({ columnFilters: { 'profile.score': '2' } }).rows.map(row => row.id)).toEqual([2, 3]);
    expect(model({ headers: [{ field: 'name', valueGetter: row => row.first.toUpperCase() }], searchText: 'GRACE' }).rows[0].id).toBe(2);
    expect(model({ headers: [{ field: 'first', searchable: false }], searchText: 'Ada' }).rows).toEqual([]);
  });
  it('never filters, sorts or slices a backend page locally', () => {
    expect(model({ serverSide: true, totalCount: 100, page: 4, rowsPerPage: 2,
      searchText: 'absent', columnFilters: { name: 'absent' }, sorting: [{ field: 'name', order: 'desc' }] }))
      .toMatchObject({ rows: data, count: 100, page: 4 });
  });
  it('uses secondary sorts and stable ties', () => {
    const rows = [{ a: 1, b: 2 }, { a: 1, b: 1 }, { a: 0, b: 3 }];
    expect(buildRowModel({ data: rows, headers: [{ field: 'a' }, { field: 'b' }],
      sorting: [{ field: 'a', order: 'asc' }, { field: 'b', order: 'desc' }] }).rows)
      .toEqual([rows[2], rows[0], rows[1]]);
  });
  it('formats Date objects and date-only strings with month tokens', () => {
    expect(formatDate(new Date(2026, 9, 29))).toBe('10/29/2026');
    expect(getColumnText({ date: '2026-10-29' }, { field: 'date' })).toBe('10/29/2026');
  });
});

import { normalizeColumns } from '../src/core/columns.js';

describe('schema and pagination boundaries', () => {
  it('rejects ambiguous column identities', () => {
    expect(() => normalizeColumns([{ label: 'No ID' }])).toThrow('unique, nonempty');
    expect(() => normalizeColumns([{ field: 'id' }, { id: 'id' }])).toThrow('unique, nonempty');
  });
  it.each([0, -2, 1.5, NaN])('rejects invalid page sizes: %s', rowsPerPage => {
    expect(() => model({ rowsPerPage })).toThrow('rowsPerPage');
  });
  it.each([-1, 1.5, NaN])('rejects invalid pages: %s', page => {
    expect(() => model({ page })).toThrow('page');
  });
  it('rejects invalid server totals', () => {
    expect(() => model({ serverSide: true, totalCount: -1 })).toThrow('totalCount');
  });
  it('preserves the server response page even when its total changes', () => {
    expect(model({ serverSide: true, totalCount: 1, page: 4 })).toMatchObject({ page: 4, rows: data });
  });
  it('excludes display columns from every data operation, including exports', () => {
    const columns = normalizeColumns([...headers, { id: 'controls', type: 'display', valueGetter: () => 'Secret control',
      exportValue: () => 'Must not export' }]);
    expect(model({ headers: columns, searchText: 'Secret control' }).rows).toEqual([]);
    expect(model({ headers: columns, columnFilters: { controls: 'absent' }, sorting: [{ field: 'controls', order: 'desc' }] }).rows).toEqual(data);
    expect(rowsToCsv({ rows: data, columns: headersToExportColumns(columns) })).not.toContain('Must not export');
    expect(columns[2]).toMatchObject({ field: 'controls', sortable: false, filterable: false, enableExport: false });
  });
});


it('does not interpret inherited object properties as active column filters', () => {
  const rows = [{ constructor: 'Ada' }];
  expect(buildRowModel({ data: rows, headers: [{ field: 'constructor' }] }).rows).toEqual(rows);
});
