import type { Map as MlMap } from "maplibre-gl";
import type { Tokens } from "@/lib/theme";

// 가게 핀 = 네모 인장. 안쪽 테두리 + 맵기 숫자 (기획안 8절, 보드 「도장 숫자」 안).
// 맵기 표시 방식(도장 숫자 / 고추 개수 / 고추 핀 / 섞기)을 고르면 여기만 바꾼다.
const PX = 2; // 선명하게 2배로 그리고 지도에는 반 크기로 올린다
const SIZE = 30;

export function drawStamp(n: number, ramp: Tokens["map"]["ramp"]) {
  const c = ramp[n - 1];
  const s = SIZE * PX;
  const pad = 3 * PX;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = s + pad * 2;
  const g = canvas.getContext("2d")!;
  g.translate(pad, pad);
  g.shadowColor = "rgba(0,0,0,.22)";
  g.shadowBlur = 2 * PX;
  g.shadowOffsetY = 1 * PX;
  roundRect(g, 0, 0, s, s, 6 * PX);
  g.fillStyle = c.bg;
  g.fill();
  g.shadowColor = "transparent";
  roundRect(g, 3.5 * PX, 3.5 * PX, s - 7 * PX, s - 7 * PX, 3.5 * PX);
  g.strokeStyle = c.edge;
  g.lineWidth = 1.4 * PX;
  g.stroke();
  g.fillStyle = c.fg;
  g.font = `800 ${17 * PX}px "Pretendard Variable", Pretendard, system-ui, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(n), s / 2, s / 2 + 1 * PX);
  return g.getImageData(0, 0, canvas.width, canvas.height);
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
export function provideStamps(map: MlMap, ramp: Tokens["map"]["ramp"]) {
  map.setMissingStyleImageResolver(async (id) => {
    const m = /^stamp-([1-5])$/.exec(id);
    if (!m || map.hasImage(id)) return;
    // 도장 숫자 글꼴(Pretendard)이 늦게 오면 기본 글꼴로 그려지므로 잠깐 기다린다
    await Promise.race([document.fonts.load(`800 34px "Pretendard Variable"`), new Promise((r) => setTimeout(r, 800))]);
    if (!map.hasImage(id)) map.addImage(id, drawStamp(Number(m[1]), ramp), { pixelRatio: PX });
  });
}
