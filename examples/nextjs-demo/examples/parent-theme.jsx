'use client';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
// Application component overrides take precedence over the table's green default.
const theme = createTheme({
  typography: { fontFamily: 'Georgia, serif' },
  components: { MuiTableCell: { styleOverrides: { head: { backgroundColor: '#7b1fa2', color: '#fff' } } } },
});
export default function Example() { return <ThemeProvider theme={theme}><DynamicTable headers={headers} data={rows} /></ThemeProvider>; }
