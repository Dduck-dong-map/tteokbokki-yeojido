"use client";

import { useEffect, useState } from "react";
import TigerLoader from "./TigerLoader";

const SHOW_AFTER = 300; // 호랑이가 나타나는 때 (globals.css 의 .tiger-loader > * 와 맞춘다)
const MIN_SHOWN = 600; // 나타났으면 이만큼은 보여 준다(깜빡임 방지)
const LEAVE = 200; // 걷히는 시간 (globals.css 의 tiger-leave)

// 지도가 한 번 준비되면 다른 화면에 갔다 와도 다시 띄우지 않는다. 새로고침하면 처음부터.
type Seen = { __tteokMapSeen?: boolean };
const seen = () => typeof window !== "undefined" && (window as Seen).__tteokMapSeen === true;

// 지도가 처음 준비될 때까지 덮는다. 폰은 화면 전체, 768 이상은 지도 칸만(목록·상세는 먼저 쓸 수 있게).
// settled = 지도가 떴거나, 실패했거나, 8초가 지남 (TteokMap 의 onSettled).
export default function MapLoading({ settled }: { settled: boolean }) {
  const [phase, setPhase] = useState<"on" | "leaving" | "gone">(() => (seen() ? "gone" : "on"));

  useEffect(() => {
    if (!settled) return;
    (window as Seen).__tteokMapSeen = true;
    const since = performance.now();
    const unseen = since < SHOW_AFTER; // 아직 안 나타났으면 바로 치운다
    const wait = unseen ? 0 : Math.max(0, SHOW_AFTER + MIN_SHOWN - since);
    // 다른 화면에 갔다 오면 이 효과가 다시 돈다(Next 가 화면을 숨겨 두었다 꺼낸다). 이미 걷혔으면 그대로 둔다.
    const leave = setTimeout(() => setPhase((p) => (p === "gone" || unseen ? "gone" : "leaving")), wait);
    const gone = setTimeout(() => setPhase("gone"), wait + LEAVE);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
  }, [settled]);

  if (phase === "gone") return null;
  return <TigerLoader className={`max-md:fixed max-md:z-40 ${phase === "leaving" ? "tiger-leaving" : ""}`} />;
}
