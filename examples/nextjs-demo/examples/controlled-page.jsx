'use client';
import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [state, setState] = useState({ page: 0 });
  return <Stack spacing={2}>
    <Typography role="status">Parent-controlled page: {state.page + 1}</Typography>
    <Stack direction="row" spacing={1}>
      <Button onClick={() => setState({ page: 0 })}>First group</Button>
      <Button onClick={() => setState({ page: 1 })}>Second group</Button>
    </Stack>
    <DynamicTable headers={headers} data={rows} state={state} initialRowsPerPage={3}
      rowsPerPageOptions={[3]} onStateChange={next => setState({ page: next.page })} />
  </Stack>;
}
