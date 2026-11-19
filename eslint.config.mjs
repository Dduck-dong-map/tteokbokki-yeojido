import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// 디자인 시스템에서 벗어나는 것을 막는 규칙 (로드맵 Phase 2 · 컴포넌트 패턴 가이드 14장).
// 꼭 필요한 예외는 그 줄 위에 `eslint-disable-next-line no-restricted-syntax -- 까닭` 으로 까닭을 적는다.
const ARBITRARY_TEXT = "/(^|[\\s:])text-\\[[0-9.]+(px|rem)\\]/";
const ARBITRARY_COLOR = "/-\\[#[0-9a-fA-F]{3,8}\\]/";
const HEX_COLOR = "/#[0-9a-fA-F]{6}\\b|#[0-9a-fA-F]{3}\\b/";
const textSize = "임의 글자 크기 대신 글자 토큰 유틸(text-body-medium 등)을 쓴다 (docs/guide/component-pattern.md 9.8절).";
const color = "색을 직접 쓰지 않는다. 디자인 토큰 유틸(bg-card · text-link 등)을 쓴다 (docs/guide/component-pattern.md 9.3절).";

const designSystem = [
  { selector: `Literal[value=${ARBITRARY_TEXT}]`, message: textSize },
  { selector: `TemplateElement[value.raw=${ARBITRARY_TEXT}]`, message: textSize },
  { selector: `Literal[value=${ARBITRARY_COLOR}]`, message: color },
  { selector: `TemplateElement[value.raw=${ARBITRARY_COLOR}]`, message: color },
  {
    selector: "JSXOpeningElement[name.name=/^(button|input|select|textarea)$/]",
    message: "날 <button> · <input> · <select> · <textarea> 대신 @/components/ui 의 Button · Chip · Input · TextField · Select 를 쓴다 (docs/guide/component-pattern.md 9.3절).",
  },
];

// 어드민: 전용 CSS 를 두지 않고(11-19 에 Tailwind · ui/ 부품으로 옮김) 색 값을 직접 쓰지 않는다
const adminOnly = [
  { selector: `Literal[value=${HEX_COLOR}]`, message: color },
  { selector: `TemplateElement[value.raw=${HEX_COLOR}]`, message: color },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // ui/ 는 뺀다: 부품 자체가 날 요소를 감싸고, shadcn 생성 형식(button 의 sm 크기 text-[0.8rem])이 있다
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-syntax": ["error", ...designSystem],
    },
  },
  {
    files: ["src/app/admin/**/*.{ts,tsx}", "src/components/admin/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...designSystem, ...adminOnly],
      "no-restricted-imports": ["error", { patterns: [{ group: ["*.css"], message: "어드민 전용 CSS 를 두지 않는다. Tailwind 유틸과 @/components/ui 부품으로 그린다." }] }],
    },
  },
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
