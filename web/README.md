# 떡볶여지도 웹앱 (web/)

떡볶여지도 반응형 웹(PC·모바일 같은 주소)의 코드다. 지금은 **웹 1차 W1**(11-06)까지 왔고, 가게는 예시 데이터(가짜)다.
화면·규칙의 기준은 [`../docs/웹1차기획_v1_2026-11-06.md`](../docs/웹1차기획_v1_2026-11-06.md), 구도는 [`../docs/MVP_거지맵구도_2026-11-04.md`](../docs/MVP_거지맵구도_2026-11-04.md), 처음 설계는 [`../docs/개발준비_v1_2026-10-27.md`](../docs/개발준비_v1_2026-10-27.md) 에 있다.

## 돌려 보기

```
npm install
npm run dev
```

크롬에서 http://localhost:3000 을 연다. 폭 768 미만은 지도 + 아래 시트 + 아래 메뉴, 768~1279 는 패널 + 지도, 1280 이상은 목록 + 상세 + 지도다. 휴대폰 크기로 보려면 F12 → 휴대폰 아이콘을 누른다.

- http://localhost:3000/admin : 운영 어드민 시안(기획: `../docs/어드민기획_v1_2026-10-27.md`). 디자인은 Admin Navy(`src/app/admin/admin-navy.css`, `.admin-root` 안에서만 듣게 바꾼 사본)
- `?pal=H1`: 팔레트 바꾸기(화면 설계 보드와 같은 이름: V1 A B C D E H1 H2 N1~N6)
- `?rice=rice&style=soup&spice=2-4&price=5000&open=1&solo=1&menu=0`: 필터가 걸린 채로 열기
- http://localhost:3000/mine : **내 맛지도**(아래 메뉴 셋째 탭). 가게 상세 머리칸 오른쪽 ♡ 로 저장한 가게 · 다녀옴 · 내 등록. 로그인 없이 이 기기(localStorage `ddy-mine`)에만 두고, 계정이 생기면 `src/lib/mine.ts` 안만 바꾼다. 떡볶이방은 2차라 안 보임
- http://localhost:3000/together : **함께 고치기**. 새로 온 가게 확인 + 오래됐거나 비어 있는 가게 고치기
- http://localhost:3000/register : **맛집 등록 + 소개글**. 폰은 다섯 단계, 768 이상은 한 화면. 옛 `/report` 는 여기로 넘어온다
- `?logo=euljiro&head=yeongwol`: 글꼴 시험(`src/lib/fonts.ts`, 이 브라우저에 기억). 원래대로 `?logo=png&head=base`
- 등록·평가는 `.data/` 폴더에 저장된다. **이 폴더를 지우면 예시 데이터로 다시 시작한다**

키나 계정이 없어도 돈다. 나중에 쓸 값은 `.env.example` 에 적어 두었다.

## 구성

- Next.js 16 (App Router · Cache Components) · React 19 · Tailwind 4
- 지도: MapLibre 6 + OpenFreeMap 타일(OpenStreetMap). 대동여지도 느낌 바탕은 `src/components/map/dongyeoStyle.ts`
- 태그 체계: `src/lib/taxonomy.ts` (기획안 7절, 화면·서버·DB 공통)
- 팔레트: `src/lib/theme.ts` (보드의 프리셋과 색 계산 그대로, 기본값은 `DEFAULT_PALETTE`)
- 데이터: `src/lib/data/db.ts` (지금 서버 파일. Vercel 에서는 오래 남지 않으므로 **공개 전에 Supabase 로 교체**) · 규칙: `src/lib/wiki.ts`
- DB 설계: `supabase/migrations/` (`…_init.sql` 서비스, `…_admin.sql` 운영 어드민. 아직 적용 안 함)
- 이용자 화면: `src/app/(site)/`. 지도 홈과 가게 상세는 `(map)/` 묶음이라 PC에서 상세를 열어도 큰 지도가 끊기지 않는다(`src/components/home/MapShell.tsx`)
- 어드민: `src/app/admin/`(화면) · `src/components/admin/`(부품) · `src/lib/admin/sample.ts`(예시 제보·신고·기록)

## 알아 둘 것

- MapLibre 6은 지도 그리기 일꾼 파일을 따로 불러온다. `npm run dev`·`build` 전에 `scripts/copy-maplibre-worker.mjs` 가 그 파일을 `public/maplibre/` 에 복사한다. 이 복사본은 깃에 올리지 않는다.
- 예시 데이터로 돌 때는 `robots` 가 검색엔진을 막는다(`src/lib/data/index.ts` 의 `USING_SAMPLE_DATA`).
- `AGENTS.md` 는 `next dev` 가 저절로 만드는 파일이다.
