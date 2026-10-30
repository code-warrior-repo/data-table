import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import DynamicTable from '../src/DynamicTable.jsx';
import ExportOptions from '../src/ExportOptions.jsx';

const headers = [{ field: 'id', label: 'ID' }, { field: 'name', label: 'Name' }];
const data = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }, { id: 3, name: 'Alan' }];

describe('table integration', () => {
  it('renders empty, loading, and error states', () => {
    const { rerender } = render(<DynamicTable headers={headers} data={[]} />);
    expect(screen.getByText('No matching records.')).toBeInTheDocument();
    rerender(<DynamicTable headers={headers} data={[]} loading />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('No matching records.')).not.toBeInTheDocument();
    rerender(<DynamicTable headers={headers} data={data} error={new Error('Request failed')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Request failed');
    expect(screen.queryByText('Ada')).not.toBeInTheDocument();
  });
  it('retains server sorting when paging and sends search and filters', () => {
    const request = vi.fn();
    render(<DynamicTable headers={headers} data={data} serverSidePagination totalCount={30}
      initialRowsPerPage={3} onPageChangeRequest={request} searchByText enableColumnFilters />);
    fireEvent.click(screen.getByText('Name'));
    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, sortBy: 'name', sortDir: 'asc' }));
    fireEvent.click(screen.getByLabelText('Open search'));
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'Ada' } });
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0, searchText: 'Ada', sortBy: 'name' }));
    fireEvent.change(screen.getByLabelText('Filter Name'), { target: { value: 'Grace' } });
    expect(request).toHaveBeenLastCalledWith(expect.objectContaining({ columnFilters: { name: 'Grace' } }));
    expect(screen.getByText('Alan')).toBeInTheDocument();
  });
  it('honors externally controlled page changes', () => {
    const { rerender } = render(<DynamicTable headers={headers} data={data} currentPage={0} initialRowsPerPage={1} />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    rerender(<DynamicTable headers={headers} data={data} currentPage={2} initialRowsPerPage={1} />);
    expect(screen.getByText('Alan')).toBeInTheDocument();
    expect(screen.queryByText('Ada')).not.toBeInTheDocument();
  });
  it('keeps action and email cells aligned and clears stale selection when rows change', () => {
    const onEmail = vi.fn();
    const onView = vi.fn();
    const { rerender } = render(<DynamicTable headers={headers} data={data} enableEmail onEmail={onEmail} enableView onView={onView} />);
    const row = screen.getByText('Ada').closest('tr');
    expect(within(row).getAllByRole('cell')).toHaveLength(4);
    fireEvent.click(within(row).getByRole('button', { name: 'View' }));
    expect(onView).toHaveBeenCalledWith(data[0]);
    fireEvent.click(within(row).getByRole('checkbox'));
    fireEvent.click(screen.getByLabelText('Send email'));
    expect(onEmail).toHaveBeenLastCalledWith([data[0]]);
    const next = [{ id: 4, name: 'Katherine' }];
    rerender(<DynamicTable headers={headers} data={next} enableEmail onEmail={onEmail} />);
    fireEvent.click(screen.getByLabelText('Send email'));
    expect(onEmail).toHaveBeenLastCalledWith(next);
  });
  it('supports custom cells and action visibility', () => {
    render(<DynamicTable headers={[{ field: 'name', label: 'Name', renderCell: ({ value }) => <strong>{value.toUpperCase()}</strong> }]}
      data={data} actions={[{ id: 'approve', label: 'Approve', onClick: vi.fn(), visible: row => row.id === 1 }]} />);
    expect(screen.getByText('ADA')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Approve' })).toHaveLength(1);
  });
  it('runs custom export handlers and keeps the UI busy through file generation', async () => {
    let finish;
    const handler = vi.fn(() => new Promise(resolve => { finish = resolve; }));
    render(<ExportOptions headers={headers} data={data} exportHandlers={{ csv: handler }} />);
    fireEvent.click(screen.getByLabelText('Export menu'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
    await waitFor(() => expect(handler).toHaveBeenCalled());
    expect(screen.getByLabelText('Export menu')).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByLabelText('Export menu')).toBeEnabled());
  });
  it('reports failed backend exports', async () => {
    render(<ExportOptions headers={headers} data={[]} fetchAllRows={async () => { throw new Error('Backend unavailable'); }} />);
    fireEvent.click(screen.getByLabelText('Export menu'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'CSV' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Backend unavailable');
  });
});
