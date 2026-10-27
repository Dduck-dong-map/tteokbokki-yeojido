// 팔레트: 화면 설계 보드(docs/design/index.html)의 프리셋과 derive() 를 그대로 옮겼다.
// 바탕 7색만 정하면 나머지 색은 계산한다. 팔레트를 고르면 DEFAULT_PALETTE 만 바꾸면 된다.
// 주소 뒤 ?pal=H1 로 다른 프리셋을 볼 수 있다(보드와 같은 이름).

export type Base = { paper: string; surface: string; ink: string; primary: string; accent: string; fab: string; water: string };
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
  { id: "N6", name: "N6 먹밤", b: { paper: "#1C1D1F", surface: "#242628", ink: "#EDEDED", primary: "#EDEDED", accent: "#8FB4E0", fab: "#8FB4E0", water: "#2B3A4C" } },
];

// 아직 사용자가 고르지 않았다(README 「▶ 재개」 1번). 고르면 여기만 바꾼다.
export const DEFAULT_PALETTE = "A";

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
  return {
    dark,
    css: {
      paper: B.paper, surface: B.surface, ink: B.ink, primary: B.primary, accent: B.accent, fab: B.fab,
      bar, line: mix(bar, B.ink, 0.14),
      chip: mix(B.surface, B.ink, dark ? 0.1 : 0.055), chipline: mix(B.surface, B.ink, 0.2),
      ink2: mix(B.ink, B.surface, 0.2), ink3,
      onprimary: onColor(B.primary), onfab: onColor(B.fab),
      spicybg: p.v1 ? "#F6E2DC" : dark ? "#4A1E22" : "#F6DCD9",
      spicytext: p.v1 ? "#8E0000" : dark ? "#FFB4AE" : "#9A0F25",
      loc: dark ? "#8FB4E0" : "#2D5B9A",
      cardshadow: dark ? "rgba(0,0,0,.45)" : "rgba(0,0,0,.12)",
      "logo-filter": dark ? "brightness(2.1) saturate(.85)" : "none",
      ...Object.fromEntries(ramp.flatMap(([bg, fg, e], i) => [[`s${i + 1}`, bg], [`s${i + 1}f`, fg], [`s${i + 1}e`, e]])),
    } as Record<string, string>,
    // 대동여지도 느낌 지도 색 (components/map/dongyeoStyle.ts)
    map: {
      paper: B.paper, ink: B.ink, primary: B.primary, onprimary: onColor(B.primary),
      water: B.water, bank,
      label: mix(B.ink, B.paper, 0.1),
      mInk: mix(B.ink, B.paper, dark ? 0.35 : 0.25),
      mRoad: mix(B.ink, B.paper, dark ? 0.3 : 0.45),
      mMinor: mix(B.ink, B.paper, dark ? 0.6 : 0.72),
      seam: mix(B.paper, B.ink, dark ? 0.2 : 0.12),
      block: mix(B.paper, B.ink, dark ? 0.07 : 0.05),
      park: mix(B.paper, "#7FA87F", 0.18),
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
