import { describe, expect, it } from 'vitest';
import { compareValues } from '../src/util.js';
import { buildRowModel } from '../src/core/rows.js';
import { headersToExportColumns } from '../src/core/columns.js';
import { getExportData, rowsToCsv } from '../src/exports.js';
const values = [null, undefined, NaN, Infinity, new Date('bad'), -10, 0, 2, '', '2', '10', true, false, 'bad', '2026-10-29', new Date('2026-10-29')];
describe('comparison laws', () => {
  it('is reflexive, antisymmetric and transitive over mixed/invalid values', () => {
    for (const a of values) {
      expect(compareValues(a, a)).toBe(0);
      for (const b of values) {
        expect(compareValues(a, b) + compareValues(b, a)).toBe(0);
        for (const c of values) if (compareValues(a, b) <= 0 && compareValues(b, c) <= 0) expect(compareValues(a, c)).toBeLessThanOrEqual(0);
      }
    }
  });
  it('keeps missing values last in both directions, with explicit type handling', () => {
    for (const order of ['asc', 'desc']) {
      const rows = buildRowModel({ data: [{ v: null }, { v: 2 }, { v: 'bad' }, { v: 1 }],
        headers: [{ field: 'v', dataType: 'number' }], sorting: [{ field: 'v', order }] }).rows;
      expect(rows.slice(2)).toEqual([{ v: null }, { v: 'bad' }]);
    }
    expect(compareValues('2026-02-30', new Date('bad'), { dataType: 'date' })).toBe(0);
    expect(compareValues(null, 1, { nulls: 'first', order: 'desc' })).toBe(-1);
    expect(compareValues('', 0)).not.toBe(0);
    expect(compareValues(false, 0)).not.toBe(0);
  });
  it('preserves primitive export types and guards formula strings without corrupting negative numbers', () => {
    const context = { rows: [{ n: -5, b: true }], columns: headersToExportColumns([{ field: 'n' }, { field: 'b' }]) };
    expect(getExportData(context).values).toEqual([[-5, true]]);
    expect(rowsToCsv({ rows: [{ v: -5 }, { v: '=1' }, { v: '＝1' }], columns: [{ accessorKey: 'v', header: 'V' }] }))
      .toBe("V\r\n-5\r\n'=1\r\n'＝1");
  });
});
