import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vite configuration file
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    cors: true,
  },
  base: './', // Use relative paths for assets in build
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true, // For  debugging
    chunkSizeWarningLimit: 1000,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Separate vendor code into chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ethers: ['ethers'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'ethers'],
    esbuildOptions: {
      jsx: 'automatic'
    }
  },
  publicDir: 'public',
}) 