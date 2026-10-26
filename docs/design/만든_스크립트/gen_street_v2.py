# 떡볶여지도 확대 화면용 「실제 지도 자리」 예시 SVG (390×844)
# 네이버 지도 API가 들어갈 자리를 보여 주는 그림일 뿐, 실제 도로 모양이 아니다.
# 색은 네이버 스타일 편집기로 맞출 수 있는 항목(육지·도로·수계·녹지)만 바꾼다.
import math, random, os, sys

W, H = 390, 844
rnd = random.Random(2026)

def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")

def pl(pts):
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts)

# 강 북쪽 둑과 강변 큰길(위에서부터 큰길 → 공원 띠 → 둑 → 강)
bank = [(-20, 694), (120, 722), (260, 752), (410, 782)]
express = [(-20, 640), (120, 666), (260, 694), (410, 722)]

def y_on(line, x):
    for (x0, y0), (x1, y1) in zip(line, line[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return line[-1][1]

def on_land(x, y, margin=14):
    return y < y_on(express, x) - margin

main_roads = [
    [(410, 300), (-20, 522)],                                   # 큰길 1 (비스듬히)
    [(232, -20), (214, 200), (198, 410), (182, 620), (178, 660)],  # 큰길 2 (세로)
]
sub_roads = [
    [(-20, 252), (410, 160)],
    [(70, -20), (64, 300), (52, 560), (46, 650)],
    [(332, -20), (320, 280), (304, 560), (298, 700)],
    [(-20, 400), (120, 380), (200, 352)],
]

def family(angle, spacing, center, keep=0.72, seg=34):
    d = (math.cos(angle), math.sin(angle))
    n = (-d[1], d[0])
    lines = []
    for k in range(-26, 27):
        off = k * spacing + rnd.uniform(-6, 6)
        p0 = (center[0] + n[0] * off, center[1] + n[1] * off)
        t = -700
        cur = []
        while t < 700:
            a = (p0[0] + d[0] * t, p0[1] + d[1] * t)
            b = (p0[0] + d[0] * (t + seg), p0[1] + d[1] * (t + seg))
            ok = all(-30 < x < W + 30 and -30 < y < H + 30 and on_land(x, y) for x, y in (a, b))
            if ok and rnd.random() < keep:
                if not cur:
                    cur = [a]
                cur.append(b)
            else:
                if len(cur) > 1:
                    lines.append(cur)
                cur = []
            t += seg
        if len(cur) > 1:
            lines.append(cur)
    return lines

ang1 = math.atan2(522 - 300, -20 - 410)
ang2 = math.atan2(660 + 20, 178 - 232)
alleys = family(ang1, 40, (200, 380)) + family(ang2, 46, (200, 380), keep=0.66)

PAL = {
    "A":  dict(block="#E6DCC8", road="#FBF7EF", case="#D2C4AA", main="#FFFDF8", mainCase="#C8B795", express="#F3E9D6", water="#A9BFDA", park="#D9DDC4", bank="#2D5B9A"),
    "B":  dict(block="#E2E0D2", road="#FAFAF5", case="#C9CFC2", main="#FFFFFF", mainCase="#B8C0B3", express="#EFEEE6", water="#A9CCC2", park="#D4DFCF", bank="#2F6B62"),
    "C":  dict(block="#EBDDC2", road="#FDF7EB", case="#D8C29E", main="#FFFDF6", mainCase="#C9AE84", express="#F5E8CF", water="#A3B8CE", park="#DCDDBE", bank="#3E5F8A"),
    "D":  dict(block="#EEECE6", road="#FFFFFF", case="#DCD8D0", main="#FFFFFF", mainCase="#CBC6BD", express="#F6F5F1", water="#CFDBE6", park="#E2E8DE", bank="#6F8DB0"),
    "E":  dict(block="#1F2838", road="#2E3A50", case="#161D29", main="#3A4862", mainCase="#141A25", express="#485670", water="#22344D", park="#22302F", bank="#7FA6D6"),
    "N1": dict(block="#E9E9E6", road="#FFFFFF", case="#D3D3CF", main="#FFFFFF", mainCase="#C4C4BF", express="#F1F1EE", water="#BFD0E2", park="#DCE3DA", bank="#2D5B9A"),
    "N2": dict(block="#DFDFDC", road="#F7F7F5", case="#C9C9C5", main="#FCFCFB", mainCase="#B9B9B4", express="#EDEDEA", water="#BCC6CF", park="#D6DBD4", bank="#4A5560"),
    "N3": dict(block="#DEE3E8", road="#FAFBFC", case="#C6CED6", main="#FFFFFF", mainCase="#B5BFCA", express="#EEF1F4", water="#A9BED5", park="#D3DED8", bank="#1F3A5F"),
    "N4": dict(block="#DCE5E0", road="#FAFCFB", case="#C4D1CA", main="#FFFFFF", mainCase="#B2C2B9", express="#EDF2EF", water="#ACCAC2", park="#CFE0D4", bank="#2F6B62"),
    "N5": dict(block="#EFEFEF", road="#FFFFFF", case="#DEDEDE", main="#FFFFFF", mainCase="#D0D0D0", express="#F6F6F6", water="#D9E3EC", park="#E6ECE6", bank="#7A93AE"),
    "N6": dict(block="#242628", road="#34373B", case="#1A1B1D", main="#3E4247", mainCase="#18191B", express="#464A50", water="#22303F", park="#263029", bank="#6F93BE"),
}

def render(p):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    o.append(f'<rect width="{W}" height="{H}" fill="{p["block"]}"/>')
    # 공원 띠(강변 큰길과 둑 사이)
    o.append(f'<path d="{pl(express)} L{pl(bank[::-1])[1:]} Z" fill="{p["park"]}"/>')
    # 강
    o.append(f'<path d="{pl(bank)} L410 {H} L-20 {H} Z" fill="{p["water"]}"/>')
    o.append(f'<path d="{pl(bank)}" fill="none" stroke="{p["bank"]}" stroke-width="1.6" opacity="0.6"/>')
    # 작은 공원 하나
    o.append(f'<path d="M262 420 L318 404 L330 470 L276 488 Z" fill="{p["park"]}"/>')
    def strokes(lines, w, col):
        return "".join(f'<path d="{pl(l)}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>' for l in lines)
    o.append(strokes(alleys, 6.2, p["case"]))
    o.append(strokes(sub_roads, 11.5, p["case"]))
    o.append(strokes(main_roads, 17.5, p["mainCase"]))
    o.append(strokes([express], 21, p["mainCase"]))
    o.append(strokes(alleys, 4.2, p["road"]))
    o.append(strokes(sub_roads, 9, p["road"]))
    o.append(strokes(main_roads, 15, p["main"]))
    o.append(strokes([express], 18, p["express"]))
    o.append('</svg>')
    return "".join(o)

outdir = sys.argv[1] if len(sys.argv) > 1 else "."
for k, p in PAL.items():
    s = render(p)
    open(os.path.join(outdir, f"street_{k}.svg"), "w", encoding="utf-8").write(s)
    print(k, len(s), "bytes,", len(alleys), "alleys")
