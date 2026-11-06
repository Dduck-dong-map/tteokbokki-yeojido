"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// 화면 폭 기준 (웹 1차 기획 3.2): 768 미만 = 모바일, 그 위 = 왼쪽 패널 + 큰 지도.
// 모양은 CSS 로 나누고, 지도를 켤지·줄을 눌렀을 때 어디로 갈지만 여기서 본다.
const WIDE = "(min-width: 768px)";

function subscribe(cb: () => void) {
  const m = window.matchMedia(WIDE);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}

// 서버 렌더 때는 모바일로 친다 → 화면이 뜬 뒤 실제 폭으로 바뀐다
export const useIsWide = () => useSyncExternalStore(subscribe, () => window.matchMedia(WIDE).matches, () => false);

// 위치를 이미 허용한 기기에서만 조용히 받는다. 여기서 새로 묻지 않고, 위치는 서버로 보내지 않는다.
export function useGrantedLocation() {
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!navigator.permissions || !navigator.geolocation) return;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((p) => {
        if (p.state !== "granted") return;
        navigator.geolocation.getCurrentPosition((pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }), () => undefined, { timeout: 6000 });
      })
      .catch(() => undefined);
  }, []);
  return me;
}
