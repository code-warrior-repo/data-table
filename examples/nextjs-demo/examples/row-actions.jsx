'use client';
import { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [message, setMessage] = useState('Choose View on a row.');
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={rows} actionsColumnLabel="Manage"
      renderRowActions={({ row, rowId }) => <Button onClick={() => setMessage(`Viewing ${row.name} (${rowId})`)}>View</Button>} />
  </Stack>;
}
