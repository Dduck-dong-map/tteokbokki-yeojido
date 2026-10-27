import { RICE_CAKES, STYLES, type RiceCake, type Spice, type Style } from "./taxonomy";

// 익명 제보 (기획안 5·7절): 새 가게 · 정보 수정 · 폐업
// 새 가게·폐업은 운영자 승인 후 반영, 가격·맵기 수정은 '확인 대기' → 다른 2명 동의 시 반영.
export type ReportKind = "new" | "edit" | "closed";

export type ReportInput = {
  kind: ReportKind;
  storeId?: string;
  name?: string;
  address?: string;
  rice: RiceCake[];
  style?: Style;
  spice?: Spice;
  price?: number;
};

export const DAILY_LIMIT = 10; // 기기·IP 기준 하루 10건

// 화면과 서버가 같은 규칙으로 검사한다. 문제가 없으면 null.
export function checkReport(r: ReportInput): string | null {
  if (!["new", "edit", "closed"].includes(r.kind)) return "제보 종류가 이상해요";
  if (r.kind !== "new" && !r.storeId) return "어느 가게인지 알려 주세요";
  if (r.kind === "closed") return null;
  if (r.kind === "new" && (!r.name?.trim() || !r.address?.trim())) return "가게 이름과 주소를 넣어 주세요";
  if ((r.name?.length ?? 0) > 60 || (r.address?.length ?? 0) > 120) return "이름이나 주소가 너무 길어요";
  if (!r.rice.length || r.rice.some((x) => !(x in RICE_CAKES))) return "떡을 하나 이상 골라 주세요";
  if (!r.style || !(r.style in STYLES)) return "스타일을 골라 주세요";
  if (!r.spice || r.spice < 1 || r.spice > 5) return "맵기를 골라 주세요";
  if (r.price !== undefined && (r.price < 500 || r.price > 50000)) return "1인분 가격을 다시 봐 주세요";
  return null;
}

export const PRICE_HINTS = [3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000] as const;
