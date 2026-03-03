import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5175,
    host: true, // Docker 컨테이너 외부 접근 허용 (0.0.0.0)
    proxy: {
      "/api": {
        target: process.env.API_TARGET ?? "http://localhost:3002",
        changeOrigin: true,
      },
    },
  },
});
