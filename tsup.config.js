import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm'],
  target: 'es2022',
  clean: true,
  sourcemap: true,
  splitting: true,
  banner: { js: "'use client';" },
  external: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled', '@mui/icons-material', 'date-fns', 'prop-types', 'exceljs', 'jspdf', 'jspdf-autotable']
});
