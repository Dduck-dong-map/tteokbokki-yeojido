import Link from "next/link";
import { SPICE_LEVELS, type Spice } from "@/lib/taxonomy";

// 맵기 도장 (지도 핀과 같은 모양을 카드·상세에서도 쓴다)
export function SpiceStamp({ n, size = 28, faded = false }: { n: Spice; size?: number; faded?: boolean }) {
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center rounded-[22%] font-extrabold leading-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.56,
        background: `var(--s${n})`,
        color: `var(--s${n}f)`,
        opacity: faded ? 0.45 : 1,
        transform: "rotate(-3deg)",
      }}
      title={`맵기 ${n} · ${SPICE_LEVELS[n].ref}`}
    >
      <span className="absolute inset-[12%] rounded-[14%] border-[1.5px]" style={{ borderColor: `var(--s${n}e)` }} />
      {n}
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

const NAV = [
  { href: "/", label: "지도", key: "map" },
  { href: "/list", label: "목록", key: "list" },
  { href: null, label: "떡볶이방", key: "bang" },
  { href: null, label: "내 떡지도", key: "mine" },
] as const;

export function BottomNav({ active }: { active: "map" | "list" }) {
  return (
    <nav className="grid h-14 shrink-0 grid-cols-4 border-t border-line bg-bar pb-[env(safe-area-inset-bottom)] text-[12px]">
      {NAV.map((n) =>
        n.href ? (
          <Link
            key={n.key}
            href={n.href}
            className={`grid place-items-center font-semibold ${active === n.key ? "text-ink" : "text-ink3"}`}
            aria-current={active === n.key ? "page" : undefined}
          >
            {n.label}
          </Link>
        ) : (
          <span key={n.key} className="grid place-items-center text-ink3/60" title="2차에 열어요">
            <span>
              {n.label}
              <span className="ml-0.5 align-top text-[9px]">2차</span>
            </span>
          </span>
        ),
      )}
    </nav>
  );
}

export function BackHeader({ title, href = "/" }: { title: string; href?: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-line bg-bar px-2">
      <Link href={href} className="grid h-10 w-10 place-items-center rounded-full text-xl text-ink" aria-label="뒤로">
        ‹
      </Link>
      <h1 className="truncate text-[16px] font-bold">{title}</h1>
    </header>
  );
}
