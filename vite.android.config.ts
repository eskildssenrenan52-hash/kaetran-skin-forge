import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: "public",
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  build: {
    outDir: ".output/android-offline",
    emptyOutDir: true,
    assetsDir: "assets",
    target: "es2022",
    rollupOptions: { input: "offline.html" },
  },
});
