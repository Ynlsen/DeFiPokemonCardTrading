import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    cors: true,
    // Proxy API requests to the backend server during development
    proxy: {
      // If you have a separate API backend:
      // '/api': {
      //   target: 'http://localhost:8000',
      //   changeOrigin: true,
      // },
    },
  },
  // Use relative paths for assets in production build
  base: './',
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
    // Don't use source maps in production to reduce size
    sourcemap: true,
    // Optimize chunk sizes
    chunkSizeWarningLimit: 1000,
    // Copy assets to a predictable location
    assetsDir: 'assets',
    // Include images with these extensions in the build
    assetsInclude: ['**/*.jpg', '**/*.png', '**/*.svg'],
    rollupOptions: {
      output: {
        // Separate vendor code from application code
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ethers: ['ethers'],
        },
      },
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'ethers'],
    esbuildOptions: {
      jsx: 'automatic'
    }
  },
  // Add public directory handling
  publicDir: 'public',
}) 