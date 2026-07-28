import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works from any GitHub Pages project path,
// combined with HashRouter for client-side routing without server rewrites.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
