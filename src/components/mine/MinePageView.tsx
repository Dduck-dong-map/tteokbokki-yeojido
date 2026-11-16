import { SampleRibbon } from "@/components/brand";
import { BottomNav } from "@/components/layout";
import ListInfoFormView from "@/components/lists/ListInfoFormView";
import { ListCard } from "@/components/lists/ListParts";
import { cn } from "@/lib/utils";
import MineEmpty from "./MineEmpty";
import MineReportsView from "./MineReportsView";
import MineSavedView from "./MineSavedView";
import type { ListSort, MinePageViewProps, MineTab } from "./types";

// 탭 넷 (11-08 사용자 지시): 내 리스트 · 모두의 리스트 · 찜한 가게 · 내 등록
const TABS: { key: MineTab; label: string }[] = [
  { key: "my", label: "내 리스트" },
  { key: "all", label: "모두의 리스트" },
  { key: "saved", label: "찜한 가게" },
  { key: "reports", label: "내 등록" },
];
const SORTS: { key: ListSort; label: string }[] = [
  { key: "likes", label: "추천순" },
  { key: "new", label: "최신순" },
];

// 리스트 카드 격자: 폰 한 줄 · 768 이상 2열 · 1280 이상 3열 (웹 1차 기획 3.2 「내 맛지도」 줄)
const CARD_GRID = "grid gap-3 md:grid-cols-2 xl:grid-cols-3";

// 내 맛지도 화면. 고른 탭·개수·리스트·찜·등록·오류·핸들러는 전부 컨테이너(MinePage)가 넘긴다.
// 탭은 shadcn Tabs 대신 칩 단추 + role="tablist" — 탭 상태와 주소(?tab=) 동기화를 컨테이너가 쥐고 있어서 상태 없는 단추가 맞는다(RoomBoardView 와 같은 모양).
export default function MinePageView(props: MinePageViewProps) {
  const { tab, counts, stores, myLists, ownedLoaded, publicLists, publicCount, sort, now, sample, creating, message, createForm, onTabChange, onSortChange, onCreatingChange } = props;
  return (
    <div className="page-wide">
      <header className="z-10 border-b border-border bg-background px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-1.5 max-md:sticky max-md:top-0 md:border-0 md:bg-transparent md:px-0 md:pt-5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="text-[18px] font-bold md:text-[20px]">내 맛지도</h1>
          <span className="text-[12px] text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">가게를 모아 리스트로 · 나누고 추천받기</span>
        </div>
        {/* 탭 줄: 단추는 36px 이지만 .hit 가 44px 로 넓힌다. 가로 스크롤 칸이 ::after 를 자르지 않게 위아래 6px 여백 */}
        <div className="mt-1.5 flex gap-1.5 overflow-x-auto py-1.5 [scrollbar-width:none]" role="tablist" aria-label="내 맛지도">
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onTabChange(t.key)}
                className={cn(
                  "hit h-9 shrink-0 rounded-full border px-3.5 text-[13px] whitespace-nowrap",
                  on ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-input bg-card text-muted-foreground hover:bg-muted",
                )}
              >
                {t.label} <span className="tabular-nums opacity-70">{counts[t.key]}</span>
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

      <main className="flex-1 px-4 pt-3 pb-6 md:px-0">
        {message && (
          <p role="alert" className="mb-3 rounded-xl bg-spicybg px-3 py-2 text-[13px] text-spicytext break-keep [overflow-wrap:anywhere]">
            {message}
          </p>
        )}

        {tab === "my" && (
          <section aria-label="내 리스트">
            {creating ? (
              <div className="md:max-w-[520px]">
                <ListInfoFormView {...createForm} />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onCreatingChange(true)}
                className={cn("grid h-12 w-full place-items-center rounded-xl border border-dashed border-input bg-card text-[14px] font-bold text-foreground hover:bg-muted md:max-w-[520px]")}
              >
                ＋ 새 리스트 만들기
              </button>
            )}
            {!ownedLoaded ? (
              <MineEmpty>내 리스트를 불러오는 중…</MineEmpty>
            ) : myLists.length ? (
              <ul className={cn("mt-4", CARD_GRID)}>
                {myLists.map((l) => (
                  <li key={l.id}>
                    <ListCard list={l} stores={stores} now={now} showVisibility />
                  </li>
                ))}
              </ul>
            ) : (
              <MineEmpty>
                아직 만든 리스트가 없어요.
                <br />
                리스트를 만들고 가게를 담으면, 링크로 나누거나 「모두의 리스트」에 올릴 수 있어요.
              </MineEmpty>
            )}
          </section>
        )}

        {tab === "all" && (
          <section aria-label="모두의 리스트">
            <div className="flex items-center justify-between text-[13px]">
              <b>공개된 리스트 {publicCount}개</b>
              <span className="flex gap-1">
                {SORTS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    aria-pressed={sort === o.key}
                    onClick={() => onSortChange(o.key)}
                    className={cn("hit h-7 rounded-full px-2.5 text-[12px] whitespace-nowrap", sort === o.key ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                  >
                    {o.label}
                  </button>
                ))}
              </span>
            </div>
            {publicLists.length ? (
              <ul className={cn("mt-2", CARD_GRID)}>
                {publicLists.map((l) => (
                  <li key={l.id}>
                    <ListCard list={l} stores={stores} now={now} />
                  </li>
                ))}
              </ul>
            ) : (
              <MineEmpty>아직 공개된 리스트가 없어요. 첫 리스트를 만들어 보세요!</MineEmpty>
            )}
          </section>
        )}

        {tab === "saved" && <MineSavedView {...props} />}

        {tab === "reports" && <MineReportsView reports={props.reports} now={now} />}
      </main>

      <div className="sticky bottom-0 md:hidden">
        <BottomNav active="mine" />
      </div>
    </div>
  );
}
