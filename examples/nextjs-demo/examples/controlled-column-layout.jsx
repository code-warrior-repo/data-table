'use client';
import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
const columns = headers.map(column => ({ ...column, ...(column.field === 'status' ? { reorderable: false, resizable: false, width: 160 } : {}) }));
export default function Example() {
  const [order, setOrder] = useState(['name', 'status', 'score']);
  const [sizing, setSizing] = useState({ name: 220, status: 160, score: 180 });
  return <Stack spacing={2}>
    <Button onClick={() => { setOrder(['name', 'status', 'score']); setSizing({ name: 220, status: 160, score: 180 }); }}>Reset column layout</Button>
    <Typography role="status">Column order: {order.join(', ')}. Status has a fixed position and width.</Typography>
    <DynamicTable headers={columns} data={rows} getRowId={row => row.id} enableColumnReordering enableColumnResizing
      columnOrder={order} onColumnOrderChange={setOrder} columnSizing={sizing} onColumnSizingChange={setSizing} />
  </Stack>;
}
