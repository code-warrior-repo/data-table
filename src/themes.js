import { createTheme } from '@mui/material/styles';

// Table palettes are explicit: Default is the original green theme.
// Application typography and component overrides are retained by createTableTheme.
export const themes = {
  default: createTheme({ palette: { primary: { main: '#008000' }, secondary: { main: '#ff4081' } } }),
  grey: createTheme({
    palette: {
      primary: { main: '#9e9e9e' },
      secondary: { main: '#bdbdbd' },
      background: { default: '#eeeeee', paper: '#f5f5f5' },
    },
  }),
  blue: createTheme({
    palette: {
      primary: { main: '#1976d2' },
      secondary: { main: '#ff4081' },
      background: { default: '#e3f2fd', paper: '#f0f7ff' },
    },
  }),
  light: createTheme({ palette: { mode: 'light', primary: { main: '#90caf9' }, secondary: { main: '#f48fb1' } } }),
  dark: createTheme({ palette: { mode: 'dark' } }),
};

/** Keep one theme boundary so choosing a palette never remounts table controls. */
export function createTableTheme(applicationTheme, preset = 'default') {
  return createTheme(applicationTheme, {
    palette: themes[preset].palette,
    components: {
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            fontSize: 'inherit',
            '& .MuiTableSortLabel-root, & .MuiTableSortLabel-root:hover, & .MuiTableSortLabel-root.Mui-active': { color: 'inherit' },
            '& .MuiTableSortLabel-icon, & .MuiCheckbox-root, & .MuiCheckbox-root.Mui-checked': { color: 'inherit' },
          }),
        },
      },
    },
  }, { components: applicationTheme.components });
}
