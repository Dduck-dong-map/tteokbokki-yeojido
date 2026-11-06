"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { FilterSpecification, GeoJSONSource, Map as MlMap, SymbolLayerSpecification } from "maplibre-gl";
import { won } from "@/lib/filters";
import { freshness } from "@/lib/freshness";
import { derive, findPreset } from "@/lib/theme";
import type { Store } from "@/lib/types";
import { isPending } from "@/lib/wiki";
import { MAP_CREDIT, REAL_FADE, dongyeoStyle, type ZoomMode } from "./dongyeoStyle";
import { createRealMap, type RealMap } from "./realMap";
import { STAMP_ICON_OFFSET, provideStamps } from "./stamps";

type LatLng = { lat: number; lng: number };

export type Bounds = { w: number; s: number; e: number; n: number };
export type Focus = { n: number } & ({ lat: number; lng: number; zoom?: number } | { bounds: Bounds });

type Props = {
  stores: Store[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  me: LatLng | null;
  focus: Focus | null; // n 이 바뀔 때마다 그곳으로 옮긴다
  onBoundsChange?: (b: Bounds) => void; // 지도를 움직일 때마다 보이는 범위 (「현재 지도에서 찾은 가게」)
  start?: { lat: number; lng: number; zoom: number }; // 처음 보여 줄 곳. 없으면 마포·서대문 13배
  interactive?: boolean; // false = 움직이지 않는 작은 지도 (가게 상세, 위에서 밀어도 페이지가 스크롤된다)
  showName?: boolean; // 도장 밑 글자를 가격 대신 가게 이름으로
};

// 첫 화면 중심: 예시 데이터가 있는 마포·서대문 사이. 위치를 허용하면 내 위치로 간다.
const START: [number, number] = [126.928, 37.5555];
const KOREAN_SERIF = "'Nanum Myeongjo', 'Noto Serif KR', Batang, '바탕', AppleMyungjo, serif";

const rot = (id: string) => ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 9) - 4; // 도장을 살짝 비뚤게

function toGeoJSON(stores: Store[], showName = false): GeoJSON.FeatureCollection {
  const now = new Date();
  return {
    type: "FeatureCollection",
    features: stores.map((s) => ({
      type: "Feature",
      properties: {
        id: s.id,
        name: s.name,
        price: won(s.price),
        spice: s.spice,
        grade: s.grade,
        stale: freshness(s, now) === "stale",
        rot: rot(s.id),
        // 도장 밑 글자: 대표 가격 + 별점 (확인 중인 가게는 그렇게 적는다)
        label: showName ? s.name : `${won(s.price)}${isPending(s, now) ? " · 확인 중" : s.rating?.count ? ` · ${s.rating.avg.toFixed(1)}점` : ""}`,
      },
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
    })),
  };
}

