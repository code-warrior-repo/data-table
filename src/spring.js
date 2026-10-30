function nonnegativeInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${name} must be a nonnegative safe integer.`);
}
function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`${name} must be a positive safe integer.`);
}
function throwIfAborted(signal) {
  if (signal?.aborted) throw signal.reason ?? new DOMException('Request aborted', 'AbortError');
}

/** Normalize and validate the Spring Page transport shape. Missing metadata retains legacy defaults. */
export function normalizeSpringPage(page) {
  if (!page || typeof page !== 'object' || Array.isArray(page)) throw new TypeError('Spring page must be an object.');
  const rows = page.content ?? [];
  const rowCount = page.totalElements ?? 0;
  const pageCount = page.totalPages ?? 0;
  if (!Array.isArray(rows)) throw new TypeError('Spring page content must be an array.');
  nonnegativeInteger(rowCount, 'totalElements');
  nonnegativeInteger(pageCount, 'totalPages');
  return { rows, rowCount, pageCount };
}

/** Map DynamicTable's query (including fetchAllForExport's shape) to a Spring adapter request. */
export function toSpringRequest(query = {}, { signal, pageSize = query.rowsPerPage ?? 10 } = {}) {
  const pageIndex = query.page ?? 0;
  nonnegativeInteger(pageIndex, 'page');
  positiveInteger(pageSize, 'pageSize');
  const fallbackField = query.sortBy ?? query.orderBy;
  const sorting = query.sorting ?? query.selectedColumns ??
    (fallbackField ? [{ field: fallbackField, order: query.sortDir ?? query.order ?? 'asc' }] : []);
  if (!Array.isArray(sorting)) throw new TypeError('sorting must be an array.');
  return {
    pagination: { pageIndex, pageSize },
    sorting: sorting.map(({ field, order }) => ({ id: field, desc: order === 'desc' })),
    globalFilter: query.searchText ?? '',
    columnFilters: Object.entries(query.columnFilters ?? {}).map(([id, value]) => ({ id, value })),
    signal
  };
}

/** Keep authentication, headers and query authorization in the caller's fetcher/backend. */
export function createSpringDataSource({ url, fetcher = fetch, params = {}, mapSort }) {
  if (typeof url !== 'string' || !url) throw new TypeError('url must be a nonempty string.');
  return async ({ pagination, sorting = [], globalFilter = '', columnFilters = [], signal }) => {
    nonnegativeInteger(pagination?.pageIndex, 'pageIndex');
    positiveInteger(pagination?.pageSize, 'pageSize');
    throwIfAborted(signal);
    const [baseUrl, hash] = url.split('#', 2);
    const [pathname, search = ''] = baseUrl.split('?', 2);
    const query = new URLSearchParams(search);
    Object.entries(params).forEach(([key, value]) => { if (value != null) query.set(key, String(value)); });
    query.set('page', String(pagination.pageIndex));
    query.set('size', String(pagination.pageSize));
    const sort = mapSort ? mapSort(sorting) : sorting.map(({ id, desc }) => `${id},${desc ? 'desc' : 'asc'}`);
    query.delete('sort');
    query.delete('search');
    columnFilters.forEach(({ id }) => query.delete(`filter.${id}`));
    sort.forEach(value => query.append('sort', value));
    if (globalFilter) query.set('search', globalFilter);
    columnFilters.forEach(({ id, value }) => { if (value !== '' && value != null) query.set(`filter.${id}`, String(value)); });
    const response = await fetcher(`${pathname}?${query}${hash ? `#${hash}` : ''}`, { signal });
    throwIfAborted(signal);
    if (!response.ok) throw new Error(`Table request failed (${response.status})`);
    const page = await response.json();
    throwIfAborted(signal);
    return normalizeSpringPage(page);
  };
}

/** Fetch a bounded complete result; never return a silently truncated export. */
export async function fetchAllSpringRows({ dataSource, query = {}, pageSize = 500,
  maxRows = 10_000, maxPages = 100, signal, getRowId, onProgress }) {
  if (typeof dataSource !== 'function') throw new TypeError('dataSource must be a function.');
  positiveInteger(pageSize, 'pageSize');
  positiveInteger(maxRows, 'maxRows');
  positiveInteger(maxPages, 'maxPages');
  const request = toSpringRequest({ ...query, page: 0 }, { pageSize, signal });
  const rows = [];
  const ids = new Set();
  let total;
  let pageCount;
  for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    throwIfAborted(signal);
    const page = await dataSource({ ...request, pagination: { pageIndex, pageSize } });
    throwIfAborted(signal);
    if (!page || !Array.isArray(page.rows)) throw new TypeError('dataSource must return a normalized page with rows.');
    nonnegativeInteger(page.rowCount, 'rowCount');
    if (page.pageCount !== undefined) nonnegativeInteger(page.pageCount, 'pageCount');
    if (total === undefined) {
      total = page.rowCount;
      pageCount = page.pageCount || undefined;
      if (total > maxRows) throw new RangeError(`Export exceeds maxRows (${maxRows}); use a server export endpoint.`);
      if (pageCount > maxPages) throw new RangeError(`Export exceeds maxPages (${maxPages}); use a server export endpoint.`);
    } else if (page.rowCount !== total || (pageCount !== undefined && page.pageCount !== pageCount)) {
      throw new Error('Spring export totals changed during paging; retry against a stable dataset.');
    }
    if (rows.length + page.rows.length > total) throw new Error('Spring export returned more rows than its total.');
    if (!page.rows.length && rows.length < total) throw new Error('Spring export ended before all rows were received.');
    for (const row of page.rows) {
      if (getRowId) {
        const id = getRowId(row);
        if (!['string', 'number'].includes(typeof id) || id === '' || (typeof id === 'number' && !Number.isFinite(id))) {
          throw new Error('Export row IDs must be nonempty strings or finite numbers.');
        }
        if (ids.has(id)) throw new Error('Spring export returned duplicate row IDs; use a stable unique sort.');
        ids.add(id);
      }
      rows.push(row);
    }
    onProgress?.({ loaded: rows.length, total, page: pageIndex, pagesFetched: pageIndex + 1 });
    throwIfAborted(signal);
    if (rows.length === total) return rows;
    if (pageCount !== undefined && pageIndex + 1 >= pageCount) {
      throw new Error('Spring export exhausted its pages before receiving all rows.');
    }
  }
  throw new RangeError(`Export exceeds maxPages (${maxPages}); use a server export endpoint.`);
}
