// 떡볶이 맛 태그 체계 v1 (기획안 v4 · 7절)
// 태그는 정해진 보기에서만 고른다. 자유 입력은 받지 않는다.
// 값(키)은 DB·주소에 쓰는 영문, label 은 화면에 쓰는 한글.

export const RICE_CAKES = {
  wheat: "밀떡",
  rice: "쌀떡",
  noodle: "누들밀떡",
  garae: "가래떡",
  mini: "눈사람떡",
  cheese: "치즈떡",
  bunmoja: "분모자",
} as const;

export const STYLES = {
  soup: "국물",
  classic: "촉촉",
  instant: "즉석",
  oil: "기름",
  rose: "로제",
  jjajang: "짜장",
  mala: "마라",
  royal: "궁중",
} as const;

// 맵기 1~5. 기준 메뉴는 신라면 = 3 (2026-10-26 확정)
export const SPICE_LEVELS = {
  1: { label: "순한", ref: "안 매운 편" },
  2: { label: "살짝", ref: "진라면 매운맛 정도" },
  3: { label: "보통 매움", ref: "신라면 정도" },
  4: { label: "매움", ref: "불닭볶음면 정도" },
  5: { label: "아주 매움", ref: "핵불닭 이상" },
} as const;

export const TASTES = {
  sweet: "달콤",
  salty: "짭짤",
  sweetsalty: "단짠",
  eomuk: "어묵 국물맛",
  pepper: "후추 맛",
} as const;
export const MAX_TASTES = 2;

export const SIDES = {
  sundae: "순대",
  twigim: "튀김",
  eomuk: "어묵",
  gimbap: "김밥",
  rabokki: "라볶이",
} as const;

export const SHOP_TYPES = {
  school: "학교 앞",
  market: "시장",
  pojang: "포장마차",
  franchise: "프랜차이즈",
  cafe: "카페형",
} as const;

export const USAGES = {
  solo: "혼밥 가능",
  takeout: "포장",
  delivery: "배달",
  parking: "주차",
  cashonly: "현금만",
} as const;

// 등재 기준 3등급: 전문·분식집은 큰 도장, '메뉴에 있음'은 작은 도장(필터에서 끌 수 있음)
export const GRADES = {
  specialist: "떡볶이 전문",
  bunsik: "분식집",
  menu: "메뉴에 있음",
} as const;

// 1인분 가격 필터 칸 (가정치 — 베타에서 실제 가격 분포를 보고 다시 정한다)
export const PRICE_STEPS = [4000, 5000, 6000] as const;

// 정보 신선도 (7절): 180일 넘으면 흐리게, 365일 넘으면 목록·지도에서 내린다
export const STALE_DAYS = 180;
export const EXPIRE_DAYS = 365;

export type RiceCake = keyof typeof RICE_CAKES;
export type Style = keyof typeof STYLES;
export type Spice = keyof typeof SPICE_LEVELS;
export type Taste = keyof typeof TASTES;
export type Side = keyof typeof SIDES;
export type ShopType = keyof typeof SHOP_TYPES;
export type Usage = keyof typeof USAGES;
export type Grade = keyof typeof GRADES;

export const keysOf = <T extends object>(o: T) => Object.keys(o) as (keyof T)[];
