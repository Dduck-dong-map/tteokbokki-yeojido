import Link from "next/link";
import { GRID_LI, GRID_UL } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { confirmedAgo } from "@/lib/freshness";
import type { MyReport } from "@/lib/mine";
import { cn } from "@/lib/utils";
import MineEmpty from "./MineEmpty";
import type { MinePageViewProps } from "./types";

// 「내 등록」 탭 — MinePageView 계약에서 이 탭에 필요한 것만 잘라 받는다.
type MineReportsViewProps = Pick<MinePageViewProps, "reports" | "now">;

// 등록 종류 배지 문구 (REQ-W12: 「제보」가 아니라 「등록」)
const KIND: Record<MyReport["kind"], string> = { new: "새 가게", edit: "정보 수정", closed: "문 닫음" };

// 배지 글자 크기에 `!` 를 붙인 까닭: ui/badge 는 기본 cn 을 써서 `text-caption` 을 글자색으로 보고 지운다(brand/Tag 와 같은 사정).
// 내가 올린 등록·수정 줄 목록. 가게 id 가 있으면 상세로 가는 링크, 없으면(아직 가게가 안 생긴 등록) 글자만.
export default function MineReportsView({ reports, now }: MineReportsViewProps) {
  return (
    <section aria-label="내 등록">
      <div className="flex items-center justify-between gap-2 text-caption">
        <b>내가 올린 등록·수정 {reports.length}건</b>
        <span className="text-muted-foreground/70">최근순</span>
      </div>

      {reports.length ? (
        <ul className={cn("mt-1", GRID_UL)}>
          {reports.map((r, i) => {
            const inner = (
              <>
                <Badge variant="outline" className="shrink-0 rounded-full border-transparent bg-muted px-2 text-caption font-normal text-muted-foreground">
                  {KIND[r.kind]}
                </Badge>
                <span className="min-w-0 flex-1 truncate text-body-small font-semibold text-foreground">{r.name}</span>
                <span className="shrink-0 text-caption text-muted-foreground/70">{confirmedAgo(r.at, now)}</span>
              </>
            );
            return (
              <li key={i} className={cn("py-3 md:p-3", GRID_LI)}>
                {r.storeId ? (
                  <Link href={`/store/${r.storeId}`} className="flex min-h-11 items-center gap-2 md:min-h-0">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex min-h-11 items-center gap-2 md:min-h-0">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <MineEmpty>
          아직 올린 가게가 없어요.
          <br />
          <Link href="/register" className="hit mt-3 inline-block font-semibold text-foreground underline underline-offset-4">
            맛집 등록하기
          </Link>
        </MineEmpty>
      )}

      <p className="mt-6 text-center text-caption text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">등록은 바로 지도에 올라가요 · 이 기기에서 올린 것만 보여요</p>
    </section>
  );
}
