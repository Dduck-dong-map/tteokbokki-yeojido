import type { AdminStoreInput } from "./admin";
import gangnam from "./stores-gangnam.json";

// 운영자가 「후보 가져오기」(/admin/candidates)에서 DB 에 넣는 실제 가게 자료 묶음 (11-15).
// 앱이 혼자 넣지 않는다 — 운영자가 눌러야 들어간다. 이미 있는 id 는 건드리지 않는다 (lib/data/admin.ts adminImport).
// 강남 v1 = 공개된 사실(이름·주소·메뉴·가격·영업시간·근거 날짜)만 모은 리서치. 리뷰 글·별점은 가져오지 않았다.
//   원본 표 docs/가게리서치_강남_v1_2026-11-15.md · 좌표 = OpenStreetMap Nominatim (© OpenStreetMap contributors)

export type Research = {
  confidence?: string | null; // high · medium
  geo?: string | null; // building = 건물 번호까지 · rough = 길 근처
  basis?: string | null;
  hoursNote?: string | null;
  statusNote?: string | null;
  lastEvidence?: string | null;
  lastEvidenceSource?: string | null;
  gapNotes?: string[];
  sources: string[];
};

// store 는 넣을 모양 그대로. missing 이 남아 있으면 바로 넣지 않고 「채워서 등록」으로 연다.
export type DatasetRow = { id: string; store: Partial<AdminStoreInput>; missing: string[]; research: Research };
export type Dataset = { id: string; title: string; at: string; who: string; doc: string; geocoder: string; stores: DatasetRow[] };

export const DATASETS: Dataset[] = [gangnam as Dataset];

export const getDataset = (id: string) => DATASETS.find((d) => d.id === id);

// 가게 id 로 리서치 근거 찾기 (가게 편집 화면 오른쪽 「리서치 근거」)
export function findResearch(storeId: string): { dataset: Dataset; row: DatasetRow } | undefined {
  for (const dataset of DATASETS) {
    const row = dataset.stores.find((r) => r.id === storeId);
    if (row) return { dataset, row };
  }
  return undefined;
}
