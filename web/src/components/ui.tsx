import Link from "next/link";
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
          className="mt-[2px] inline-flex items-center gap-[1px] rounded-full border border-black/15 bg-surface px-[3px]"
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

// 가게 평점(별 1~5) — 두 축 중 「가게」 축 (슬랙 10-28). 거지맵처럼 「★ 4.3 · 12개」.
export function Stars({ rating, size = 13 }: { rating?: { avg: number; count: number }; size?: number }) {
  if (!rating || !rating.count) return <span className="text-ink3" style={{ fontSize: size }}>평점 아직 없음</span>;
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-ink" style={{ fontSize: size }}>
      <span className="text-[#D98E04]">★</span>
      {rating.avg.toFixed(1)}
      <span className="font-normal text-ink3">· {rating.count}개</span>
    </span>
  );
}

export function Tag({ children, spicy = false }: { children: React.ReactNode; spicy?: boolean }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[12px] font-medium ${
        spicy ? "border-transparent bg-spicybg text-spicytext" : "border-chipline bg-chip text-ink2"
      }`}
    >
      {children}
    </span>
  );
}

export function SampleRibbon() {
  return (
    <div className="pointer-events-none rounded-full bg-ink/80 px-3 py-1 text-center text-[11px] font-medium text-paper">
      예시 데이터 · 실제 가게가 아니에요
    </div>
  );
}

// 아래 메뉴 셋 (보드 v3, 11-02 사용자 「내 맛지도까지는 있어야」). 떡볶이방은 2차라 아예 안 보인다.
const NAV = [
  { href: "/", label: "지도", key: "map" },
  { href: "/list", label: "목록", key: "list" },
  { href: "/mine", label: "내 맛지도", key: "mine" },
] as const;

export function BottomNav({ active }: { active: "map" | "list" | "mine" }) {
  return (
    <nav className="grid h-14 shrink-0 grid-cols-3 border-t border-line bg-bar pb-[env(safe-area-inset-bottom)] text-[12px]">
      {NAV.map((n) => (
        <Link
          key={n.key}
          href={n.href}
          className={`grid place-items-center font-semibold ${active === n.key ? "text-ink" : "text-ink3"}`}
          aria-current={active === n.key ? "page" : undefined}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export function BackHeader({ title, href = "/", right }: { title: string; href?: string; right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-line bg-bar px-2">
      <Link href={href} className="grid h-10 w-10 place-items-center rounded-full text-xl text-ink" aria-label="뒤로">
        ‹
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-[16px] font-bold">{title}</h1>
      {right}
    </header>
  );
}
