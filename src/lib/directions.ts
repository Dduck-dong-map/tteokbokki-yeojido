import type { Store } from "./types";

// 길찾기는 직접 만들지 않고 네이버·카카오 지도로 넘긴다 (기획안 5절).
// 카카오: 공식 「지도 URL」 링크. 네이버: 웹 지도 검색 링크(앱이 깔려 있으면 앱이 받는다).
// 실제 가게가 들어오면 휴대폰에서 두 링크가 제대로 열리는지 확인한다.

export function kakaoDirections(s: Pick<Store, "name" | "lat" | "lng">) {
  return `https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}`;
}

export function naverDirections(s: Pick<Store, "name" | "address">) {
  return `https://map.naver.com/p/search/${encodeURIComponent(`${s.name} ${s.address}`)}`;
}

// 등록할 때 「네이버 지도에서 확인하기」: 아직 좌표가 없는 가게를 이름(+주소)으로 찾는다.
// 영업시간 · 메뉴 가격은 네이버가 밖으로 내주지 않아, 사람이 열어 보고 적는다 (11-21). 이름이 없으면 링크를 만들지 않는다.
export function naverLookup(name: string, address = ""): string | null {
  const q = `${name.trim()} ${address.trim()}`.trim();
  return name.trim() ? `https://map.naver.com/p/search/${encodeURIComponent(q)}` : null;
}
