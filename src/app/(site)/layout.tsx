import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";

// 이용자 화면 전체의 틀: 768 이상에서는 위 헤더(로고 · 검색 · 메뉴 넷 · 맛집 등록), 그 아래는 각 화면.
// 어드민(/admin)은 이 틀 밖에 있다.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* 새로 등록한 가게 주소는 미리 그려 둘 수 없어 현재 주소를 읽는 헤더는 Suspense 안에 둔다 */}
      <Suspense fallback={<div className="hidden h-14 border-b border-border bg-background md:block" />}>
        <SiteHeader />
      </Suspense>
      {children}
    </>
  );
}
