'use client';
import { useState } from 'react';
import { Button, Stack } from '@mui/material';
import { createTableState, DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [state, setState] = useState(() => createTableState({ rowsPerPage: 3 }));
  return <Stack spacing={2}>
    <Button onClick={() => setState(createTableState({ rowsPerPage: 3 }))}>Reset all query state</Button>
    <DynamicTable headers={headers} data={rows} state={state} onStateChange={setState}
      searchByText enableColumnFilters enableMultiColumnSort />
  </Stack>;
}
