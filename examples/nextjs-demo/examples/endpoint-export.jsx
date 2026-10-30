'use client';
import { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { exportWithEndpoint } from '@company/mui-data-table';

export default function Example() {
  const [message, setMessage] = useState('Download a JSON response from a simulated endpoint.');
  const [busy, setBusy] = useState(false);
  async function download() {
    setBusy(true);
    try {
      await exportWithEndpoint({ url: '/api/customers/export', filename: 'endpoint-customers.json', method: 'POST',
        body: { status: 'Active' },
        // Omit fetcher in production to use window.fetch against your server.
        fetcher: async (_url, request) => ({ ok: true,
          blob: async () => new Blob([JSON.stringify({ exported: true, query: JSON.parse(request.body) }, null, 2)], { type: 'application/json' }) }) });
      setMessage('Endpoint response downloaded.');
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <Stack spacing={2}><Alert severity="info">{message}</Alert><Button disabled={busy} onClick={download}>Download endpoint response</Button></Stack>;
}
