
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: [
        /three\/webgpu/
      ],
      plugins: [
        {
          name: 'disable-rollup-native',
          buildStart() {
            // Force rollup to use JS fallback instead of native binaries
            const rollupNative = require.resolve('rollup/dist/native.js');
            const Module = require('module');
            const originalRequire = Module.prototype.require;
            
            Module.prototype.require = function(id) {
              if (id.includes('@rollup/rollup-') && (
                id.includes('linux') || 
                id.includes('darwin') || 
                id.includes('android')
              )) {
                throw new Error(`Skipping native rollup binary: ${id}`);
              }
              return originalRequire.apply(this, arguments);
            };
          }
        }
      ]
    },
  },
  optimizeDeps: {
    exclude: [
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-linux-arm64-gnu', 
      '@rollup/rollup-darwin-x64',
      '@rollup/rollup-darwin-arm64'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  define: {
    global: 'globalThis',
  },
}));
