'use client';
import { useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [message, setMessage] = useState('Select rows, then click Send email to preview recipients.');
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={rows} uniqueField="id" searchByText enableEmail
      onEmail={recipients => setMessage(`Recipients: ${recipients.map(row => row.name).join(', ')}`)} />
  </Stack>;
}
