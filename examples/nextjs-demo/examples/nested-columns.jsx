'use client';
import { DynamicTable } from '@company/mui-data-table';
import { rows } from './shared';
const headers = [{ field: 'name', label: 'Name' }, { field: 'profile.city', label: 'City' }];
export default function Example() { return <DynamicTable headers={headers} data={rows} />; }
