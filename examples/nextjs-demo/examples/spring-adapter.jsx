'use client';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { createSpringDataSource, toSpringRequest, fetchAllSpringRows, DynamicTable } from '@company/mui-data-table';
import { headers } from './shared';
import { mockSpringFetch } from './mockServer';

export default function Example() {
  const source = useMemo(() => createSpringDataSource({ url: '/api/customers', fetcher: mockSpringFetch }), []);
  const [query, setQuery] = useState({ page: 0, rowsPerPage: 3, sorting: [], searchText: '', columnFilters: {} });
  const [result, setResult] = useState({ rows: [], rowCount: 0, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setResult(previous => ({ ...previous, rows: [], loading: true, error: null }));
    source(toSpringRequest(query, { signal: controller.signal })).then(page => {
      if (!controller.signal.aborted) setResult({ ...page, loading: false, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setResult(previous => ({ ...previous, loading: false, error }));
    });
    return () => controller.abort();
  }, [source, query]);
  return <Stack spacing={2}>
    <Alert severity="info">Spring Data query/response adaptation with a fetch-compatible mock. Remove fetcher to use a real endpoint.</Alert>
    <DynamicTable headers={headers} data={result.rows} totalCount={result.rowCount} serverSidePagination
      currentPage={query.page} initialRowsPerPage={3} rowsPerPageOptions={[3, 5]} onPageChangeRequest={setQuery}
      loading={result.loading} error={result.error} searchByText enableColumnFilters enableExport
      fetchAllForExport={(exportQuery, { signal, onProgress }) => fetchAllSpringRows({ dataSource: source, query: exportQuery, pageSize: 3, getRowId: row => row.id, signal, onProgress })} />
  </Stack>;
}
