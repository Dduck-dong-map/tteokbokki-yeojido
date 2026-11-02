import type { Map as MlMap } from "maplibre-gl";
import type { Tokens } from "@/lib/theme";

// 가게 핀 = 네모 인장 「게이지 도장 + 고추 개수」 (슬랙 10-28 결정, 기획 팀장·irisonestar)
//  - 도장 안에 숫자를 쓰지 않는다. 맵기 단계만큼(n/5) 아래에서 위로 색이 차오른다.
//  - 찬 부분 = 맵기 1~5 색(1 주황 → 5 검붉음), 안 찬 부분 = 종이 톤(stampbg). 테두리는 그 단계 색.
//  - 도장 바로 아래 작은 알약 안에 고추 n개. 캐릭터·표정은 핀에 넣지 않는다(상세 화면에서만).
// 같은 모양을 components/ui.tsx 의 SpiceStamp(HTML)가 카드·필터·제보·상세에 그린다.
const PX = 2; // 선명하게 2배로 그리고 지도에는 반 크기로 올린다
export const STAMP = 30; // 도장 한 변(화면 px)
const GAP = 2;
const PILL_H = 9;
const PAD = 3;
const CHILI_W = 5; // 알약 속 고추 하나 폭

export const pillWidth = (n: number) => n * CHILI_W + 6;
// 지도 점 위에 도장 중심이 오도록 아이콘을 위로 올린다(전체 그림 중심 → 도장 중심)
export const STAMP_ICON_OFFSET = -(GAP + PILL_H) / 2;

export const CHILI_RED = "#C8102E";
export const CHILI_GREEN = "#4F8A3A";

export function drawStamp(n: number, ramp: Tokens["map"]["ramp"], stampbg: string, surface = "#FFFFFF") {
  const c = ramp[n - 1];
  const s = STAMP * PX;
  const pad = PAD * PX;
  const pillW = pillWidth(n) * PX;
  const pillH = PILL_H * PX;
  const w = Math.max(s, pillW) + pad * 2;
  const h = s + GAP * PX + pillH + pad * 2;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  const x0 = (w - s) / 2;
  const y0 = pad;

  // 도장 본체
  g.save();
  g.shadowColor = "rgba(0,0,0,.22)";
  g.shadowBlur = 2 * PX;
  g.shadowOffsetY = 1 * PX;
  roundRect(g, x0, y0, s, s, 6 * PX);
  g.fillStyle = stampbg;
  g.fill();
  g.restore();
  // 게이지: 아래에서 n/5 만큼
  g.save();
  roundRect(g, x0, y0, s, s, 6 * PX);
  g.clip();
  const fillH = (s * n) / 5;
  g.fillStyle = c.bg;
  g.fillRect(x0, y0 + s - fillH, s, fillH);
  g.restore();
  // 테두리 = 그 단계 색
  roundRect(g, x0 + PX, y0 + PX, s - 2 * PX, s - 2 * PX, 5 * PX);
  g.strokeStyle = c.bg;
  g.lineWidth = 2 * PX;
  g.stroke();

  // 알약 + 고추 n개
  const py = y0 + s + GAP * PX;
  const px = (w - pillW) / 2;
  roundRect(g, px, py, pillW, pillH, pillH / 2);
  g.fillStyle = surface;
  g.fill();
  g.strokeStyle = "rgba(0,0,0,.18)";
  g.lineWidth = 1 * PX;
  g.stroke();
  for (let i = 0; i < n; i++) drawChili(g, px + (3 + i * CHILI_W) * PX, py + 1.2 * PX, (PILL_H - 2.4) * PX);

  return g.getImageData(0, 0, w, h);
}

// 작은 고추: 빨간 물방울 몸통 + 초록 꼭지. 상자 (x, y) 에서 높이 h.
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
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// 스타일이 'stamp-3' 같은 그림을 찾을 때 그 자리에서 그려 넣는다
export function provideStamps(map: MlMap, t: Tokens["map"], surface: string) {
  map.setMissingStyleImageResolver((id) => {
    const m = /^stamp-([1-5])$/.exec(id);
    if (!m || map.hasImage(id)) return;
    map.addImage(id, drawStamp(Number(m[1]), t.ramp, t.stampbg, surface), { pixelRatio: PX });
  });
}
