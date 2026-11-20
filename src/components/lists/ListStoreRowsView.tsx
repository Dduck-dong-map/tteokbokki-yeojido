import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { SpiceStamp } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { won } from "@/lib/filters";
import { RICE_CAKES, STYLES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import type { ListPanelViewProps } from "./types";

// 리스트에 담긴 가게 줄 — 번호 = 리스트 순서. 내 리스트면 ↑↓·빼기가 붙는다. 비어 있으면 안내 한 줄.
// ListPanelView 에서 떼어 낸 섹션 View. props 는 ListPanelViewProps 의 부분집합(계약에서 파생, 새 계약 아님).
// 줄의 id(`row-${id}`)는 컨테이너가 scrollIntoView 로 찾는 손잡이다 — 바꾸지 않는다.
export type ListStoreRowsViewProps = Pick<ListPanelViewProps, "stores" | "mine" | "selectedId" | "onSelect" | "onMove" | "onRemove">;

// ↑↓ 단추: 줄이 좁아(390 에서 가게 이름 자리 확보) 보이는 크기는 32px, 누르는 범위는 .hit-target 이 48px 로 넓힌다
const MOVE = "size-8 text-muted-foreground";

export default function ListStoreRowsView({ stores, mine, selectedId, onSelect, onMove, onRemove }: ListStoreRowsViewProps) {
  if (!stores.length)
    return (
      <p className="rounded-xl border border-dashed border-input px-4 py-8 text-center text-body-small text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">
        아직 담긴 가게가 없어요.
        {mine ? <> 아래에서 가게를 찾아 넣거나, 가게 화면의 「리스트에 담기」를 눌러 주세요.</> : null}
      </p>
    );

  return (
    <ol className="divide-y divide-border border-y border-border">
      {stores.map((s, i) => (
        <li key={s.id} id={`row-${s.id}`} className={cn("flex items-center gap-3 py-3", selectedId === s.id && "bg-muted")}>
          <span className="w-6 shrink-0 text-center font-serif text-body-large text-primary">{i + 1}</span>
          <Link href={`/store/${s.id}`} onMouseEnter={() => onSelect(s.id)} className="flex min-w-0 flex-1 items-center gap-3">
            <SpiceStamp n={s.spice} size={28} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body-medium font-bold">{s.name}</span>
              <span className="block truncate text-caption text-muted-foreground/70">
                {s.dong} · {STYLES[s.style]} · {s.rice.map((r) => RICE_CAKES[r]).join("·")}
              </span>
            </span>
            <b className="shrink-0 text-caption">{won(s.price)}</b>
          </Link>
          {mine && (
            <span className="flex shrink-0 items-center gap-0.5">
              <Button type="button" variant="text" size="icon-md" aria-label={`${s.name} 위로`} disabled={i === 0} onClick={() => onMove(s.id, -1)} className={MOVE}>
                <ArrowUp className="size-5" aria-hidden="true" />
              </Button>
              <Button type="button" variant="text" size="icon-md" aria-label={`${s.name} 아래로`} disabled={i === stores.length - 1} onClick={() => onMove(s.id, 1)} className={MOVE}>
                <ArrowDown className="size-5" aria-hidden="true" />
              </Button>
              <Button type="button" variant="text" size="compact" aria-label={`${s.name} 리스트에서 빼기`} onClick={() => onRemove(s.id)} className="px-2">
                빼기
              </Button>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
