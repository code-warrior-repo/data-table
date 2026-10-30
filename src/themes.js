import { createTheme } from '@mui/material/styles';

// Default is resolved from the surrounding application by DynamicTable.
// Presets include surface colors so neutral table cells visibly reflect the choice.
export const themes = {
  default: createTheme(),
  grey: createTheme({
    palette: {
      primary: { main: '#616161' },
      secondary: { main: '#757575' },
      background: { default: '#eeeeee', paper: '#f5f5f5' },
    },
  }),
  blue: createTheme({
    palette: {
      primary: { main: '#1565c0' },
      secondary: { main: '#7b1fa2' },
      background: { default: '#e3f2fd', paper: '#f0f7ff' },
    },
  }),
  light: createTheme({ palette: { mode: 'light' } }),
  dark: createTheme({ palette: { mode: 'dark' } }),
};
