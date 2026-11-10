import Link from "next/link";
import { cn } from "@/lib/utils";
import { NAV, type NavKey } from "./nav";

// 폰(< 768) 아래 메뉴. 활성 메뉴는 컨테이너(각 page)가 넘긴다. 칸 높이 56px 라 누르는 곳 44px 이상 (REQ-W10).
export function BottomNav({ active }: { active?: NavKey }) {
  return (
    <nav
      aria-label="메뉴"
      className="grid h-14 shrink-0 grid-cols-3 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] text-[12px] md:hidden"
    >
      {NAV.map((n) => {
        const isActive = active === n.key;
        return (
          <Link
            key={n.key}
            href={n.href}
            className={cn("grid place-items-center font-semibold", isActive ? "text-foreground" : "text-muted-foreground")}
            aria-current={isActive ? "page" : undefined}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
