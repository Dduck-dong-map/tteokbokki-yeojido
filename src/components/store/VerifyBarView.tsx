import { HIDE_AT, VERIFY_YES } from "@/lib/wiki";
import VerifyButtonsView from "./VerifyButtonsView";
import type { VerifyBarViewProps } from "./types";

// 확인 중인 가게 상세에 뜨는 점선 칸: 등록자 · 집계 설명 · 맞아요/달라요 수 · 투표 단추.
// 기준 수(VERIFY_YES · HIDE_AT)는 상수라 lib/wiki 에서 바로 읽는다. 투표 상태·핸들러는 verify 묶음으로 받는다.
export default function VerifyBarView({ by, yes, no, verify }: VerifyBarViewProps) {
  return (
    <section className="rounded-2xl border border-dashed border-muted-foreground/70 bg-card p-4">
      <h3 className="text-body-medium">아직 확인 중인 가게예요</h3>
      <p className="mt-1 text-body-small leading-relaxed text-muted-foreground break-keep [overflow-wrap:anywhere]">
        {by ? `${by} 님이 등록했어요. ` : ""}가 보신 적 있으면 알려 주세요. 「맞아요」 {VERIFY_YES}명이면 확인이 끝나고, 「달라요」 {HIDE_AT}명이면 지도에서 내려요.
      </p>
      <p className="mt-2 text-caption font-semibold">
        맞아요 {yes} · 달라요 {no}
      </p>
      <div className="mt-2.5">
        <VerifyButtonsView {...verify} />
      </div>
    </section>
  );
}
