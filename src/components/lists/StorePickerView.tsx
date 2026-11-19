import { Input } from "@/components/ui/input";
import type { StorePickerViewProps } from "./types";

// 가게 이름·동네로 찾아 고르기의 마크업. 검색 입력칸 + 결과 줄(최대 8, 거르기는 컨테이너 StorePicker 가 한다).
// 검색 칸은 디자인 시스템 칸(variant="field" · 56px · 18px) — 16px 보다 커서 아이폰 사파리가 화면을 확대하지 않는다 (REQ-W09).
// 결과 줄은 왼쪽 정렬 목록 줄이라 Button 이 아니다.
export default function StorePickerView({ query, hits, placeholder = "가게 이름이나 동네로 찾기", autoFocus = false, onQueryChange, onPick }: StorePickerViewProps) {
  return (
    <div>
      <Input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        variant="field"
      />
      {query.trim() && (
        <ul className="mt-1.5 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {hits.length ? (
            hits.map((s) => (
              <li key={s.id}>
                {/* eslint-disable-next-line no-restricted-syntax -- 찾은 가게 목록의 줄 전체가 단추 */}
                <button type="button" onClick={() => onPick(s.id)} className="flex h-11 w-full items-center gap-2 px-3 text-left text-body-small hover:bg-ghost-hover">
                  <span className="min-w-0 flex-1 truncate font-semibold">{s.name}</span>
                  <span className="shrink-0 text-caption text-muted-foreground/70">{s.dong}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-body-small text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">찾는 가게가 없어요. 지도에 없는 집이면 먼저 등록해 주세요.</li>
          )}
        </ul>
      )}
    </div>
  );
}
