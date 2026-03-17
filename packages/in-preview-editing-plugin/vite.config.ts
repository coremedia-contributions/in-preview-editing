import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    // Inline source maps im Development-Mode für Debugging im Browser
    sourcemap: mode === "development" ? "inline" : false,
    // Kein Minify im Development-Mode, damit der Code lesbar bleibt
    minify: mode !== "development",
    lib: {
      entry: "src/plugin.tsx",
      name: "CoreMediaInPreviewEditingPlugin",
      fileName: "coremedia.ipe.plugin",
      formats: ["iife"]
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    }
  }
}));
