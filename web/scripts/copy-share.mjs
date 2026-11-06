// 공유 허브(/share): 화면 설계 보드 · 출시 로드맵 · 허브 페이지를 docs/ 에서 public/share/ 로 복사한다.
// 원본은 늘 docs/ 쪽이다. npm run dev / build 전에 저절로 돈다(package.json predev·prebuild). 복사본은 깃에 올리지 않는다.
// Vercel 은 web/ 만 올라가서 ../docs 가 없다 → 그때는 건너뛰고, 올라간 public/share/ 를 그대로 쓴다.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";

const DOCS = "../docs";
const OUT = "public/share";

if (!existsSync(DOCS)) {
  console.log("copy-share: ../docs 가 없어 건너뜀 (올라온 public/share 를 그대로 씀)");
  process.exit(0);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 허브 페이지와 카드 그림
cpSync(`${DOCS}/share`, OUT, { recursive: true });
// 화면 설계 보드: 기존 v1 사진을 ../화면시안_v1_2026-10-26/화면_이미지/ 에서 불러오므로 같은 자리 관계로 둔다
cpSync(`${DOCS}/design/index.html`, `${OUT}/board/index.html`);
cpSync(`${DOCS}/design/img`, `${OUT}/board/img`, { recursive: true });
cpSync(`${DOCS}/화면시안_v1_2026-10-26/화면_이미지`, `${OUT}/화면시안_v1_2026-10-26/화면_이미지`, { recursive: true });
// 출시 로드맵: 온라인 보드(claude.ai) 밖에서는 「처음 상태」 보기용으로 열린다
cpSync(`${DOCS}/roadmap/index.html`, `${OUT}/roadmap/index.html`);
// 진행 현황(팀 공유용 한 장) + 거기서 보여 주는 M1 화면 그림. 그림은 ../M1_화면_이미지_… 상대 경로 그대로
cpSync(`${DOCS}/진행현황/index.html`, `${OUT}/status/index.html`);
cpSync(`${DOCS}/M1_화면_이미지_2026-10-31`, `${OUT}/M1_화면_이미지_2026-10-31`, { recursive: true });

console.log("copy-share: docs → public/share 복사함");
