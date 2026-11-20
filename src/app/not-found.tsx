import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 없는 가게 주소 (웹 1차 기획 경고창#7)
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div>
        <p className="text-heading-1" aria-hidden="true">
          🍢
        </p>
        <h1 className="mt-3 text-heading-4 break-keep">찾으시는 곳이 지도에 없어요</h1>
        <p className="mt-2 text-body-small break-keep text-muted-foreground">주소가 바뀌었거나 내려간 가게일 수 있어요.</p>
        <Link href="/" className={cn(buttonVariants({ variant: "filled", size: "xl" }), "mt-6 w-full max-w-[280px]")}>
          지도로 가기
        </Link>
      </div>
    </main>
  );
}
