import { Button } from "@/components/ui/button";
import type { StillHereViewProps } from "./types";

// 「아직 있어요」 단추와 결과·안내 문구. geolocation·거리 계산·fetch 는 컨테이너(StoreActions.tsx 의 StillHere)가 맡는다.
export default function StillHereView({ busy, message, onPress }: StillHereViewProps) {
  return (
    <div className="min-w-0 text-right">
      <Button type="button" variant="outlined" size="md" onClick={onPress} disabled={busy}>
        {busy ? "위치 확인 중…" : "아직 있어요"}
      </Button>
      {message && <p className="mt-1.5 text-caption text-muted-foreground/70 break-keep [overflow-wrap:anywhere]">{message}</p>}
    </div>
  );
}
