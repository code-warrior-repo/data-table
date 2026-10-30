'use client';
import { useEffect, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { headers } from './shared';
import { loadPage } from './mockServer';

export default function Example() {
  const [query, setQuery] = useState({ page: 0, rowsPerPage: 3, sorting: [], searchText: '', columnFilters: {} });
  const [result, setResult] = useState({ rows: [], rowCount: 0, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setResult(previous => ({ ...previous, rows: [], loading: true, error: null }));
    loadPage(query, { signal: controller.signal }).then(page => {
      if (!controller.signal.aborted) setResult({ ...page, loading: false, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setResult(previous => ({ ...previous, loading: false, error }));
    });
    return () => controller.abort();
  }, [query]);
  return <Stack spacing={2}>
    <Alert severity="info">Simulated backend: 150 ms requests. Search, filters and sorting run on the backend; obsolete requests are cancelled.</Alert>
    <DynamicTable headers={headers} data={result.rows} totalCount={result.rowCount} serverSidePagination
      currentPage={query.page} initialRowsPerPage={3} rowsPerPageOptions={[3, 5]} onPageChangeRequest={setQuery}
      loading={result.loading} error={result.error} searchByText enableColumnFilters enableMultiColumnSort />
  </Stack>;
}
