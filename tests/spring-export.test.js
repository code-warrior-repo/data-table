import { describe, expect, it, vi } from 'vitest';
import { createSpringDataSource, fetchAllSpringRows, normalizeSpringPage, toSpringRequest } from '../src/spring.js';

const page = (rows, rowCount, pageCount) => ({ rows, rowCount, ...(pageCount === undefined ? {} : { pageCount }) });

describe('table-to-Spring request mapping', () => {
  it('maps both table page requests and full-result export queries', () => {
    const signal = new AbortController().signal;
    expect(toSpringRequest({ page: 2, rowsPerPage: 20, searchText: 'Ada', columnFilters: { status: 'Active' },
      sorting: [{ field: 'name', order: 'desc' }] }, { signal })).toEqual({
      pagination: { pageIndex: 2, pageSize: 20 }, sorting: [{ id: 'name', desc: true }],
      globalFilter: 'Ada', columnFilters: [{ id: 'status', value: 'Active' }], signal
    });
    expect(toSpringRequest({ orderBy: 'id', order: 'asc' }).sorting).toEqual([{ id: 'id', desc: false }]);
    expect(toSpringRequest({ selectedColumns: [{ field: 'name', order: 'desc' }] }).sorting).toEqual([{ id: 'name', desc: true }]);
    expect(toSpringRequest({ rowsPerPage: -1 }, { pageSize: 100 }).pagination.pageSize).toBe(100);
  });
  it('rejects unbounded/invalid backend pagination and malformed responses', async () => {
    expect(() => toSpringRequest({ rowsPerPage: -1 })).toThrow('pageSize');
    expect(() => toSpringRequest({ page: -1 })).toThrow('page');
    expect(() => normalizeSpringPage({ content: 'bad' })).toThrow('content');
    expect(() => normalizeSpringPage({ totalElements: -1 })).toThrow('totalElements');
    expect(() => normalizeSpringPage(null)).toThrow('object');
    const fetcher = vi.fn();
    await expect(createSpringDataSource({ url: '/api', fetcher })({ pagination: { pageIndex: 0, pageSize: -1 } })).rejects.toThrow('pageSize');
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('bounded full Spring export', () => {
  it('starts at page zero, preserves criteria and signal, and assembles every page', async () => {
    const fetcher = vi.fn(async url => {
      const index = Number(new URL(url, 'https://example.test').searchParams.get('page'));
      return { ok: true, json: async () => ({ content: [[{ id: 1 }, { id: 2 }], [{ id: 3 }]][index], totalElements: 3, totalPages: 2 }) };
    });
    const signal = new AbortController().signal;
    const onProgress = vi.fn();
    const result = await fetchAllSpringRows({ dataSource: createSpringDataSource({ url: '/api?tenant=demo', fetcher }),
      query: { page: 9, searchText: 'Ada', selectedColumns: [{ field: 'id', order: 'asc' }], columnFilters: { status: 'Active' } },
      pageSize: 2, signal, onProgress, getRowId: row => row.id });
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    for (const [index, [url, options]] of fetcher.mock.calls.entries()) {
      const params = new URL(url, 'https://example.test').searchParams;
      expect(params.get('page')).toBe(String(index));
      expect(params.get('size')).toBe('2');
      expect(params.get('search')).toBe('Ada');
      expect(params.get('filter.status')).toBe('Active');
      expect(params.get('sort')).toBe('id,asc');
      expect(params.get('tenant')).toBe('demo');
      expect(options.signal).toBe(signal);
    }
    expect(onProgress).toHaveBeenLastCalledWith({ loaded: 3, total: 3, page: 1, pagesFetched: 2 });
  });
  it('accepts capped backend sizes and missing pageCount metadata', async () => {
    const dataSource = vi.fn().mockResolvedValueOnce(page([1, 2], 3)).mockResolvedValueOnce(page([3], 3));
    expect(await fetchAllSpringRows({ dataSource, pageSize: 500 })).toEqual([1, 2, 3]);
    expect(dataSource).toHaveBeenCalledTimes(2);
  });
  it('returns an empty array for an empty dataset', async () => {
    expect(await fetchAllSpringRows({ dataSource: async () => page([], 0, 0) })).toEqual([]);
  });
  it('refuses exports over row or page limits without returning partial data', async () => {
    const tooManyRows = vi.fn(async () => page([1], 11));
    await expect(fetchAllSpringRows({ dataSource: tooManyRows, maxRows: 10 })).rejects.toThrow('maxRows');
    expect(tooManyRows).toHaveBeenCalledTimes(1);
    const tooManyPages = vi.fn(async () => page([1], 10, 10));
    await expect(fetchAllSpringRows({ dataSource: tooManyPages, maxPages: 2 })).rejects.toThrow('maxPages');
    expect(tooManyPages).toHaveBeenCalledTimes(1);
    const unknownPages = vi.fn(async () => page([1], 10));
    await expect(fetchAllSpringRows({ dataSource: unknownPages, maxPages: 2 })).rejects.toThrow('maxPages');
    expect(unknownPages).toHaveBeenCalledTimes(2);
  });
  it('aborts before requesting and between pages even if the source ignores cancellation', async () => {
    const controller = new AbortController();
    controller.abort();
    const dataSource = vi.fn(async () => page([1], 1));
    await expect(fetchAllSpringRows({ dataSource, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(dataSource).not.toHaveBeenCalled();
    const midflight = new AbortController();
    const ignoringSource = vi.fn(async () => { midflight.abort(); return page([1], 2); });
    await expect(fetchAllSpringRows({ dataSource: ignoringSource, signal: midflight.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(ignoringSource).toHaveBeenCalledTimes(1);
  });
  it('rejects changing totals, empty early pages, duplicate IDs and impossible totals', async () => {
    const changed = vi.fn().mockResolvedValueOnce(page([1], 2, 2)).mockResolvedValueOnce(page([2], 3, 2));
    await expect(fetchAllSpringRows({ dataSource: changed })).rejects.toThrow('totals changed');
    const empty = vi.fn().mockResolvedValueOnce(page([1], 2)).mockResolvedValueOnce(page([], 2));
    await expect(fetchAllSpringRows({ dataSource: empty })).rejects.toThrow('before all rows');
    const duplicates = vi.fn().mockResolvedValueOnce(page([{ id: 1 }], 2)).mockResolvedValueOnce(page([{ id: 1 }], 2));
    await expect(fetchAllSpringRows({ dataSource: duplicates, getRowId: row => row.id })).rejects.toThrow('duplicate');
    await expect(fetchAllSpringRows({ dataSource: async () => page([1, 2], 1) })).rejects.toThrow('more rows');
    await expect(fetchAllSpringRows({ dataSource: async () => page([1], 2, 1) })).rejects.toThrow('exhausted');
  });
  it('propagates backend errors and rejects malformed normalized pages', async () => {
    await expect(fetchAllSpringRows({ dataSource: async () => { throw new Error('HTTP 503'); } })).rejects.toThrow('HTTP 503');
    await expect(fetchAllSpringRows({ dataSource: async () => ({ rows: 'bad', rowCount: 1 }) })).rejects.toThrow('normalized');
  });
});
