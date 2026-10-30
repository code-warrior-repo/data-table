import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import DynamicTable from '../src/DynamicTable.jsx';

const headers = [{ field: 'name', label: 'Name' }];
const data = [{ id: 'ada', name: 'Ada', editable: true }, { id: 'grace', name: 'Grace', editable: false }];

describe('caller-defined row actions', () => {
  it('creates no actions column when no actions are supplied', () => {
    render(<DynamicTable headers={headers} data={data} />);
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
  });
  it('supports conditional JSX and passes the original row, stable ID and display index', () => {
    const edit = vi.fn();
    const renderer = vi.fn(({ row, rowId, rowIndex }) => row.editable &&
      <button onClick={() => edit(row, rowId, rowIndex)}>Edit {row.name}</button>);
    render(<DynamicTable headers={headers} data={data} renderRowActions={renderer} actionsColumnLabel="Manage" />);
    expect(screen.getByRole('columnheader', { name: 'Manage' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Ada' }));
    expect(edit).toHaveBeenCalledWith(data[0], 'ada', 0);
    expect(screen.queryByRole('button', { name: 'Edit Grace' })).not.toBeInTheDocument();
    expect(within(screen.getByText('Grace').closest('tr')).getAllByRole('cell')).toHaveLength(2);
  });
  it('prefers caller rendering over legacy actions and can disable the dedicated column', () => {
    const custom = vi.fn(() => <button>Approve</button>);
    const { rerender } = render(<DynamicTable headers={headers} data={data}
      enableView onView={vi.fn()} renderRowActions={custom} />);
    expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Approve' })).toHaveLength(2);
    custom.mockClear();
    rerender(<DynamicTable headers={headers} data={data} enableRowActions={false} renderRowActions={custom} />);
    expect(custom).not.toHaveBeenCalled();
    expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
  });
  it('supports display-only action columns anywhere, without sorting or filtering controls', () => {
    const view = vi.fn();
    render(<DynamicTable headers={[{ id: 'controls', label: 'Controls', type: 'display',
      renderCell: ({ row, rowId }) => <button onClick={() => view(rowId)}>View {row.name}</button> }, ...headers]}
      data={data} enableColumnFilters />);
    const heading = screen.getByRole('columnheader', { name: 'Controls' });
    expect(within(heading).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Filter Controls')).not.toBeInTheDocument();
    const cells = within(screen.getByText('Ada').closest('tr')).getAllByRole('cell');
    expect(within(cells[0]).getByRole('button', { name: 'View Ada' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View Ada' }));
    expect(view).toHaveBeenCalledWith('ada');
  });
  it('requires stable IDs for interactive rows', () => {
    expect(() => render(<DynamicTable headers={headers} data={[{ name: 'No ID' }]} renderRowActions={() => null} />))
      .toThrow('stable string or number ID');
  });
});
