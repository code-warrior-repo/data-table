export const QUERY_KEYS = ['page', 'rowsPerPage', 'searchText', 'columnFilters', 'sorting'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateTableState(state) {
  if (!object(state)) throw new TypeError('Table state must be an object.');
  for (const key of Object.keys(state)) {
    if (!QUERY_KEYS.includes(key)) throw new Error(`Unknown table state key: ${key}`);
  }
  if (!Number.isSafeInteger(state.page) || state.page < 0) throw new RangeError('page must be a nonnegative safe integer.');
  if (state.rowsPerPage !== -1 && (!Number.isSafeInteger(state.rowsPerPage) || state.rowsPerPage < 1)) {
    throw new RangeError('rowsPerPage must be a positive safe integer or -1.');
  }
  if (typeof state.searchText !== 'string') throw new TypeError('searchText must be a string.');
  if (!object(state.columnFilters)) throw new TypeError('columnFilters must be an object.');
  if (!Array.isArray(state.sorting) || state.sorting.some(sort => !sort || typeof sort.field !== 'string' ||
    !sort.field || !['asc', 'desc'].includes(sort.order))) {
    throw new TypeError('sorting must contain { field, order: asc or desc } descriptors.');
  }
  const fields = state.sorting.map(sort => sort.field);
  if (new Set(fields).size !== fields.length) throw new Error('Sort fields must be unique.');
  return state;
}

export function createTableState(partial = {}) {
  return validateTableState({ page: 0, rowsPerPage: 5, searchText: '', columnFilters: {}, sorting: [], ...partial });
}

const sameRecord = (a, b) => Object.keys(a).length === Object.keys(b).length &&
  Object.keys(a).every(key => Object.hasOwn(b, key) && Object.is(a[key], b[key]));
export function changedQueryKeys(a, b) {
  return QUERY_KEYS.filter(key => key === 'sorting'
    ? a.sorting.length !== b.sorting.length || a.sorting.some((sort, index) =>
      sort.field !== b.sorting[index]?.field || sort.order !== b.sorting[index]?.order)
    : key === 'columnFilters' ? !sameRecord(a[key], b[key]) : !Object.is(a[key], b[key]));
}

/** Pure transition: no callbacks, requests, mutations or React state updates. */
export function transitionTableState(previous, change) {
  const patch = typeof change === 'function' ? change(previous) : change;
  if (!object(patch)) throw new TypeError('update must return a state patch object.');
  const reset = ['searchText', 'columnFilters', 'sorting', 'rowsPerPage'].some(key => Object.hasOwn(patch, key));
  const next = validateTableState({ ...previous, ...(reset ? { page: 0 } : {}), ...patch });
  const changedKeys = changedQueryKeys(previous, next);
  const type = changedKeys.length === 1 ? changedKeys[0] : 'query';
  return { next, event: { type, changedKeys, previousState: previous } };
}

/** Compatibility query for existing Spring/application page-request handlers. */
export function toTableQuery(state) {
  return { ...state, sortBy: state.sorting[0]?.field ?? '', sortDir: state.sorting[0]?.order ?? 'asc',
    selectedColumns: state.sorting };
}
