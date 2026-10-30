import { styled } from '@mui/material/styles';
import TableCell from '@mui/material/TableCell';

// Preserve standard MUI appearance and application MuiTableCell/MuiTableRow overrides.
export { default as StyledTableCell } from '@mui/material/TableCell';
export { default as StyledTableRow } from '@mui/material/TableRow';

export const StyledActionTableCell = styled(TableCell)({
  whiteSpace: 'nowrap',
  width: '1%'
});
