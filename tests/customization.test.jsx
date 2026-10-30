import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import DynamicTable from '../src/DynamicTable.jsx';
const headers = [{ field: 'name', label: 'Name' }];
const data = [{ id: 1, name: 'Ada' }];
describe('slots and labels', () => {
  it('retains working controls inside a caller-owned toolbar', () => {
    function Toolbar({ children }) { return <section aria-label="Custom toolbar">{children}</section>; }
    render(<DynamicTable headers={headers} data={data} slots={{ toolbar: Toolbar }} searchByText
      slotProps={{ table: { 'data-testid': 'custom-table' } }} />);
    expect(screen.getByLabelText('Custom toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('custom-table')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }));
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'absent' } });
    expect(screen.getByText('No matching records.')).toBeInTheDocument();
  });
  it('uses translated names for search and real checkbox inputs', () => {
    render(<DynamicTable headers={headers} data={data} searchByText enableEmail
      labels={{ openSearch: 'Rechercher', selectAllEmails: 'Tout sélectionner', selectEmailRow: () => 'Choisir Ada' }} />);
    expect(screen.getByRole('button', { name: 'Rechercher' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Tout sélectionner' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Choisir Ada' })).toBeInTheDocument();
  });
});
