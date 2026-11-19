import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GoLinksViewProps } from "./types";

// 주소 밑 길찾기 두 링크. 누른 기록은 컨테이너(GoLinks)가 보내고, 링크는 기다리지 않고 바로 열린다.
// 「네이버 지도로 길찾기」가 이 화면의 주 행동(filled), 「카카오맵」은 보조(outlined). 둘 다 48px 알약.
// 좁은 폭(360)에서 글자가 넘치지 않게 좌우 여백을 줄였다.
export default function GoLinksView({ naver, kakao, onGo }: GoLinksViewProps) {
  return (
    <div className="flex gap-2">
      <a href={naver} target="_blank" rel="noopener" onClick={() => onGo("naver")} className={cn(buttonVariants({ variant: "filled", size: "xl" }), "min-w-0 flex-[2] px-3")}>
        네이버 지도로 길찾기
      </a>
      <a href={kakao} target="_blank" rel="noopener" onClick={() => onGo("kakao")} className={cn(buttonVariants({ variant: "outlined", size: "xl" }), "min-w-0 flex-1 px-3")}>
        카카오맵
      </a>
    </div>
  );
}
