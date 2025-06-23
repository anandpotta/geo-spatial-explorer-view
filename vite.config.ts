
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
  define: {
    global: 'globalThis',
  },
  build: {
    target: 'esnext',
    // Completely disable rollup for problematic modules
    rollupOptions: {
      external: [
        '@rollup/rollup-linux-x64-gnu',
        '@rollup/rollup-linux-arm64-gnu', 
        '@rollup/rollup-darwin-x64',
        '@rollup/rollup-darwin-arm64',
        '@rollup/rollup-win32-x64-msvc'
      ],
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    // Force exclude all rollup native binaries
    exclude: [
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-linux-arm64-gnu', 
      '@rollup/rollup-darwin-x64',
      '@rollup/rollup-darwin-arm64',
      '@rollup/rollup-win32-x64-msvc'
    ],
    // Force immediate re-bundling
    force: true,
    // Use esbuild exclusively
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis',
      },
      // Prevent any native module loading
      platform: 'browser',
      format: 'esm',
    },
  },
  esbuild: {
    target: 'esnext',
    include: /\.(ts|tsx|js|jsx)$/,
    define: {
      global: 'globalThis',
    },
    // Ensure esbuild handles everything
    platform: 'browser',
    format: 'esm',
  },
}));
