import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/cnapp/",   // 🔴 이거 중요
  build: {
    cssMinify: false, // 위에서 말한 우회책 쓰면 같이
  },
});
