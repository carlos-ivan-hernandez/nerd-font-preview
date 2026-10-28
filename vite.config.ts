import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import {downloads} from './scripts/downloads.ts';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), downloads()],
});
