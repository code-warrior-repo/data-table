'use client';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';

export default function Example() {

  return <Stack spacing={2}>
    <Alert severity="info">Use the palette button to choose Grey, Blue, Light or Dark. Default restores the original green theme.</Alert>
    <DynamicTable headers={headers} data={rows} getRowId={row => row.id} enableThemes searchByText />
  </Stack>;
}
