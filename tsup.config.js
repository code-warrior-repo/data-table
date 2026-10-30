import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.js', core: 'src/core/index.js', spring: 'src/spring.js', exports: 'src/exports.js' },
  format: ['esm'],
  target: 'es2022',
  clean: true,
  sourcemap: true,
  splitting: true,
  external: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled', '@mui/icons-material', 'date-fns', 'prop-types', 'exceljs', 'jspdf', 'jspdf-autotable']
});