export default function TteokMap({ stores, selectedId, onSelect, me, focus, onBoundsChange, start, interactive = true, showName = false }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const startAt = useRef(start);
  const under = useRef<HTMLDivElement>(null);
  const [realOn, setRealOn] = useState(false);
  const [failed, setFailed] = useState(false); // 지도를 못 불러와도 주소·길찾기는 그대로 쓸 수 있다 (경고창#6)
  const initial = useRef({ interactive, showName });
  const mapRef = useRef<MlMap | null>(null);
  const ready = useRef(false);
  const latest = useRef({ stores, selectedId, me, onSelect, onBoundsChange });
  useEffect(() => {
    latest.current = { stores, selectedId, me, onSelect, onBoundsChange };
  });

  useEffect(() => {
    let map: MlMap | undefined;
    let real: RealMap | undefined;
    let cancelled = false;
    let resize: ResizeObserver | undefined;
    (async () => {
      const ml = await import("maplibre-gl").catch(() => null);
      if (cancelled || !box.current) return;
      if (!ml) return setFailed(true);
      ml.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs"); // scripts/copy-maplibre-worker.mjs 가 복사해 둔 파일
      const t = derive(findPreset(document.documentElement.dataset.pal));
      const mode: ZoomMode = new URLSearchParams(window.location.search).get("zoom") === "real" ? "real" : "names";
      let m: MlMap;
      try {
        m = new ml.Map({
        container: box.current,
        interactive: initial.current.interactive,
        style: dongyeoStyle(t.map, mode),
        center: startAt.current ? [startAt.current.lng, startAt.current.lat] : START,
        zoom: startAt.current?.zoom ?? 13,
        minZoom: 10,
        maxZoom: 18.5,
        // 기본값 4 면 15단계부터 타일을 그대로 늘리기만 해서, 확대할수록 길 이름이 사라지고 16단계 이상 층은 아예 안 그려진다.
        zoomLevelsToOverscale: 0,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: false,
        localIdeographFontFamily: KOREAN_SERIF,
        });
      } catch {
        return setFailed(true); // WebGL 을 못 쓰는 기기
      }
      map = m;
      // 타일이 하나도 안 오면 안내를 띄우고, 하나라도 오면 내린다
      let sawTile = false;
      m.on("error", () => {
        if (!sawTile) setFailed(true);
      });
      m.on("data", (e) => {
        if (!sawTile && e.dataType === "source" && "tile" in e && e.tile) {
          sawTile = true;
          setFailed(false);
        }
      });
      // 패널을 열고 닫거나 등록 단계를 넘기면 지도 칸의 크기가 바뀐다
      resize = new ResizeObserver(() => m.resize());
      resize.observe(box.current);
      // 오른쪽 아래는 등록·내 위치 버튼 자리. ① 은 확대하면 위 지도 층이 꺼지므로 저작권 표시를 고정으로 둔다.
      m.addControl(new ml.AttributionControl({ compact: true, customAttribution: mode === "real" ? MAP_CREDIT : undefined }), "bottom-left");
      m.touchZoomRotate.disableRotation();
      // 마우스를 쓰는 넓은 화면: ＋− 단추 + 도장에 올리면 이름·가격 (웹 1차 기획 REQ-W11). 터치 노트북도 마우스가 있으면 나온다.
      const mouse = initial.current.interactive && window.matchMedia("(hover: hover) and (min-width: 768px)").matches;
      if (mouse) m.addControl(new ml.NavigationControl({ showCompass: false }), "bottom-right");
      mapRef.current = m;
      if (process.env.NODE_ENV === "development" && initial.current.interactive) Object.assign(window, { __tteokMap: m }); // 개발 중 콘솔에서 지도 살펴보기
      provideStamps(m, t.map, t.css.surface);

      if (mode === "real" && under.current) {
        const follow = () => {
          real?.follow(m.getCenter(), m.getZoom());
          setRealOn(m.getZoom() >= REAL_FADE[1]);
        };
        m.on("move", follow);
        createRealMap(ml, under.current, m.getCenter(), m.getZoom()).then((r) => {
          if (cancelled) return r.remove();
          real = r;
          follow();
        });
      }

      m.on("load", () => {
        const { stores, selectedId, me } = latest.current;
        m.addSource("stores", { type: "geojson", data: toGeoJSON(stores, initial.current.showName), cluster: true, clusterRadius: 42, clusterMaxZoom: 14 });
        m.addSource("me", { type: "geojson", data: meData(me) });

        // 가게가 몰린 곳: 둥근 도장에 가게 수
        m.addLayer({
          id: "clusters", type: "circle", source: "stores", filter: ["has", "point_count"],
          paint: {
            "circle-color": t.map.primary,
            "circle-radius": ["step", ["get", "point_count"], 15, 5, 19, 15, 24],
            "circle-stroke-width": 2.5,
            "circle-stroke-color": t.map.paper,
          },
        });
        m.addLayer({
          id: "cluster-count", type: "symbol", source: "stores", filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 13, "text-allow-overlap": true },
          paint: { "text-color": t.map.onprimary },
        });
        m.addLayer({
          id: "stamp-ring", type: "circle", source: "stores", filter: selFilter(selectedId),
          paint: { "circle-radius": 24, "circle-color": "rgba(0,0,0,0)", "circle-stroke-width": 2.5, "circle-stroke-color": t.map.primary },
        });
        const stampLayout: SymbolLayerSpecification["layout"] = {
          "icon-image": ["concat", "stamp-", ["to-string", ["get", "spice"]]],
          "icon-size": ["case", ["==", ["get", "grade"], "menu"], 0.68, 1],
          "icon-rotate": ["get", "rot"],
          "icon-offset": [0, STAMP_ICON_OFFSET], // 도장 중심이 가게 위치에 오게(아래 고추 알약만큼 올림)
          "icon-allow-overlap": true,
        };
        // 안 보이는 도장: 길·건물·상호 이름만 도장을 비켜 가게 한다. 역·동네 이름은 이 층보다 위라 밀려나지 않는다.
        if (mode === "names") {
          m.addLayer(
            { id: "stamps-block", type: "symbol", source: "stores", minzoom: 15, filter: ["!", ["has", "point_count"]], layout: stampLayout, paint: { "icon-opacity": 0 } },
            "water-name",
          );
        }
        m.addLayer({
          id: "stamps", type: "symbol", source: "stores", filter: ["!", ["has", "point_count"]],
          layout: { ...stampLayout, "icon-ignore-placement": true, "symbol-sort-key": ["get", "spice"] },
          // 마지막 확인 180일 넘은 가게 = 바랜 도장
          paint: { "icon-opacity": ["case", ["get", "stale"], 0.42, 1] },
        });
        // 확대하면 도장 밑에 가격·별점. 지도만 봐도 고를 수 있게 한다. 자리가 없으면 글자만 빠진다.
        m.addLayer({
          id: "stamp-label", type: "symbol", source: "stores", minzoom: 14.5, filter: ["!", ["has", "point_count"]],
          layout: { "text-field": ["get", "label"], "text-font": ["Noto Sans Bold"], "text-size": 11.5, "text-anchor": "top", "text-offset": [0, 2.5], "text-padding": 1 },
          paint: { "text-color": t.map.mInk, "text-halo-color": t.map.paper, "text-halo-width": 1.8 },
        });
        m.addLayer({ id: "me-halo", type: "circle", source: "me", paint: { "circle-radius": 18, "circle-color": t.css.loc, "circle-opacity": 0.18 } });
        m.addLayer({ id: "me-dot", type: "circle", source: "me", paint: { "circle-radius": 6.5, "circle-color": t.css.loc, "circle-stroke-width": 3, "circle-stroke-color": "#FFFFFF" } });

        m.on("click", (e) => {
          const hit = m.queryRenderedFeatures(e.point, { layers: ["stamps", "clusters"] })[0];
          if (!hit) return latest.current.onSelect(null);
          if (hit.layer.id === "clusters") {
            const src = m.getSource("stores") as GeoJSONSource;
            src.getClusterExpansionZoom(hit.properties.cluster_id).then((zoom) =>
              m.easeTo({ center: (hit.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.3 }),
            );
          } else latest.current.onSelect(String(hit.properties.id));
        });
        for (const id of ["stamps", "clusters"]) {
          m.on("mouseenter", id, () => (m.getCanvas().style.cursor = "pointer"));
          m.on("mouseleave", id, () => (m.getCanvas().style.cursor = ""));
        }
        if (mouse) {
          const tip = new ml.Popup({ closeButton: false, closeOnClick: false, offset: 30, className: "stamp-tip" });
          m.on("mousemove", "stamps", (e) => {
            const f = e.features?.[0];
            if (f) tip.setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number]).setText(`${f.properties.name} · ${f.properties.price}`).addTo(m);
          });
          m.on("mouseleave", "stamps", () => tip.remove());
        }
        const report = () => {
          const b = m.getBounds();
          latest.current.onBoundsChange?.({ w: b.getWest(), s: b.getSouth(), e: b.getEast(), n: b.getNorth() });
        };
        m.on("moveend", report);
        report();
        ready.current = true;
      });
    })();
    return () => {
      cancelled = true;
      ready.current = false;
      resize?.disconnect();
      real?.remove();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ready.current) (mapRef.current?.getSource("stores") as GeoJSONSource | undefined)?.setData(toGeoJSON(stores, initial.current.showName));
  }, [stores]);

  useEffect(() => {
    if (ready.current) mapRef.current?.setFilter("stamp-ring", selFilter(selectedId));
  }, [selectedId]);

  useEffect(() => {
    if (ready.current) (mapRef.current?.getSource("me") as GeoJSONSource | undefined)?.setData(meData(me));
  }, [me]);

  useEffect(() => {
    const m = mapRef.current;
    if (!focus || !m) return;
    if ("bounds" in focus) m.fitBounds([[focus.bounds.w, focus.bounds.s], [focus.bounds.e, focus.bounds.n]], { padding: 48, maxZoom: 15, duration: 600 });
    else m.easeTo({ center: [focus.lng, focus.lat], zoom: focus.zoom ?? Math.max(m.getZoom(), 15), duration: 600 });
  }, [focus]);

  // maplibre 가 지도 상자에 position: relative 를 붙이므로, 바깥 상자로 자리를 잡는다
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0" aria-hidden="true">
        <div ref={under} className="h-full w-full" />
      </div>
      <div className="absolute inset-0">
        <div ref={box} className="h-full w-full" aria-label="떡볶이 가게 지도" role="region" />
      </div>
      {failed && (
        <p role="status" className="absolute inset-x-3 top-3 z-10 rounded-xl border border-line bg-surface px-3 py-2 text-center text-[13px] text-ink2 shadow-sm">
          지도를 불러오지 못했어요. 주소와 길찾기는 그대로 쓸 수 있어요.
        </p>
      )}
      {realOn && (
        <span className="pointer-events-none absolute top-11 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-chipline bg-surface px-3 py-1 text-[12px] text-ink2 shadow-sm">
          실제 지도 · 네이버 자리에 임시 지도 · 축소하면 그림 지도
        </span>
      )}
    </div>
  );
}

const selFilter = (id: string | null) =>
  ["all", ["!", ["has", "point_count"]], ["==", ["get", "id"], id ?? ""]] as FilterSpecification;

function meData(me: LatLng | null): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: me ? [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [me.lng, me.lat] } }] : [],
  };
}
