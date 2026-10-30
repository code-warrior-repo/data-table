'use client';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  return <Stack spacing={2}>
    <Alert severity="info">Drag a column’s move button onto another header, use its arrow keys, or click it for a move menu.</Alert>
    <DynamicTable headers={headers} data={rows} getRowId={row => row.id} enableColumnReordering enableRowSelection />
  </Stack>;
}
