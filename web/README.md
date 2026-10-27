# 떡볶여지도 웹앱 (web/)

떡볶여지도 모바일 웹앱(PWA)의 코드다. 지금은 **M0 개발 뼈대**이고, 가게는 예시 데이터(가짜)다.
왜 이렇게 만들었는지와 다음 단계는 [`../docs/개발준비_v1_2026-10-27.md`](../docs/개발준비_v1_2026-10-27.md) 에 있다.

## 돌려 보기

```
npm install
npm run dev
```

크롬에서 http://localhost:3000 을 연다. 휴대폰 크기로 보려면 F12 → 휴대폰 아이콘을 누른다.

- http://localhost:3000/admin : 운영 어드민 시안(기획: `../docs/어드민기획_v1_2026-10-27.md`). 디자인은 Admin Navy(`src/app/admin/admin-navy.css`, `.admin-root` 안에서만 듣게 바꾼 사본)
- `?pal=H1`: 팔레트 바꾸기(화면 설계 보드와 같은 이름: V1 A B C D E H1 H2 N1~N6)
- `?rice=rice&style=soup&spice=2-4&price=5000&open=1&solo=1&menu=0`: 필터가 걸린 채로 열기

키나 계정이 없어도 돈다. 나중에 쓸 값은 `.env.example` 에 적어 두었다.

## 구성

- Next.js 16 (App Router · Cache Components) · React 19 · Tailwind 4
- 지도: MapLibre 6 + OpenFreeMap 타일(OpenStreetMap). 대동여지도 느낌 바탕은 `src/components/map/dongyeoStyle.ts`
- 태그 체계: `src/lib/taxonomy.ts` (기획안 7절, 화면·서버·DB 공통)
- 팔레트: `src/lib/theme.ts` (보드의 프리셋과 색 계산 그대로, 기본값은 `DEFAULT_PALETTE`)
- 데이터: `src/lib/data/` (지금 예시 → M2에 Supabase)
- DB 설계: `supabase/migrations/` (`…_init.sql` 서비스, `…_admin.sql` 운영 어드민. 아직 적용 안 함)
- 어드민: `src/app/admin/`(화면) · `src/components/admin/`(부품) · `src/lib/admin/sample.ts`(예시 제보·신고·기록)

## 알아 둘 것

- MapLibre 6은 지도 그리기 일꾼 파일을 따로 불러온다. `npm run dev`·`build` 전에 `scripts/copy-maplibre-worker.mjs` 가 그 파일을 `public/maplibre/` 에 복사한다. 이 복사본은 깃에 올리지 않는다.
- 예시 데이터로 돌 때는 `robots` 가 검색엔진을 막는다(`src/lib/data/index.ts` 의 `USING_SAMPLE_DATA`).
- `AGENTS.md` 는 `next dev` 가 저절로 만드는 파일이다.
