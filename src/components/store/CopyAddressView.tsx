import { Button } from "@/components/ui/button";
import type { CopyAddressViewProps } from "./types";

// 주소 옆 「주소 복사」/「복사했어요」 단추. clipboard·되돌리는 타이머는 컨테이너(CopyAddress)가 맡는다.
// 보이는 높이는 32px 이고 누르는 범위는 Button 의 .hit-target 이 48px 로 넓힌다.
export default function CopyAddressView({ copied, onCopy }: CopyAddressViewProps) {
  return (
    <Button type="button" variant="outlined" size="compact" onClick={onCopy}>
      {copied ? "복사했어요" : "주소 복사"}
    </Button>
  );
}
