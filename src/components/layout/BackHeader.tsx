import Link from "next/link";

// 하위 화면 머리칸. 폰에서는 위에 붙어 따라오고, 768 이상에서는 위 헤더 아래 제목 줄이 된다.
export function BackHeader({ title, href = "/", right, className = "" }: { title: string; href?: string; right?: React.ReactNode; className?: string }) {
  return (
    <header className={`z-10 flex h-12 items-center gap-2 border-b border-line bg-bar px-2 max-md:sticky max-md:top-0 md:h-14 md:border-0 md:bg-transparent md:px-0 ${className}`}>
      <Link href={href} className="grid h-11 w-11 place-items-center rounded-full text-xl text-ink hover:bg-chip" aria-label="뒤로">
        ‹
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-[16px] font-bold md:text-[20px]">{title}</h1>
      {right}
    </header>
  );
}
