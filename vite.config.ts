import { defineConfig } from "vitest/config";

// base를 상대 경로로 두면 Vercel(도메인 루트)과 GitHub Pages(/저장소이름/) 양쪽에서 그대로 동작한다.
export default defineConfig({
  base: "./",
  test: {
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
  },
});
