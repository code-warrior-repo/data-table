import { fileURLToPath } from 'node:url';

export default {
  outputFileTracingRoot: fileURLToPath(new URL('../..', import.meta.url)),
  // The local library is symlinked above this demo. Share its peer contexts with
  // custom renderers rather than loading a second MUI/Emotion installation.
  turbopack: {
    root: fileURLToPath(new URL('../..', import.meta.url)),
    resolveAlias: {
      '@mui/*': '../../node_modules/@mui/*',
      '@emotion/*': '../../node_modules/@emotion/*',
    },
  }
};
