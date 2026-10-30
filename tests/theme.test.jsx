import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import DynamicTable from '../src/DynamicTable.jsx';

const headers = [{ field: 'name', label: 'Name' }];
const data = [{ id: 1, name: 'Ada' }];
function Probe() {
  const theme = useTheme();
  return <span data-testid="theme-primary">{theme.palette.primary.main}</span>;
}

describe('default Material UI appearance', () => {
  it('uses native header and row styles without a forced color or stripes', () => {
    render(<>
      <Table aria-label="Reference"><TableHead><TableRow><TableCell>Reference name</TableCell></TableRow></TableHead>
        <TableBody><TableRow><TableCell>Reference row</TableCell></TableRow></TableBody></Table>
      <DynamicTable headers={headers} data={data} />
    </>);
    const reference = getComputedStyle(screen.getByRole('columnheader', { name: 'Reference name' }));
    const actual = getComputedStyle(screen.getByRole('columnheader', { name: 'Name' }));
    expect(actual.backgroundColor).toBe(reference.backgroundColor);
    expect(actual.color).toBe(reference.color);
    expect(actual.fontSize).toBe(reference.fontSize);
    expect(getComputedStyle(screen.getByText('Ada').closest('tr')).backgroundColor)
      .toBe(getComputedStyle(screen.getByText('Reference row').closest('tr')).backgroundColor);
  });
  it('restores the application theme after returning from a preset to Default', () => {
    const theme = createTheme({ palette: { primary: { main: '#7b1fa2' } } });
    render(<ThemeProvider theme={theme}><DynamicTable headers={headers} data={data} enableThemes renderToolbar={() => <Probe />} /></ThemeProvider>);
    fireEvent.click(screen.getByLabelText('theme selector'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Grey' }));
    expect(screen.getByTestId('theme-primary')).not.toHaveTextContent('#7b1fa2');
    fireEvent.click(screen.getByLabelText('theme selector'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Default' }));
    expect(screen.getByTestId('theme-primary')).toHaveTextContent('#7b1fa2');
  });
  it('changes the table surface visibly and marks the active preset', () => {
    render(<DynamicTable headers={headers} data={data} enableThemes slotProps={{ root: { 'data-testid': 'surface' } }} />);
    const choose = name => {
      fireEvent.click(screen.getByLabelText('theme selector'));
      fireEvent.click(screen.getByRole('menuitem', { name, exact: true }));
    };
    expect(getComputedStyle(screen.getByTestId('surface')).backgroundColor).toBe('rgb(255, 255, 255)');
    choose('Grey');
    expect(getComputedStyle(screen.getByTestId('surface')).backgroundColor).toBe('rgb(245, 245, 245)');
    choose('Blue');
    expect(getComputedStyle(screen.getByTestId('surface')).backgroundColor).toBe('rgb(240, 247, 255)');
    choose('Dark');
    expect(getComputedStyle(screen.getByTestId('surface')).backgroundColor).toBe('rgb(18, 18, 18)');
    expect(getComputedStyle(screen.getByTestId('surface')).color).toBe('rgb(255, 255, 255)');
    fireEvent.click(screen.getByLabelText('theme selector'));
    expect(screen.getByRole('menuitem', { name: 'Dark', exact: true })).toHaveAttribute('aria-current', 'true');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Light', exact: true }));
    expect(getComputedStyle(screen.getByTestId('surface')).backgroundColor).toBe('rgb(255, 255, 255)');
  });
  it('preserves control instances and application overrides across theme changes', () => {
    const applicationTheme = createTheme({ typography: { fontFamily: 'monospace' },
      components: { MuiTableCell: { styleOverrides: { head: { backgroundColor: 'rgb(12, 34, 56)' } } } } });
    render(<ThemeProvider theme={applicationTheme}><DynamicTable headers={headers} data={data} enableThemes
      renderToolbar={() => <input aria-label="Custom control" defaultValue="Draft" />} /></ThemeProvider>);
    const input = screen.getByRole('textbox', { name: 'Custom control' });
    fireEvent.change(input, { target: { value: 'Unsaved draft' } });
    for (const name of ['Grey', 'Dark', 'Default']) {
      fireEvent.click(screen.getByLabelText('theme selector'));
      fireEvent.click(screen.getByRole('menuitem', { name, exact: true }));
      expect(screen.getByRole('textbox', { name: 'Custom control' })).toBe(input);
      expect(input).toHaveValue('Unsaved draft');
      expect(getComputedStyle(screen.getByRole('columnheader', { name: 'Name' })).backgroundColor).toBe('rgb(12, 34, 56)');
      expect(getComputedStyle(screen.getByRole('columnheader', { name: 'Name' })).fontFamily).toBe('monospace');
    }
  });
  it.each([false, true])('inherits application theme and cell overrides with selector=%s', enableThemes => {
    const theme = createTheme({ palette: { mode: 'dark', primary: { main: '#7b1fa2' } },
      components: { MuiTableCell: { styleOverrides: { head: { backgroundColor: 'rgb(12, 34, 56)' } } } } });
    render(<ThemeProvider theme={theme}>
      <DynamicTable headers={headers} data={data} enableThemes={enableThemes} renderToolbar={() => <Probe />} />
    </ThemeProvider>);
    expect(screen.getByTestId('theme-primary')).toHaveTextContent('#7b1fa2');
    const header = within(screen.getByRole('table', { name: 'Data table' })).getByRole('columnheader', { name: 'Name' });
    expect(getComputedStyle(header).backgroundColor).toBe('rgb(12, 34, 56)');
  });
});
