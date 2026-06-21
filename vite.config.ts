import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/ORDR_HELPER/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "ORDR 보유 스탯 계산기",
        short_name: "ORDR",
        description: "원랜디 캐릭터 보유 스탯 합계 계산기",
        theme_color: "#161b24",
        background_color: "#eef1f5",
        display: "standalone",
        scope: "/ORDR_HELPER/",
        start_url: "/ORDR_HELPER/",
        icons: [
          {
            src: "icons/app-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/app-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/app-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "icons/app.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts"
  }
});
