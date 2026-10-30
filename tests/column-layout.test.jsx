import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import DynamicTable from '../src/DynamicTable.jsx';
import { moveColumn, resolveColumnOrder, resolveColumnSizing } from '../src/core/columnLayout.js';
const headers = [{ field: 'name', label: 'Name', width: 180 }, { field: 'status', label: 'Status' }, { field: 'score', label: 'Score' }];
const data = [{ id: 1, name: 'Ada', status: 'Active', score: 96 }];
const fields = () => [...screen.getByRole('table').querySelectorAll('th[data-column-field]')].map(cell => cell.dataset.columnField);
const renderTable = props => render(<DynamicTable headers={headers} data={data} {...props} />);

describe('column layout', () => {
  it('reconciles partial orders and changing columns and rejects duplicate fields', () => {
    expect(resolveColumnOrder(headers, ['obsolete', 'score'])).toEqual(['score', 'name', 'status']);
    expect(() => resolveColumnOrder(headers, ['name', 'name'])).toThrow(/unique/);
    expect(moveColumn(headers, ['name', 'status', 'score'], 'name', 'score')).toEqual(['status', 'score', 'name']);
    const locked = headers.map(column => ({ ...column, reorderable: column.field !== 'status' }));
    expect(moveColumn(locked, ['name', 'status', 'score'], 'name', 'score')).toEqual(['score', 'status', 'name']);
  });
  it('clamps widths to per-column bounds and rejects malformed sizing', () => {
    expect(resolveColumnSizing([{ field: 'a', minWidth: 100, maxWidth: 250 }], { a: 999 })).toEqual({ a: 250 });
    expect(resolveColumnSizing([{ field: 'a', width: '125px' }])).toEqual({ a: 125 });
    expect(() => resolveColumnSizing(headers, { name: NaN })).toThrow(/positive/);
    expect(() => resolveColumnSizing([{ field: 'a', minWidth: 300, maxWidth: 100 }])).toThrow(/must not exceed/);
  });
  it('leaves existing automatic layout and controls unchanged when disabled', () => {
    renderTable();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move Name' })).not.toBeInTheDocument();
    expect(screen.getByRole('table').querySelector('colgroup')).toBeNull();
  });
  it('moves headers, cells and export columns together without sorting or resetting selection', () => {
    const query = vi.fn(), handler = vi.fn();
    renderTable({ enableColumnReordering: true, enableRowSelection: true, enableExport: true,
      exportHandlers: { csv: handler }, onQueryChange: query, renderRowActions: () => <button>Edit</button> });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row 1', exact: true }));
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move Name' }), { key: 'ArrowRight' });
    expect(fields()).toEqual(['status', 'name', 'score']);
    const row = screen.getByText('Ada').closest('tr');
    expect(within(row).getAllByRole('cell').map(cell => cell.textContent)).toEqual(['', 'Active', 'Ada', '96', 'Edit']);
    expect(screen.getByRole('checkbox', { name: 'Select row 1', exact: true })).toBeChecked();
    expect(query).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Export menu', exact: true }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'CSV', exact: true }));
    expect(handler.mock.calls[0][0].columns.map(column => column.id)).toEqual(['status', 'name', 'score']);
  });
  it('supports move menus and fixed column positions', () => {
    renderTable({ headers: headers.map(column => ({ ...column, reorderable: column.field !== 'status' })), enableColumnReordering: true });
    expect(screen.queryByRole('button', { name: 'Move Status' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Move Name' }));
    expect(screen.getByRole('menuitem', { name: 'Move toward start' })).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Move toward end' }));
    expect(fields()).toEqual(['score', 'status', 'name']);
  });
  it('proposes controlled ordering and sizing until the parent accepts them', () => {
    const orderChange = vi.fn(), sizingChange = vi.fn();
    const props = { enableColumnReordering: true, enableColumnResizing: true, columnOrder: ['name', 'status', 'score'],
      columnSizing: { name: 200 }, onColumnOrderChange: orderChange, onColumnSizingChange: sizingChange };
    const view = renderTable(props);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move Name' }), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize Name' }), { key: 'ArrowRight' });
    expect(orderChange).toHaveBeenCalledWith(['status', 'name', 'score']);
    expect(sizingChange).toHaveBeenCalledWith({ name: 210, status: 180, score: 180 });
    expect(fields()).toEqual(['name', 'status', 'score']);
    expect(screen.getByRole('separator', { name: 'Resize Name' })).toHaveAttribute('aria-valuenow', '200');
    view.rerender(<DynamicTable headers={headers} data={data} {...props} columnOrder={orderChange.mock.calls[0][0]} columnSizing={sizingChange.mock.calls[0][0]} />);
    expect(fields()).toEqual(['status', 'name', 'score']);
    expect(screen.getByRole('separator', { name: 'Resize Name' })).toHaveAttribute('aria-valuenow', '210');
  });
  it('resizes with keyboard bounds and preserves widths when reordered', () => {
    renderTable({ enableColumnReordering: true, enableColumnResizing: true, minColumnWidth: 100, maxColumnWidth: 240 });
    const resize = screen.getByRole('separator', { name: 'Resize Name' });
    fireEvent.keyDown(resize, { key: 'ArrowRight', shiftKey: true });
    expect(resize).toHaveAttribute('aria-valuenow', '230');
    fireEvent.keyDown(resize, { key: 'End' });
    fireEvent.keyDown(resize, { key: 'ArrowRight' });
    expect(resize).toHaveAttribute('aria-valuenow', '240');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move Name' }), { key: 'ArrowRight' });
    expect(screen.getByRole('table').querySelectorAll('col')[1]).toHaveStyle({ width: '240px' });
    fireEvent.keyDown(resize, { key: 'Home' });
    expect(resize).toHaveAttribute('aria-valuenow', '100');
  });
  it('keeps utility columns aligned and skips non-resizable columns', () => {
    renderTable({ headers: headers.map(column => ({ ...column, resizable: column.field !== 'score' })), enableColumnResizing: true,
      enableRowSelection: true, selectionColumnPosition: 'last', renderRowActions: () => <button>Edit</button> });
    expect(screen.queryByRole('separator', { name: 'Resize Score' })).not.toBeInTheDocument();
    expect([...screen.getByRole('table').querySelectorAll('col')].map(col => col.style.width)).toEqual(['180px', '180px', '180px', '160px', '140px']);
  });
  it('uses visual arrow directions in RTL', () => {
    render(<ThemeProvider theme={createTheme({ direction: 'rtl' })}><DynamicTable headers={headers} data={data} enableColumnReordering enableColumnResizing /></ThemeProvider>);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Move Name' }), { key: 'ArrowLeft' });
    expect(fields()).toEqual(['status', 'name', 'score']);
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Resize Name' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('separator', { name: 'Resize Name' })).toHaveAttribute('aria-valuenow', '190');
  });
  it('adds new columns and removes stale fields without losing existing order or width', () => {
    const view = renderTable({ enableColumnReordering: true, enableColumnResizing: true, initialColumnOrder: ['score', 'name'], initialColumnSizing: { name: 240 } });
    view.rerender(<DynamicTable headers={[headers[0], { field: 'new', label: 'New' }]} data={data} enableColumnReordering enableColumnResizing />);
    expect(fields()).toEqual(['name', 'new']);
    expect(screen.getByRole('separator', { name: 'Resize Name' })).toHaveAttribute('aria-valuenow', '240');
  });
});
