"use client";

import { useEffect, useRef, useState } from "react";
import IntroZoom from "./IntroZoom";

const ZOOM_END = 2400; // 확대가 끝나는 때 (globals.css 의 intro-zoom 과 맞춘다) — 브라우저가 움직임을 못 알려 줄 때만 쓴다
const STILL_END = 800; // 움직임 줄이기 설정일 때 (확대 없이 그림만 나타남)
const LEAVE = 500; // 지도로 겹쳐 바뀌는 시간 (globals.css 의 intro-leave)

// 지도가 한 번 준비되면 다른 화면에 갔다 와도 다시 띄우지 않는다. 새로고침하면 처음부터.
type Seen = { __tteokMapSeen?: boolean };
const seen = () => typeof window !== "undefined" && (window as Seen).__tteokMapSeen === true;

// 지도가 처음 준비될 때까지 첫 화면 전환(대동여지도 확대)으로 덮는다. 폰은 화면 전체, 768 이상은 지도 칸만(목록·상세는 먼저 쓸 수 있게).
// settled = 지도가 떴거나, 실패했거나, 8초가 지남 (TteokMap 의 onSettled).
// 지도가 일찍 준비돼도 한양까지 확대가 끝난 뒤에 바뀌고, 늦으면 확대한 채 「지도 펼치는 중…」으로 기다린다.
export default function MapLoading({ settled }: { settled: boolean }) {
  const [phase, setPhase] = useState<"on" | "leaving" | "gone">(() => (seen() ? "gone" : "on"));
  const ref = useRef<HTMLDivElement>(null);
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (!settled) return;
    (window as Seen).__tteokMapSeen = true;
    let alive = true;
    let wait: ReturnType<typeof setTimeout> | undefined;
    let gone: ReturnType<typeof setTimeout> | undefined;
    // 다른 화면에 갔다 오면 이 효과가 다시 돈다(Next 가 화면을 숨겨 두었다 꺼낸다). 이미 걷혔으면 그대로 둔다.
    const leave = () => {
      if (!alive) return;
      setPhase((p) => (p === "gone" ? "gone" : "leaving"));
      gone = setTimeout(() => setPhase("gone"), LEAVE);
    };
    // 확대 움직임이 끝나기를 기다린다 (그림은 서버에서 먼저 그려져 움직이고 있으므로, 시계 대신 움직임 자체를 본다)
    const map = ref.current?.querySelector(".intro-map");
    const zoom = map?.getAnimations?.().find((a) => (a as CSSAnimation).animationName === "intro-zoom");
    if (zoom) zoom.finished.then(leave, leave);
    else {
      const end = matchMedia("(prefers-reduced-motion: reduce)").matches ? STILL_END : ZOOM_END;
      wait = setTimeout(leave, Math.max(0, end - (performance.now() - mountedAt.current)));
    }
    return () => {
      alive = false;
      clearTimeout(wait);
      clearTimeout(gone);
    };
  }, [settled]);

  if (phase === "gone") return null;
  return <IntroZoom ref={ref} className={`max-md:fixed max-md:z-40 ${phase === "leaving" ? "intro-leaving" : ""}`} />;
}
