import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { createTheme, ThemeProvider, useTheme } from '@mui/material/styles';
import DynamicTable from '../src/DynamicTable.jsx';

const headers = [{ field: 'name', label: 'Name' }];
const data = [{ id: 1, name: 'Ada' }];
function Probe() {
  const theme = useTheme();
  return <span data-testid="theme-primary">{theme.palette.primary.main}</span>;
}

describe('table theme selection', () => {
  it.each([false, true])('uses the original green default and striped rows with selector=%s', enableThemes => {
    render(<DynamicTable headers={headers} data={data} enableThemes={enableThemes} />);
    const header = getComputedStyle(screen.getByRole('columnheader', { name: 'Name' }));
    expect(header.backgroundColor).toBe('rgb(0, 128, 0)');
    expect(header.color).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(screen.getByText('Ada').closest('tr')).backgroundColor).toBe('rgba(0, 0, 0, 0.04)');
  });
  it('restores the green theme after returning from a preset to Default', () => {
    const theme = createTheme({ palette: { primary: { main: '#7b1fa2' } } });
    render(<ThemeProvider theme={theme}><DynamicTable headers={headers} data={data} enableThemes renderToolbar={() => <Probe />} /></ThemeProvider>);
    fireEvent.click(screen.getByLabelText('theme selector'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Grey' }));
    expect(screen.getByTestId('theme-primary')).not.toHaveTextContent('#7b1fa2');
    fireEvent.click(screen.getByLabelText('theme selector'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Default' }));
    expect(screen.getByTestId('theme-primary')).toHaveTextContent('#008000');
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
    expect(getComputedStyle(screen.getByRole('columnheader', { name: 'Name' })).backgroundColor).toBe('rgb(158, 158, 158)');
    choose('Blue');
    expect(getComputedStyle(screen.getByTestId('surface')).backgroundColor).toBe('rgb(240, 247, 255)');
    expect(getComputedStyle(screen.getByRole('columnheader', { name: 'Name' })).backgroundColor).toBe('rgb(25, 118, 210)');
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
  it('keeps pagination value and popup options readable despite application input/menu colors', () => {
    const theme = createTheme({ components: {
      MuiInputBase: { styleOverrides: { root: { color: '#bdbdbd' } } },
      MuiMenuItem: { styleOverrides: { root: { color: '#bdbdbd' } } },
    } });
    render(<ThemeProvider theme={theme}><DynamicTable headers={headers} data={data} /></ThemeProvider>);
    const dropdown = screen.getByRole('combobox', { name: 'Rows per page:' });
    expect(getComputedStyle(dropdown.closest('.MuiInputBase-root')).color).toBe('rgba(0, 0, 0, 0.87)');
    fireEvent.mouseDown(dropdown);
    for (const option of screen.getAllByRole('option')) {
      expect(getComputedStyle(option).color).toBe('rgba(0, 0, 0, 0.87)');
    }
  });
  it('labels both visible pagination selectors and underlying inputs with localized text', () => {
    render(<>
      <DynamicTable headers={headers} data={data} />
      <DynamicTable headers={headers} data={data} labels={{ rowsPerPage: 'Lignes par page :' }} />
    </>);
    for (const label of ['Rows per page:', 'Lignes par page :']) {
      const dropdown = screen.getByRole('combobox', { name: label });
      expect(dropdown).toHaveAttribute('aria-label', label);
      expect(document.getElementById(dropdown.getAttribute('aria-labelledby'))).toHaveTextContent(label);
      const input = dropdown.parentElement.querySelector('input');
      expect(input).toHaveAttribute('aria-labelledby', dropdown.getAttribute('aria-labelledby'));
      expect(document.getElementById(input.getAttribute('aria-labelledby'))).toHaveTextContent(label);
      expect(input).toHaveAttribute('aria-hidden', 'true');
    }
    const inputs = [...document.querySelectorAll('.MuiTablePagination-root input')];
    expect(new Set(inputs.map(input => input.id)).size).toBe(inputs.length);
  });
  it.each([false, true])('retains application cell overrides with the green palette and selector=%s', enableThemes => {
    const theme = createTheme({ palette: { mode: 'dark', primary: { main: '#7b1fa2' } },
      components: { MuiTableCell: { styleOverrides: { head: { backgroundColor: 'rgb(12, 34, 56)' } } } } });
    render(<ThemeProvider theme={theme}>
      <DynamicTable headers={headers} data={data} enableThemes={enableThemes} renderToolbar={() => <Probe />} />
    </ThemeProvider>);
    expect(screen.getByTestId('theme-primary')).toHaveTextContent('#008000');
    const header = within(screen.getByRole('table', { name: 'Data table' })).getByRole('columnheader', { name: 'Name' });
    expect(getComputedStyle(header).backgroundColor).toBe('rgb(12, 34, 56)');
  });
});
