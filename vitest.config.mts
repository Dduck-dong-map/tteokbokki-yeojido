import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 단위 테스트: 순수 TS 규칙 함수(lib/)만 돈다. React 부품은 Playwright(E2E)로 본다.
// 확장자 .mts 는 번들 문서(02-guides/testing/vitest.md)대로 — package.json 이 CJS 라 .ts 면 Vite 가 경고한다.
// 별칭 @/ 는 tsconfig.json 의 paths 와 같다.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
