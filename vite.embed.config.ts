import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    process: JSON.stringify({ env: { NODE_ENV: 'production' } }),
    global: 'globalThis',
  },
  plugins: [react(), cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@ui': resolve(__dirname, './src/ui'),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/embed.ts'),
      name: 'ChatbotWidgetEmbed',
      formats: ['umd', 'es'],
      fileName: (format) => `chatbot-widget-embed.${format}.js`,
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
});

