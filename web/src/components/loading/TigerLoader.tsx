import { Logo } from "../ui";

// 로딩 화면: 떡 문 호랑이가 떡을 호호 분다 (docs/로딩캐릭터기획_v1).
// CSS 로만 움직이므로 서버에서 바로 그린다. 시간 규칙은 globals.css 의 .tiger-loader:
//   호랑이는 0.3초 뒤에 나타나고, 스크립트가 죽어도 9초 뒤에는 저절로 걷힌다.
export default function TigerLoader({ className = "" }: { className?: string }) {
  return (
    <div role="status" aria-label="불러오는 중이에요" className={`tiger-loader ${className}`}>
      <span className="absolute top-[calc(env(safe-area-inset-top)+24px)] md:hidden" aria-hidden="true">
        <Logo />
      </span>
      <div className="tiger-art" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/loading/tiger-hoho.webp" alt="" width={220} height={220} fetchPriority="high" />
        {/* 11-09 사용자 「호호호 글자 나오는 건 없애줘」 → 호랑이 옆에 떠오르던 「호」 글자 뺌 */}
      </div>
      <p className="text-[15px] text-ink2" aria-hidden="true">
        호호, 떡 식히는 중…
      </p>
    </div>
  );
}
