"use client";

import { useState } from "react";
import { SPICE_LEVELS, type Spice } from "@/lib/taxonomy";
import { SpiceStamp } from "@/components/brand";
import { cn } from "@/lib/utils";

// 가게 상세에서만: 도장을 누르면 휙 돌아가며 뒷면에 그 맵기의 표정 (슬랙 10-28, 기획 팀장 아이디어).
// 지도 핀을 누르는 건 가게 열기 그대로다. 표정은 화면 설계 보드 face_1~5 의 눈·입을 옮겨 그렸다(숫자·틀은 뺌).
export default function FlipStamp({ n, size = 64, faded = false }: { n: Spice; size?: number; faded?: boolean }) {
  const [on, setOn] = useState(false);
  const pillH = Math.max(9, size * 0.3) + 2;
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      aria-label={`맵기 ${n} 도장 · 누르면 표정이 보여요`}
      className={cn("flip shrink-0", on && "on")}
      style={{ width: size, height: size + pillH }}
    >
      <div className="flip-inner" style={{ width: size, height: size + pillH }}>
        <div className="flip-face">
          <SpiceStamp n={n} size={size} faded={faded} />
        </div>
        <div className="flip-back flip-face flex flex-col items-center">
          <span
            className="block rounded-[20%] shadow-[0_1px_2px_rgba(0,0,0,.2)]"
            style={{ width: size, height: size, background: `var(--s${n})`, boxShadow: `inset 0 0 0 ${Math.max(1.5, size * 0.067)}px var(--s${n}e)`, transform: "rotate(-3deg)" }}
          >
            <Face n={n} />
          </span>
          <span className="mt-[2px] text-[11px] leading-tight text-muted-foreground/70">{SPICE_LEVELS[n].label}</span>
        </div>
      </div>
    </button>
  );
}

function Face({ n }: { n: Spice }) {
  const c = `var(--s${n}f)`;
  const common = { fill: "none", stroke: c, strokeWidth: 7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
      {n === 1 && (
        <>
          <path d="M34 58 q10 -10 20 0 M66 58 q10 -10 20 0" {...common} />
          <path d="M46 78 q14 10 28 0" {...common} />
        </>
      )}
      {n === 2 && (
        <>
          <circle cx="42" cy="54" r="6.5" fill={c} />
          <circle cx="78" cy="54" r="6.5" fill={c} />
          <path d="M44 76 q16 12 32 0" {...common} />
        </>
      )}
      {n === 3 && (
        <>
          <circle cx="42" cy="52" r="10" fill={c} />
          <circle cx="78" cy="52" r="10" fill={c} />
          <circle cx="42" cy="54" r="4.5" fill="#2A2421" />
          <circle cx="78" cy="54" r="4.5" fill="#2A2421" />
          <ellipse cx="60" cy="82" rx="11" ry="8" fill={c} />
          <ellipse cx="24" cy="72" rx="7" ry="4" fill="#F2B78C" opacity=".85" />
          <ellipse cx="96" cy="72" rx="7" ry="4" fill="#F2B78C" opacity=".85" />
        </>
      )}
      {n === 4 && (
        <>
          <path d="M30 46 l14 8 l-14 8 M90 46 l-14 8 l14 8" {...common} />
          <path d="M40 82 q5 -6 10 0 q5 6 10 0 q5 -6 10 0 q5 6 10 0" {...common} />
          <path d="M22 60 v16 M98 60 v16" stroke="#7FA6D6" strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {n === 5 && (
        <>
          <path d="M26 12 c-4 -6 2 -10 0 -14 c8 6 8 10 4 14 Z M54 10 c-6 -8 2 -12 -2 -18 c12 8 10 14 6 18 Z M86 12 c-4 -6 2 -10 0 -14 c8 6 8 10 4 14 Z" fill="#E3814D" />
          <path d="M30 44 l16 14 M46 44 l-16 14 M74 44 l16 14 M90 44 l-16 14" {...common} />
          <path d="M40 74 h40 q0 16 -20 16 q-20 0 -20 -16 Z" fill={c} />
          <path d="M52 82 h16 v9 q-8 7 -16 0 Z" fill="#E3814D" />
        </>
      )}
    </svg>
  );
}
