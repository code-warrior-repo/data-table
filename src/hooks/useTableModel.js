import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getFilteredRows, paginateRows } from '../core/rows.js';
import { createTableState, QUERY_KEYS, toTableQuery, transitionTableState, validateTableState } from '../core/state.js';

const EMPTY = [];
export function useTableModel({ data = EMPTY, headers = EMPTY, currentPage, initialRowsPerPage = 5,
  orderBy = '', order = 'asc', serverSidePagination = false, totalCount, onPageChangeRequest,
  state: controlledState, initialState, onStateChange, onQueryChange }) {
  const ownedKeys = QUERY_KEYS.filter(key => Object.hasOwn(controlledState ?? {}, key)).join(',');
  const ownership = useRef(ownedKeys);
  if (ownership.current !== ownedKeys) throw new Error('Controlled state keys must remain fixed; remount to change ownership.');
  const [internal, setInternal] = useState(() => createTableState({
    page: currentPage ?? 0, rowsPerPage: initialRowsPerPage,
    sorting: orderBy ? [{ field: orderBy, order }] : [], ...initialState
  }));
  const effective = validateTableState({ ...internal,
    ...(currentPage !== undefined ? { page: currentPage } : {}), ...controlledState });
  const { page, rowsPerPage, searchText, columnFilters, sorting } = effective;
  const filteredRows = useMemo(() => getFilteredRows({ data, headers, searchText, columnFilters, sorting,
    serverSide: serverSidePagination }), [data, headers, searchText, columnFilters, sorting, serverSidePagination]);
  const model = useMemo(() => paginateRows({ filteredRows, page, rowsPerPage, serverSide: serverSidePagination, totalCount }),
    [filteredRows, page, rowsPerPage, serverSidePagination, totalCount]);
  const state = { ...effective, page: model.page };
  const settings = { state, controlledState, currentPage, serverSidePagination,
    onStateChange, onQueryChange, onPageChangeRequest };
  const latest = useRef(settings);
  // Synchronize only committed renders, never leak speculative render state into event handlers.
  useLayoutEffect(() => { latest.current = settings; });
  const update = useCallback(change => {
    const current = latest.current;
    const { next, event } = transitionTableState(current.state, change);
    if (!event.changedKeys.length) return;
    // Compose proposals in the same event, but controlled values render only after parent acceptance.
    latest.current = { ...current, state: next };
    setInternal(previous => {
      const uncontrolled = { ...previous };
      for (const key of QUERY_KEYS) {
        const owned = Object.hasOwn(current.controlledState ?? {}, key) ||
          (key === 'page' && current.currentPage !== undefined);
        if (!owned) uncontrolled[key] = next[key];
      }
      return uncontrolled;
    });
    current.onStateChange?.(next, event);
    current.onQueryChange?.(next, event);
    if (current.serverSidePagination) current.onPageChangeRequest?.(toTableQuery(next));
  }, []);
  return { ...state, ...model, state, update };
}
