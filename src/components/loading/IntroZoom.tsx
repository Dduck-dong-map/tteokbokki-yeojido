import { Logo } from "@/components/brand";

// 첫 화면 전환 A (보드 IN-01 · 사용자 11-12 「첫 화면 전환은 A 로」):
//   로고 → 대동여지도 전도가 먹 번지듯 나타남 → 한양(서울)으로 확대 → 뒤에서 불러 둔 지금 지도로 겹쳐 바뀜.
// CSS 로만 움직이므로 서버에서 바로 그린다. 시간 규칙은 globals.css 의 .intro-zoom.
//   still = 지도 틀 데이터를 기다리는 동안(Suspense 대기 화면) 로고만 세워 둔다. 움직이는 판도 로고는 처음부터 보여서 바뀌는 자리가 안 보인다.
// 바탕은 지금 로딩과 같은 흰색 그대로 (사용자 11-12 「한지 느낌 통일은 지금으로」).
// 대동여지도 그림: 전도는 960px(public/loading/daedong.webp, 먼저 받음) + 확대해 들어가는 한양 둘레만 고화질 조각
//   (public/loading/daedong-hanyang.webp, 3,840px 판에서 잘라 냄 · 11-16). 조각은 전도와 같은 원본이라 % 자리만 맞추면 겹친다.
//   원본: 위키미디어 공용 Daedongyeojido-full.jpg (김정호 1861, 서울대 규장각 소장 · 퍼블릭 도메인 표기).
export default function IntroZoom({ className = "", still = false, ref }: { className?: string; still?: boolean; ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} role="status" aria-label="지도를 펼치는 중이에요" className={`intro-zoom ${still ? "intro-still" : ""} ${className}`}>
      {!still && (
        <div className="intro-map" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loading/daedong.webp" alt="" width={960} height={1615} fetchPriority="high" />
          {/* 한양 둘레 고화질 조각: 확대(0.5초부터) 때 쓰이므로 첫 그림보다 늦게 받아도 된다. 못 받으면 아래 960px 가 그대로 보인다 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="intro-hires" src="/loading/daedong-hanyang.webp" alt="" width={1306} height={1291} decoding="async" fetchPriority="low" />
        </div>
      )}
      <span className="intro-logo md:hidden" aria-hidden="true">
        <Logo />
      </span>
      {!still && (
        <p className="intro-cap" aria-hidden="true">
          지도 펼치는 중…
        </p>
      )}
    </div>
  );
}
