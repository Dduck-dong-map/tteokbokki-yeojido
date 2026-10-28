import { Button } from "@/components/ui/button";

// 초기 세팅 확인용 최소 화면: 제목과 shadcn/ui 버튼 하나만 둔다.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">떡볶여지도</h1>
      <Button>시작하기</Button>
    </main>
  );
}
