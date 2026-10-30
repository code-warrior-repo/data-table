import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import DynamicTable from '../src/DynamicTable.jsx';
const headers = [{ field: 'name', label: 'Name' }, { field: 'status', label: 'Status' }];
const data = [{ id: 'a', name: 'Ada', status: 'Active' }, { id: 'b', name: 'Grace', status: 'Pending' }];

describe('generic bulk actions', () => {
  it('provides selected IDs and loaded rows and can clear the selection', () => {
    const action = vi.fn();
    render(<DynamicTable headers={headers} data={data} enableRowSelection
      renderBulkActions={({ selectedRowIds, selectedRows, selectedCount, clearSelection, disabled }) => <button
        disabled={disabled || !selectedCount} onClick={() => { action(selectedRowIds, selectedRows); clearSelection(); }}>Remove selected</button>} />);
    expect(screen.getByRole('button', { name: 'Remove selected' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row 1', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove selected' }));
    expect(action).toHaveBeenCalledWith(['a'], [data[0]]);
    expect(screen.getByRole('checkbox', { name: 'Select row 1', exact: true })).not.toBeChecked();
    expect(screen.queryByLabelText('Send email')).not.toBeInTheDocument();
  });
  it('includes selected loaded rows hidden by a filter and discloses unloaded server IDs', () => {
    const renderer = vi.fn(() => null);
    const { rerender } = render(<DynamicTable headers={headers} data={data} enableRowSelection
      initialState={{ searchText: 'Ada' }} selectedRowIds={['b', 'remote']} renderBulkActions={renderer} />);
    expect(renderer.mock.lastCall[0]).toMatchObject({ selectedRowIds: ['b', 'remote'], selectedRows: [data[1]],
      selectedCount: 2, unloadedSelectedRowIds: ['remote'] });
    rerender(<DynamicTable headers={headers} data={[data[0]]} enableRowSelection serverSidePagination totalCount={5}
      selectedRowIds={['b']} renderBulkActions={renderer} />);
    expect(renderer.mock.lastCall[0]).toMatchObject({ selectedRows: [], unloadedSelectedRowIds: ['b'] });
  });
  it('lets custom bulk rendering replace the legacy email control and exposes busy state', () => {
    const renderer = vi.fn(({ disabled }) => <button disabled={disabled}>Custom email</button>);
    render(<DynamicTable headers={headers} data={data} enableEmail onEmail={vi.fn()} loading renderBulkActions={renderer} />);
    expect(screen.queryByLabelText('Send email')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom email' })).toBeDisabled();
  });
});

describe('selection column placement', () => {
  it.each([['first', 0], ['last', 3], [1, 1]])('aligns header and row cells at %s', (position, index) => {
    render(<DynamicTable headers={headers} data={data} enableRowSelection selectionColumnPosition={position}
      renderRowActions={() => <button>View</button>} />);
    const allRows = within(screen.getByRole('table')).getAllByRole('row');
    const headingCells = within(allRows[0]).getAllByRole('columnheader');
    expect(within(headingCells[index]).getByRole('checkbox')).toBeInTheDocument();
    for (const row of allRows.slice(1)) {
      const cells = within(row).getAllByRole('cell');
      expect(cells).toHaveLength(headingCells.length);
      expect(within(cells[index]).getByRole('checkbox')).toBeInTheDocument();
    }
  });
  it('uses first by default and keeps the empty-row span correct', () => {
    const { rerender } = render(<DynamicTable headers={headers} data={data} enableRowSelection />);
    expect(within(screen.getAllByRole('columnheader')[0]).getByRole('checkbox')).toBeInTheDocument();
    rerender(<DynamicTable headers={headers} data={[]} enableRowSelection />);
    expect(screen.getByText('No matching records.')).toHaveAttribute('colspan', '3');
  });
  it('rejects invalid selection positions', () => {
    expect(() => render(<DynamicTable headers={headers} data={data} enableRowSelection selectionColumnPosition={9} />))
      .toThrow('selectionColumnPosition');
  });
});

describe('toolbar positioning', () => {
  it.each(['left', 'right'])('aligns built-in and custom controls to %s', alignment => {
    render(<DynamicTable headers={headers} data={data} searchByText enableExport enableThemes toolbarAlignment={alignment}
      renderToolbar={() => <button>Custom</button>} />);
    for (const name of ['Open search', 'Export menu', 'theme selector', 'Custom']) {
      expect(screen.getByRole('button', { name, exact: true }).closest('[data-table-toolbar-side]'))
        .toHaveAttribute('data-table-toolbar-side', alignment);
    }
  });
  it('defaults left, supports per-control overrides, and retains search input while moving controls', () => {
    const { rerender } = render(<DynamicTable headers={headers} data={data} searchByText enableExport />);
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }));
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Ada' } });
    rerender(<DynamicTable headers={headers} data={data} searchByText enableExport
      toolbarPositions={{ search: 'right', export: 'left' }} />);
    expect(screen.getByLabelText('Search')).toHaveValue('Ada');
    expect(screen.getByLabelText('Search').closest('[data-table-toolbar-side]')).toHaveAttribute('data-table-toolbar-side', 'right');
    expect(screen.getByRole('button', { name: 'Export menu' }).closest('[data-table-toolbar-side]')).toHaveAttribute('data-table-toolbar-side', 'left');
  });
  it('does not cancel an in-progress export when controls move to another side', async () => {
    let finish;
    const handler = vi.fn(() => new Promise(resolve => { finish = resolve; }));
    const completed = vi.fn();
    const props = { headers, data, enableExport: true, exportHandlers: { csv: handler }, onExportComplete: completed };
    const { rerender } = render(<DynamicTable {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export menu' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
    rerender(<DynamicTable {...props} toolbarAlignment="right" />);
    expect(screen.getByRole('button', { name: 'Cancel export' })).toBeInTheDocument();
    expect(handler.mock.calls[0][0].signal.aborted).toBe(false);
    await act(async () => finish());
    expect(completed).toHaveBeenCalledTimes(1);
  });
  it('rejects unsupported toolbar controls and positions', () => {
    expect(() => render(<DynamicTable headers={headers} data={data} toolbarPositions={{ unknown: 'left' }} />)).toThrow('Unknown toolbar control');
  });
});
