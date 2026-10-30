import { useMemo, useRef, useState } from 'react';
import { buildRowModel } from '../core/rows.js';

const EMPTY = [];
export function useTableModel({ data = EMPTY, headers = EMPTY, currentPage, initialRowsPerPage = 5,
  orderBy = '', order = 'asc', serverSidePagination = false, totalCount, onPageChangeRequest }) {
  const [state, setState] = useState(() => ({ page: currentPage ?? 0,
    rowsPerPage: initialRowsPerPage, searchText: '', columnFilters: {},
    sorting: orderBy ? [{ field: orderBy, order }] : [] }));
  const requestedPage = currentPage ?? state.page;
  const model = useMemo(() => buildRowModel({ data, headers, ...state, page: requestedPage,
    serverSide: serverSidePagination, totalCount }),
  [data, headers, state, requestedPage, serverSidePagination, totalCount]);

  // Keep multiple updates within one event from overwriting each other.
  const latest = useRef(state);
  latest.current = { ...state, page: model.page };
  function update(change) {
    const patch = typeof change === 'function' ? change(latest.current) : change;
    const resetPage = ['searchText', 'columnFilters', 'sorting', 'rowsPerPage']
      .some(key => Object.hasOwn(patch, key));
    const next = { ...latest.current, ...(resetPage ? { page: 0 } : {}), ...patch };
    latest.current = next;
    setState(next);
    if (serverSidePagination) onPageChangeRequest?.({
      ...next, sortBy: next.sorting[0]?.field ?? '', sortDir: next.sorting[0]?.order ?? 'asc',
      selectedColumns: next.sorting
    });
  }
  return { ...state, ...model, update };
}
