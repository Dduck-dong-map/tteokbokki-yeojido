// 메뉴 셋: 폰은 아래 메뉴, 768 이상은 위 헤더 (11-08 사용자 지시).
// 「목록」은 지도 화면 목록으로 충분해서 메뉴에서 뺐다(/list 주소는 남김). 「함께 고치기」는 가게 상세 안으로 옮겼다.
export const NAV = [
  { href: "/", label: "지도", key: "map" },
  { href: "/room", label: "떡볶이방", key: "room" },
  { href: "/mine", label: "내 맛지도", key: "mine" },
] as const;

export type NavKey = (typeof NAV)[number]["key"];
