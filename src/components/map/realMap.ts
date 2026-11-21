import type { LayerSpecification, LngLatLike, Map as MlMap, StyleSpecification } from "maplibre-gl";

// 확대 방식 ① 의 「실제 지도」 자리 (11-13 부터 기본, 주소 ?zoom=names 면 ②). 밖에서는 follow · remove · kind 만 쓴다.
// 네이버 키(NEXT_PUBLIC_NAVER_MAP_KEY)가 있으면 네이버 지도(GL 벡터), 없거나 인증이 안 되면 OpenFreeMap 상세 지도(임시).
// 범위 = ① 확대했을 때 실제 지도만 네이버 (보드 W1-6, 11-11 사용자 결정). 그림 지도·주소 검색은 그대로.

const SANS = "ChosunCentennial, 'Nanum Myeongjo', 'Noto Serif KR', AppleMyungjo, serif"; // 글꼴 통일: 조선100년체 (11-12)
// 이 배율에 처음 닿을 때 실제 지도를 만든다(TteokMap). 네이버 Dynamic Map 은 지도를 띄울 때마다 1건으로 세므로,
// 확대하지 않고 둘러보기만 하는 사람은 0건이다. 그림 지도가 사라지기(REAL_FADE 15) 전에 미리 받아 둔다.
export const PRELOAD_ZOOM = 14;
// 네이버 지도가 드러났을 때 왼쪽 아래 저작권 표시 (네이버 로고는 지도 왼쪽 위에 따로 나온다)
// 가게 좌표 일부는 OpenStreetMap(Nominatim)에서 찾았다 (강남 리서치 v1, 11-15) → 네이버 지도가 보일 때도 OSM 표시를 함께 둔다 (ODbL)
export const NAVER_CREDIT = '<a href="https://www.navercorp.com" target="_blank">© NAVER Corp.</a> · 가게 좌표 <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a> contributors';
const NAVER_KEY = process.env.NEXT_PUBLIC_NAVER_MAP_KEY; // 빌드 때 박힌다 → .env.local 을 바꾸면 개발 서버를 다시 켠다

export type RealMap = { follow: (center: LngLatLike, zoom: number) => void; remove: () => void; kind: () => "naver" | "temp" };
type Ml = typeof import("maplibre-gl");

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

// 임시: OpenFreeMap 상세 지도 (키 없음 · 요금 없음)
async function tempRealMap(ml: Ml, container: HTMLElement, center: LngLatLike, zoom: number): Promise<RealMap> {
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
    kind: () => "temp",
  };
}

// ── 네이버 지도 (Maps · Dynamic Map, GL 벡터) ──
// 스크립트 주소·옵션 = navermaps.github.io/maps.js.ncp (ncpKeyId · submodules=gl · gl: true).
// GL 벡터 지도는 줌이 소수이고 기본값이 래스터보다 1 낮다(512 타일) → MapLibre 줌과 같은 값으로 맞춘다.
type NaverLatLng = object;
type NaverMap = { setCenter: (c: NaverLatLng) => void; setZoom: (z: number, effect?: boolean) => void; setSize: (s: object) => void; destroy: () => void };
type NaverMaps = {
  Map: new (el: HTMLElement, options: Record<string, unknown>) => NaverMap;
  LatLng: new (lat: number, lng: number) => NaverLatLng;
  Size: new (width: number, height: number) => object;
  Position: Record<string, number>;
  jsContentLoaded?: boolean;
  onJSContentLoaded?: () => void;
};
declare global {
  interface Window {
    naver?: { maps: NaverMaps };
    navermap_authFailure?: () => void; // 키나 서비스 주소가 안 맞으면 네이버 스크립트가 부른다
  }
}

