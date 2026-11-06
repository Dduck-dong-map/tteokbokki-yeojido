import type { ExpressionSpecification, FilterSpecification, LayerSpecification, StyleSpecification } from "maplibre-gl";
import type { Tokens } from "@/lib/theme";

// 대동여지도 느낌 바탕 지도 (기획안 8절)
// 한지 바탕 · 옅은 먹선 길 · 쪽빛 물 · 큰길 위 10리 점 · 첩 이음선 격자 · 명조 지명.
// 지도 데이터: OpenStreetMap, 타일: OpenFreeMap (키·가입 없음, 상업 사용 가능 — 개발준비 문서 2절).
// 지도 엔진을 네이버로 정하면 이 파일 대신 네이버 스타일 편집기 스타일을 쓴다.

const OFM = "https://tiles.openfreemap.org";
export const MAP_CREDIT = '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';
const FONT = ["Noto Sans Regular"];
const FONT_BOLD = ["Noto Sans Bold"];
const name: ExpressionSpecification = ["coalesce", ["get", "name:ko"], ["get", "name"]];

// 지도에서 길 찾을 때 기준으로 삼기 좋은 곳. 조금 일찍, 조금 진하게 보인다.
const LANDMARK = ["school", "college", "park", "library", "hospital", "post", "police", "bank", "attraction", "theatre", "town_hall", "fire_station", "stadium", "museum", "place_of_worship", "grocery"];
// 이름이 붙어 있어도 위치 찾기에 도움이 안 되는 것 (역은 station 층에 따로 있다)
const POI_SKIP = ["bus", "railway", "hairdresser", "parking", "bicycle", "bicycle_rental", "car", "laundry", "toilets", "waste_basket", "shelter", "gate", "atm"];

// 대동여지도의 첩(책 한 권 크기) 이음선처럼 옅은 격자를 깐다. 서울 둘레만.
function seamGrid(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  const [w, s, e, n] = [126.7, 37.4, 127.25, 37.72];
  for (let x = w; x <= e; x += 0.03) features.push(line([[x, s], [x, n]]));
  for (let y = s; y <= n; y += 0.024) features.push(line([[w, y], [e, y]]));
  return { type: "FeatureCollection", features };
}
const line = (coordinates: number[][]): GeoJSON.Feature => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } });

const roadClass = (...c: string[]): FilterSpecification => [
  "all",
  ["match", ["get", "class"], c, true, false],
  ["!=", ["get", "brunnel"], "tunnel"],
];

// 확대 방식 (팀 피드백 v2 정-2, 시안 비교 중). 주소 ?zoom=real 이면 ①, 아니면 ②.
// ② names: 같은 지도에 이름을 더한다. ① real: 그림 지도가 사라지며 아래 실제 지도(realMap.ts)가 드러난다.
export type ZoomMode = "names" | "real";
export const REAL_FADE: [number, number] = [15, 15.8]; // ① 그림 지도가 사라지는 구간

// 확대했을 때 위치를 짚는 이름. 멀리서는 그림 지도 그대로, 가까이 갈수록 길 → 큰 건물 → 상호 순으로 나온다.
// 층은 아래일수록 먼저 밀려난다: 상호 < 큰 건물 < 길 < 역·동네.
function nameLayers(t: Tokens["map"]): LayerSpecification[] {
  return [
    {
      id: "poi-name", type: "symbol", source: "omt", "source-layer": "poi", minzoom: 16.5,
      filter: ["all", ["match", ["get", "class"], [...LANDMARK, ...POI_SKIP], false, true], ["<=", ["length", ["get", "name"]], 14]],
      layout: {
        "text-field": name, "text-font": FONT,
        "text-size": ["interpolate", ["linear"], ["zoom"], 16.5, 10.5, 18, 12],
        "text-padding": 4, "text-max-width": 7, "symbol-sort-key": ["get", "rank"],
      },
      paint: { "text-color": t.label, "text-opacity": 0.72, "text-halo-color": t.paper, "text-halo-width": 1.3 },
    },
    {
      id: "poi-landmark", type: "symbol", source: "omt", "source-layer": "poi", minzoom: 15.5,
      filter: ["match", ["get", "class"], LANDMARK, true, false],
      layout: {
        "text-field": name, "text-font": FONT,
        "text-size": ["interpolate", ["linear"], ["zoom"], 15.5, 11, 18, 13],
        "text-padding": 6, "text-max-width": 7, "symbol-sort-key": ["get", "rank"],
      },
      paint: { "text-color": t.mInk, "text-opacity": 0.88, "text-halo-color": t.paper, "text-halo-width": 1.5 },
    },
    {
      id: "road-name", type: "symbol", source: "omt", "source-layer": "transportation_name", minzoom: 15,
      layout: {
        "symbol-placement": "line", "text-field": name, "text-font": FONT,
        "text-size": ["interpolate", ["linear"], ["zoom"], 15, 10.5, 18, 13],
        "text-letter-spacing": 0.12, "symbol-spacing": 240, "text-max-angle": 30,
      },
      paint: { "text-color": t.mInk, "text-halo-color": t.paper, "text-halo-width": 2 },
    },
  ];
}

