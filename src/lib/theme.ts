// 팔레트: 화면 설계 보드(docs/design/index.html)의 프리셋과 derive() 를 그대로 옮겼다.
// 바탕 7색만 정하면 나머지 색은 계산한다. 팔레트를 고르면 DEFAULT_PALETTE 만 바꾸면 된다.
// 주소 뒤 ?pal=H1 로 다른 프리셋을 볼 수 있다(보드와 같은 이름).

// mapPaper: 지도 그림 바탕만 따로 둘 때 (없으면 paper). 화면 바탕을 흰색으로 해도 지도는 한지 톤을 지킨다 (11-08)
export type Base = { paper: string; surface: string; ink: string; primary: string; accent: string; fab: string; water: string; mapPaper?: string };
export type Preset = { id: string; name: string; v1?: boolean; b: Base };

export const PRESETS: Preset[] = [
  { id: "V1", name: "V1 기준 (기존)", v1: true, b: { paper: "#ECE3D1", surface: "#FBF7EF", ink: "#1A1614", primary: "#C00000", accent: "#C00000", fab: "#C00000", water: "#87A3C9" } },
  { id: "A", name: "A 먹과 쪽빛", b: { paper: "#ECE3D1", surface: "#FBF7EF", ink: "#1F1A17", primary: "#2A2421", accent: "#2D5B9A", fab: "#2D5B9A", water: "#87A3C9" } },
  { id: "B", name: "B 청자", b: { paper: "#E8E6D8", surface: "#FAFAF5", ink: "#18211E", primary: "#2F6B62", accent: "#2B6259", fab: "#2F6B62", water: "#A3C7BC" } },
  { id: "C", name: "C 노포", b: { paper: "#F0E3C8", surface: "#FDF7EB", ink: "#2A1D14", primary: "#5A3A22", accent: "#7A4A16", fab: "#E3A93C", water: "#93AAC2" } },
  { id: "D", name: "D 흰 떡", b: { paper: "#F4F2EC", surface: "#FFFFFF", ink: "#151515", primary: "#151515", accent: "#151515", fab: "#151515", water: "#C8D5E2" } },
  { id: "E", name: "E 밤 포장마차", b: { paper: "#1A2231", surface: "#1D2637", ink: "#F3ECDF", primary: "#F0A23A", accent: "#F5B862", fab: "#F0A23A", water: "#27405F" } },
  { id: "H1", name: "H1 한지 옅게", b: { paper: "#E9E3D8", surface: "#FAF7F2", ink: "#1F1A17", primary: "#2A2421", accent: "#2D5B9A", fab: "#2D5B9A", water: "#8CA6CA" } },
  { id: "H2", name: "H2 한지 더 옅게", b: { paper: "#E7E3DC", surface: "#F9F7F4", ink: "#1F1A17", primary: "#2A2421", accent: "#2D5B9A", fab: "#2D5B9A", water: "#94ACCB" } },
  { id: "N1", name: "N1 쌀종이", b: { paper: "#F2F2EF", surface: "#FFFFFF", ink: "#1C1C1B", primary: "#232323", accent: "#2D5B9A", fab: "#2D5B9A", water: "#AFC3D9" } },
  { id: "N2", name: "N2 먹 회색", b: { paper: "#E6E6E4", surface: "#FCFCFB", ink: "#161616", primary: "#161616", accent: "#161616", fab: "#161616", water: "#B7C2CC" } },
  { id: "N3", name: "N3 쪽빛 종이", b: { paper: "#E7EBEF", surface: "#FBFCFD", ink: "#141B23", primary: "#1F3A5F", accent: "#2D5B9A", fab: "#1F3A5F", water: "#9FB6CF" } },
  { id: "N4", name: "N4 옥빛", b: { paper: "#E5ECE8", surface: "#FBFCFB", ink: "#14201B", primary: "#24574F", accent: "#2B6259", fab: "#24574F", water: "#A6C6BE" } },
  { id: "N5", name: "N5 순백", b: { paper: "#F7F7F7", surface: "#FFFFFF", ink: "#111111", primary: "#111111", accent: "#2D5B9A", fab: "#111111", water: "#D3DEE9" } },
  // 슬랙 10-28 결정(기획 팀장): 고추장 레드를 포인트 컬러로, 메뉴·가게 정보·버튼은 쉽게 구분되게. 바탕은 N1 쌀종이.
  { id: "R", name: "R 고추장 포인트", b: { paper: "#F2F2EF", surface: "#FFFFFF", ink: "#1C1C1B", primary: "#232323", accent: "#B42318", fab: "#B42318", water: "#AFC3D9" } },
  // 슬랙 10-28 #design(irisonestar): 빨간 버튼은 웹에서 경고색이라 버튼은 다른 색으로 → 옥빛(B 청자·N4 옥빛의 중간 #2A6159, 링크는 팀장 후보 #2F6F70). 빨강은 로고·도장·제보 버튼(포인트)만. 바탕은 한지 미색.
  { id: "T", name: "T 옥빛 버튼 · 고추장 포인트", b: { paper: "#F3F0E9", surface: "#FDFCF9", ink: "#1C1C1B", primary: "#2A6159", accent: "#2F6F70", fab: "#B42318", water: "#A3C7BC" } },
  // 슬랙 10-28 #design: 팀장이 tweakcn 으로 만든 「떡볶이 초안 1」(shadcn 변수) 을 그대로 옮김 — 비교용. 주 색이 빨강이라 본인 글과 어긋나서 기본으로 쓰지 않음.
  { id: "W", name: "W tweakcn 초안 1", b: { paper: "#FAF8F6", surface: "#FEFEFE", ink: "#2D2D2D", primary: "#E63917", accent: "#E63917", fab: "#E63917", water: "#AFC3D9" } },
  // 11-10 사용자 참고 팔레트: 주황은 구운 고추장 톤으로 낮추고, 링크·제보는 서로 다른 차분한 색으로 분리.
  { id: "P1", name: "P1 구운 고추장 · 쪽빛 물", b: { paper: "#F3F1EE", surface: "#FEFEFE", ink: "#2D2D2D", primary: "#A85028", accent: "#455F73", fab: "#526B57", water: "#AFC3D9" } },
  { id: "P2", name: "P2 어묵국물 · 시장 간판", b: { paper: "#F5E6E0", surface: "#FEFEFE", ink: "#2D2D2D", primary: "#435F77", accent: "#A45A2A", fab: "#6E5436", water: "#AFC3D9" } },
  { id: "N6", name: "N6 먹밤", b: { paper: "#1C1D1F", surface: "#242628", ink: "#EDEDED", primary: "#EDEDED", accent: "#8FB4E0", fab: "#8FB4E0", water: "#2B3A4C" } },
  // 11-08 사용자 「배경을 구분선만 두고 일단 전부 흰색으로」: T 에서 화면 바탕·면·메뉴줄을 흰색으로. 지도 그림 바탕은 T 의 한지 미색 그대로.
  { id: "T2", name: "T2 흰 바탕 · 옥빛 버튼", b: { paper: "#FFFFFF", surface: "#FFFFFF", ink: "#1C1C1B", primary: "#2A6159", accent: "#2F6F70", fab: "#B42318", water: "#A3C7BC", mapPaper: "#F3F0E9" } },
];

