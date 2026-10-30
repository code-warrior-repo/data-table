import { styled } from '@mui/material/styles';
import TableCell, {tableCellClasses} from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontSize: 'inherit',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

export const StyledActionTableCell = styled(TableCell)(({ theme }) => ({
  whiteSpace: 'nowrap',
  textAlign: 'right',
  width: '1%',
  paddingRight: theme.spacing(2),

  '& .MuiButtonBase-root': {
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },

  // If rendering text Buttons when icons are off
  '& .MuiButton-root:hover': {
    textDecoration: 'underline',
  },
}));