import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// 내 맛지도 네 탭이 같이 쓰는 빈 상태 틀. 문구는 쓰는 쪽(탭 View)이 넣는다.
export default function MineEmpty({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-10 text-center text-[13px] leading-relaxed text-muted-foreground/70 break-keep [overflow-wrap:anywhere]", className)}>{children}</div>;
}
