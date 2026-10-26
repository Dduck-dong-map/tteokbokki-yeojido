# 중립 팔레트 점검: 바탕의 붉은 기(a*)·누런 기(b*)와 글자 대비
import math
def srgb(h):
    h = h.lstrip("#"); return [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
def lin(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def lum(h):
    r, g, b = map(lin, srgb(h)); return 0.2126*r + 0.7152*g + 0.0722*b
def cr(a, b):
    x, y = sorted((lum(a), lum(b)), reverse=True); return (x + .05) / (y + .05)
def lab(h):
    r, g, b = map(lin, srgb(h))
    X = (0.4124*r + 0.3576*g + 0.1805*b) / 0.95047
    Y = (0.2126*r + 0.7152*g + 0.0722*b)
    Z = (0.0193*r + 0.1192*g + 0.9505*b) / 1.08883
    f = lambda t: t ** (1/3) if t > 0.008856 else 7.787*t + 16/116
    return 116*f(Y) - 16, 500*(f(X) - f(Y)), 200*(f(Y) - f(Z))
ref = {"v1 한지 바탕": "#ECE3D1", "v1 윗줄·메뉴": "#F4EDE0", "v1 카드": "#FBF7EF"}
for k, h in ref.items():
    L, a, b = lab(h); print(f"{k} {h}  a*={a:+.1f} b*={b:+.1f}")
P = {
 "N1": dict(bg="#F2F2EF", bar="#FAFAF8", surface="#FFFFFF", ink="#1C1C1B", ink3="#62625F", primary="#232323", onPrimary="#FFFFFF", accent="#2D5B9A", fab="#2D5B9A", onFab="#FFFFFF"),
 "N2": dict(bg="#E6E6E4", bar="#F4F4F2", surface="#FCFCFB", ink="#161616", ink3="#5B5B58", primary="#161616", onPrimary="#FFFFFF", accent="#161616", fab="#161616", onFab="#FFFFFF"),
 "N3": dict(bg="#E7EBEF", bar="#F5F7F9", surface="#FBFCFD", ink="#141B23", ink3="#566270", primary="#1F3A5F", onPrimary="#FFFFFF", accent="#2D5B9A", fab="#1F3A5F", onFab="#FFFFFF"),
 "N4": dict(bg="#E5ECE8", bar="#F4F7F5", surface="#FBFCFB", ink="#14201B", ink3="#54655C", primary="#24574F", onPrimary="#FFFFFF", accent="#2B6259", fab="#24574F", onFab="#FFFFFF"),
 "N5": dict(bg="#F7F7F7", bar="#FFFFFF", surface="#FFFFFF", ink="#111111", ink3="#666666", primary="#111111", onPrimary="#FFFFFF", accent="#2D5B9A", fab="#111111", onFab="#FFFFFF"),
 "N6": dict(bg="#1C1D1F", bar="#141516", surface="#242628", ink="#EDEDED", ink3="#9C9C9C", primary="#EDEDED", onPrimary="#141516", accent="#8FB4E0", fab="#8FB4E0", onFab="#141516"),
}
for k, p in P.items():
    L, a, b = lab(p["bg"])
    print(f"{k} bg {p['bg']} a*={a:+.1f} b*={b:+.1f} | 글자 {cr(p['ink'], p['surface']):.1f} 흐린 {cr(p['ink3'], p['surface']):.1f} 버튼 {cr(p['onPrimary'], p['primary']):.1f} 강조 {cr(p['accent'], p['bar']):.1f} 제보 {cr(p['onFab'], p['fab']):.1f}")
