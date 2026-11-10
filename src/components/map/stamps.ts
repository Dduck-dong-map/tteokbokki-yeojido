import type { Map as MlMap } from "maplibre-gl";
import type { MapTokens } from "@/lib/theme";

// 가게 핀 = 「고추 개수」 알약 (11-08 사용자 지시, 맵기 표시 4안 중 「나) 고추 개수」)
//  - 흰 알약 안에 고추를 맵기만큼(1~5개). 3개가 신라면 정도.
//  - 알약 테두리 = 그 단계 색(1 주황 → 5 검붉음). 숫자는 쓰지 않는다.
//  - 고른 가게는 바깥에 주 버튼 색(옥빛) 테두리를 한 겹 더 두르고 조금 크게.
// 이전 「게이지 도장 + 고추 알약」(슬랙 10-28)은 깃 기록에 있다. 카드·필터·상세의 HTML 도장(ui.tsx SpiceStamp)은 아직 그대로.
const PX = 2; // 선명하게 2배로 그리고 지도에는 반 크기로 올린다
const H = 22; // 알약 높이(화면 px)
const CHILI_H = 13; // 고추 하나 높이
const STEP = 9.5; // 고추 사이 간격(폭)
const PAD_X = 6.5;
const BORDER = 2;
const RING_GAP = 2.5; // 고른 가게: 알약과 바깥 테두리 사이
const RING = 2.5;
const MARGIN = 3; // 그림자 자리

export const CHILI_RED = "#C8102E";
export const CHILI_GREEN = "#4F8A3A";

export const pinWidth = (n: number) => PAD_X * 2 + n * STEP;

export function drawChiliPin(n: number, ramp: MapTokens["ramp"], surface: string, ring?: string) {
  const c = ramp[n - 1];
  const extra = ring ? RING_GAP + RING : 0;
  const pw = pinWidth(n);
  const w = (pw + (extra + MARGIN) * 2) * PX;
  const h = (H + (extra + MARGIN) * 2) * PX;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(w);
  canvas.height = Math.ceil(h);
  const g = canvas.getContext("2d")!;
  const x0 = (extra + MARGIN) * PX;
  const y0 = (extra + MARGIN) * PX;
  const r = (H / 2) * PX;

  // 고른 가게: 바깥 테두리
  if (ring) {
    const o = (RING_GAP + RING / 2) * PX;
    roundRect(g, x0 - o, y0 - o, pw * PX + o * 2, H * PX + o * 2, r + o);
    g.strokeStyle = ring;
    g.lineWidth = RING * PX;
    g.stroke();
  }

  // 알약 바탕 + 그림자
  g.save();
  g.shadowColor = "rgba(0,0,0,.22)";
  g.shadowBlur = 2.5 * PX;
  g.shadowOffsetY = 1 * PX;
  roundRect(g, x0, y0, pw * PX, H * PX, r);
  g.fillStyle = surface;
  g.fill();
  g.restore();

  // 테두리 = 그 단계 색
  const b = (BORDER / 2) * PX;
  roundRect(g, x0 + b, y0 + b, pw * PX - b * 2, H * PX - b * 2, r - b);
  g.strokeStyle = c.bg;
  g.lineWidth = BORDER * PX;
  g.stroke();

  // 고추 n개
  const cy = y0 + ((H - CHILI_H) / 2 + 0.3) * PX;
  for (let i = 0; i < n; i++) drawChili(g, x0 + (PAD_X + i * STEP + (STEP - CHILI_H * (10 / 14)) / 2) * PX, cy, CHILI_H * PX);

  return g.getImageData(0, 0, canvas.width, canvas.height);
}

// 작은 고추: 빨간 물방울 몸통 + 초록 꼭지. 상자 (x, y) 에서 높이 h (폭은 h × 10/14).
export function drawChili(g: CanvasRenderingContext2D, x: number, y: number, h: number) {
  const k = h / 14; // 기준 상자 10 × 14
  g.save();
  g.translate(x, y);
  g.scale(k, k);
  g.beginPath();
  g.moveTo(5, 3);
  g.bezierCurveTo(8, 3, 9, 7, 7, 11);
  g.bezierCurveTo(6, 13, 4, 13, 3, 11);
  g.bezierCurveTo(1, 7, 2, 3, 5, 3);
  g.closePath();
  g.fillStyle = CHILI_RED;
  g.fill();
  g.beginPath();
  g.moveTo(5, 3.2);
  g.lineTo(5.6, 0.8);
  g.strokeStyle = CHILI_GREEN;
  g.lineWidth = 1.6;
  g.lineCap = "round";
  g.stroke();
  g.restore();
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, h / 2, w / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// 스타일이 'stamp-3' · 'stamp-sel-3'(고른 가게) 같은 그림을 찾을 때 그 자리에서 그려 넣는다
export function provideStamps(map: MlMap, t: MapTokens, surface: string) {
  map.setMissingStyleImageResolver((id) => {
    const m = /^stamp-(sel-)?([1-5])$/.exec(id);
    if (!m || map.hasImage(id)) return;
    map.addImage(id, drawChiliPin(Number(m[2]), t.ramp, surface, m[1] ? t.primary : undefined), { pixelRatio: PX });
  });
}
