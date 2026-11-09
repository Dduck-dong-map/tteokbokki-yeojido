// 로고: 기본은 붓글씨 그림. ?logo=글꼴 로 시험하면 글자로 바뀐다 (lib/fonts.ts · globals.css)
export function Logo() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo_red.png" alt="떡볶여지도" className="logo-png h-8 w-auto [filter:var(--logo-filter)]" />
      <span className="logo-text">떡볶여지도</span>
    </>
  );
}
