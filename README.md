# 떡볶여지도

떡 종류·스타일·맵기 취향으로 찾는 분식(떡볶이) 맛집 지도. 모티브는 거지맵(거지맵.com). "모두가 고치는 지도" 구도라 가입 없이 누구나 가게를 올리고 고치고, 가 본 사람들이 「맞아요·달라요」로 걸러 낸다.

이 저장소 루트가 **Next.js 앱 본체**다(2026-11-09 에 `web/` 폴더를 루트로 합침). 기획·시안·기록은 전부 [`docs/`](docs/) 에 있고, 기획안·시안은 덮어쓰지 않고 v1, v2 로 따로 둔다.

## 돌려 보기

```
pnpm install
pnpm dev
```

크롬에서 http://localhost:3000 을 연다. 폭 768 미만은 지도 + 아래 시트 + 아래 메뉴, 768~1279 는 왼쪽 패널 + 지도, 1280 이상은 목록 + 상세 + 지도다. 휴대폰 크기로 보려면 F12 → 휴대폰 아이콘.

키나 계정이 없어도 돈다. 가게는 예시 데이터(가짜) 16곳이고, 등록·평가·글은 `.data/` 폴더 파일에 저장된다(지우면 예시로 다시 시작). 로컬 DB(도커 Postgres)에 저장하려면 [`db/README.md`](db/README.md) 대로 `pnpm db:up` 뒤 `.env.local` 에 `DATABASE_URL` 을 넣는다. 나중에 쓸 값은 [`.env.example`](.env.example) 에 적어 두었다.

| 주소 | 화면 | 비고 |
| --- | --- | --- |
| `/` | 지도 홈 · 검색 · 필터 | `?rice=rice&style=soup&spice=2-4&price=5000` 처럼 필터를 걸어 열 수 있다 |
| `/store/[id]` | 가게 상세 · 위치 · 길찾기 · 평가 · 함께 고치기 | PC 는 옆 큰 지도가 작은 지도를 대신한다 |
| `/store/[id]/edit` · `/history` | 정보 고치기 · 변경 이력 | 고치면 바로 반영되고 이력에 남는다 |
| `/register` | 맛집 등록 + 소개글 | 폰은 다섯 단계, 768 이상은 한 화면. 옛 `/report` 는 여기로 |
| `/list` · `/seoul/[gu]` · `/seoul/[gu]/[taste]` | 동네·취향별 글 목록 (검색 유입용) | 메뉴에서는 빠졌고 주소로 들어온다 |
| `/room` · `/room/write` · `/room/[id]` | 떡볶이방(게시판) — 자유 · 맛집 추천 · 같이 가요 | 2차(11-08). 가입 없이 닉네임으로 |
| `/mine` | 내 맛지도 — 내 리스트 · 모두의 리스트 · 찜한 가게 · 내 등록 | 찜·내 등록은 이 기기(localStorage)에만 |
| `/lists/[id]` | 맛집 리스트 하나 | 링크로만 공유한 리스트도 주소를 알면 연다 |
| `/admin` | 운영 어드민 **시안** | 예시 데이터로 움직이고 저장·로그인 없음. 기획: [`docs/어드민기획_v1_2026-10-27.md`](docs/어드민기획_v1_2026-10-27.md) |


## 구성

- Next.js 16 (App Router · Cache Components) · React 19 · TypeScript · Tailwind 4 · shadcn/ui(base-nova) · pnpm
- 지도: MapLibre 6 + OpenFreeMap 타일(OpenStreetMap). 대동여지도 느낌 바탕은 `src/components/map/dongyeoStyle.ts`
- 화면 구조(2026-11-09 리팩토링): 화면마다 **컨테이너**(`X.tsx`: 상태·데이터·라우터)와 **View**(`XView.tsx`: props 만 받아 그리는 정적 마크업)로 나뉜다. View 의 props 계약은 `src/components/<screen>/types.ts`. 공용 부품은 `src/components/ui/`(shadcn) · `brand/`(도장·별점·로고 등 우리 것) · `layout/`(헤더·아래 메뉴·격자)
- 색: `src/app/globals.css` 의 shadcn 변수 한 벌(팔레트 T2 값 고정, 2026-11-10 결정 R2). 런타임 팔레트 전환 `?pal=`·글꼴 시험 `?logo=`·화면 스튜디오 연동은 제거했다. 팔레트 비교는 `docs/design/index.html` 보드에서만 한다. `src/lib/theme.ts` 는 지도 색 계산(T2)만 남겼다
- 태그 체계: `src/lib/taxonomy.ts` (기획안 7절, 화면·서버·DB 공통) · 규칙: `src/lib/wiki.ts`(등록·확인·숨김) · `src/lib/community.ts`(게시판·리스트 한도)
- 데이터: 화면은 `src/lib/data/index.ts` 로만 읽고, 쓰기는 route handler(`src/app/api/*`) → `src/lib/data/db.ts`(규칙·단일 쓰기 경로) → `DATABASE_URL` 이 있으면 `pg.ts`(Postgres), 없으면 `.data/db.json`. 표 설계는 `db/init/*.sql`
- 시험: `pnpm test`(vitest, 규칙 단위) · `pnpm e2e`(Playwright: 라우트 23개 × 폭 390·768·1280 + 저장 흐름 5. 3101 포트에 파일 저장소 모드로 따로 띄우며 개발 DB 는 건드리지 않는다) · `pnpm typecheck` · `pnpm lint`

