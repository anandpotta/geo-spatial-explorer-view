
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
    rollupOptions: {
      // Force fallback to JS version of Rollup
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    // Exclude problematic native binaries and force JS fallback
    exclude: [
      '@rollup/rollup-linux-x64-gnu',
      '@rollup/rollup-linux-arm64-gnu', 
      '@rollup/rollup-darwin-x64',
      '@rollup/rollup-darwin-arm64',
      '@rollup/rollup-win32-x64-msvc'
    ],
    force: true,
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis',
      },
    },
  },
  esbuild: {
    target: 'esnext',
    include: /\.(ts|tsx|js|jsx)$/,
    define: {
      global: 'globalThis',
    },
  },
}));
