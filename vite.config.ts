import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./apps/web/src"),
      "@ui": path.resolve(__dirname, "./packages/ui/src"),
      "@utils": path.resolve(__dirname, "./packages/utils/src"),
      "@config": path.resolve(__dirname, "./packages/config/src"),
      "@types-pkg": path.resolve(__dirname, "./packages/types/src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
