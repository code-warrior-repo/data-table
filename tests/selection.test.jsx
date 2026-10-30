import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DynamicTable from '../src/DynamicTable.jsx';
const headers = [{ field: 'name', label: 'Name' }];
const data = [{ id: 'a', name: 'Ada' }, { id: 'b', name: 'Grace' }];
describe('stable identity and selection', () => {
  it('rejects duplicate row IDs', () => {
    expect(() => render(<DynamicTable headers={headers} data={[data[0], data[0]]} />)).toThrow('Duplicate row ID');
  });
  it('preserves opted-in selection across refresh and resets on dataset switch', () => {
    const props = { headers, enableEmail: true, selectionReset: 'dataset', datasetKey: 'team-a' };
    const { rerender } = render(<DynamicTable {...props} data={data} />);
    fireEvent.click(screen.getByLabelText('Select email row 1'));
    rerender(<DynamicTable {...props} data={data.map(row => ({ ...row }))} />);
    expect(screen.getByLabelText('Select email row 1')).toBeChecked();
    rerender(<DynamicTable {...props} datasetKey="team-b" data={data} />);
    expect(screen.getByLabelText('Select email row 1')).not.toBeChecked();
  });
  it('waits for controlled selection acceptance and scopes select-all to the current page', () => {
    const onSelectionChange = vi.fn();
    render(<DynamicTable headers={headers} data={data} enableEmail initialRowsPerPage={1}
      selectionScope="page" selectedRowIds={[]} onSelectionChange={onSelectionChange} />);
    fireEvent.click(screen.getByLabelText('Select all emails'));
    expect(onSelectionChange).toHaveBeenCalledWith(['a']);
    expect(screen.getByLabelText('Select email row 1')).not.toBeChecked();
  });
});

it('does not resurrect cleared selection when an old array reference returns', () => {
  const { rerender } = render(<DynamicTable headers={headers} data={data} enableEmail />);
  fireEvent.click(screen.getByLabelText('Select email row 1'));
  rerender(<DynamicTable headers={headers} data={[...data]} enableEmail />);
  rerender(<DynamicTable headers={headers} data={data} enableEmail />);
  expect(screen.getByLabelText('Select email row 1')).not.toBeChecked();
});

it('supports general selection without email controls', () => {
  const changed = vi.fn();
  render(<DynamicTable headers={headers} data={data} enableRowSelection onSelectionChange={changed} />);
  expect(screen.queryByLabelText('Send email')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select row 1', exact: true }));
  expect(changed).toHaveBeenCalledWith(['a']);
  expect(screen.getByRole('checkbox', { name: 'Select row 1', exact: true })).toBeChecked();
});
