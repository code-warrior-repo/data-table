import { createTheme } from '@mui/material/styles';

export const themes = {
    default: createTheme({
        palette: {
          primary: {
            main: '#008000',
          },
          secondary: {
            main: '#ff4081',
          },
        },
      }),
      grey: createTheme({
        palette: {
          primary: {
            main: '#9e9e9e', // grey 500
          },
          secondary: {
            main: '#bdbdbd', // grey 400
          },
        },
      }),
    blue: createTheme({
      palette: {
        primary: {
          main: '#1976d2',
        },
        secondary: {
          main: '#ff4081',
        },
      },
    }),
    light: createTheme({
        palette: {
          mode: 'light',
          primary: {
            main: '#90caf9',
          },
          secondary: {
            main: '#f48fb1',
          },
        },
      }),
  };
