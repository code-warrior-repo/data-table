'use client';
import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';

export default function Example() {
  // The parent supplies a page, using the same contract as a backend integration.
  const [query, setQuery] = useState({ page: 0, rowsPerPage: 3 });
  const pageRows = rows.slice(query.page * query.rowsPerPage, (query.page + 1) * query.rowsPerPage);
  return <Stack spacing={2}>
    <Typography role="status">Parent-controlled page: {query.page + 1}</Typography>
    <Stack direction="row" spacing={1}>
      <Button onClick={() => setQuery(previous => ({ ...previous, page: 0 }))}>First group</Button>
      <Button onClick={() => setQuery(previous => ({ ...previous, page: 1 }))}>Second group</Button>
    </Stack>
    <DynamicTable headers={headers.map(header => ({ ...header, sortable: false }))} data={pageRows}
      serverSidePagination totalCount={rows.length} currentPage={query.page} initialRowsPerPage={3}
      rowsPerPageOptions={[3]} onPageChangeRequest={setQuery} />
  </Stack>;
}
