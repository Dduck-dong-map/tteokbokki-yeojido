import type { ExpressionSpecification, FilterSpecification, StyleSpecification } from "maplibre-gl";
import type { Tokens } from "@/lib/theme";

// 대동여지도 느낌 바탕 지도 (기획안 8절)
// 한지 바탕 · 옅은 먹선 길 · 쪽빛 물 · 큰길 위 10리 점 · 첩 이음선 격자 · 명조 지명.
// 지도 데이터: OpenStreetMap, 타일: OpenFreeMap (키·가입 없음, 상업 사용 가능 — 개발준비 문서 2절).
// 지도 엔진을 네이버로 정하면 이 파일 대신 네이버 스타일 편집기 스타일을 쓴다.

const OFM = "https://tiles.openfreemap.org";
const FONT = ["Noto Sans Regular"];
const FONT_BOLD = ["Noto Sans Bold"];
const name: ExpressionSpecification = ["coalesce", ["get", "name:ko"], ["get", "name"]];

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

export function dongyeoStyle(t: Tokens["map"]): StyleSpecification {
  return {
    version: 8,
    glyphs: `${OFM}/fonts/{fontstack}/{range}.pbf`,
    sources: {
      omt: { type: "vector", url: `${OFM}/planet`, attribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>' },
      seam: { type: "geojson", data: seamGrid() },
    },
    layers: [
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
    ],
  };
}
