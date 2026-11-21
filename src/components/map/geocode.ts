import { inKorea } from "@/lib/wiki";
import { NAVER_KEY, loadNaver } from "./realMap";

// 주소 → 좌표 (11-21 개발자 제안 「가게 이름이랑 주소 넣으면 핀 자동으로」).
// 네이버 지도 스크립트의 geocoder 서브모듈을 쓴다 → 지도와 같은 키 하나, 서버 비밀값 없음.
// 네이버 클라우드 콘솔의 지도 앱(Application)에서 Geocoding 을 켜야 답이 온다. 안 켜져 있으면 「못 찾음」(null)으로 끝난다.
// 키가 없으면(시험 · 로컬) canGeocode 가 false → 부르는 화면은 주소 찾기를 아예 보이지 않는다.

export const canGeocode = !!NAVER_KEY;

export type Found = { lat: number; lng: number; road?: string };

const WAIT_MS = 8000; // 네이버가 답을 안 주면 이만큼 기다리고 「못 찾음」

export async function geocode(address: string): Promise<Found | null> {
  const query = address.trim();
  if (!NAVER_KEY || query.length < 4) return null;
  try {
    const N = await loadNaver(NAVER_KEY);
    const S = N.Service;
    if (!S) return null;
    return await new Promise<Found | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), WAIT_MS);
      S.geocode({ query }, (status, res) => {
        clearTimeout(timer);
        const a = status === S.Status.OK ? res?.v2?.addresses?.[0] : undefined;
        const lat = Number(a?.y);
        const lng = Number(a?.x);
        resolve(a && inKorea(lat, lng) ? { lat, lng, road: a.roadAddress || undefined } : null);
      });
    });
  } catch {
    return null; // 스크립트를 못 받음 · 인증 실패 → 사람이 지도에서 맞춘다
  }
}
