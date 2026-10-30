import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({ plugins: [react()], resolve: { dedupe: ['react', 'react-dom', '@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'], alias: { '@company/mui-data-table': fileURLToPath(new URL('./src/index.js', import.meta.url)) } }, test: { include: ['tests/**/*.test.{js,jsx}'], environment: 'jsdom', setupFiles: ['./tests/setup.js'] } });
