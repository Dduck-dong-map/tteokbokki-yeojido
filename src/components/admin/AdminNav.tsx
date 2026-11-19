"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

type MenuItem = { href: string; label: string; count?: number; spec?: string };
type Section = { key: string; href: string; label: string; icon: IconName; group: string; menu: MenuItem[]; bottom?: boolean };

// 화면 ID(M-AD-xx)는 기획 문서와 같다. 시안이던 홈 · 제보 · 신고 · 설정 · 신선도 점검은 11-19 에 지웠다
export const SECTIONS: Section[] = [
  {
    key: "stores", href: "/admin/stores", label: "가게", icon: "map", group: "가게 관리",
    menu: [
      { href: "/admin/stores", label: "전체 가게" },
      { href: "/admin/stores?view=hidden", label: "내림·숨김" },
      { href: "/admin/stores/new", label: "직접 등록" },
    ],
  },
  { key: "check", href: "/admin/candidates", label: "후보", icon: "clock", group: "후보", menu: [{ href: "/admin/candidates", label: "후보 가져오기" }] },
  { key: "logs", href: "/admin/logs", label: "기록", icon: "list", group: "운영 기록", menu: [{ href: "/admin/logs", label: "운영 기록" }] },
];

function sectionOf(path: string) {
  return [...SECTIONS].sort((a, b) => b.href.length - a.href.length).find((s) => (s.href === "/admin" ? path === "/admin" : path.startsWith(s.href) || s.menu.some((m) => path.startsWith(m.href.split(/[?#]/)[0])))) ?? SECTIONS[0];
}

export default function AdminNav() {
  const path = usePathname();
  const q = useSearchParams().toString();
  const here = path + (q ? `?${q}` : "");
  const active = sectionOf(path);

  // 레일 칸: 뒤집힌 면 위. 고른 칸은 왼쪽 막대(뒤집힌 면용 행동색)로도 표시한다 (색만으로 구분하지 않게)
  const rail = (s: Section) => {
    const on = s.key === active.key;
    return (
      <Link
        key={s.key}
        href={s.href}
        aria-current={on ? "page" : undefined}
        className={cn(
          "relative flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 py-2 text-inverse-foreground transition-colors hover:bg-inverse-foreground/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-inverse-action",
          on && "bg-inverse-foreground/20 before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-sm before:bg-inverse-action",
        )}
      >
        <Icon name={s.icon} className="size-icon-sm" />
        <span className="text-caption">{s.label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="row-start-2 flex flex-col gap-1 overflow-y-auto bg-inverse py-2 print:hidden" aria-label="운영 메뉴">
        {SECTIONS.filter((s) => !s.bottom).map(rail)}
        <div className="flex-1" />
        {SECTIONS.filter((s) => s.bottom).map(rail)}
      </nav>
      <nav className="row-start-2 hidden flex-col overflow-y-auto border-r border-border bg-card py-1 lg:flex print:hidden" aria-label={active.group}>
        <div className="px-4 pt-2 pb-1 text-caption text-muted-foreground">{active.group}</div>
        {active.menu.map((m) => {
          const on = m.href.includes("?") ? here === m.href : here === m.href || (path === m.href && !q);
          return (
            <Link
              key={m.href}
              href={m.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-2 px-4 text-body-small text-foreground transition-colors hover:bg-ghost-hover active:bg-ghost-active",
                on && "bg-secondary font-medium text-secondary-foreground hover:bg-secondary-hover",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{m.label}</span>
              {m.count !== undefined && <span className="text-caption tabular-nums">{m.count}</span>}
              {m.spec && (
                <Badge variant="outline" className="rounded-badge border-input text-caption">
                  {m.spec}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
