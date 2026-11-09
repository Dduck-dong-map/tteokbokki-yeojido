import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // 스크립트가 만드는 복사본 (scripts/copy-maplibre-worker.mjs · copy-share.mjs)
    "public/maplibre/**",
    "public/share/**",
    // Playwright 산출물 · E2E 저장소 (tests/e2e). 실행 중에 생겼다 지워져 파일 훑기가 깨진다
    "test-results/**",
    "playwright-report/**",
    ".data-e2e/**",
  ]),
]);

export default eslintConfig;
