'use client';
import { useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers, onlyFormat } from './shared';
export default function Example() {
  const [query, setQuery] = useState({ page: 0, rowsPerPage: 3 });
  return <Stack spacing={2}><Alert severity="info">Choose CSV to see the failed export notification.</Alert>
    <DynamicTable headers={headers.map(header => ({ ...header, sortable: false }))}
      data={rows.slice(query.page * query.rowsPerPage, (query.page + 1) * query.rowsPerPage)} totalCount={rows.length} serverSidePagination
      initialRowsPerPage={3} rowsPerPageOptions={[3]} currentPage={query.page} onPageChangeRequest={setQuery} enableExport exportOptions={onlyFormat('csv')}
      fetchAllForExport={async () => { throw new Error('The simulated export service is unavailable.'); }} />
  </Stack>;
}
