import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_LIST_TITLE } from "@/lib/community";
import { cn } from "@/lib/utils";
import type { AddToListViewProps } from "./types";

// 가게 상세 「리스트에 담기」의 마크업. 접힌 상태 = 단추 하나, 펼친 상태 = 내 리스트 체크 목록 · 새 리스트 만들기 · 결과 문구 · 모두 보기.
// 열림·값·보내는 중과 모든 핸들러는 컨테이너(AddToList)가 넘긴다. fetch·refreshOwned 는 여기 없다. preventDefault 한 줄만 한다.
// 새 리스트 이름 칸은 디자인 시스템 칸(variant="field" · 56px · 18px) — 16px 보다 커서 아이폰 사파리가 화면을 확대하지 않는다 (REQ-W09).
// 가게 상세의 주 행동(filled)은 길찾기라 「만들고 담기」는 두 번째 행동(tonal)이다. 리스트 줄은 체크 상자가 든 전체 폭 줄이라 Chip·Button 이 아니다.
export default function AddToListView({ lists, loaded, open, title, busyId, message, count, has, onToggleOpen, onToggleList, onTitleChange, onCreate }: AddToListViewProps) {
  return (
    <div>
      <Button
        type="button"
        variant="outlined"
        size="md"
        onClick={onToggleOpen}
        aria-expanded={open}
        // 기호를 lucide 아이콘으로 바꿨어도 접근성 이름은 예전 글자 그대로 둔다(E2E 가 「내 리스트에 담기」로 찾는다)
        aria-label={count ? `✓ 내 리스트 ${count}곳에 담김` : "＋ 내 리스트에 담기"}
        className={cn("w-full min-w-0 px-3", count > 0 && "border-primary text-primary")}
      >
        {count ? <Check className="size-5" strokeWidth={2} aria-hidden="true" /> : <Plus className="size-5" strokeWidth={2} aria-hidden="true" />}
        {count ? `내 리스트 ${count}곳에 담김` : "내 리스트에 담기"}
      </Button>
      {open && (
        <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
          {!loaded ? (
            <p className="text-body-small text-muted-foreground/70">내 리스트를 불러오는 중…</p>
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
                      className="flex h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-body-small hover:bg-ghost-hover disabled:opacity-50"
                    >
                      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded border", on ? "border-primary bg-primary text-primary-foreground" : "border-input")} aria-hidden="true">
                        {on && <Check className="size-4" strokeWidth={2} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{l.title}</span>
                      <span className="shrink-0 text-caption text-muted-foreground/70">{l.storeIds.length}곳</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-body-small text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">아직 만든 리스트가 없어요. 이 가게로 첫 리스트를 만들어 보세요.</p>
          )}
          <form
            className="flex flex-wrap items-center justify-end gap-2"
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
              variant="field"
              className="min-w-40 flex-1"
            />
            <Button type="submit" variant="tonal" size="md" disabled={busyId === "new"}>
              만들고 담기
            </Button>
          </form>
          {message && (
            <p role="status" className="text-body-small text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">
              {message}
            </p>
          )}
          <Link href="/mine?tab=my" className="hit self-end text-caption text-muted-foreground/70 underline underline-offset-2">
            내 리스트 모두 보기
          </Link>
        </div>
      )}
    </div>
  );
}
