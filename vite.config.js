import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/cnapp/",        // repo 이름 cnapp

  css: {
    // 정식 vite 5에서는 이거 없이도 잘 돌아가지만,
    // 혹시 모를 css 문제 방지용으로 postcss만 쓰게 명시
    transformer: "postcss",
  },
  build: {
    // lightningcss 말고 esbuild로 css minify
    cssMinify: "esbuild",
  },
});
