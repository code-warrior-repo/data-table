'use client';
import { Button, Typography } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  return <DynamicTable headers={headers} data={rows} searchByText enableColumnFilters
    renderToolbar={({ count, update }) => <>
      <Typography role="status">{count} matching customers</Typography>
      <Button onClick={() => update({ searchText: '', columnFilters: {}, sorting: [] })}>Reset query</Button>
    </>} />;
}
