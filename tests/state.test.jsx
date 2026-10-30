import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTableModel } from '../src/hooks/useTableModel.js';

const headers = [{ field: 'id' }];
const data = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe('query transitions', () => {
  it('composes batched patches and functional updates without losing earlier changes', () => {
    const request = vi.fn();
    const { result } = renderHook(() => useTableModel({ headers, data, serverSidePagination: true,
      totalCount: 100, onPageChangeRequest: request }));
    act(() => {
      result.current.update({ searchText: 'Ada' });
      result.current.update(previous => ({ columnFilters: { id: previous.searchText } }));
    });
    expect(result.current).toMatchObject({ searchText: 'Ada', columnFilters: { id: 'Ada' } });
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ searchText: 'Ada', columnFilters: { id: 'Ada' } }));
  });
  it('automatically resets the page for search, filters, sorting and page-size changes', () => {
    const { result } = renderHook(() => useTableModel({ headers, data, initialRowsPerPage: 1 }));
    for (const patch of [{ searchText: '' }, { columnFilters: {} }, { sorting: [] }, { rowsPerPage: 2 }]) {
      act(() => result.current.update({ page: 1 }));
      act(() => result.current.update(patch));
      expect(result.current.page).toBe(0);
    }
  });
});

import React, { StrictMode, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import DynamicTable from '../src/DynamicTable.jsx';
import { createTableState } from '../src/core/state.js';

describe('controlled query ownership', () => {
  it('waits for parent acceptance and supports externally resetting every query slice', () => {
    const onStateChange = vi.fn();
    const initial = createTableState({ rowsPerPage: 1 });
    const { result, rerender } = renderHook(({ state }) => useTableModel({ data, headers, state, onStateChange }), { initialProps: { state: initial } });
    act(() => result.current.update({ searchText: '2', sorting: [{ field: 'id', order: 'desc' }], rowsPerPage: 2, columnFilters: { id: '2' } }));
    expect(result.current.state).toEqual(initial);
    const proposed = onStateChange.mock.calls[0][0];
    rerender({ state: proposed });
    expect(result.current.rows).toEqual([{ id: 2 }]);
    expect(result.current.state).toEqual(proposed);
    rerender({ state: createTableState() });
    expect(result.current.state).toEqual(createTableState());
    expect(onStateChange).toHaveBeenCalledTimes(1);
  });
  it('supports partial control and keeps native state.page above legacy currentPage', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => useTableModel({ data, headers, currentPage: 0,
      state: { page: 1, searchText: '' }, initialState: { rowsPerPage: 1 }, onStateChange }));
    expect(result.current.page).toBe(1);
    act(() => result.current.update({ sorting: [{ field: 'id', order: 'desc' }] }));
    expect(result.current.page).toBe(1);
    expect(result.current.sorting).toEqual([{ field: 'id', order: 'desc' }]);
    expect(onStateChange.mock.calls[0][0].page).toBe(0);
  });
  it('emits exactly once per meaningful action in Strict Mode, and not on mount or no-op', () => {
    const onStateChange = vi.fn(), onQueryChange = vi.fn(), onPageChangeRequest = vi.fn();
    const wrapper = ({ children }) => <StrictMode>{children}</StrictMode>;
    const { result } = renderHook(() => useTableModel({ data, headers, onStateChange, onQueryChange,
      serverSidePagination: true, totalCount: 100, onPageChangeRequest }), { wrapper });
    expect(onQueryChange).not.toHaveBeenCalled();
    act(() => result.current.update({ sorting: [], columnFilters: {} }));
    expect(onStateChange).not.toHaveBeenCalled();
    act(() => result.current.update({ searchText: 'Ada' }));
    expect(onStateChange).toHaveBeenCalledTimes(1);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(onPageChangeRequest).toHaveBeenCalledTimes(1);
    expect(onQueryChange.mock.calls[0][1]).toMatchObject({ type: 'searchText', changedKeys: ['searchText'] });
  });
  it('rejects invalid patches before notifying the application', () => {
    const onQueryChange = vi.fn();
    const { result } = renderHook(() => useTableModel({ data, headers, onQueryChange }));
    expect(() => act(() => result.current.update({ rowsPerPage: 0 }))).toThrow('rowsPerPage');
    expect(() => act(() => result.current.update({ selection: [] }))).toThrow('Unknown');
    expect(onQueryChange).not.toHaveBeenCalled();
  });
  it('supports native client pagination through parent-owned state', () => {
    function Controlled() {
      const [state, setState] = useState(() => createTableState({ rowsPerPage: 1 }));
      return <DynamicTable headers={headers} data={data} state={state} onStateChange={setState} />;
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(screen.getByRole('cell', { name: '2' })).toBeInTheDocument();
  });
  it('notifies client queries without the server compatibility callback', () => {
    const onQueryChange = vi.fn(), legacy = vi.fn();
    const { result } = renderHook(() => useTableModel({ data, headers, onQueryChange, onPageChangeRequest: legacy }));
    act(() => result.current.update({ page: 1, rowsPerPage: 1 }));
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    expect(legacy).not.toHaveBeenCalled();
  });
});

it('does not repeat filtering or sorting just to change the page', () => {
  const getter = vi.fn(row => row.id);
  const columns = [{ field: 'id', valueGetter: getter }];
  const { result } = renderHook(() => useTableModel({ data, headers: columns, initialRowsPerPage: 1, orderBy: 'id' }));
  const before = getter.mock.calls.length;
  act(() => result.current.update({ page: 1 }));
  expect(getter).toHaveBeenCalledTimes(before);
});

it('requires a remount when native controlled-key ownership changes', () => {
  const { rerender } = renderHook(({ state }) => useTableModel({ data, headers, state }), { initialProps: { state: { page: 0 } } });
  expect(() => rerender({ state: { searchText: '' } })).toThrow('Controlled state keys');
});
