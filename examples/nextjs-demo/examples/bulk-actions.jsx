'use client';
import { useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';

export default function Example() {
  const [data, setData] = useState(rows);
  const [ids, setIds] = useState([]);
  const [message, setMessage] = useState('Select synthetic records, then choose an action. Email previews recipients only.');
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={data} enableRowSelection selectedRowIds={ids} onSelectionChange={setIds}
      renderBulkActions={({ selectedRowIds, selectedRows, selectedCount, clearSelection, disabled }) => <>
        <Button disabled={disabled || !selectedCount} onClick={() => {
          setData(previous => previous.filter(row => !selectedRowIds.includes(row.id)));
          setMessage(`Removed ${selectedCount} synthetic records.`);
          clearSelection();
        }}>Remove selected</Button>
        <Button disabled={disabled || !selectedCount}
          onClick={() => setMessage(`Email preview: ${selectedRows.map(row => row.email).join(', ')}`)}>Email selected</Button>
      </>} />
    <Button onClick={() => { setData(rows); setIds([]); setMessage('Synthetic records restored.'); }}>Restore data</Button>
  </Stack>;
}
