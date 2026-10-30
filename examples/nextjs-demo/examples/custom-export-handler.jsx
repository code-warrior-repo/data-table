'use client';
import { useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers, onlyFormat } from './shared';
export default function Example() {
  const [message, setMessage] = useState('Choose JSON in the export menu.');
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={rows} enableExport exportOptions={onlyFormat('json')}
      exportHandlers={{ json: async ({ rows: exported, filename }) => setMessage(`Custom handler received ${exported.length} rows for ${filename}`) }} />
  </Stack>;
}
