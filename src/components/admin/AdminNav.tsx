"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "./Icon";

type MenuItem = { href: string; label: string; count?: number; spec?: string };
type Section = { key: string; href: string; label: string; icon: IconName; group: string; menu: MenuItem[]; bottom?: boolean };

// 화면 ID(M-AD-xx)는 기획 문서와 같다
export const SECTIONS: Section[] = [
  { key: "home", href: "/admin", label: "홈", icon: "grid", group: "홈", menu: [{ href: "/admin", label: "오늘 할 일" }] },
  {
    key: "reports", href: "/admin/reports", label: "제보", icon: "inbox", group: "제보 승인함",
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
    ],
  },
  {
    key: "check", href: "/admin/freshness", label: "점검", icon: "clock", group: "점검",
    menu: [
      { href: "/admin/freshness", label: "신선도 점검", count: 3 },
      { href: "/admin/candidates", label: "후보 가져오기", spec: "M4" },
    ],
  },
  { key: "flags", href: "/admin/flags", label: "신고", icon: "message", group: "신고·요청", menu: [{ href: "/admin/flags", label: "신고·요청", count: 3 }] },
  { key: "logs", href: "/admin/logs", label: "기록", icon: "list", group: "운영 기록", menu: [{ href: "/admin/logs", label: "운영 기록" }] },
  {
    key: "settings", href: "/admin/settings", label: "설정", icon: "settings", group: "설정", bottom: true,
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

  const rail = (s: Section) => (
    <Link key={s.key} href={s.href} className={`rail__item${s.key === active.key ? " is-active" : ""}`}>
      <Icon name={s.icon} />
      <span>{s.label}</span>
    </Link>
  );

  return (
    <>
      <nav className="rail" aria-label="운영 메뉴">
        {SECTIONS.filter((s) => !s.bottom).map(rail)}
        <div className="rail__spacer" />
        {SECTIONS.filter((s) => s.bottom).map(rail)}
      </nav>
      <nav className="sidemenu" aria-label={active.group}>
        <div className="sidemenu__group">
          <div className="sidemenu__grouptitle">{active.group}</div>
          {active.menu.map((m) => {
            const on = m.href.includes("?") ? here === m.href : here === m.href || (path === m.href && !q);
            return (
              <Link key={m.href} href={m.href} className={`menu-item${on ? " is-active" : ""}`}>
                <span className="menu-item__label">{m.label}</span>
                {m.count !== undefined && <span className="menu-item__count">{m.count}</span>}
                {m.spec && <span className="badge badge--outline">{m.spec}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
