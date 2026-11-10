import { SampleRibbon } from "@/components/brand";
import TteokMap from "@/components/map/TteokMap";
import { Button } from "@/components/ui/button";
import { LIST_VISIBILITY, MAX_LIST_STORES, timeAgo } from "@/lib/community";
import { cn } from "@/lib/utils";
import ListInfoFormView from "./ListInfoFormView";
import { LikeButton, ShareListButton } from "./ListParts";
import ListStoreRowsView from "./ListStoreRowsView";
import StorePicker from "./StorePicker";
import type { ListPanelViewProps } from "./types";

// 맛집 리스트 하나의 마크업 (리팩토링 계획 ⑧). 폰 = 한 줄, 768 이상 = 왼쪽 내용 + 오른쪽 고정 지도 (웹 1차 기획 3.2 「내 맛지도」 줄).
// 머리(이름·설명·누가·추천·공유·고치기 또는 ListInfoFormView) · 폰 지도 · 오류 · 가게 줄(ListStoreRowsView) · 가게 넣기(StorePicker) · 리스트 지우기 · PC 큰 지도.
// 상태·fetch·router·화면 폭·scrollIntoView 는 전부 컨테이너(ListPanel)가 넘긴다. 지도는 화면 폭에 맞는 한 곳에만 그린다(wide 로 판단).
export default function ListPanelView({
  list, stores, pick, now, mine, wide, selectedId, editing, askDelete, message, start, focus, inList, info,
  onSelect, onEditStart, onRemove, onMove, onAdd, onAskDelete, onDelete,
}: ListPanelViewProps) {
  return (
    <main className="flex-1 pb-10 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,440px)] md:gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
      <div className="flex min-w-0 flex-col gap-4 px-4 pt-3 md:px-0">
        {list.isSample && (
          <div className="flex justify-center">
            <SampleRibbon />
          </div>
        )}

        {/* 머리: 이름 · 설명 · 누가 · 추천 · 공유 (고치는 중이면 폼) */}
        {editing ? (
          <ListInfoFormView {...info} />
        ) : (
          <header className="flex flex-col gap-2">
            <h1 className="text-[22px] leading-snug font-bold text-balance break-keep [overflow-wrap:anywhere]">{list.title}</h1>
            {list.desc && <p className="text-[14px] leading-relaxed whitespace-pre-line text-muted-foreground break-keep [overflow-wrap:anywhere]">{list.desc}</p>}
            <p className="text-[12px] text-muted-foreground/70">
              {list.who} 님의 리스트 · {stores.length}곳 · {timeAgo(list.updatedAt, now)} 고침
              {list.visibility === "link" && <> · 🔗 {LIST_VISIBILITY.link}</>}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <LikeButton id={list.id} likes={list.likes} />
              <ShareListButton title={list.title} />
              {mine && (
                <Button type="button" variant="outline" onClick={onEditStart} className={cn("h-10 rounded-xl border-input bg-card px-3.5 text-[14px] font-bold text-foreground")}>
                  이름·설명 고치기
                </Button>
              )}
            </div>
          </header>
        )}

        {/* 폰: 지도는 가게 줄 위에 */}
        {stores.length > 0 && !wide && (
          <div className="relative h-[240px] overflow-hidden rounded-[14px] border border-border bg-background md:hidden">
            <TteokMap stores={stores} selectedId={selectedId} onSelect={onSelect} me={null} focus={focus} start={start} showName />
          </div>
        )}

        {message && (
          <p role="alert" className="rounded-xl bg-spicybg px-3 py-2 text-[13px] text-spicytext">
            {message}
          </p>
        )}

        <ListStoreRowsView stores={stores} mine={mine} selectedId={selectedId} onSelect={onSelect} onMove={onMove} onRemove={onRemove} />

        {/* 만든 기기: 가게 넣기 · 리스트 지우기 */}
        {mine && (
          <section className="flex flex-col gap-2">
            <h2 className="text-[14px] font-bold">
              가게 넣기{" "}
              <span className="font-normal text-muted-foreground/70">
                ({stores.length}/{MAX_LIST_STORES})
              </span>
            </h2>
            <StorePicker stores={pick} exclude={inList} onPick={onAdd} />
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 text-[13px]">
              {askDelete ? (
                <>
                  <span className="text-muted-foreground break-keep [overflow-wrap:anywhere]">이 리스트를 지울까요? 받은 추천도 함께 사라져요.</span>
                  <button type="button" onClick={onDelete} className={cn("hit h-8 rounded-lg bg-spicybg px-3 font-semibold text-spicytext")}>
                    지우기
                  </button>
                  <Button type="button" variant="outline" onClick={() => onAskDelete(false)} className={cn("hit h-8 rounded-lg border-input bg-card px-3 text-[13px] font-normal text-muted-foreground")}>
                    그만두기
                  </Button>
                </>
              ) : (
                <button type="button" onClick={() => onAskDelete(true)} className="hit text-muted-foreground/70 underline underline-offset-2">
                  리스트 지우기
                </button>
              )}
            </div>
          </section>
        )}
      </div>

      {/* PC: 오른쪽 큰 지도 (머리 72px 아래 고정) */}
      <aside className="hidden md:block">
        <div className="sticky top-[72px] h-[calc(100dvh-104px)] min-h-[360px] overflow-hidden rounded-2xl border border-border bg-background">
          {stores.length ? (
            wide && <TteokMap stores={stores} selectedId={selectedId} onSelect={onSelect} me={null} focus={focus} start={start} showName />
          ) : (
            <p className="grid h-full place-items-center text-[13px] text-muted-foreground/70">가게를 넣으면 지도에 도장이 찍혀요</p>
          )}
        </div>
      </aside>
    </main>
  );
}
