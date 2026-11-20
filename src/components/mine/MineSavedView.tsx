import { Heart } from "lucide-react";
import Link from "next/link";
import { SpiceStamp } from "@/components/brand";
import { GRID_LI, GRID_UL } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { distanceM, distanceText } from "@/lib/filters";
import { confirmedAgo, freshness } from "@/lib/freshness";
import { RICE_CAKES, STYLES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import MineEmpty from "./MineEmpty";
import type { MinePageViewProps } from "./types";

// 「찜한 가게」 탭 — MinePageView 계약에서 이 탭에 필요한 것만 잘라 받는다.
type MineSavedViewProps = Pick<MinePageViewProps, "saved" | "savedShown" | "onlyVisited" | "me" | "now" | "onToggleOnlyVisited" | "onCreateFromSaved" | "onToggleVisited" | "onUnsave">;

// 찜한 가게 줄 목록. 정렬(가까운순/최근 저장순)·「다녀온 곳만」 거르기는 컨테이너가 끝내서 넘긴다.
// 「다녀온 곳만」·「다녀옴」은 주 행동이 아닌 켜짐이라 Chip tone="tonal"(옥빛 테두리 + 옅은 바탕). 「다녀옴」의 켜짐은 Chip 의 체크 아이콘(lucide Check)으로 보인다.
// 줄 하나 = 도장 · 이름 · 동·거리·스타일·떡 / 찜한 날 · 확인한 날(오래되면 맵기 글색) · 「다녀옴」 · 채운 하트(lucide Heart, 찜 취소).
export default function MineSavedView({ saved, savedShown, onlyVisited, me, now, onToggleOnlyVisited, onCreateFromSaved, onToggleVisited, onUnsave }: MineSavedViewProps) {
  return (
    <section aria-label="찜한 가게">
      <div className="flex items-center justify-between gap-2 text-caption">
        <b className="min-w-0 break-keep">
          찜한 가게 {saved.length}곳 <span className="font-normal text-muted-foreground/70">· {me ? "가까운순" : "최근 저장순"}</span>
        </b>
        <Chip type="button" size="sm" tone="tonal" shape="pill" selected={onlyVisited} onChange={onToggleOnlyVisited}>
          다녀온 곳만
        </Chip>
      </div>

      {saved.length > 0 && (
        <Button type="button" variant="outlined" size="md" onClick={onCreateFromSaved} className="mt-2 w-full min-w-0 px-3 md:max-w-[520px]">
          찜한 {saved.length}곳으로 리스트 만들기
        </Button>
      )}

      {savedShown.length ? (
        <ul className={cn("mt-1", GRID_UL)}>
          {savedShown.map(({ s, v }) => {
            const stale = freshness(s, now) === "stale";
            return (
              <li key={s.id} className={cn("flex items-center gap-3 py-3 md:p-3", GRID_LI)}>
                <Link href={`/store/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <SpiceStamp n={s.spice} size={30} faded={stale} />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-body-medium">{s.name}</h3>
                    <p className="truncate text-caption text-muted-foreground">
                      {s.dong}
                      {me && <> · {distanceText(distanceM(me, s))}</>} · {STYLES[s.style]} · {s.rice.map((r) => RICE_CAKES[r]).join("·")}
                    </p>
                    <p className="truncate text-caption text-muted-foreground/70">
                      찜 {confirmedAgo(v.at, now)}
                      <span className={cn(stale && "text-spicytext")}> · 확인 {confirmedAgo(s.lastConfirmedAt, now)}</span>
                    </p>
                  </div>
                </Link>
                <Chip type="button" size="sm" tone="tonal" shape="pill" selected={!!v.visited} onChange={() => onToggleVisited(s.id)}>
                  다녀옴
                </Chip>
                <Button type="button" variant="text" size="icon-md" onClick={() => onUnsave(s.id)} aria-label={`${s.name} 찜 취소`} className="text-brand-red">
                  <Heart className="size-5 fill-current" strokeWidth={2} aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <MineEmpty>
          {onlyVisited ? (
            <>찜한 가게 옆 「다녀옴」 을 누르면 여기 모여요.</>
          ) : (
            <>
              지도에서 가게를 열고 <Heart className="inline size-4 align-text-bottom" strokeWidth={2} aria-hidden="true" />
              <span className="sr-only">찜</span> 를 누르면 여기 모여요.
              <br />
              <Link href="/" className="hit mt-3 inline-block font-semibold text-foreground underline underline-offset-4">
                지도로 가기
              </Link>
            </>
          )}
        </MineEmpty>
      )}
    </section>
  );
}
