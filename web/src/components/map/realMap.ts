import type { LayerSpecification, LngLatLike, Map as MlMap, StyleSpecification } from "maplibre-gl";

// 확대 방식 ① 의 「실제 지도」 자리 (주소 ?zoom=real).
// 네이버 키를 받기 전이라 OpenFreeMap 상세 지도를 임시로 쓴다. 키를 받으면 이 파일만 네이버 지도로 바꾼다 — 밖에서는 follow · remove 만 쓴다.

const SANS = "'Pretendard', 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
const PRELOAD_ZOOM = 14; // 그림 지도가 사라지기 전에 미리 타일을 받아 둔다. 그 아래에선 움직이지 않아 비용이 없다.

export type RealMap = { follow: (center: LngLatLike, zoom: number) => void; remove: () => void };

// 받은 상세 지도 스타일을 한글 이름만 나오게 다듬는다. (원본은 로마자 + 한글을 두 줄로 쓴다)
async function realStyle(): Promise<StyleSpecification> {
  const style: StyleSpecification = await fetch("https://tiles.openfreemap.org/styles/liberty").then((r) => r.json());
  const layers = style.layers
    .filter((l) => l.type !== "raster") // 위성 음영은 쓰지 않는다
    .map((l): LayerSpecification => {
      const field = l.type === "symbol" ? l.layout?.["text-field"] : undefined;
      if (l.type !== "symbol" || !JSON.stringify(field ?? "").includes("name")) return l;
      return { ...l, layout: { ...l.layout, "text-field": ["coalesce", ["get", "name:ko"], ["get", "name:nonlatin"], ["get", "name"]] } };
    });
  const sources = Object.fromEntries(Object.entries(style.sources).filter(([, s]) => s.type !== "raster"));
  return { ...style, layers, sources };
}

export async function createRealMap(ml: typeof import("maplibre-gl"), container: HTMLElement, center: LngLatLike, zoom: number): Promise<RealMap> {
  const map: MlMap = new ml.Map({
    container,
    style: await realStyle(),
    center,
    zoom,
    maxZoom: 18.5,
    interactive: false, // 움직임은 위의 그림 지도가 받고, 이 지도는 따라만 간다
    attributionControl: false, // 저작권 표시는 위 지도에 함께 있다 (같은 OpenFreeMap · OpenStreetMap)
    zoomLevelsToOverscale: 0,
    localIdeographFontFamily: SANS,
  });
  return {
    follow: (c, z) => {
      if (z >= PRELOAD_ZOOM) map.jumpTo({ center: c, zoom: z });
    },
    remove: () => map.remove(),
  };
}