let naverScript: Promise<NaverMaps> | null = null;
function loadNaver(key: string): Promise<NaverMaps> {
  naverScript ??= new Promise<NaverMaps>((resolve, reject) => {
    const ready = () => {
      const maps = window.naver?.maps;
      if (!maps) return reject(new Error("네이버 지도 스크립트에 maps 가 없음"));
      // gl 서브모듈은 본 스크립트 뒤에 따로 받는다 → 다 받았다는 신호를 기다린다
      if (maps.jsContentLoaded) resolve(maps);
      else maps.onJSContentLoaded = () => resolve(maps);
    };
    if (window.naver?.maps) return ready();
    const s = document.createElement("script");
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(key)}&submodules=gl`;
    s.async = true;
    s.onload = ready;
    s.onerror = () => reject(new Error("네이버 지도 스크립트를 받지 못함"));
    document.head.appendChild(s);
  });
  naverScript.catch(() => (naverScript = null)); // 실패하면 다음에 다시 시도
  return naverScript;
}

async function naverRealMap(ml: Ml, container: HTMLElement, center: LngLatLike, zoom: number, key: string, onSwap?: () => void): Promise<RealMap> {
  const N = await loadNaver(key);
  const box = document.createElement("div"); // 인증 실패 때 통째로 걷어 내고 임시 지도로 바꾸기 쉽게 한 겹 둔다
  box.style.cssText = "position:absolute;inset:0";
  container.appendChild(box);
  let last = { c: ml.LngLat.convert(center), z: zoom };
  const map = new N.Map(box, {
    gl: true,
    center: new N.LatLng(last.c.lat, last.c.lng),
    zoom,
    minZoom: 6, // 5 로 두면 네이버가 「6 이상으로」 경고한다 (11-11 확인)
    maxZoom: 20,
    // 움직임은 위의 그림 지도가 받고, 이 지도는 따라만 간다
    draggable: false,
    pinchZoom: false,
    scrollWheel: false,
    keyboardShortcuts: false,
    disableDoubleTapZoom: true,
    disableDoubleClickZoom: true,
    disableTwoFingerTapZoom: true,
    disableKineticPan: true,
    zoomControl: false,
    mapTypeControl: false,
    scaleControl: false,
    mapDataControl: false,
    // 네이버 로고는 가리지 않는다(이용 약관). 왼쪽 아래는 위 지도의 저작권 단추, 오른쪽 아래는 등록·내 위치 단추 자리
    logoControl: true,
    logoControlOptions: { position: N.Position.TOP_LEFT },
  });

  let removed = false;
  let gone = false; // 인증 실패로 먼저 걷어 낸 뒤 remove 가 또 와도 한 번만 지운다
  // 네이버 지도는 창 크기가 바뀔 때만 제 크기를 다시 잰다. 상세 패널이 열려 칸만 좁아지면 옛 크기로 남아
  // 위 그림 지도와 중심이 어긋나고, 도장이 실제 자리에서 벗어나 확대할수록 움직여 보인다 (11-21) → 칸 크기를 직접 따라간다
  const fit = new ResizeObserver(() => {
    if (gone || !box.clientWidth || !box.clientHeight) return;
    try {
      map.setSize(new N.Size(box.clientWidth, box.clientHeight));
      map.setZoom(last.z, false);
      map.setCenter(new N.LatLng(last.c.lat, last.c.lng));
    } catch {
      // follow 와 같은 까닭: 인증 전·실패 직후의 지도는 명령에 오류를 낸다
    }
  });
  fit.observe(box);
  let inner: RealMap = {
    follow: (c, z) => {
      if (gone || z < PRELOAD_ZOOM) return;
      const p = ml.LngLat.convert(c);
      try {
        map.setZoom(z, false);
        map.setCenter(new N.LatLng(p.lat, p.lng));
      } catch {
        // 인증이 끝나기 전·실패한 직후의 네이버 지도는 명령을 받으면 오류를 낸다 (11-11 틀린 키 시험) → 그림 지도 움직임은 막지 않는다
      }
    },
    remove: () => {
      if (gone) return;
      gone = true;
      fit.disconnect();
      try {
        map.destroy(); // 인증 실패한 지도는 지우다가 오류를 낼 수 있다 → 칸은 어쨌든 걷어 낸다
      } catch {}
      box.remove();
    },
    kind: () => "naver",
  };
  window.navermap_authFailure = () => {
    console.warn("[지도] 네이버 지도 인증 실패 (Client ID · 서비스 URL 확인) → 임시 지도로 바꿈");
    inner.remove();
    void tempRealMap(ml, container, last.c, last.z).then((t) => {
      if (removed) return t.remove();
      inner = t;
      t.follow(last.c, last.z); // 바꾸는 사이에 움직인 자리로
      onSwap?.(); // 화면의 「실제 지도 · …」 안내를 임시 지도로 바꾸게 알린다
    });
  };
  return {
    follow: (c, z) => {
      last = { c: ml.LngLat.convert(c), z };
      inner.follow(c, z);
    },
    remove: () => {
      removed = true;
      inner.remove();
    },
    kind: () => inner.kind(),
  };
}

// onSwap: 네이버 인증이 실패해 임시 지도로 바뀌었을 때 부른다
export async function createRealMap(ml: Ml, container: HTMLElement, center: LngLatLike, zoom: number, onSwap?: () => void): Promise<RealMap> {
  if (NAVER_KEY) {
    try {
      return await naverRealMap(ml, container, center, zoom, NAVER_KEY, onSwap);
    } catch (e) {
      console.warn("[지도] 네이버 지도를 못 띄움 → 임시 지도", e);
    }
  }
  return tempRealMap(ml, container, center, zoom);
}
