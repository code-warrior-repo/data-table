'use client';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
const columns = headers.map(column => ({ ...column, minWidth: 120, maxWidth: 400 }));
export default function Example() {
  return <Stack spacing={2}>
    <Alert severity="info">Drag a header’s end divider. Keyboard: Left/Right adjusts 10px, Shift adjusts 50px, Home/End selects the minimum/maximum.</Alert>
    <DynamicTable headers={columns} data={rows} getRowId={row => row.id} enableColumnResizing />
  </Stack>;
}
