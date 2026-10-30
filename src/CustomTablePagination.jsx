import React from 'react';
import { TablePagination } from '@mui/material';

export default function CustomTablePagination({ count, page, rowsPerPage, onPageChange,
  onRowsPerPageChange, rowsPerPageOptions = [5, 10, 20, 30, { value: -1, label: 'All' }] }) {
  const options = rowsPerPageOptions.some(option => (option.value ?? option) === rowsPerPage)
    ? rowsPerPageOptions : [rowsPerPage, ...rowsPerPageOptions];
  return <TablePagination component="div" count={count} page={page} rowsPerPage={rowsPerPage}
    rowsPerPageOptions={options} onPageChange={(_, next) => onPageChange(next)}
    onRowsPerPageChange={onRowsPerPageChange} showFirstButton showLastButton />;
}
