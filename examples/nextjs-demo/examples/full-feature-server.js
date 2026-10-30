import { buildRowModel } from '@company/mui-data-table/core';
import { fullFeatureColumns, makeFullFeatureRows } from './full-feature-shared';

/** Each mounted example owns an isolated backend. Only this module sees all server rows. */
export function createFullFeatureBackend({ latency = 150 } = {}) {
  let records = makeFullFeatureRows(), copies = 0, failure = false, requests = 0;
  function pause(signal) {
    return new Promise((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new DOMException('Request aborted', 'AbortError')); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, latency);
      if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    });
  }
  return {
    get requestCount() { return requests; },
    failNext: () => { failure = true; },
    restore: () => { records = makeFullFeatureRows(); copies = 0; failure = false; },
    remove: ids => { const selected = new Set(ids); records = records.filter(row => !selected.has(row.id)); },
    toggleStatus: id => { records = records.map(row => row.id === id ? { ...row, status: row.status === 'Active' ? 'Pending' : 'Active' } : row); },
    clone: id => {
      const row = records.find(record => record.id === id);
      if (row) records = [...records, { ...row, id: `${id}-copy-${++copies}`, name: `${row.name} (copy)` }];
    },
    previewEmails: ids => { const selected = new Set(ids); return records.filter(row => selected.has(row.id)).map(row => row.email); },
    fetcher: async (url, { signal } = {}) => {
      requests++;
      await pause(signal);
      if (failure) { failure = false; return { ok: false, status: 503 }; }
      const params = new URL(url, 'https://example.test').searchParams;
      const sorting = params.getAll('sort').map(value => { const [field, order] = value.split(','); return { field, order }; });
      // A stable ID breaks ties while the user selects one or more sort columns.
      if (sorting.length && !sorting.some(sort => sort.field === 'id')) sorting.push({ field: 'id', order: 'asc' });
      const allColumns = [...fullFeatureColumns, { field: 'id', label: 'ID', searchable: false }];
      const page = buildRowModel({ data: records, headers: allColumns, page: Number(params.get('page')), rowsPerPage: Number(params.get('size')),
        searchText: params.get('search') ?? '', sorting,
        columnFilters: Object.fromEntries([...params].filter(([key]) => key.startsWith('filter.')).map(([key, value]) => [key.slice(7), value])) });
      return { ok: true, status: 200, json: async () => ({ content: page.rows, totalElements: page.count, totalPages: Math.ceil(page.count / Number(params.get('size'))) }) };
    },
  };
}
