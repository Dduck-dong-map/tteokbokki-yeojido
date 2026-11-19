# 떡볶여지도

떡 종류·스타일·맵기 취향으로 찾는 분식(떡볶이) 맛집 지도. 모티브는 거지맵(거지맵.com). "모두가 고치는 지도" 구도라 가입 없이 누구나 가게를 올리고 고치고, 가 본 사람들이 「맞아요·달라요」로 걸러 낸다.

이 저장소 루트가 **Next.js 앱 본체**다(2026-11-09 에 `web/` 폴더를 루트로 합침). 기획·시안·기록은 전부 [`docs/`](docs/) 에 있고, 기획안·시안은 덮어쓰지 않고 v1, v2 로 따로 둔다.

## 돌려 보기

```
pnpm install
pnpm dev
```

크롬에서 http://localhost:3000 을 연다. 폭 768 미만은 지도 + 아래 시트 + 아래 메뉴, 768~1279 는 왼쪽 패널 + 지도, 1280 이상은 목록 + 상세 + 지도다. 휴대폰 크기로 보려면 F12 → 휴대폰 아이콘.

키나 계정이 없어도 돈다. 저장소는 빈 채로 시작하고(예시 데이터 없음), 등록·평가·글은 `.data/` 폴더 파일에 저장된다. DB(Neon)에 저장하려면 [`db/README.md`](db/README.md) 대로 `.env.local` 에 `DATABASE_URL` 을 넣는다. 로컬 도커 DB · 도커 앱 서버는 11-19 에 지웠다. 나중에 쓸 값은 [`.env.example`](.env.example) 에 적어 두었다.

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
| `/admin` | 운영 어드민 | 가게 관리(`/admin/stores`) · 후보 가져오기(`/admin/candidates`) · 운영 기록(`/admin/logs`)셋이고 실제 저장소를 읽고 고친다(`/admin` 은 가게 관리로 넘긴다). `ADMIN_KEY` 가 있으면 `/admin/login` 으로 들어가고, 없으면 개발 서버의 127.0.0.1 · localhost 에서만 열린다(production 은 잠김). 기획: [`docs/기획/어드민기획_v1_2026-10-27.md`](docs/기획/어드민기획_v1_2026-10-27.md) |


## 구성

- Next.js 16 (App Router · Cache Components) · React 19 · TypeScript · Tailwind 4 · shadcn/ui(base-nova) · pnpm
- 지도: MapLibre 6 + OpenFreeMap 타일(OpenStreetMap). 대동여지도 느낌 바탕은 `src/components/map/dongyeoStyle.ts`
- 화면 구조(2026-11-09 리팩토링): 화면마다 **컨테이너**(`X.tsx`: 상태·데이터·라우터)와 **View**(`XView.tsx`: props 만 받아 그리는 정적 마크업)로 나뉜다. View 의 props 계약은 `src/components/<screen>/types.ts`. 공용 부품은 `src/components/ui/`(shadcn) · `brand/`(도장·별점·로고 등 우리 것) · `layout/`(헤더·아래 메뉴·격자)
- 색: `src/app/globals.css` 의 shadcn 변수 한 벌(팔레트 T2 값 고정, 2026-11-10 결정 R2). 런타임 팔레트 전환 `?pal=`·글꼴 시험 `?logo=`·화면 스튜디오 연동은 제거했다. 팔레트 비교는 `docs/공유/design/index.html` 보드에서만 한다. `src/lib/theme.ts` 는 지도 색 계산(T2)만 남겼다
- 태그 체계: `src/lib/taxonomy.ts` (기획안 7절, 화면·서버·DB 공통) · 규칙: `src/lib/wiki.ts`(등록·확인·숨김) · `src/lib/community.ts`(게시판·리스트 한도)
- 데이터: 화면은 `src/lib/data/index.ts` 로만 읽고, 쓰기는 route handler(`src/app/api/*`) → `src/lib/request.ts`(출처 · JSON · 크기 · 기기 표시 검사) → `src/lib/data/db.ts`(규칙·단일 쓰기 경로) → `DATABASE_URL` 이 있으면 `pg.ts`(Postgres), 없으면 `.data/db.json`. 표 설계는 `db/init/*.sql`(표 13개, 모두 RLS 켬 · 허용 규칙 없음). 표가 바뀌면 `db/README.md` 「표가 바뀌면」을 따른다
- 사진: `src/lib/data/photos.ts`. Vercel Blob 저장소가 이어져 있으면(`BLOB_STORE_ID` 또는 `BLOB_READ_WRITE_TOKEN`) 비공개로 넣고 서버가 내려 주며, 없으면 서버 폴더(`.data/photos`)에 둔다. 주소는 어느 쪽이든 `/api/photos/<id>`
- 같은 사람 판정: 기기 표시(`x-ddy-device`) + 접속 IP 해시. 기기 표시 없는 쓰기는 거절하고, 내리는 판정(달라요 · 신고)은 서로 다른 IP 3곳, 하루 한도는 한 사람 한도 + 같은 IP 상한이다
- 시험: `pnpm test`(vitest: 규칙 함수 · 저장소 쓰기 규칙 · 쓰기 입구 검사 · 어드민 접근 · 사진 저장소. Postgres 시험 `pg.test.ts` 는 `DATABASE_URL` 이 있을 때만) · `pnpm e2e`(Playwright: 라우트 23개 + 저장 흐름 5 + 수용 기준 32, 폭 390·768·1280. 3101 포트에 파일 저장소 모드로 따로 띄우며 개발 DB 는 건드리지 않는다) · `pnpm typecheck` · `pnpm lint`
- CI: `.github/workflows/ci.yml` 이 푸시·PR 마다 타입 검사 · 린트 · 단위 시험과 Postgres 서비스 시험을 돌린다. E2E 는 CI 에 없다

