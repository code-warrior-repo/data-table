'use client';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Box, Button, CssBaseline, Stack } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

export default function Providers({ children }) {
  const [mode, setMode] = useState('light');
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);
  return <ThemeProvider theme={theme}>
    <CssBaseline/>
    <Box sx={{p:{xs:1,sm:3},maxWidth:1200,mx:'auto'}}>
      <Stack direction="row" spacing={1} sx={{mb:2, flexWrap:'wrap', rowGap:1}}>
        <Button component={Link} href="/">All examples</Button>
        <Button component={Link} href="/examples/client-pagination-all-features">Full client demo</Button>
        <Button component={Link} href="/examples/server-pagination-all-features">Full server demo</Button>
        <Button component={Link} href="/examples/server-pagination">Server pagination</Button>
        <Button component={Link} href="/examples/spring-adapter">Spring adapter</Button>
        <Button onClick={()=>setMode(mode==='light'?'dark':'light')}>Use {mode==='light'?'dark':'light'} theme</Button>
      </Stack>
      {children}
    </Box>
  </ThemeProvider>;
}
