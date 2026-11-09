"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SearchBox from "./SearchBox";
import { Logo } from "@/components/brand";
import { NAV } from "@/components/layout";

// 768 이상에서만 보이는 위 헤더 (웹 1차 기획 3.2). 폰에서는 아래 메뉴(BottomNav)가 같은 일을 한다.
export default function SiteHeader() {
  const path = usePathname();
  const router = useRouter();
  const onMap = path === "/" || /^\/store\/[^/]+$/.test(path);
  const active = NAV.find((n) => (n.href === "/" ? onMap : path.startsWith(n.href)))?.key;

  return (
    <header className="sticky top-0 z-40 hidden h-14 items-center gap-3 border-b border-line bg-bar px-4 md:flex xl:gap-5 xl:px-5">
      <Link href="/" aria-label="떡볶여지도 첫 화면으로" className="shrink-0">
        <Logo />
      </Link>
      {/* 목록이 보이는 화면에서는 쓰는 대로 걸러지고, 목록이 없는 화면에서는 Enter 를 누르면 지도로 간다 */}
      <form
        role="search"
        className="min-w-0 max-w-[320px] flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          const listShown = path === "/" || (onMap && window.matchMedia("(min-width: 1280px)").matches);
          if (!listShown) router.push("/");
        }}
      >
        <SearchBox />
      </form>
      <nav aria-label="메뉴" className="ml-auto flex shrink-0 items-center gap-0.5 text-[14px]">
        {NAV.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            aria-current={active === n.key ? "page" : undefined}
            className={`rounded-lg px-2 py-1.5 whitespace-nowrap hover:bg-chip xl:px-3 ${active === n.key ? "font-bold text-ink" : "text-ink2"}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <Link href="/register" className="grid h-[38px] shrink-0 place-items-center rounded-xl bg-fab px-3 text-[14px] font-bold whitespace-nowrap text-onfab hover:opacity-90 xl:px-4">
        ＋ 맛집 등록
      </Link>
    </header>
  );
}
