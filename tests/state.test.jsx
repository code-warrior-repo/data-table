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
