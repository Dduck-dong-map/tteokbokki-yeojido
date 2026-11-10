"use client";

import type { FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import SearchBox from "./SearchBox";
import { NAV } from "@/components/layout";
import SiteHeaderView from "@/components/layout/SiteHeaderView";

// 틀: 현재 경로 → 활성 메뉴, 검색 제출 → 지도로.
// 768 이상에서만 보이는 위 헤더 (웹 1차 기획 3.2). 폰에서는 아래 메뉴(BottomNav)가 같은 일을 한다.
// 마크업은 SiteHeaderView 가 맡고, 여기서는 경로·라우터·matchMedia 만 다룬다.
export default function SiteHeader() {
  const path = usePathname();
  const router = useRouter();
  const onMap = path === "/" || /^\/store\/[^/]+$/.test(path);
  const active = NAV.find((n) => (n.href === "/" ? onMap : path.startsWith(n.href)))?.key;

  // 목록이 보이는 화면에서는 쓰는 대로 걸러지고, 목록이 없는 화면에서는 Enter 를 누르면 지도로 간다
  const onSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const listShown = path === "/" || (onMap && window.matchMedia("(min-width: 1280px)").matches);
    if (!listShown) router.push("/");
  };

  return <SiteHeaderView active={active} onSearchSubmit={onSearchSubmit} search={<SearchBox />} />;
}
