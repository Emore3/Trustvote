import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // These options ensure that Buffer and process are polyfilled globally
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
  // alias are only to be added when absolutely necessary, these modules are already present in the browser environment
  // resolve: {
  // alias: {
  // crypto: "crypto-browserify",
  // assert: "assert",
  // http: "stream-http",
  // https: "https-browserify",
  // url: "url",
  // zlib: "browserify-zlib",
  // stream: "stream-browserify",
  // },
  // },
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
      buffer: 'buffer/',
    },
  },
  build: {
    target: 'esnext',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
})
