import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@ui': resolve(__dirname, './src/ui'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'ChatbotWidget',
      formats: ['umd', 'es'],
      fileName: (format) => `chatbot-widget.${format}.js`,
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        exports: 'named',
      },
    },
    minify: 'esbuild',
    target: 'es2015',
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: [
      '.trycloudflare.com',
    ],
    proxy: {
      '/api/web/chat/ws': {
        target: 'ws://192.168.27.228:8001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
