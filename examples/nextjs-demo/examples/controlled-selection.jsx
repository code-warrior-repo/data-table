'use client';
import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [ids, setIds] = useState([]);
  return <Stack spacing={2}><Typography role="status">Selected IDs: {ids.join(', ') || 'none'}</Typography>
    <Button onClick={() => setIds([])}>Clear selection</Button>
    <DynamicTable headers={headers} data={rows} enableRowSelection selectedRowIds={ids} onSelectionChange={setIds}
      selectionScope="page" selectionReset="dataset" datasetKey="customers" />
  </Stack>;
}
