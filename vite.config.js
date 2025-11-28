import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/cnapp/", // GitHub Pages용

  // ⚠ CSS 파이프라인 완전 순한맛 모드
  css: {
    // Vite 6 계열 기준: lightningcss 대신 postcss 사용
    transformer: "postcss",
  },
  build: {
    cssMinify: false, // CSS 최소화도 끔
  },
});
