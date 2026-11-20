import { MapPin, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { BOARD_CATS, timeAgo, type BoardCat } from "@/lib/community";
import { cn } from "@/lib/utils";
import type { BoardCatFilter, RoomBoardViewProps } from "./types";

// 말머리 탭 순서: 「전체」 + BOARD_CATS(자유 · 맛집 추천 · 같이 가요). 거르기는 컨테이너가 하고 여기는 켜진 탭만 그린다.
const CATS: [BoardCatFilter, string][] = [["all", "전체"], ...(Object.entries(BOARD_CATS) as [BoardCat, string][])];

// 떡볶이방 글 목록. 줄 하나 = 말머리 · 제목 · [댓글 수] / 닉네임 · 시각 · 👍 · 📍가게.
// 폰은 위에 붙는 머리칸 + 좌우 꽉 찬 줄 목록, 768 이상은 둥근 카드 한 장 (웹 1차 기획 3.2 「목록」 줄).
// 상태(고른 말머리)·거르기·fetch 는 전부 컨테이너(RoomBoard)가 한다.
export default function RoomBoardView({ posts, cat, storeNames, now, onCatChange }: RoomBoardViewProps) {
  return (
    <>
      <header className="z-10 border-b border-border bg-background px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-1.5 max-md:sticky max-md:top-0 md:border-0 md:bg-transparent md:px-0 md:pt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-heading-4">떡볶이방</h1>
            <p className="mt-0.5 text-body-small text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">떡볶이 이야기 나누는 곳 · 가입 없이 닉네임으로</p>
          </div>
          <Link href="/room/write" className={cn(buttonVariants({ variant: "filled", size: "md" }), "px-5")}>
            글쓰기
          </Link>
        </div>
        {/* 탭 줄: 칩은 32px 이지만 .hit-target 이 48px 로 넓힌다. 가로 스크롤 칸이 ::after 를 자르지 않게 위아래 8px 여백.
            aria-selected 는 Chip 이 role="tab" 을 보고 붙인다. 누를 때마다 그 말머리를 알린다 */}
        <div role="tablist" aria-label="말머리" className="mt-1 flex gap-2 overflow-x-auto py-2 [scrollbar-width:none]">
          {CATS.map(([key, label]) => (
            <Chip key={key} role="tab" shape="pill" selected={cat === key} onClick={() => onCatChange(key)}>
              {label}
            </Chip>
          ))}
        </div>
      </header>

      <main className="flex-1 pb-6">
        {posts.length ? (
          <ul className="divide-y divide-border md:mt-2 md:rounded-2xl md:border md:border-border md:bg-card">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/room/${p.id}`} className="block min-h-11 px-4 py-3.5 hover:bg-muted">
                  <p className="flex items-center gap-1.5">
                    <Badge variant="outline" className="shrink-0 rounded-full border-transparent bg-muted px-2 text-caption font-normal text-muted-foreground">
                      {BOARD_CATS[p.cat]}
                    </Badge>
                    <span className="min-w-0 truncate text-body-medium font-semibold text-foreground">{p.title}</span>
                    {p.comments > 0 && <span className="shrink-0 text-caption font-bold text-link">[{p.comments}]</span>}
                  </p>
                  <p className="mt-1 truncate text-caption text-muted-foreground/70">
                    {p.who} · {timeAgo(p.at, now)}
                    {/* 아이콘은 그림만, 읽는 글은 예전 그대로(👍 · 📍) 남긴다 */}
                    {p.likes > 0 && (
                      <>
                        {" · "}
                        <ThumbsUp className="inline size-4 align-[-3px]" strokeWidth={2} aria-hidden="true" />
                        <span className="sr-only">👍</span> {p.likes}
                      </>
                    )}
                    {p.storeId && storeNames[p.storeId] && (
                      <>
                        {" · "}
                        <MapPin className="inline size-4 align-[-3px]" strokeWidth={2} aria-hidden="true" />
                        <span className="sr-only">📍</span> {storeNames[p.storeId]}
                      </>
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-16 px-4 text-center">
            <p className="text-body-small text-muted-foreground/70">아직 글이 없어요.</p>
            <Link href="/room/write" className="hit mt-3 inline-block text-body-small font-semibold text-foreground underline underline-offset-4">
              첫 글 쓰기
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
