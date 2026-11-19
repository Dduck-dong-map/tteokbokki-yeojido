import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 하위 화면 머리칸. 폰에서는 위에 붙어 따라오고, 768 이상에서는 위 헤더 아래 제목 줄이 된다.
export function BackHeader({ title, href = "/", right, className }: { title: string; href?: string; right?: ReactNode; className?: string }) {
  return (
    <header
      className={cn(
        "z-10 flex h-12 items-center gap-2 border-b border-border bg-background px-2 max-md:sticky max-md:top-0 md:h-14 md:border-0 md:bg-transparent md:px-0",
        className,
      )}
    >
      <Link href={href} className={cn(buttonVariants({ variant: "text", size: "icon-xl" }), "text-foreground")} aria-label="뒤로">
        <ChevronLeft className="size-6" strokeWidth={2} aria-hidden="true" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-heading-4">{title}</h1>
      {right}
    </header>
  );
}
