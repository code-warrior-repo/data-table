'use client';
import { Button, List, ListItem, Stack, TextField, Typography } from '@mui/material';
import { useTableModel } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const model = useTableModel({ data: rows, headers, initialRowsPerPage: 3 });
  return <Stack spacing={2}>
    <TextField label="Search customers" value={model.searchText} onChange={event => model.update({ searchText: event.target.value })} />
    <List>{model.rows.map(row => <ListItem key={row.id}>{row.name}</ListItem>)}</List>
    <Typography role="status">Page {model.page + 1}; {model.count} matches</Typography>
    <Stack direction="row"><Button disabled={model.page === 0} onClick={() => model.update(previous => ({ page: previous.page - 1 }))}>Previous</Button>
      <Button disabled={(model.page + 1) * model.rowsPerPage >= model.count} onClick={() => model.update(previous => ({ page: previous.page + 1 }))}>Next</Button></Stack>
  </Stack>;
}
