'use client';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { createSpringDataSource, fetchAllSpringRows, exportRowsAsCsv, headersToExportColumns } from '@company/mui-data-table';
import { headers } from './shared';
import { mockSpringFetch } from './mockServer';

const source = createSpringDataSource({ url: '/api/customers', fetcher: mockSpringFetch });
export default function Example() {
  const controllerRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Export every Spring page with progress and cancellation.');
  useEffect(() => () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);
  async function download() {
    if (controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    try {
      const rows = await fetchAllSpringRows({ dataSource: source, pageSize: 3, maxRows: 100,
        query: { sorting: [{ field: 'name', order: 'asc' }, { field: 'id', order: 'asc' }] },
        getRowId: row => row.id, signal: controller.signal,
        onProgress: ({ loaded, total }) => setMessage(`Loaded ${loaded} of ${total} rows.`) });
      if (controllerRef.current !== controller) return;
      exportRowsAsCsv({ rows, columns: headersToExportColumns(headers), filename: 'spring-customers.csv' });
      setMessage(`Downloaded ${rows.length} rows from all Spring pages.`);
    } catch (error) {
      if (controllerRef.current === controller) setMessage(controller.signal.aborted ? 'Export cancelled.' : error.message);
    } finally {
      if (controllerRef.current === controller) { controllerRef.current = null; setBusy(false); }
    }
  }
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <Stack direction="row" spacing={1}>
      <Button disabled={busy} onClick={download}>Export all Spring rows</Button>
      <Button disabled={!busy} onClick={() => controllerRef.current?.abort()}>Cancel export</Button>
    </Stack>
  </Stack>;
}
