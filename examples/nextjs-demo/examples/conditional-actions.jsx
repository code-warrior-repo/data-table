'use client';
import { useState } from 'react';
import { Button, Stack, Alert } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [editing, setEditing] = useState(null);
  return <Stack spacing={2}><Alert severity="info">{editing ? `Editing ${editing}. Close to enable actions again.` : 'Only active rows can be edited.'}</Alert>
    {editing && <Button onClick={() => setEditing(null)}>Close editor</Button>}
    <DynamicTable headers={headers} data={rows} renderRowActions={({ row }) => row.status === 'Active' &&
      <Button disabled={Boolean(editing)} onClick={() => setEditing(row.name)}>Edit</Button>} />
  </Stack>;
}