// 2026-11-01: 슬랙 #design 10-28 반영 → T (주 버튼 옥빛, 빨강은 포인트만). 이전 기본 R 은 ?pal=R 로 비교. 바꾸려면 여기만 고친다.
// 2026-11-08: 시험으로 T2(흰 바탕) 를 기본으로. 바로 전 기본은 ?pal=T 로 비교.
export const DEFAULT_PALETTE = "T2";

// 맵기 도장 1~5: [바탕, 숫자, 안쪽 테두리]
const RAMP_LIGHT = [["#F2B78C", "#3A1408", "rgba(58,20,8,.38)"], ["#E3814D", "#2E0F05", "rgba(46,15,5,.38)"], ["#C8102E", "#FFF4E6", "rgba(255,244,230,.75)"], ["#8E0B1F", "#FFF4E6", "rgba(255,244,230,.75)"], ["#4A0710", "#FFF4E6", "rgba(255,244,230,.75)"]];
const RAMP_NIGHT = [["#F6C08A", "#2B1006", "rgba(43,16,6,.38)"], ["#EE8752", "#2B1006", "rgba(43,16,6,.38)"], ["#C92A30", "#FFF4E6", "rgba(255,244,230,.85)"], ["#9C1430", "#FFF4E6", "rgba(255,244,230,.85)"], ["#6C0E22", "#FFF4E6", "rgba(255,244,230,.85)"]];
const RAMP_V1 = ["#A6521B", "#BC3A12", "#C00000", "#9E0012", "#6E0A0E"].map((c) => [c, "#F6EFE3", "rgba(246,239,227,.75)"]);

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

