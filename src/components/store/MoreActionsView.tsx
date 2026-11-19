import Link from "next/link";
import { FLAG_REASONS, type FlagReason } from "@/lib/wiki";
import { cn } from "@/lib/utils";
import type { MoreActionsViewProps } from "./types";

// 상세 맨 아래 「함께 고치기」 넷: 정보 고치기 · 변경 이력 · 공유 · 신고. 신고를 펼치면 이유 목록이 아래 열린다.
// navigator.share·clipboard·fetch·router.refresh 는 컨테이너(MoreActions)가 맡는다.
// 네 칸은 폭이 좁아(390 에서 칸마다 약 85px) 글자가 두 줄로 접힐 수 있어야 해서 Button(한 줄 알약) 대신 칸 모양을 그대로 둔다.
const CELL = "grid h-11 place-items-center rounded-xl border border-input bg-card px-1 text-center text-caption leading-tight text-muted-foreground break-keep [overflow-wrap:anywhere] hover:bg-ghost-hover";

export default function MoreActionsView({ storeId, flagOpen, message, onShare, onToggleFlag, onFlag }: MoreActionsViewProps) {
  return (
    <section>
      <div className="grid grid-cols-4 gap-1.5">
        <Link href={`/store/${storeId}/edit`} className={cn(CELL, "font-bold text-foreground")}>
          정보 고치기
        </Link>
        <Link href={`/store/${storeId}/history`} className={cn(CELL)}>
          변경 이력
        </Link>
        <button type="button" onClick={onShare} className={cn(CELL)}>
          공유
        </button>
        <button type="button" onClick={onToggleFlag} aria-expanded={flagOpen} className={cn(CELL)}>
          신고
        </button>
      </div>
      {flagOpen && (
        <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-card">
          {(Object.keys(FLAG_REASONS) as FlagReason[]).map((r) => (
            <li key={r}>
              <button type="button" onClick={() => onFlag(r)} className="min-h-11 w-full px-3 text-left text-body-small break-keep [overflow-wrap:anywhere] hover:bg-ghost-hover">
                {FLAG_REASONS[r]}
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-2 text-center text-body-small text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">{message}</p>}
    </section>
  );
}
