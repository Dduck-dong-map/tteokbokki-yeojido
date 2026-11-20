// 팔레트는 P3 「어묵국물 · 옥빛 버튼」, 바탕 #F3F1EE (2026-11-12 디자인 시스템). 다른 팔레트와의 비교는 docs/공유/design 보드에서 한다.
// 화면 색은 app/tokens.css(docs/design-system/tokens.json 에서 생성)가 정한다.
// 이 파일은 CSS 변수를 못 읽는 지도(components/map: MapLibre 스타일·캔버스 도장)의 색 계산에만 쓴다.

// mapPaper: 지도 그림 바탕만 따로 둘 때. 화면 바탕은 흰색이어도 지도는 한지 톤을 지킨다 (11-08)
type Base = { paper: string; surface: string; ink: string; primary: string; accent: string; fab: string; water: string; mapPaper?: string };

// P3 어묵국물 · 옥빛 버튼, 바탕만 #F3F1EE (11-12). tokens.json 의 neutral-100 · neutral-50 · neutral-900 · jade-600 · broth-500 · bark-600 · blue-300 과 같은 값
const P3: Base = { paper: "#F3F1EE", surface: "#FEFEFE", ink: "#2D2D2D", primary: "#2A6159", accent: "#A45A2A", fab: "#6E5436", water: "#AFC3D9" };

// 맵기 도장 1~5: [바탕, 숫자, 안쪽 테두리]. globals.css 의 --s1..--s5 / --s1f.. / --s1e.. 와 같은 값
const RAMP_LIGHT = [["#F2B78C", "#3A1408", "rgba(58,20,8,.38)"], ["#E3814D", "#2E0F05", "rgba(46,15,5,.38)"], ["#C8102E", "#FFF4E6", "rgba(255,244,230,.75)"], ["#8E0B1F", "#FFF4E6", "rgba(255,244,230,.75)"], ["#4A0710", "#FFF4E6", "rgba(255,244,230,.75)"]];
const RAMP_NIGHT = [["#F6C08A", "#2B1006", "rgba(43,16,6,.38)"], ["#EE8752", "#2B1006", "rgba(43,16,6,.38)"], ["#C92A30", "#FFF4E6", "rgba(255,244,230,.85)"], ["#9C1430", "#FFF4E6", "rgba(255,244,230,.85)"], ["#6C0E22", "#FFF4E6", "rgba(255,244,230,.85)"]];

const hex = (h: string) => [0, 2, 4].map((i) => parseInt(h.replace("#", "").slice(i, i + 2), 16));
const toHex = (a: number[]) => "#" + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const mix = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
const lum = (h: string) => {
  const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const [r, g, b] = hex(h).map(f);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const cr = (a: string, b: string) => {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const onColor = (bg: string) => (cr("#FFFFFF", bg) >= cr("#141414", bg) ? "#FFFFFF" : "#141414");

// 바탕 7색에서 지도 색을 계산한다 (화면 설계 보드의 derive 와 같은 식)
function derive(B: Base) {
  const dark = lum(B.paper) < 0.2;
  const ramp = dark ? RAMP_NIGHT : RAMP_LIGHT;
  const bank = mix(B.water, B.ink, dark ? 0.1 : 0.5);
  const MP = B.mapPaper ?? B.paper; // 지도 그림 바탕
  return {
    dark,
    // 지도 위 도장·내 위치에 쓰는 화면 쪽 색. globals.css 의 --card · --loc · --stampbg 와 같은 값이어야 한다
    css: {
      surface: B.surface,
      loc: dark ? "#8FB4E0" : "#2D5B9A",
      // 게이지 도장의 안 찬 부분(종이 톤) — 슬랙 10-28 결정. P3 에서 #EFEFEF
      stampbg: mix(B.surface, B.ink, dark ? 0.14 : 0.07),
    },
    // 대동여지도 느낌 지도 색 (components/map/dongyeoStyle.ts)
    map: {
      paper: MP, ink: B.ink, primary: B.primary, onprimary: onColor(B.primary),
      water: B.water, bank,
      label: mix(B.ink, MP, 0.1),
      mInk: mix(B.ink, MP, dark ? 0.35 : 0.25),
      mRoad: mix(B.ink, MP, dark ? 0.3 : 0.45),
      mMinor: mix(B.ink, MP, dark ? 0.6 : 0.72),
      seam: mix(MP, B.ink, dark ? 0.2 : 0.12),
      block: mix(MP, B.ink, dark ? 0.07 : 0.05),
      stampbg: mix(B.surface, B.ink, dark ? 0.14 : 0.07),
      park: mix(MP, "#7FA87F", 0.18),
      ramp: ramp.map(([bg, fg, e]) => ({ bg, fg, edge: e })),
    },
  };
}

export const THEME = derive(P3);
export type MapTokens = typeof THEME.map;
