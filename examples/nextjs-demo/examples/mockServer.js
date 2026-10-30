import { buildRowModel } from '@company/mui-data-table';
import { rows, headers } from './shared';

/** A deterministic in-memory backend for examples. Replace it with your fetch integration. */
export function matchingRows(query = {}) {
  return buildRowModel({ data: rows, headers, searchText: query.searchText ?? '',
    columnFilters: query.columnFilters ?? {}, sorting: query.sorting ?? query.selectedColumns ?? [], rowsPerPage: -1 }).rows;
}
export function loadPage(query, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(new DOMException('Request aborted', 'AbortError')); };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      const matching = matchingRows(query);
      resolve({ rows: matching.slice(query.page * query.rowsPerPage, (query.page + 1) * query.rowsPerPage), rowCount: matching.length });
    }, 150);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
  });
}
/** Fetch-compatible response in Spring Data Page format, without a network request. */
export async function mockSpringFetch(url, { signal } = {}) {
  const params = new URL(url, 'https://example.test').searchParams;
  const query = { page: Number(params.get('page')), rowsPerPage: Number(params.get('size')),
    searchText: params.get('search') ?? '',
    sorting: params.getAll('sort').map(value => { const [field, order] = value.split(','); return { field, order }; }),
    columnFilters: Object.fromEntries([...params].filter(([key]) => key.startsWith('filter.')).map(([key, value]) => [key.slice(7), value])) };
  const page = await loadPage(query, { signal });
  return { ok: true, json: async () => ({ content: page.rows, totalElements: page.rowCount,
    totalPages: Math.ceil(page.rowCount / query.rowsPerPage) }) };
}