export type Tokens = ReturnType<typeof derive>;

export function derive(p: Preset) {
  const B = p.b;
  const dark = lum(B.paper) < 0.2;
  let ink3 = mix(B.ink, B.surface, 0.42);
  for (let t = 0.42; t > 0.18 && cr(ink3, B.surface) < 4.6; t -= 0.02) ink3 = mix(B.ink, B.surface, t);
  const bar = dark ? mix(B.paper, "#000000", 0.28) : mix(B.surface, B.paper, 0.35);
  const ramp = p.v1 ? RAMP_V1 : dark ? RAMP_NIGHT : RAMP_LIGHT;
  const bank = mix(B.water, B.ink, dark ? 0.1 : 0.5);
  const MP = B.mapPaper ?? B.paper; // 지도 그림 바탕
  return {
    dark,
    css: {
      paper: B.paper, surface: B.surface, ink: B.ink, primary: B.primary, accent: B.accent, fab: B.fab,
      // PC 왼쪽 가게 목록 칸 바탕 — 사용자 11-08 「이 부분 배경 흰색으로」. 어두운 팔레트에서는 면 색을 그대로 쓴다
      panel: dark ? B.surface : "#FFFFFF",
      bar, line: mix(bar, B.ink, 0.14),
      chip: mix(B.surface, B.ink, dark ? 0.1 : 0.055), chipline: mix(B.surface, B.ink, 0.2),
      ink2: mix(B.ink, B.surface, 0.2), ink3,
      onprimary: onColor(B.primary), onfab: onColor(B.fab), onaccent: onColor(B.accent),
      // 게이지 도장의 안 찬 부분(종이 톤) — 슬랙 10-28 결정
      stampbg: mix(B.surface, B.ink, dark ? 0.14 : 0.07),
      spicybg: p.v1 ? "#F6E2DC" : dark ? "#4A1E22" : "#F6DCD9",
      spicytext: p.v1 ? "#8E0000" : dark ? "#FFB4AE" : "#9A0F25",
      loc: dark ? "#8FB4E0" : "#2D5B9A",
      cardshadow: dark ? "rgba(0,0,0,.45)" : "rgba(0,0,0,.12)",
      "logo-filter": dark ? "brightness(2.1) saturate(.85)" : "none",
      ...Object.fromEntries(ramp.flatMap(([bg, fg, e], i) => [[`s${i + 1}`, bg], [`s${i + 1}f`, fg], [`s${i + 1}e`, e]])),
    } as Record<string, string>,
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

export const findPreset = (id: string | null | undefined) =>
  PRESETS.find((p) => p.id === id) ?? PRESETS.find((p) => p.id === DEFAULT_PALETTE)!;

// 모든 프리셋을 :root[data-pal="…"] 변수로 미리 만들어 둔다 (깜빡임 없이 바꾸기)
export function paletteCss() {
  const block = (sel: string, p: Preset) => {
    const { css, dark } = derive(p);
    const vars = Object.entries(css).map(([k, v]) => `--${k}:${v}`).join(";");
    return `${sel}{${vars};color-scheme:${dark ? "dark" : "light"}}`;
  };
  return [block(":root", findPreset(DEFAULT_PALETTE)), ...PRESETS.map((p) => block(`:root[data-pal="${p.id}"]`, p))].join("\n");
}

// <head> 에서 바로 도는 짧은 스크립트: ?pal= 또는 지난번 고른 팔레트를 붙인다
export const PALETTE_BOOT = `(function(){try{var q=new URLSearchParams(location.search).get('pal');var ids=${JSON.stringify(PRESETS.map((p) => p.id))};var p=q&&ids.indexOf(q)>=0?q:localStorage.getItem('pal');if(q&&ids.indexOf(q)>=0)localStorage.setItem('pal',q);if(p&&ids.indexOf(p)>=0)document.documentElement.dataset.pal=p;}catch(e){}})();`;
