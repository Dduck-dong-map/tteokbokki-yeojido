import Link from "next/link";
import { Heart, Map as MapIcon, MessagesSquare, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, type NavKey } from "./nav";

// 메뉴 그림 (11-13 수정판, 게슈탈트 「친숙함」: 글자만 있으면 앱 탭으로 덜 읽힌다)
const ICON: Record<NavKey, LucideIcon> = { map: MapIcon, room: MessagesSquare, mine: Heart };

// 폰(< 768) 아래 메뉴. 활성 메뉴는 컨테이너(각 page)가 넘긴다. 칸 높이 56px 라 누르는 곳 44px 이상 (REQ-W10).
// 지금 있는 탭 = 옥빛 글자·그림 + 위쪽 옥빛 막대 (「선택됨」은 옥빛 한 가지, 11-13 수정판)
export function BottomNav({ active }: { active?: NavKey }) {
  return (
    <nav
      aria-label="메뉴"
      className="grid h-14 shrink-0 grid-cols-3 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] text-[12px] md:hidden"
    >
      {NAV.map((n) => {
        const isActive = active === n.key;
        const Icon = ICON[n.key];
        return (
          <Link
            key={n.key}
            href={n.href}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 font-semibold",
              isActive ? "text-primary before:absolute before:inset-x-7 before:top-0 before:h-[3px] before:rounded-b-full before:bg-primary" : "text-muted-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
