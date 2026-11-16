import Link from "next/link";
import { cn } from "@/lib/utils";
import { StoreCardBody } from "./StoreCardBody";
import type { StoreRowViewProps } from "./types";

// 지도 홈 목록 한 줄 (거지맵 목록 참고 · 슬랙 10-28).
// 줄 전체가 <button> — 폰은 지도 이동·선택, 다시 누르면 상세. 768 이상은 바로 상세(둘 다 컨테이너 onPick 이 정한다).
// 고른 줄은 폰에서만 「자세히 · 길찾기」 링크가 아래에 붙는다.
export default function StoreRowView({ store, me, now, selected, onPick }: StoreRowViewProps) {
  return (
    <li id={`row-${store.id}`} className={cn(selected && "bg-secondary shadow-[inset_3px_0_0_var(--primary)]")}>
      <button
        type="button"
        onClick={onPick}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex w-full min-h-11 gap-3 px-4 py-3 text-left outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:hover:bg-muted",
        )}
      >
        <StoreCardBody store={store} me={me} now={now} thumb />
      </button>

      {selected && (
        <div className="flex gap-2 px-4 pb-3 md:hidden">
          <Link href={`/store/${store.id}`} className="grid h-11 flex-1 place-items-center rounded-xl bg-primary text-[14px] font-bold text-primary-foreground">
            자세히 · 길찾기
          </Link>
        </div>
      )}
    </li>
  );
}