// ① 그림 지도 층을 REAL_FADE 구간에서 투명하게 지운다. 다 지워진 뒤엔 층을 꺼서 타일도 안 받는다.
const OPACITY_KEY: Partial<Record<LayerSpecification["type"], string>> = { background: "background-opacity", fill: "fill-opacity", line: "line-opacity", symbol: "text-opacity" };
function fadeOut(layer: LayerSpecification): LayerSpecification {
  const key = OPACITY_KEY[layer.type];
  if (!key) return layer;
  const paint = (layer as { paint?: Record<string, unknown> }).paint ?? {};
  const from = typeof paint[key] === "number" ? paint[key] : 1;
  return {
    ...layer,
    maxzoom: layer.maxzoom ?? REAL_FADE[1],
    paint: { ...paint, [key]: ["interpolate", ["linear"], ["zoom"], REAL_FADE[0], from, REAL_FADE[1], 0] },
  } as LayerSpecification;
}

export function dongyeoStyle(t: Tokens["map"], mode: ZoomMode = "names"): StyleSpecification {
  return {
    version: 8,
    glyphs: `${OFM}/fonts/{fontstack}/{range}.pbf`,
    sources: {
      omt: { type: "vector", url: `${OFM}/planet`, attribution: MAP_CREDIT },
      seam: { type: "geojson", data: seamGrid() },
    },
    layers: ((layers: LayerSpecification[]) => (mode === "real" ? layers.map(fadeOut) : layers))([
      { id: "paper", type: "background", paint: { "background-color": t.paper } },
      { id: "park", type: "fill", source: "omt", "source-layer": "park", paint: { "fill-color": t.park, "fill-opacity": 0.5 } },
      {
        id: "wood", type: "fill", source: "omt", "source-layer": "landcover",
        filter: ["match", ["get", "class"], ["wood", "grass"], true, false],
        paint: { "fill-color": t.park, "fill-opacity": 0.35 },
      },
      { id: "seam", type: "line", source: "seam", paint: { "line-color": t.seam, "line-width": 1, "line-dasharray": [6, 4] } },
      // 물: 옅은 쪽빛 면 + 진한 물가 선 (대동여지도의 겹선 강)
      { id: "water", type: "fill", source: "omt", "source-layer": "water", paint: { "fill-color": t.water, "fill-opacity": 0.55 } },
      { id: "water-bank", type: "line", source: "omt", "source-layer": "water", paint: { "line-color": t.bank, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 16, 1.6] } },
      {
        id: "waterway", type: "line", source: "omt", "source-layer": "waterway",
        filter: ["!=", ["get", "brunnel"], "tunnel"],
        paint: { "line-color": t.bank, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.6, 16, 2] },
      },
      { id: "building", type: "fill", source: "omt", "source-layer": "building", minzoom: 15, paint: { "fill-color": t.block, "fill-opacity": 0.9 } },
      // 구 경계: 군현 경계처럼 점선
      {
        id: "gu-boundary", type: "line", source: "omt", "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 6], ["!=", ["get", "maritime"], 1]],
        paint: { "line-color": t.mInk, "line-width": 1.2, "line-dasharray": [3, 2, 0.5, 2], "line-opacity": 0.6 },
      },
      // 길: 골목은 아주 옅게, 큰길은 곧은 먹선
      {
        id: "road-minor", type: "line", source: "omt", "source-layer": "transportation", minzoom: 14,
        filter: roadClass("minor", "service"),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": t.mMinor, "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.5, 18, 3] },
      },
      {
        id: "road-mid", type: "line", source: "omt", "source-layer": "transportation", minzoom: 11,
        filter: roadClass("secondary", "tertiary"),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": t.mRoad, "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.4, 14, 1.2, 18, 5] },
      },
      {
        id: "road-major", type: "line", source: "omt", "source-layer": "transportation",
        filter: roadClass("motorway", "trunk", "primary"),
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": t.mRoad, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.5, 14, 1.4, 18, 5] },
      },
      // 큰길 위 일정 간격의 점 (대동여지도의 10리 표시)
      {
        id: "road-ri-dots", type: "line", source: "omt", "source-layer": "transportation", minzoom: 13,
        filter: roadClass("trunk", "primary"),
        layout: { "line-cap": "round" },
        paint: { "line-color": t.mInk, "line-width": ["interpolate", ["linear"], ["zoom"], 13, 2.6, 16, 4.5], "line-dasharray": [0, 9] },
      },
      {
        id: "rail", type: "line", source: "omt", "source-layer": "transportation", minzoom: 12,
        filter: ["all", ["==", ["get", "class"], "rail"], ["!=", ["get", "brunnel"], "tunnel"]],
        paint: { "line-color": t.mRoad, "line-width": 1, "line-dasharray": [4, 3] },
      },
      ...(mode === "names" ? nameLayers(t) : []),
      // 지명: 목판 명조 느낌 (한글은 지도 생성 시 localIdeographFontFamily 로 명조를 쓴다)
      {
        id: "water-name", type: "symbol", source: "omt", "source-layer": "water_name", minzoom: 11,
        layout: { "text-field": name, "text-font": FONT, "text-size": 13, "text-letter-spacing": 0.4 },
        paint: { "text-color": t.bank, "text-halo-color": t.paper, "text-halo-width": 1.4 },
      },
      {
        id: "station", type: "symbol", source: "omt", "source-layer": "poi", minzoom: 12.5,
        filter: ["all", ["==", ["get", "class"], "railway"], ["==", ["get", "subclass"], "subway"]],
        layout: {
          "text-field": ["case", [">=", ["index-of", "역", name], 0], name, ["concat", name, "역"]],
          "text-font": FONT_BOLD,
          "text-size": ["interpolate", ["linear"], ["zoom"], 12.5, 11, 16, 13],
          "text-padding": 4,
        },
        paint: { "text-color": t.mInk, "text-halo-color": t.paper, "text-halo-width": 1.8 },
      },
      {
        id: "place-dong", type: "symbol", source: "omt", "source-layer": "place", minzoom: 12.5,
        filter: ["match", ["get", "class"], ["quarter", "neighbourhood"], true, false],
        layout: { "text-field": name, "text-font": FONT, "text-size": ["interpolate", ["linear"], ["zoom"], 13, 11.5, 16, 14], "text-padding": 6 },
        paint: { "text-color": t.label, "text-halo-color": t.paper, "text-halo-width": 1.6, "text-opacity": 0.85 },
      },
      {
        id: "place-gu", type: "symbol", source: "omt", "source-layer": "place", maxzoom: 15,
        filter: ["match", ["get", "class"], ["suburb", "borough", "city"], true, false],
        layout: { "text-field": name, "text-font": FONT_BOLD, "text-size": ["interpolate", ["linear"], ["zoom"], 10, 13, 14, 17], "text-letter-spacing": 0.3 },
        paint: { "text-color": t.label, "text-halo-color": t.paper, "text-halo-width": 2 },
      },
    ]),
  };
}
