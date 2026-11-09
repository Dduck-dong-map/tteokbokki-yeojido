import Link from "next/link";
import { NAV, type NavKey } from "./nav";

export function BottomNav({ active }: { active?: NavKey }) {
  return (
    <nav aria-label="메뉴" className="grid h-14 shrink-0 grid-cols-3 border-t border-line bg-bar pb-[env(safe-area-inset-bottom)] text-[12px] md:hidden">
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
