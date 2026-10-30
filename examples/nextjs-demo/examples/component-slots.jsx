'use client';
import { Stack, Typography } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
function ApplicationToolbar({ children }) {
  return <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ p: 2 }}><Typography>Application toolbar</Typography>{children}</Stack>;
}
export default function Example() {
  return <DynamicTable headers={headers} data={rows} searchByText slots={{ toolbar: ApplicationToolbar }}
    slotProps={{ table: { 'data-testid': 'application-table' } }} />;
}
