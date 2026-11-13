import { cn } from "@/lib/utils";
import type { GoLinksViewProps } from "./types";

// 길찾기 단추 둘의 공통 모양 (52px — 상세에서 가장 큰 행동, REQ-W10)
const GO = "flex h-[52px] items-center justify-center rounded-xl font-bold whitespace-nowrap";

// 주소 밑 길찾기 두 링크. 누른 기록은 컨테이너(GoLinks)가 보내고, 링크는 기다리지 않고 바로 열린다.
export default function GoLinksView({ naver, kakao, onGo }: GoLinksViewProps) {
  return (
    <div className="flex gap-2">
      <a href={naver} target="_blank" rel="noopener" onClick={() => onGo("naver")} className={cn(GO, "flex-[2] bg-primary text-[15px] text-primary-foreground hover:bg-primary/90")}>
        네이버 지도로 길찾기
      </a>
      <a href={kakao} target="_blank" rel="noopener" onClick={() => onGo("kakao")} className={cn(GO, "flex-1 border border-input bg-card text-[14px] text-foreground hover:bg-muted")}>
        카카오맵
      </a>
    </div>
  );
}
