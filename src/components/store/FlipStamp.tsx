"use client";

import { useState } from "react";
import { SPICE_LEVELS, type Spice } from "@/lib/taxonomy";
import { SpiceStamp } from "@/components/brand";
import { cn } from "@/lib/utils";

// 가게 상세에서만: 도장을 누르면 휙 돌아간다 (슬랙 10-28, 기획 팀장 아이디어). 지도 핀을 누르는 건 가게 열기 그대로다.
// 11-11 사용자: 앞면 = 그 맵기의 도장이 얼굴(보드 CH-15 디벨롭) + 고추 개수, 뒷면 = 게이지 도장 + 맵기 이름.
export default function FlipStamp({ n, size = 64, faded = false }: { n: Spice; size?: number; faded?: boolean }) {
  const [on, setOn] = useState(false);
  const pillH = Math.max(9, size * 0.3) + 2;
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      aria-label={`맵기 ${n} 도장 · 누르면 뒤집혀요`}
      className={cn("flip shrink-0", on && "on")}
      style={{ width: size, height: size + pillH }}
    >
      <div className="flip-inner" style={{ width: size, height: size + pillH }}>
        <div className="flip-face">
          <SpiceStamp n={n} size={size} faded={faded} face />
        </div>
        <div className="flip-back flip-face flex flex-col items-center">
          <SpiceStamp n={n} size={size} faded={faded} pill={false} />
          <span className="mt-[2px] text-[11px] leading-tight text-muted-foreground/70">{SPICE_LEVELS[n].label}</span>
        </div>
      </div>
    </button>
  );
}
