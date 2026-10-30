import React from 'react';
import { TablePagination } from '@mui/material';

export default function CustomTablePagination({ count, page, rowsPerPage, onPageChange,
  onRowsPerPageChange, rowsPerPageOptions = [5, 10, 20, 30, { value: -1, label: 'All' }], labels }) {
  const labelId = React.useId();
  const options = rowsPerPageOptions.some(option => (option.value ?? option) === rowsPerPage)
    ? rowsPerPageOptions : [rowsPerPage, ...rowsPerPageOptions];
  return <TablePagination component="div" count={count} page={page} rowsPerPage={rowsPerPage}
    // Pair foreground and surface colors explicitly, including the portaled menu.
    // Otherwise application InputBase/MenuItem colors can leak into this control.
    sx={{ color: 'text.primary', bgcolor: 'background.paper' }}
    slotProps={{
      select: {
        labelId,
        inputProps: { 'aria-labelledby': labelId },
        SelectDisplayProps: { 'aria-label': labels.rowsPerPage },
        sx: { color: 'text.primary', '& .MuiSelect-icon': { color: 'text.primary' } },
        MenuProps: { slotProps: { paper: { sx: { color: 'text.primary', bgcolor: 'background.paper' } } } },
      },
      menuItem: { sx: { color: 'text.primary' } },
    }}
    rowsPerPageOptions={options} onPageChange={(_, next) => onPageChange(next)}
    onRowsPerPageChange={onRowsPerPageChange} labelRowsPerPage={labels.rowsPerPage} labelDisplayedRows={labels.displayedRows}
    getItemAriaLabel={type => labels[`${type}Page`]} showFirstButton showLastButton />;
}
