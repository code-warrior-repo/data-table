'use client';
import { useState } from 'react';
import { Alert, Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { DynamicTable } from '@company/mui-data-table';
import { rows, headers } from './shared';
export default function Example() {
  const [message, setMessage] = useState('Pending rows can be approved; inactive rows are disabled.');
  return <Stack spacing={2}><Alert severity="info">{message}</Alert>
    <DynamicTable headers={headers} data={rows} showActionIcons actions={[
      { id: 'approve', label: 'Approve', icon: CheckIcon, visible: row => row.status !== 'Active',
        disabled: row => row.status === 'Inactive', onClick: row => setMessage(`Approved ${row.name}`) }
    ]} />
  </Stack>;
}
