import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const localApiTarget = env.VITE_LOCAL_API_TARGET?.trim() || "http://localhost:8080";

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: localApiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
