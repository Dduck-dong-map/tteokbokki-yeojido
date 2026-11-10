import { SPICE_LEVELS, type Spice } from "@/lib/taxonomy";

// 작은 고추 (알약 속). 지도 핀의 drawChili 와 같은 모양.
export function Chili({ h = 10 }: { h?: number }) {
  return (
    <svg width={h * (10 / 14)} height={h} viewBox="0 0 10 14" aria-hidden="true" className="shrink-0">
      <path d="M5 3 C8 3 9 7 7 11 C6 13 4 13 3 11 C1 7 2 3 5 3Z" fill="#C8102E" />
      <path d="M5 3.2 L5.6 .8" stroke="#4F8A3A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 맵기 도장 「게이지 도장 + 고추 개수」 (슬랙 10-28 결정) — 지도 핀(components/map/stamps.ts)과 같은 모양.
// 숫자 없이 맵기만큼 아래에서 색이 차오르고, 아래 알약에 고추 n개.
export function SpiceStamp({ n, size = 28, faded = false, pill = true }: { n: Spice; size?: number; faded?: boolean; pill?: boolean }) {
  const pct = n * 20;
  const border = Math.max(1.5, size * 0.067);
  const pillH = Math.max(9, size * 0.3);
  return (
    <span
      className="inline-flex shrink-0 flex-col items-center"
      style={{ opacity: faded ? 0.45 : 1 }}
      title={`맵기 ${n} · ${SPICE_LEVELS[n].ref}`}
      aria-label={`맵기 ${n}`}
    >
      <span
        className="block rounded-[20%] shadow-[0_1px_2px_rgba(0,0,0,.2)]"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(to top, var(--s${n}) ${pct}%, var(--stampbg) ${pct}%)`,
          boxShadow: `inset 0 0 0 ${border}px var(--s${n})`,
          transform: "rotate(-3deg)",
        }}
      />
      {pill && (
        <span
          className="mt-[2px] inline-flex items-center gap-[1px] rounded-full border border-black/15 bg-card px-[3px]"
          style={{ height: pillH }}
        >
          {Array.from({ length: n }, (_, i) => (
            <Chili key={i} h={pillH - 2.5} />
          ))}
        </span>
      )}
    </span>
  );
}
