'use client';
import { useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers, onlyFormat } from './shared';
export default function Example() {
  const [message, setMessage] = useState('Endpoint handlers receive query state and bypass the row resolver.');
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={rows} enableExport exportOptions={onlyFormat('json')}
      exportHandlers={{ json: { mode: 'endpoint', handler: async ({ state, signal }) => {
        // Replace this simulated response with exportWithEndpoint({url, filename, body: state, signal}).
        signal.throwIfAborted();
        setMessage(`Endpoint handler received search: ${state.searchText || '(empty)'}. No rows were fetched.`);
      } } }} />
  </Stack>;
}
