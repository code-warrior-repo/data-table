'use client';
import { useState } from 'react';
import { Alert, Button, Menu, MenuItem, Stack } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
function CustomerMenu({ row, onAction }) {
  const [anchor, setAnchor] = useState(null);
  const id = `actions-${row.id}`;
  return <>
    <Button aria-haspopup="menu" aria-controls={anchor ? id : undefined} aria-expanded={Boolean(anchor)}
      onClick={event => setAnchor(event.currentTarget)}>Actions for {row.name}</Button>
    <Menu id={id} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
      <MenuItem onClick={() => { onAction(`Viewing ${row.name}`); setAnchor(null); }}>View</MenuItem>
      <MenuItem disabled={row.status !== 'Active'} onClick={() => { onAction(`Editing ${row.name}`); setAnchor(null); }}>Edit</MenuItem>
    </Menu>
  </>;
}
export default function Example() {
  const [message, setMessage] = useState('Open a row menu.');
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={rows} renderRowActions={({ row }) => <CustomerMenu row={row} onAction={setMessage} />} />
  </Stack>;
}
