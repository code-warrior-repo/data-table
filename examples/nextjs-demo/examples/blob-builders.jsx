'use client';
import { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { createXlsxBlob, createPdfBlob, downloadBlob, headersToExportColumns } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Generate a Blob separately from its download.');
  async function generate(format) {
    setBusy(true);
    try {
      const context = { rows, columns: headersToExportColumns(headers), title: 'Customers' };
      const blob = await (format === 'xlsx' ? createXlsxBlob(context) : createPdfBlob(context));
      setMessage(`Generated ${blob.size} bytes of ${blob.type}.`);
      downloadBlob(blob, `customers.${format}`);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <Button disabled={busy} onClick={() => generate('xlsx')}>Build XLSX Blob</Button>
    <Button disabled={busy} onClick={() => generate('pdf')}>Build PDF Blob</Button>
  </Stack>;
}
