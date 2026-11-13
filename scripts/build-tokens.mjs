// 디자인 토큰 → CSS 변수. docs/design-system/tokens.json 을 읽어 src/app/tokens.css 를 만든다.
// 디자인 시스템 문서는 docs/design-system/ (README · 접근성 · 부품). tokens.json 의 원본은 Claude 디자인의 「떡볶여지도」 디자인 시스템이다(https://claude.ai/artifact/MtL8cQEtr3fNf4avBNE7vZ).
// 거기서 토큰을 고치면 tokens.json 을 다시 받아 두고 `pnpm tokens` 로 이 파일을 다시 돌린다. tokens.css 는 손으로 고치지 않는다.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "docs/design-system/tokens.json";
const OUT = "src/app/tokens.css";
const t = JSON.parse(readFileSync(SRC, "utf8"));

const themes = t.color.themes.map((x) => x.id); // ["light", "dark", "hc"]
// 테마별 선택자: 첫 테마는 :root, 어두운 테마는 shadcn 관례(.dark)도 함께 받는다
const SELECTOR = { light: ":root", dark: '.dark,\n[data-theme="dark"]', hc: '[data-theme="hc"]' };

// 색 값: "{jade-600}" 별칭은 var(--jade-600) 로
const colorValue = (v) => (/^\{.+\}$/.test(v) ? `var(--${v.slice(1, -1)})` : v);
const perTheme = (value, theme) => (typeof value === "string" ? (theme === themes[0] ? value : null) : value[theme] ?? null);

const block = (selector, lines) => (lines.length ? `${selector} {\n${lines.map((l) => `  ${l}`).join("\n")}\n}\n` : "");

// ── 색 · 그림자: 테마마다 ──
const isPrimitive = (tok) => tok.usage?.startsWith("Primitive");
const themed = Object.fromEntries(themes.map((th) => [th, []]));
const primitives = [];
for (const tok of t.color.tokens) {
  if (isPrimitive(tok)) { primitives.push(`--${tok.name}: ${colorValue(perTheme(tok.value, themes[0]))};`); continue; }
  for (const th of themes) {
    const v = perTheme(tok.value, th);
    if (v != null) themed[th].push(`--${tok.name}: ${colorValue(v)};`);
  }
}
for (const tok of t.shadow?.tokens ?? []) {
  for (const th of themes) {
    const v = perTheme(tok.value, th);
    if (v != null) themed[th].push(`--${tok.name}: ${v};`);
  }
}

// ── 치수 · 글자 기본값: 테마와 무관 ──
const FAMILIES = ["spacing", "radius", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "size"];
const dims = FAMILIES.flatMap((f) => (t[f]?.tokens ?? []).map((tok) => `--${tok.name}: ${tok.value};`));

// ── 글자 단계(Semantic Typography): 스타일마다 기본 토큰 다섯 개를 묶는다 ──
const px = (v) => parseInt(v, 10);
const WEIGHT = Object.fromEntries((t.fontWeight?.tokens ?? []).map((x) => [Number(x.value), x.name]));
const TRACK = Object.fromEntries((t.letterSpacing?.tokens ?? []).map((x) => [x.value, x.name]));
const styles = t.type.groups.flatMap((g) => g.styles.map((s) => ({ ...s, family: s.family ?? g.family })));
const typeVars = styles.flatMap((s) => [
  `--${s.name}-font-family: var(--font-family-${s.family});`,
  `--${s.name}-font-size: var(--font-size-${px(s.fontSize)});`,
  `--${s.name}-font-weight: var(--${WEIGHT[s.fontWeight]});`,
  `--${s.name}-line-height: var(--line-height-${px(s.lineHeight)});`,
  `--${s.name}-letter-spacing: var(--${TRACK[s.letterSpacing ?? "0em"]});`,
]);
// Tailwind 글자 크기 유틸리티: text-heading-1 처럼 쓰면 크기·줄 높이·자간이 함께 들어간다
const twText = styles.flatMap((s) => [
  `--text-${s.name}: var(--${s.name}-font-size);`,
  `--text-${s.name}--line-height: var(--${s.name}-line-height);`,
  `--text-${s.name}--letter-spacing: var(--${s.name}-letter-spacing);`,
]);

const css = `/* 생성 파일 — scripts/build-tokens.mjs 가 ${SRC} 에서 만든다. 손으로 고치지 말 것 (pnpm tokens)
   층: Primitive 색(단계표) → Semantic 색(테마별) · Primitive 치수·글자 → Semantic 글자 단계
   테마: 기본(밝게) = :root · 어둡게 = <html class="dark"> 또는 data-theme="dark" · 고대비 = data-theme="hc" (모두 <html> 에) */

/* Primitive 색 — 화면 코드에서 직접 쓰지 않는다 */
${block(":root", primitives)}
/* Semantic 색 · 그림자 */
${themes.map((th) => block(SELECTOR[th], themed[th])).join("\n")}
/* Primitive 치수 · 글자 */
${block(":root", dims)}
/* Semantic 글자 단계 */
${block(":root", typeVars)}
@theme inline {
${twText.map((l) => `  ${l}`).join("\n")}
}
`;
writeFileSync(OUT, css);
console.log(`${OUT}: 색 ${t.color.tokens.length} · 치수·글자 ${dims.length} · 글자 단계 ${styles.length}`);
