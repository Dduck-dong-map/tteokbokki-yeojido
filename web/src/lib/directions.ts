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