## 알아 둘 것

- MapLibre 6 은 지도 그리기 일꾼 파일을 따로 불러온다. `pnpm dev`·`pnpm build` 앞에서 `scripts/copy-maplibre-worker.mjs` 가 `public/maplibre/` 에 복사한다(깃 제외). `scripts/copy-share.mjs` 는 `docs/` 의 공유용 HTML 을 `public/share/` 로 복사한다.
- Vercel 배포에서는 `HASH_SALT` 나 `DATABASE_URL` 이 비어 있으면 서버가 시작하지 않는다. Vercel Blob 저장소가 이어져 있지 않으면 Vercel 에서는 사진 올리기를 거절한다(사진 없이 등록은 된다). Neon 프로젝트는 11-20 에 만들어 표 13개를 올렸고([`db/README.md`](db/README.md)), Vercel 프로젝트와 Blob 저장소는 아직 없다.
- 저장소는 빈 채로 시작한다. 실제 가게는 어드민 「후보 가져오기」로 넣는다([`db/README.md`](db/README.md) 「가게 넣는 순서」). 시험 자료(가게 16곳 · 글 · 리스트)는 `tests/fixtures/` 에 있고 시험만 쓴다.
- `globals.css` 를 고쳐도 개발 서버가 옛 CSS 를 줄 때가 있다. 다시 켜도 그대로면 `.next` 를 지우고 켠다.
- `AGENTS.md` 는 `next dev` 가 저절로 만드는 파일이다. 어드민 화면도 사용자 화면과 같은 스택(Tailwind · `ui/` 부품 · 디자인 토큰)으로 그린다. 전용 CSS 는 없고 공용 조각은 `src/components/admin/bits.tsx` · `controls.tsx` 다. 어드민 아이콘은 `lucide-react` 다(`src/components/admin/Icon.tsx`).

## 문서

- 기획·결정: [`docs/기획/기획안_v5_2026-10-31.md`](docs/기획/기획안_v5_2026-10-31.md) · [`docs/기획/웹1차기획_v1_2026-11-06.md`](docs/기획/웹1차기획_v1_2026-11-06.md) · [`docs/기획/MVP_거지맵구도_2026-11-04.md`](docs/기획/MVP_거지맵구도_2026-11-04.md) · [`docs/개발/기술스택_v1_2026-10-28.md`](docs/개발/기술스택_v1_2026-10-28.md)
- 검토·계획: [`docs/기획/검토/`](docs/기획/검토/) — 정리 검토 보고서, MVP 방향 재정렬, 리팩토링 계획(web 해체)
- 작업 기록: [`docs/작업기록.md`](docs/작업기록.md)
- 이전 web/ README: [`docs/개발/웹앱_README_이전본_2026-11-09.md`](docs/개발/웹앱_README_이전본_2026-11-09.md)

## 화면 설계 보드 (시안 v2)

`docs/공유/design/index.html` 을 크롬으로 열면 화면 설계 보드가 뜬다. 디자인/프로토타입 모드가 있고, 기존 v1 과 나란히 볼 수 있고, 팔레트를 직접 고를 수 있다. 인터넷 서버는 필요 없다.

<table>
<tr>
<td align="center"><img src="docs/공유/design/화면_이미지/02_프로토타입_v1과나란히.png" width="400"><br>프로토타입: 왼쪽 기존 v1 · 오른쪽 개선안</td>
<td align="center"><img src="docs/공유/design/화면_이미지/01_보드_디자인모드.png" width="400"><br>디자인 모드: 화면 흐름 · 왼쪽 팔레트 칸</td>
</tr>
<tr>
<td align="center"><img src="docs/공유/design/화면_이미지/03_맵기표시_4안.png" width="400"><br>맵기 표시 4안</td>
<td align="center"><img src="docs/공유/design/화면_이미지/04_캐릭터방향_8가지.png" width="400"><br>캐릭터 방향 8가지</td>
</tr>
</table>

- 화면을 더블클릭하면 그 화면부터 프로토타입이 시작되고, 누를 수 있는 곳을 누르면 넘어간다.
- 왼쪽 칸에서는 팔레트, 맵기 표시 방식, 실제 지도 가장자리를 바꿀 수 있다. 주소 뒤에 `?pal=H1` `?sp=count` `?focus=ch_all` `#home` 을 붙여 바로 열 수도 있다.

화면 시안 v1(와이어프레임 7장): [docs/공유/화면시안_v1_2026-10-26/](docs/공유/화면시안_v1_2026-10-26/README.md)
