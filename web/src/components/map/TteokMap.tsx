"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { FilterSpecification, GeoJSONSource, Map as MlMap } from "maplibre-gl";
import { freshness } from "@/lib/freshness";
import { derive, findPreset } from "@/lib/theme";
import type { Store } from "@/lib/types";
import { dongyeoStyle } from "./dongyeoStyle";
import { provideStamps } from "./stamps";

type LatLng = { lat: number; lng: number };

type Props = {
  stores: Store[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  me: LatLng | null;
  focus: (LatLng & { zoom?: number; n: number }) | null; // n 이 바뀔 때마다 그곳으로 옮긴다
};

// 첫 화면 중심: 예시 데이터가 있는 마포·서대문 사이. 위치를 허용하면 내 위치로 간다.
const START: [number, number] = [126.928, 37.5555];
const KOREAN_SERIF = "'Nanum Myeongjo', 'Noto Serif KR', Batang, '바탕', AppleMyungjo, serif";

const rot = (id: string) => ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 9) - 4; // 도장을 살짝 비뚤게

function toGeoJSON(stores: Store[]): GeoJSON.FeatureCollection {
  const now = new Date();
  return {
    type: "FeatureCollection",
    features: stores.map((s) => ({
      type: "Feature",
      properties: { id: s.id, spice: s.spice, grade: s.grade, stale: freshness(s, now) === "stale", rot: rot(s.id) },
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
    })),
  };
}

export default function TteokMap({ stores, selectedId, onSelect, me, focus }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const ready = useRef(false);
  const latest = useRef({ stores, selectedId, me, onSelect });
  useEffect(() => {
    latest.current = { stores, selectedId, me, onSelect };
  });

  useEffect(() => {
    let map: MlMap | undefined;
    let cancelled = false;
    (async () => {
      const ml = await import("maplibre-gl");
      if (cancelled || !box.current) return;
      ml.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs"); // scripts/copy-maplibre-worker.mjs 가 복사해 둔 파일
      const t = derive(findPreset(document.documentElement.dataset.pal));
      const m = new ml.Map({
        container: box.current,
        style: dongyeoStyle(t.map),
        center: START,
        zoom: 13,
        minZoom: 10,
        maxZoom: 18.5,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: false,
        localIdeographFontFamily: KOREAN_SERIF,
      });
      map = m;
      m.addControl(new ml.AttributionControl({ compact: true }), "bottom-left"); // 오른쪽 아래는 제보 버튼 자리
      m.touchZoomRotate.disableRotation();
      mapRef.current = m;
      if (process.env.NODE_ENV === "development") Object.assign(window, { __tteokMap: m }); // 개발 중 콘솔에서 지도 살펴보기
      provideStamps(m, t.map.ramp);

      m.on("load", () => {
        const { stores, selectedId, me } = latest.current;
        m.addSource("stores", { type: "geojson", data: toGeoJSON(stores), cluster: true, clusterRadius: 42, clusterMaxZoom: 14 });
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
        m.addLayer({
          id: "stamps", type: "symbol", source: "stores", filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": ["concat", "stamp-", ["to-string", ["get", "spice"]]],
            "icon-size": ["case", ["==", ["get", "grade"], "menu"], 0.68, 1],
            "icon-rotate": ["get", "rot"],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "symbol-sort-key": ["get", "spice"],
          },
          // 마지막 확인 180일 넘은 가게 = 바랜 도장
          paint: { "icon-opacity": ["case", ["get", "stale"], 0.42, 1] },
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
        ready.current = true;
      });
    })();
    return () => {
      cancelled = true;
      ready.current = false;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (ready.current) (mapRef.current?.getSource("stores") as GeoJSONSource | undefined)?.setData(toGeoJSON(stores));
  }, [stores]);

  useEffect(() => {
    if (ready.current) mapRef.current?.setFilter("stamp-ring", selFilter(selectedId));
  }, [selectedId]);

  useEffect(() => {
    if (ready.current) (mapRef.current?.getSource("me") as GeoJSONSource | undefined)?.setData(meData(me));
  }, [me]);

  useEffect(() => {
    if (focus) mapRef.current?.easeTo({ center: [focus.lng, focus.lat], zoom: focus.zoom ?? Math.max(mapRef.current.getZoom(), 15), duration: 600 });
  }, [focus]);

  // maplibre 가 지도 상자에 position: relative 를 붙이므로, 바깥 상자로 자리를 잡는다
  return (
    <div className="absolute inset-0">
      <div ref={box} className="h-full w-full" aria-label="떡볶이 가게 지도" role="region" />
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
