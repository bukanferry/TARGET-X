import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Konfigurasi Base Path:
  // - Saat Development (npm run dev): gunakan '/' (root) agar localhost jalan normal
  // - Saat Production (npm run build/deploy): gunakan nama repository GitHub
  // PENTING: GANTI '/NAMA-REPOSITORY-GITHUB/' DI BAWAH INI DENGAN NAMA REPO KAMU!
  // Contoh: jika nama repo adalah 'target-x', ubah menjadi '/target-x/'
  base: mode === 'production' ? '/target-x/' : '/',
}));