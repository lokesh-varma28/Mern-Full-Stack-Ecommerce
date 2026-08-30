import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    headers: {
      // Allows Google OAuth popup to communicate back via window.closed
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
});