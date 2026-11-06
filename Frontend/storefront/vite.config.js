import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const storefrontRootPath = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: storefrontRootPath,
  envDir: fileURLToPath(new URL("..", import.meta.url)),
  cacheDir: fileURLToPath(new URL("../node_modules/.vite-storefront", import.meta.url)),
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: fileURLToPath(new URL("../dist-storefront", import.meta.url)),
    emptyOutDir: true,
  },
});
