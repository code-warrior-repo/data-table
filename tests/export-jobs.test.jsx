import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ExportOptions from '../src/ExportOptions.jsx';
const headers = [{ field: 'name', label: 'Name' }];
const state = { page: 0, rowsPerPage: 5, sorting: [], searchText: 'Ada', columnFilters: {} };
function clickExport() {
  fireEvent.click(screen.getByLabelText('Export menu'));
  fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
}
describe('export jobs', () => {
  it('cancels a pending resolver and ignores its stale completion', async () => {
    let finish;
    const resolver = vi.fn(() => new Promise(resolve => { finish = resolve; }));
    const handler = vi.fn(), complete = vi.fn(), cancelled = vi.fn();
    render(<ExportOptions headers={headers} state={state} fetchAllRows={resolver}
      exportHandlers={{ csv: handler }} onExportComplete={complete} onExportCancel={cancelled} />);
    clickExport();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel export' }));
    expect(resolver.mock.calls[0][0].signal.aborted).toBe(true);
    await act(async () => finish([{ name: 'Ada' }]));
    expect(handler).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Export menu')).toBeEnabled();
  });
  it('aborts on unmount without later notifications', async () => {
    let finish;
    const resolver = vi.fn(() => new Promise(resolve => { finish = resolve; }));
    const complete = vi.fn();
    const { unmount } = render(<ExportOptions headers={headers} state={state} fetchAllRows={resolver} onExportComplete={complete} />);
    clickExport(); unmount();
    expect(resolver.mock.calls[0][0].signal.aborted).toBe(true);
    await act(async () => finish([]));
    expect(complete).not.toHaveBeenCalled();
  });
  it('bypasses row fetching for an endpoint handler and supplies a query snapshot', async () => {
    const resolver = vi.fn();
    const handler = vi.fn();
    const complete = vi.fn();
    render(<ExportOptions headers={headers} state={state} fetchAllRows={resolver}
      exportHandlers={{ csv: { mode: 'endpoint', handler } }} onExportComplete={complete} />);
    clickExport();
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
    expect(resolver).not.toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toMatchObject({ rows: [], state });
    expect(handler.mock.calls[0][0].state).not.toBe(state);
  });
});
