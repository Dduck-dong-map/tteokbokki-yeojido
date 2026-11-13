import { Badge } from "@/components/ui/badge";
import { PendingTag, SpiceStamp, Stars, StoreThumb } from "@/components/brand";
import { distanceM, distanceText, won } from "@/lib/filters";
import { confirmedAgo, freshness } from "@/lib/freshness";
import { RICE_CAKES, SPICE_LEVELS, STYLES } from "@/lib/taxonomy";
import type { Store } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isPending } from "@/lib/wiki";
import type { LatLng } from "./types";

// 가게 카드 본문 — 지도 홈 목록 줄(StoreRowView)과 글 목록(StoreList)이 같이 쓴다.
// 정보 순서(기획 팀장 · 슬랙 10-28): 이름 → 위치(동·거리·확인 시점) → 떡볶이 종류 → 맵기 → 대표 가격.
// 상태·핸들러 없음. 값만 받아 그린다.
export type StoreCardBodyProps = {
  store: Store;
  now: Date;
  me?: LatLng | null; // 있으면 거리 표시
  thumb?: boolean; // 왼쪽 사진 자리
  tags?: boolean; // 스타일·떡을 「·」 글 대신 배지로
};

export function StoreCardBody({ store: s, now, me = null, thumb = false, tags = false }: StoreCardBodyProps) {
  const stale = freshness(s, now) === "stale";
  const rice = s.rice.map((r) => RICE_CAKES[r]);
  return (
    <>
      {thumb && <StoreThumb photo={s.photos?.[0]} />}

      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
          <span className="truncate">{s.name}</span>
          {isPending(s, now) && <PendingTag />}
        </h3>

        <p className="truncate text-[12px] text-muted-foreground/70">
          {s.dong}
          {me && <> · {distanceText(distanceM(me, s))}</>}
          <span className={cn(stale && "text-spicytext")}> · 확인 {confirmedAgo(s.lastConfirmedAt, now)}</span>
        </p>

        {tags ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="h-6 rounded-full px-2.5 text-[12px]">
              {STYLES[s.style]}
            </Badge>
            {rice.map((r) => (
              <Badge key={r} variant="outline" className="h-6 rounded-full px-2.5 text-[12px]">
                {r}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {STYLES[s.style]} · {rice.join("·")}
          </p>
        )}

        <p className="mt-1 flex items-center gap-2 text-[13px]">
          <Stars rating={s.rating} size={12} />
          {tags && <span className="text-muted-foreground/70">· 맵기 {SPICE_LEVELS[s.spice].ref.replace(" 정도", "")}</span>}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-between">
        <SpiceStamp n={s.spice} size={26} faded={stale} face />
        <div className="text-right">
          <b className="block text-[15px] leading-tight text-foreground">{won(s.price)}</b>
          {s.menu[0] && <span className="block max-w-[96px] truncate text-[11px] text-muted-foreground/70">{s.menu[0].name}</span>}
        </div>
      </div>
    </>
  );
}
