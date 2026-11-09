import Link from "next/link";

// 없는 가게 주소 (웹 1차 기획 경고창#7)
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
      <div>
        <p className="text-[40px]" aria-hidden="true">
          🍢
        </p>
        <h1 className="mt-3 text-[20px] font-bold">찾으시는 곳이 지도에 없어요</h1>
        <p className="mt-2 text-[14px] text-ink2">주소가 바뀌었거나 내려간 가게일 수 있어요.</p>
        <Link href="/" className="mt-6 inline-grid h-12 w-full max-w-[280px] place-items-center rounded-xl bg-accent text-[15px] font-bold text-onaccent">
          지도로 가기
        </Link>
      </div>
    </main>
  );
}
