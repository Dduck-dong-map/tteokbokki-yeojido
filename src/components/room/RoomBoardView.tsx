import Link from "next/link";
import { SampleRibbon } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { BOARD_CATS, timeAgo, type BoardCat } from "@/lib/community";
import { cn } from "@/lib/utils";
import type { BoardCatFilter, RoomBoardViewProps } from "./types";

// 말머리 탭 순서: 「전체」 + BOARD_CATS(자유 · 맛집 추천 · 같이 가요). 거르기는 컨테이너가 하고 여기는 켜진 탭만 그린다.
const CATS: [BoardCatFilter, string][] = [["all", "전체"], ...(Object.entries(BOARD_CATS) as [BoardCat, string][])];

// 떡볶이방 글 목록. 줄 하나 = 말머리 · 제목 · [댓글 수] / 닉네임 · 시각 · 👍 · 📍가게.
// 폰은 위에 붙는 머리칸 + 좌우 꽉 찬 줄 목록, 768 이상은 둥근 카드 한 장 (웹 1차 기획 3.2 「목록」 줄).
// 상태(고른 말머리)·거르기·fetch 는 전부 컨테이너(RoomBoard)가 한다.
export default function RoomBoardView({ posts, cat, storeNames, now, sample, onCatChange }: RoomBoardViewProps) {
  return (
    <>
      <header className="z-10 border-b border-border bg-background px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-1.5 max-md:sticky max-md:top-0 md:border-0 md:bg-transparent md:px-0 md:pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[18px] font-bold md:text-[20px]">떡볶이방</h1>
            <p className="mt-0.5 text-[12px] text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">떡볶이 이야기 나누는 곳 · 가입 없이 닉네임으로</p>
          </div>
          <Link
            href="/room/write"
            className={cn("grid h-11 shrink-0 place-items-center rounded-xl bg-primary px-4 text-[14px] font-bold text-primary-foreground hover:bg-primary/80 md:h-10")}
          >
            글쓰기
          </Link>
        </div>
        {/* 탭 줄: 단추는 32px 이지만 .hit 가 44px 로 넓힌다. 가로 스크롤 칸이 ::after 를 자르지 않게 위아래 6px 여백 */}
        <div role="tablist" aria-label="말머리" className="mt-1.5 flex gap-1.5 overflow-x-auto py-1.5 [scrollbar-width:none]">
          {CATS.map(([key, label]) => {
            const on = cat === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onCatChange(key)}
                className={cn(
                  "hit h-8 shrink-0 rounded-full border px-3 text-[13px] whitespace-nowrap",
                  on ? "border-foreground bg-foreground font-semibold text-background" : "border-input bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </header>

      {sample && (
        <div className="flex justify-center pt-3">
          <SampleRibbon />
        </div>
      )}

      <main className="flex-1 pb-6">
        {posts.length ? (
          <ul className="divide-y divide-border md:mt-2 md:rounded-2xl md:border md:border-border md:bg-card">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/room/${p.id}`} className="block min-h-11 px-4 py-3.5 hover:bg-muted">
                  <p className="flex items-center gap-1.5">
                    <Badge variant="outline" className="shrink-0 rounded-md border-input px-1.5 text-[11px] font-normal text-muted-foreground">
                      {BOARD_CATS[p.cat]}
                    </Badge>
                    <span className="min-w-0 truncate text-[15px] font-semibold text-foreground">{p.title}</span>
                    {p.comments > 0 && <span className="shrink-0 text-[13px] font-bold text-link">[{p.comments}]</span>}
                  </p>
                  <p className="mt-1 truncate text-[12px] text-muted-foreground/70">
                    {p.who} · {timeAgo(p.at, now)}
                    {p.likes > 0 && <> · 👍 {p.likes}</>}
                    {p.storeId && storeNames[p.storeId] && <> · 📍 {storeNames[p.storeId]}</>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-16 px-4 text-center">
            <p className="text-[13px] leading-relaxed text-muted-foreground/70">아직 글이 없어요.</p>
            <Link href="/room/write" className="hit mt-3 inline-block text-[13px] font-semibold text-foreground underline underline-offset-4">
              첫 글 쓰기
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
