'use client';
import { useId, useState } from 'react';
import { Box, Button, Chip, FormControl, InputLabel, Menu, MenuItem, Select, Stack, Typography } from '@mui/material';
import { rows } from './shared';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const makeFullFeatureRows = () => rows.map((row, index) => ({ ...row, profile: { ...row.profile }, joined: `2024-${String(index + 1).padStart(2, '0')}-15` }));
export const fullFeatureColumns = [
  { field: 'name', label: 'Name', fields: ['name', 'surname'], separator: ' ', dataType: 'string', width: 240, minWidth: 180 },
  { field: 'status', label: 'Status', width: 160, minWidth: 140,
    renderCell: ({ value }) => <Chip size="small" label={value} sx={value === 'Pending' ? { color: 'common.black' } : undefined} color={value === 'Active' ? 'success' : value === 'Pending' ? 'warning' : 'default'} /> },
  { field: 'score', label: 'Score', dataType: 'number', width: 140, minWidth: 120, align: 'right',
    filterFn: (value, filter) => Number(value) >= Number(filter) },
  { field: 'amount', label: 'Amount', dataType: 'number', width: 160, minWidth: 140, align: 'right',
    renderCell: ({ value }) => currency.format(value) },
  { field: 'profile.city', label: 'City', width: 180, minWidth: 160 },
  { field: 'email', label: 'Email', width: 260, minWidth: 200 },
  { field: 'joined', label: 'Joined', dataType: 'date', dateFormat: 'MMM dd, yyyy', width: 180, minWidth: 160 },
];
export const initialColumnOrder = fullFeatureColumns.map(column => column.field);
export const initialColumnSizing = Object.fromEntries(fullFeatureColumns.map(column => [column.field, column.width]));
export const splitToolbar = { search: 'left', sort: 'left', custom: 'left', bulkActions: 'left', export: 'right', themes: 'right' };

function Setting({ label, value, onChange, options }) {
  const id = useId();
  return <FormControl size="small" sx={{ minWidth: 170 }}>
    <InputLabel id={`${id}-label`}>{label}</InputLabel>
    <Select labelId={`${id}-label`} id={`${id}-select`} label={label} inputProps={{ 'aria-labelledby': `${id}-label` }} value={value} onChange={event => onChange(event.target.value)}>
      {options.map(([key, text]) => <MenuItem key={key} value={key}>{text}</MenuItem>)}
    </Select>
  </FormControl>;
}
export function FeatureSettings({ position, onPositionChange, toolbar, onToolbarChange, preview, onPreviewChange }) {
  return <Stack direction="row" gap={2} flexWrap="wrap">
    <Setting label="Checkbox position" value={position} onChange={onPositionChange} options={[["first", 'First'], ["last", 'Last'], [1, 'Column position 1']]} />
    <Setting label="Toolbar layout" value={toolbar} onChange={onToolbarChange} options={[["left", 'Left'], ["right", 'Right'], ["split", 'Split']]} />
    {onPreviewChange && <Setting label="Preview table state" value={preview} onChange={onPreviewChange}
      options={[["ready", 'Ready'], ["loading", 'Loading'], ["error", 'Error'], ["empty", 'Empty']]} />}
  </Stack>;
}
export function ExampleRowMenu({ row, items }) {
  const [anchor, setAnchor] = useState(null);
  const id = useId();
  return <>
    <Button color="inherit" size="small" aria-label={`Actions for ${row.name}`} aria-haspopup="menu" aria-controls={anchor ? id : undefined}
      aria-expanded={Boolean(anchor)} onClick={event => setAnchor(event.currentTarget)}>Actions</Button>
    <Menu id={id} anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
      {items.map(item => <MenuItem key={item.id} disabled={item.disabled} onClick={() => { setAnchor(null); item.onClick(); }}>{item.label}</MenuItem>)}
    </Menu>
  </>;
}
export function ExampleBulkActions({ context, onRemove, onEmail }) {
  const { selectedRowIds, selectedCount, clearSelection, disabled } = context;
  return <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    <Button color="inherit" disabled={disabled || !selectedCount} onClick={() => { onRemove(selectedRowIds); clearSelection(); }}>Remove selected</Button>
    <Button color="inherit" disabled={disabled || !selectedCount} onClick={() => onEmail(context)}>Email selected</Button>
    <Button color="inherit" disabled={!selectedCount} onClick={clearSelection}>Clear selection</Button>
  </Box>;
}
export function FeatureSummary({ query, selectedIds }) {
  return <Stack>
    <Typography variant="body2" data-testid="feature-selection">Selected IDs: {selectedIds.join(', ') || 'none'}</Typography>
    <Typography variant="caption" data-testid="feature-query">Page {query.page + 1}; page size {query.rowsPerPage}; search: {query.searchText || '(none)'}; sort: {query.sorting.map(sort => `${sort.field} ${sort.order}`).join(', ') || '(none)'}</Typography>
  </Stack>;
}
