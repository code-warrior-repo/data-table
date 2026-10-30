'use client';
import { useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { headers } from './shared';
import { matchingRows } from './mockServer';

export default function Example() {
  const [query, setQuery] = useState({ page: 0, rowsPerPage: 3, sorting: [], searchText: '', columnFilters: {} });
  const [message, setMessage] = useState('Only three rows are loaded. Export resolves all matching rows.');
  const matching = matchingRows(query);
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={matching.slice(query.page * query.rowsPerPage, (query.page + 1) * query.rowsPerPage)}
      totalCount={matching.length} serverSidePagination currentPage={query.page} initialRowsPerPage={3}
      rowsPerPageOptions={[3]} onPageChangeRequest={setQuery} searchByText enableExport
      fetchAllForExport={async exportQuery => {
        const all = matchingRows(exportQuery);
        setMessage(`Full-result resolver returned ${all.length} matching rows.`);
        return all;
      }} />
  </Stack>;
}
