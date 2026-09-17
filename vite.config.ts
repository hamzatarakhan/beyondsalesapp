import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Only the GitHub Pages deploy (npm run deploy, which sets GH_PAGES=1) is served from the
  // /beyondsalesapp/ sub-path. Lovable hosting and local dev serve from the domain root, so
  // they must keep "/" — otherwise every asset 404s and the page renders blank.
  base: process.env.GH_PAGES ? "/beyondsalesapp/" : "/",
  server: {
    host: "::",
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
