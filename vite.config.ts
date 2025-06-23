
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
        /three\/webgpu/, 
        /@rollup\/rollup-linux-x64-gnu/,
        /@rollup\/rollup-linux-arm64-gnu/,
        /@rollup\/rollup-darwin-x64/,
        /@rollup\/rollup-darwin-arm64/
      ],
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
