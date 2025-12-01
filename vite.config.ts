import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GANTI 'NAMA-REPOSITORY-GITHUB' dengan nama repository kamu, contoh: '/target-x/'
  base: '/NAMA-REPOSITORY-GITHUB/',
});