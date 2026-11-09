import type { BoardCat, ListVisibility } from "../community";

// 떡볶이방 글 · 맛집 리스트 예시 (11-08). 빈 화면으로 보이지 않게 넣은 가짜 기록이고, 제목에 (예시)를 붙였다.
// 가게 id 는 sample-stores.ts 의 예시 가게다.

export const SAMPLE_LISTS: { id: string; title: string; desc: string; storeIds: string[]; who: string; daysAgo: number; likes: number; visibility: ListVisibility }[] = [
  {
    id: "l-sample-mapo-hot",
    title: "마포 맵부심 코스 (예시)",
    desc: "신라면이 순하게 느껴지는 분만. 매운 순서대로 돌아보세요.",
    storeIds: ["seogyo-hell", "yeonnam-mala", "sinchon-cheese", "hapjeong-rose"],
    who: "화끈한 쫄면 208",
    daysAgo: 4,
    likes: 12,
    visibility: "public",
  },
  {
    id: "l-sample-market",
    title: "시장 떡볶이 투어 (예시)",
    desc: "망원시장부터 대흥동까지, 4천 원 안쪽 시장 떡볶이만 모았어요.",
    storeIds: ["mangwon-market-oil", "mangwon-soup", "daeheung-market", "gajwa-pojang"],
    who: "든든한 순대 317",
    daysAgo: 9,
    likes: 8,
    visibility: "public",
  },
  {
    id: "l-sample-mild",
    title: "맵찔이도 괜찮은 집 (예시)",
    desc: "맵기 1~2 위주. 아이랑 가도 되는 곳.",
    storeIds: ["yeonnam-jjajang", "gongdeok-royal", "yeonhui-gimbap"],
    who: "달콤한 순대 95",
    daysAgo: 2,
    likes: 5,
    visibility: "public",
  },
];

export const SAMPLE_POSTS: { id: string; cat: BoardCat; title: string; body: string; who: string; daysAgo: number; likes: number; storeId?: string; comments: { who: string; text: string }[] }[] = [
  {
    id: "p-sample-1",
    cat: "recommend",
    title: "망원 할머니 국물떡볶이 어묵 국물 꼭 드세요 (예시)",
    body: "튀김을 국물에 찍어 먹는 게 정석이에요. 주말 점심엔 줄이 좀 있어요.\n(예시 글)",
    who: "쫀득한 밀떡 412",
    daysAgo: 1,
    likes: 7,
    storeId: "mangwon-soup",
    comments: [{ who: "말랑한 가래떡 660", text: "저도 거기 단골이에요! (예시 댓글)" }],
  },
  {
    id: "p-sample-2",
    cat: "together",
    title: "이번 주 금요일 저녁 서교동 불지옥 같이 가실 분 (예시)",
    body: "혼자 가기엔 너무 매울 것 같아서요. 쿨피스 제가 살게요.\n(예시 글)",
    who: "매콤한 튀김 731",
    daysAgo: 2,
    likes: 2,
    storeId: "seogyo-hell",
    comments: [],
  },
  {
    id: "p-sample-3",
    cat: "free",
    title: "밀떡파 vs 쌀떡파 (예시)",
    body: "저는 국물이면 밀떡, 기름이면 쌀떡이요. 다들 어떠세요?\n(예시 글)",
    who: "촉촉한 라볶이 154",
    daysAgo: 3,
    likes: 4,
    comments: [
      { who: "바삭한 김말이 880", text: "무조건 밀떡이죠 (예시 댓글)" },
      { who: "뜨끈한 어묵 402", text: "가래떡 구워 먹는 것도 좋아요 (예시 댓글)" },
    ],
  },
];
