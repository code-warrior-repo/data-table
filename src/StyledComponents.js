import { styled } from '@mui/material/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

// Header colors come from createTableTheme so all header cells (including slots)
// follow the selected palette and application component overrides remain effective.
export const StyledTableCell = styled(TableCell)({
  [`&.${tableCellClasses.body}`]: { fontSize: 14 },
});

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
  '&:last-child td, &:last-child th': { border: 0 },
}));

export const StyledActionTableCell = styled(StyledTableCell)(({ theme }) => ({
  whiteSpace: 'nowrap',
  textAlign: 'right',
  width: '1%',
  paddingRight: theme.spacing(2),
  '& .MuiButtonBase-root': {
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: theme.spacing(0.5),
  },
  '& .MuiButton-root:hover': { textDecoration: 'underline' },
}));
