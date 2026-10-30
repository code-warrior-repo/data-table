'use client';
import { useState } from 'react';
import { Alert, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [message, setMessage] = useState('Only active rows show Deactivate.');
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={rows} showActionIcons enableDelete deleteLabel="Deactivate"
      actionVisibilityRules={{ delete: row => row.status === 'Active' }} onDelete={row => setMessage(`Deactivate ${row.name}`)} />
  </Stack>;
}
