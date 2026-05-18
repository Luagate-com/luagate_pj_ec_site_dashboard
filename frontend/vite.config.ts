import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // dev では同一オリジン経由でバックエンドにつなぐためのプロキシ。
  // 本番ビルドでは VITE_API_BASE_URL を介して直接 API を叩く。
  const apiTarget = env.VITE_DEV_API_PROXY_TARGET || "http://localhost:3032";

  return {
    plugins: [react()],
    server: {
      port: 5176,
      host: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 5176,
    },
  };
});
