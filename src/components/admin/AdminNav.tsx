"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

// mock = 시안 화면(예시 데이터로만 움직이고 눌러도 저장되지 않는다). 배포(운영 모드)에서는 메뉴에 내지 않는다 (11-19 결정, PRD 12절 5번).
// 주소로 직접 열면 화면은 그대로 열린다 — 메뉴에서만 뺀다
type MenuItem = { href: string; label: string; count?: number; spec?: string; mock?: boolean };
type Section = { key: string; href: string; label: string; icon: IconName; group: string; menu: MenuItem[]; bottom?: boolean; mock?: boolean };
const HIDE_MOCK = process.env.NODE_ENV === "production";

// 화면 ID(M-AD-xx)는 기획 문서와 같다
export const SECTIONS: Section[] = [
  { key: "home", href: "/admin", label: "홈", icon: "grid", group: "홈", mock: true, menu: [{ href: "/admin", label: "오늘 할 일" }] },
  {
    key: "reports", href: "/admin/reports", label: "제보", icon: "inbox", group: "제보 승인함", mock: true,
    menu: [
      { href: "/admin/reports", label: "승인 대기", count: 5 },
      { href: "/admin/reports?tab=agree", label: "동의 대기 (자동 반영)", count: 2 },
      { href: "/admin/reports?tab=done", label: "처리 완료" },
    ],
  },
  {
    key: "stores", href: "/admin/stores", label: "가게", icon: "map", group: "가게 관리",
    menu: [
      { href: "/admin/stores", label: "전체 가게" },
      { href: "/admin/stores?view=hidden", label: "내림·숨김" },
      { href: "/admin/stores/new", label: "직접 등록" },
    ],
  },
  {
    key: "check", href: "/admin/freshness", label: "점검", icon: "clock", group: "점검",
    menu: [
      { href: "/admin/freshness", label: "신선도 점검", count: 3, mock: true },
      { href: "/admin/candidates", label: "후보 가져오기" },
    ],
  },
  { key: "flags", href: "/admin/flags", label: "신고", icon: "message", group: "신고·요청", mock: true, menu: [{ href: "/admin/flags", label: "신고·요청", count: 3 }] },
  { key: "logs", href: "/admin/logs", label: "기록", icon: "list", group: "운영 기록", menu: [{ href: "/admin/logs", label: "운영 기록" }] },
  {
    key: "settings", href: "/admin/settings", label: "설정", icon: "settings", group: "설정", bottom: true, mock: true,
    menu: [
      { href: "/admin/settings#staff", label: "운영자·권한" },
      { href: "/admin/settings#rules", label: "운영 규칙" },
      { href: "/admin/settings#blocks", label: "차단 기기" },
    ],
  },
];

function sectionOf(path: string) {
  return [...SECTIONS].sort((a, b) => b.href.length - a.href.length).find((s) => (s.href === "/admin" ? path === "/admin" : path.startsWith(s.href) || s.menu.some((m) => path.startsWith(m.href.split(/[?#]/)[0])))) ?? SECTIONS[0];
}

export default function AdminNav() {
  const path = usePathname();
  const q = useSearchParams().toString();
  const here = path + (q ? `?${q}` : "");
  const active = sectionOf(path);
  const shown = (m: { mock?: boolean }) => !HIDE_MOCK || !m.mock;
  const sections = SECTIONS.filter(shown);

  // 레일 칸: 뒤집힌 면 위. 고른 칸은 왼쪽 막대(뒤집힌 면용 행동색)로도 표시한다 (색만으로 구분하지 않게)
  const rail = (s: Section) => {
    const on = s.key === active.key;
    return (
      <Link
        key={s.key}
        // 묶음의 첫 화면이 시안이면(점검 → 신선도 점검) 보이는 첫 메뉴로 간다
        href={s.menu.filter(shown).some((m) => m.href === s.href) ? s.href : (s.menu.find(shown)?.href ?? s.href)}
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
        {sections.filter((s) => !s.bottom).map(rail)}
        <div className="flex-1" />
        {sections.filter((s) => s.bottom).map(rail)}
      </nav>
      <nav className="row-start-2 hidden flex-col overflow-y-auto border-r border-border bg-card py-1 lg:flex print:hidden" aria-label={active.group}>
        <div className="px-4 pt-2 pb-1 text-caption text-muted-foreground">{active.group}</div>
        {active.menu.filter(shown).map((m) => {
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