## 알아 둘 것

- MapLibre 6 은 지도 그리기 일꾼 파일을 따로 불러온다. `pnpm dev`·`pnpm build` 앞에서 `scripts/copy-maplibre-worker.mjs` 가 `public/maplibre/` 에 복사한다(깃 제외). `scripts/copy-share.mjs` 는 `docs/` 의 공유용 HTML 을 `public/share/` 로 복사한다.
- 예시 데이터로 돌 때는 `robots` 가 검색엔진을 막는다(`src/lib/data/index.ts` 의 `USING_SAMPLE_DATA`).
- Vercel 배포에서는 `HASH_SALT` 가 비어 있으면 서버가 시작하지 않는다. 사진은 아직 서버 폴더에 저장되어 Vercel 에서는 사라진다(Supabase Storage 로 옮기기 전).
- `globals.css` 를 고쳐도 개발 서버가 옛 CSS 를 줄 때가 있다. 다시 켜도 그대로면 `.next` 를 지우고 켠다.
- `AGENTS.md` 는 `next dev` 가 저절로 만드는 파일이다. 어드민 화면 CSS(`src/app/admin/*.css`)는 `.admin-root` 안에서만 듣는다.

## 문서

- 기획·결정: [`docs/기획안_v5_2026-10-31.md`](docs/기획안_v5_2026-10-31.md) · [`docs/웹1차기획_v1_2026-11-06.md`](docs/웹1차기획_v1_2026-11-06.md) · [`docs/MVP_거지맵구도_2026-11-04.md`](docs/MVP_거지맵구도_2026-11-04.md) · [`docs/기술스택_v1_2026-10-28.md`](docs/기술스택_v1_2026-10-28.md)
- 검토·계획: [`docs/designs/`](docs/designs/) — 정리 검토 보고서, MVP 방향 재정렬, 리팩토링 계획(web 해체)
- 작업 기록: [`docs/작업기록.md`](docs/작업기록.md)
- 이전 web/ README: [`docs/웹앱_README_이전본_2026-11-09.md`](docs/웹앱_README_이전본_2026-11-09.md)

## 화면 설계 보드 (시안 v2)

`docs/design/index.html` 을 크롬으로 열면 화면 설계 보드가 뜬다. 디자인/프로토타입 모드가 있고, 기존 v1 과 나란히 볼 수 있고, 팔레트를 직접 고를 수 있다. 인터넷 서버는 필요 없다.

<table>
<tr>
<td align="center"><img src="docs/design/화면_이미지/02_프로토타입_v1과나란히.png" width="400"><br>프로토타입: 왼쪽 기존 v1 · 오른쪽 개선안</td>
<td align="center"><img src="docs/design/화면_이미지/01_보드_디자인모드.png" width="400"><br>디자인 모드: 화면 흐름 · 왼쪽 팔레트 칸</td>
</tr>
<tr>
<td align="center"><img src="docs/design/화면_이미지/03_맵기표시_4안.png" width="400"><br>맵기 표시 4안</td>
<td align="center"><img src="docs/design/화면_이미지/04_캐릭터방향_8가지.png" width="400"><br>캐릭터 방향 8가지</td>
</tr>
</table>

- 화면을 더블클릭하면 그 화면부터 프로토타입이 시작되고, 누를 수 있는 곳을 누르면 넘어간다.
- 왼쪽 칸에서는 팔레트, 맵기 표시 방식, 실제 지도 가장자리를 바꿀 수 있다. 주소 뒤에 `?pal=H1` `?sp=count` `?focus=ch_all` `#home` 을 붙여 바로 열 수도 있다.

화면 시안 v1(와이어프레임 7장): [docs/화면시안_v1_2026-10-26/](docs/화면시안_v1_2026-10-26/README.md)
