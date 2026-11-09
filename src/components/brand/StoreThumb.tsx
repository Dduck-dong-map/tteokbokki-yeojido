// 목록의 사진 자리. 사진이 없으면 어묵 그림.
export function StoreThumb({ photo, size = 64 }: { photo?: string; size?: number }) {
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/api/photos/${photo}`} alt="" loading="lazy" style={{ width: size, height: size }} className="shrink-0 rounded-xl border border-line object-cover" />
  ) : (
    <div style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-xl border border-line bg-paper text-[22px]" aria-hidden="true">
      🍢
    </div>
  );
}
