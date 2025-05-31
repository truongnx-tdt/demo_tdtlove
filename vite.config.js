import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    open: true,
    allowedHosts: 'all'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'tween': ['@tweenjs/tween.js'],
          'troika': ['troika-three-text']
        },
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    manifest: true,
    sourcemap: true
  }
}); 