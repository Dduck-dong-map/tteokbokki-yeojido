import Link from "next/link";
import { SpiceStamp } from "@/components/brand";
import { GRID_LI, GRID_UL } from "@/components/layout";
import { distanceM, distanceText } from "@/lib/filters";
import { confirmedAgo, freshness } from "@/lib/freshness";
import { RICE_CAKES, STYLES } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import MineEmpty from "./MineEmpty";
import type { MinePageViewProps } from "./types";

// 「찜한 가게」 탭 — MinePageView 계약에서 이 탭에 필요한 것만 잘라 받는다.
type MineSavedViewProps = Pick<MinePageViewProps, "saved" | "savedShown" | "onlyVisited" | "me" | "now" | "onToggleOnlyVisited" | "onCreateFromSaved" | "onToggleVisited" | "onUnsave">;

// 찜한 가게 줄 목록. 정렬(가까운순/최근 저장순)·「다녀온 곳만」 거르기는 컨테이너가 끝내서 넘긴다.
// 줄 하나 = 도장 · 이름 · 동·거리·스타일·떡 / 찜한 날 · 확인한 날(오래되면 맵기 글색) · 「다녀옴」 · ♥(찜 취소).
export default function MineSavedView({ saved, savedShown, onlyVisited, me, now, onToggleOnlyVisited, onCreateFromSaved, onToggleVisited, onUnsave }: MineSavedViewProps) {
  return (
    <section aria-label="찜한 가게">
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <b>
          찜한 가게 {saved.length}곳 <span className="font-normal text-muted-foreground/70">· {me ? "가까운순" : "최근 저장순"}</span>
        </b>
        <button
          type="button"
          aria-pressed={onlyVisited}
          onClick={onToggleOnlyVisited}
          className={cn("hit h-7 shrink-0 rounded-full border px-2.5 text-[12px] whitespace-nowrap", onlyVisited ? "border-primary bg-secondary font-semibold text-primary" : "border-input text-muted-foreground")}
        >
          다녀온 곳만
        </button>
      </div>

      {saved.length > 0 && (
        <button type="button" onClick={onCreateFromSaved} className={cn("mt-2 grid h-11 w-full place-items-center rounded-xl border border-input bg-card text-[13px] font-bold text-foreground hover:bg-muted md:h-10 md:max-w-[520px]")}>
          찜한 {saved.length}곳으로 리스트 만들기
        </button>
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
                    <h3 className="truncate text-[15px] font-bold">{s.name}</h3>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {s.dong}
                      {me && <> · {distanceText(distanceM(me, s))}</>} · {STYLES[s.style]} · {s.rice.map((r) => RICE_CAKES[r]).join("·")}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      찜 {confirmedAgo(v.at, now)}
                      <span className={cn(stale && "text-spicytext")}> · 확인 {confirmedAgo(s.lastConfirmedAt, now)}</span>
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => onToggleVisited(s.id)}
                  aria-pressed={!!v.visited}
                  className={cn("hit h-8 shrink-0 rounded-full border px-2.5 text-[12px] whitespace-nowrap", v.visited ? "border-primary bg-secondary font-semibold text-primary" : "border-input bg-card text-muted-foreground")}
                >
                  {v.visited ? "다녀옴 ✓" : "다녀옴"}
                </button>
                <button type="button" onClick={() => onUnsave(s.id)} aria-label={`${s.name} 찜 취소`} className={cn("grid h-11 w-11 shrink-0 place-items-center text-[18px] text-brand-red md:h-8 md:w-8")}>
                  ♥
                </button>
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
              지도에서 가게를 열고 ♡ 를 누르면 여기 모여요.
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
