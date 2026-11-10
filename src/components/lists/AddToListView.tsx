import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_LIST_TITLE } from "@/lib/community";
import { cn } from "@/lib/utils";
import type { AddToListViewProps } from "./types";

// 가게 상세 「리스트에 담기」의 마크업. 접힌 상태 = 단추 하나, 펼친 상태 = 내 리스트 체크 목록 · 새 리스트 만들기 · 결과 문구 · 모두 보기.
// 열림·값·보내는 중과 모든 핸들러는 컨테이너(AddToList)가 넘긴다. fetch·refreshOwned 는 여기 없다. preventDefault 한 줄만 한다.
// 입력 글자는 폰에서 16px — 더 작으면 아이폰 사파리가 화면을 저절로 확대한다 (REQ-W09).
export default function AddToListView({ lists, loaded, open, title, busyId, message, count, has, onToggleOpen, onToggleList, onTitleChange, onCreate }: AddToListViewProps) {
  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={onToggleOpen}
        aria-expanded={open}
        className={cn("h-11 w-full gap-1.5 rounded-xl bg-card text-[14px] font-bold", count ? "border-primary text-primary" : "border-input text-foreground")}
      >
        {count ? `✓ 내 리스트 ${count}곳에 담김` : "＋ 내 리스트에 담기"}
      </Button>
      {open && (
        <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
          {!loaded ? (
            <p className="text-[13px] text-muted-foreground/70">내 리스트를 불러오는 중…</p>
          ) : lists.length ? (
            <ul className="flex flex-col gap-1">
              {lists.map((l) => {
                const on = has(l.id);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      disabled={busyId === l.id}
                      onClick={() => onToggleList(l.id)}
                      aria-pressed={on}
                      className={cn("flex h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-[14px] hover:bg-muted disabled:opacity-50")}
                    >
                      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded border text-[12px]", on ? "border-primary bg-primary text-primary-foreground" : "border-input")} aria-hidden="true">
                        {on ? "✓" : ""}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{l.title}</span>
                      <span className="shrink-0 text-[12px] text-muted-foreground/70">{l.storeIds.length}곳</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13px] text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">아직 만든 리스트가 없어요. 이 가게로 첫 리스트를 만들어 보세요.</p>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onCreate();
            }}
          >
            <Input
              id="new-list-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              maxLength={MAX_LIST_TITLE}
              placeholder="새 리스트 이름"
              aria-label="새 리스트 이름"
              className={cn("h-10 min-w-0 flex-1 rounded-lg bg-card px-3 text-[16px] md:text-[14px]")}
            />
            <Button type="submit" disabled={busyId === "new"} className={cn("h-10 shrink-0 rounded-lg px-3 text-[13px] font-bold")}>
              만들고 담기
            </Button>
          </form>
          {message && (
            <p role="status" className="text-[12px] text-muted-foreground/70">
              {message}
            </p>
          )}
          <Link href="/mine?tab=my" className="hit self-end text-[12px] text-muted-foreground/70 underline underline-offset-2">
            내 리스트 모두 보기
          </Link>
        </div>
      )}
    </div>
  );
}
