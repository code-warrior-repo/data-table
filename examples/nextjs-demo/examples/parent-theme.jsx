'use client';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
const theme = createTheme({ palette: { primary: { main: '#7b1fa2' } } });
export default function Example() { return <ThemeProvider theme={theme}><DynamicTable headers={headers} data={rows} /></ThemeProvider>; }
