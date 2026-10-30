'use client';
import { useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [message, setMessage] = useState('Choose an action.');
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={rows} enableEdit
      onEdit={row => setMessage(`Legacy Edit action: ${row.name}`)} />
  </Stack>;
}
