# 떡볶여지도 지도 바탕 v2 — 팔레트별 색으로 같은 지형을 그린다 (지형 계산은 v1 gen_map.py 그대로)
# 산줄기 먹선 그물 · 쪽빛 물길 · 곧은 길 + 10리 점 · 첩 이음선 · 한지 바탕
import math, random

W, H = 390, 844
rnd = random.Random(1861)

def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")

def path_d(pts):
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts)

def smooth_d(pts):
    # Catmull-Rom → cubic bezier
    if len(pts) < 3:
        return path_d(pts)
    d = [f"M{f(pts[0][0])} {f(pts[0][1])}"]
    for i in range(len(pts) - 1):
        p0 = pts[i - 1] if i > 0 else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append(f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}")
    return "".join(d)

# ── 한강: 북쪽 둑(위)과 남쪽 둑(아래)
north_bank = [(-12, 468), (40, 500), (100, 538), (160, 566), (220, 590), (280, 612), (340, 630), (402, 646)]
south_bank = [(402, 760), (340, 744), (280, 728), (220, 708), (160, 686), (100, 662), (40, 630), (-12, 600)]

def in_river(x, y):
    # 북쪽 둑 아래면 강(화면 아래쪽은 전부 강 건너로 보고 그리지 않음)
    for (x0, y0), (x1, y1) in zip(north_bank, north_bank[1:]):
        if x0 <= x <= x1:
            t = (x - x0) / (x1 - x0)
            return y > y0 + (y1 - y0) * t - 6
    return False

def south_of_river(x, y):
    for (x0, y0), (x1, y1) in zip(south_bank[::-1], south_bank[::-1][1:]):
        if x0 <= x <= x1:
            t = (x - x0) / (x1 - x0)
            return y > y0 + (y1 - y0) * t + 6
    return False

def land(x, y):
    return (not in_river(x, y)) or south_of_river(x, y)

# ── 먹선 그물(산줄기·물줄기): 갈래 치는 무작위 선
def walk(x, y, ang, length, step=3.2, curl=0.22):
    pts = [(x, y)]
    turn = 0.0
    for _ in range(int(length / step)):
        turn = turn * 0.7 + rnd.uniform(-curl, curl)
        ang += turn
        x += math.cos(ang) * step
        y += math.sin(ang) * step
        if not (-8 < x < W + 8 and -8 < y < H + 8) or not land(x, y):
            break
        pts.append((x, y))
    return pts, ang

def tree(x, y, ang, length, depth, out, widths, curl=0.13):
    pts, _ = walk(x, y, ang, length, curl=curl)
    if len(pts) < 3:
        return
    out.append((depth, pts))
    if depth >= len(widths) - 1:
        return
    n = len(pts)
    side = rnd.choice((-1, 1))
    i = rnd.randint(1, 3)
    while i < n - 2:
        px, py = pts[i]
        qx, qy = pts[i + 1]
        base = math.atan2(qy - py, qx - px)
        taper = 1 - i / n
        tree(px, py, base + side * rnd.uniform(0.75, 1.05), length * (0.22 + 0.3 * taper) * rnd.uniform(0.8, 1.2),
             depth + 1, out, widths, curl)
        side = -side
        i += rnd.randint(2, 3)

# ── 이름 있는 산(산줄기 등마루)
mountains = {
    "안산": [(286, 22), (312, 40), (340, 62), (366, 92), (398, 118)],
    "성미산": [(26, 232), (44, 246), (62, 262), (78, 282)],
    "와우산": [(222, 380), (232, 398), (240, 418), (246, 440)],
    "노고산": [(286, 372), (298, 386), (310, 400), (322, 414)],
}
ridge_paths = [smooth_d(p) for p in mountains.values()]

# ── 홍제천(쪽빛 물길)
hongje = [(208, -10), (200, 40), (192, 100), (176, 160), (158, 214), (134, 268), (108, 318), (84, 366), (60, 420), (40, 470), (24, 492)]


# ── 먹선 그물: 높낮이를 만들고 물이 흘러내리는 갈래(물줄기 = 산줄기 사이)를 그린다
def seg_dist(px, py, pts):
    best = 1e9
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        dx, dy = x1 - x0, y1 - y0
        t = max(0, min(1, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy)))
        best = min(best, math.hypot(px - x0 - t * dx, py - y0 - t * dy))
    return best

GR = 12
noise_grid = {}
def vnoise(x, y, scale, seed):
    gx0, gy0 = math.floor(x / scale), math.floor(y / scale)
    tx, ty = x / scale - gx0, y / scale - gy0
    def g(i, j):
        key = (i, j, seed)
        if key not in noise_grid:
            noise_grid[key] = random.Random(hash(key)).random()
        return noise_grid[key]
    sx, sy = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
    a = g(gx0, gy0) + (g(gx0 + 1, gy0) - g(gx0, gy0)) * sx
    b = g(gx0, gy0 + 1) + (g(gx0 + 1, gy0 + 1) - g(gx0, gy0 + 1)) * sx
    return a + (b - a) * sy

def height(x, y):
    h = 26 * vnoise(x, y, 70, 1) + 12 * vnoise(x, y, 28, 2) + 5 * vnoise(x, y, 11, 3)
    water = min(seg_dist(x, y, north_bank), seg_dist(x, y, hongje))
    h += 0.09 * water
    for p in mountains.values():
        d = seg_dist(x, y, p)
        h += 30 * math.exp(-d * d / (2 * 22 * 22))
    return h

SP = 6.5
nodes = {}
for j in range(-1, int(H / SP) + 2):
    for i in range(-1, int(W / SP) + 2):
        x = i * SP + rnd.uniform(-2.2, 2.2)
        y = j * SP + rnd.uniform(-2.2, 2.2)
        if land(x, y):
            nodes[(i, j)] = (x, y, height(x, y))
down = {}
for (i, j), (x, y, h) in nodes.items():
    best, bh = None, h
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            k = (i + di, j + dj)
            if k in nodes and k != (i, j):
                nh = nodes[k][2] + 0.0001 * rnd.random()
                if nh < bh:
                    best, bh = k, nh
    if best:
        down[(i, j)] = best
acc = {k: 1 for k in nodes}
for k in sorted(nodes, key=lambda k: -nodes[k][2]):
    if k in down:
        acc[down[k]] += acc[k]
texture = []
for k, d in down.items():
    a_ = acc[k]
    if a_ < 2:
        continue
    w = min(0.32 + 0.24 * math.log2(a_), 2.0)
    texture.append((w, nodes[k][:2], nodes[d][:2]))

# ── 큰길: 곧은 선 + 일정 간격 점(대동여지도 10리 표시)
N = dict(S=(262, 300), E=(330, 290), A=(402, 302), H=(190, 330), J=(125, 470), M=(55, 400),
         SS=(205, 520), SG=(300, 548), YH=(232, 168), T=(244, -10), WN=(-12, 240), WM=(-12, 372), R=(402, 566))
roads = [("S", "E"), ("E", "A"), ("H", "S"), ("J", "H"), ("M", "J"), ("J", "SS"), ("SS", "SG"), ("SG", "R"),
         ("S", "YH"), ("YH", "T"), ("H", "WN"), ("M", "WM")]
stations = ["S", "E", "H", "J", "M", "SS", "SG"]

# ── 물결 위치는 한 번만 뽑는다(팔레트마다 같은 그림이 되게)
waves = []
for i in range(26):
    t = rnd.random()
    x = -10 + t * 410
    ytop = None
    for (x0, y0), (x1, y1) in zip(north_bank, north_bank[1:]):
        if x0 <= x <= x1:
            ytop = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    if ytop is None:
        continue
    waves.append((x, ytop + rnd.uniform(18, 96)))

# ── 팔레트별 지도 색
# fiber/blot = 종이 결·얼룩 색(0~1), ink_op = 먹선 진하기 배율
PAL = {
    "A": dict(bg="#ECE3D1", tones=["#EFE7D6", "#E9DFCB", "#EDE4D2", "#E7DCC7", "#F0E9DA", "#EAE0CD"],
              fiber=(0.36, 0.28, 0.2), fiber_op=0.5, blot=(0.55, 0.45, 0.3), blot_a=0.55,
              ink="#3E2F23", ink_op=1.0, ridge="#2E231B", water="#87A3C9", wave="#6E8FBA",
              island="#ECE3D1", bank="#2D5B9A", road="#33261C", station="#F3ECDD", seam="#8C7B63"),
    "B": dict(bg="#E8E6D8", tones=["#ECEADD", "#E5E3D4", "#EAE8DA", "#E3E1D1", "#EEECE0", "#E7E5D6"],
              fiber=(0.3, 0.33, 0.3), fiber_op=0.45, blot=(0.45, 0.5, 0.45), blot_a=0.5,
              ink="#34413B", ink_op=0.95, ridge="#26322D", water="#A3C7BC", wave="#77A898",
              island="#E8E6D8", bank="#2F6B62", road="#2B3631", station="#EFEEE3", seam="#8A9488"),
    "C": dict(bg="#F0E3C8", tones=["#F3E7CE", "#EDDFC2", "#F1E4CA", "#EBDCBE", "#F5EAD3", "#EEE0C5"],
              fiber=(0.42, 0.3, 0.18), fiber_op=0.5, blot=(0.6, 0.45, 0.25), blot_a=0.55,
              ink="#4A3222", ink_op=1.0, ridge="#3A2618", water="#93AAC2", wave="#6F8CAE",
              island="#F0E3C8", bank="#3E5F8A", road="#3B2A1C", station="#F6ECD8", seam="#9A8466"),
    "D": dict(bg="#F4F2EC", tones=["#F6F4EF", "#F1EFE8", "#F5F3ED", "#EFEDE6", "#F7F6F1", "#F2F0EA"],
              fiber=(0.5, 0.5, 0.48), fiber_op=0.25, blot=(0.6, 0.58, 0.55), blot_a=0.25,
              ink="#6E6A63", ink_op=0.6, ridge="#57534D", water="#C8D5E2", wave="#A9BCD0",
              island="#F4F2EC", bank="#6F8DB0", road="#4A4743", station="#FFFFFF", seam="#C9C4BA"),
    "E": dict(bg="#1A2231", tones=["#1C2434", "#18202E", "#1B2332", "#171F2C", "#1D2636", "#192130"],
              fiber=(0.75, 0.72, 0.65), fiber_op=0.18, blot=(0.02, 0.04, 0.1), blot_a=0.5,
              ink="#CBBF9F", ink_op=0.62, ridge="#D8CCAE", water="#27405F", wave="#3C5C84",
              island="#1A2231", bank="#7FA6D6", road="#D6CBB3", station="#1A2231", seam="#3A4660"),
}

# ── 붉은 기를 뺀 중립 팔레트(10-26 사용자: 「배경에 붉은 기가 들어가 있다」)
PAL.update({
    "N1": dict(bg="#F2F2EF", tones=["#F4F4F1", "#EFEFEC", "#F3F3F0", "#EDEDEA", "#F5F5F3", "#F0F0ED"],
               fiber=(0.4, 0.4, 0.4), fiber_op=0.35, blot=(0.5, 0.5, 0.5), blot_a=0.35,
               ink="#4A4A47", ink_op=0.9, ridge="#3A3A38", water="#AFC3D9", wave="#8EA8C6",
               island="#F2F2EF", bank="#2D5B9A", road="#2E2E2D", station="#FAFAF8", seam="#B9B9B4"),
    "N2": dict(bg="#E6E6E4", tones=["#E9E9E7", "#E3E3E1", "#E8E8E6", "#E1E1DF", "#EAEAE8", "#E4E4E2"],
               fiber=(0.35, 0.35, 0.35), fiber_op=0.4, blot=(0.45, 0.45, 0.45), blot_a=0.4,
               ink="#3C3C3A", ink_op=1.0, ridge="#2A2A29", water="#B7C2CC", wave="#95A3B0",
               island="#E6E6E4", bank="#4A5560", road="#222221", station="#F2F2F0", seam="#AFAFAA"),
    "N3": dict(bg="#E7EBEF", tones=["#EAEEF2", "#E4E8EC", "#E9EDF1", "#E2E6EA", "#ECEFF3", "#E5E9ED"],
               fiber=(0.33, 0.36, 0.4), fiber_op=0.35, blot=(0.45, 0.5, 0.56), blot_a=0.38,
               ink="#3F4A56", ink_op=0.95, ridge="#2C3540", water="#9FB6CF", wave="#7F9BBA",
               island="#E7EBEF", bank="#1F3A5F", road="#1F2933", station="#F5F7F9", seam="#AEB7C1"),
    "N4": dict(bg="#E5ECE8", tones=["#E8EFEB", "#E2E9E5", "#E7EEEA", "#E0E7E3", "#EAF0EC", "#E3EAE6"],
               fiber=(0.32, 0.38, 0.35), fiber_op=0.35, blot=(0.44, 0.52, 0.48), blot_a=0.38,
               ink="#3B4A43", ink_op=0.95, ridge="#2A3731", water="#A6C6BE", wave="#80AA9F",
               island="#E5ECE8", bank="#2F6B62", road="#22302A", station="#F4F7F5", seam="#AAB8B0"),
    "N5": dict(bg="#F7F7F7", tones=["#F8F8F8", "#F5F5F5", "#F7F7F7", "#F4F4F4", "#F9F9F9", "#F6F6F6"],
               fiber=(0.5, 0.5, 0.5), fiber_op=0.15, blot=(0.6, 0.6, 0.6), blot_a=0.15,
               ink="#8A8A8A", ink_op=0.5, ridge="#6E6E6E", water="#D3DEE9", wave="#B4C5D6",
               island="#F7F7F7", bank="#7A93AE", road="#4D4D4D", station="#FFFFFF", seam="#D6D6D6"),
    "N6": dict(bg="#1C1D1F", tones=["#1E1F21", "#1A1B1D", "#1D1E20", "#191A1C", "#1F2022", "#1B1C1E"],
               fiber=(0.8, 0.8, 0.8), fiber_op=0.12, blot=(0.02, 0.02, 0.03), blot_a=0.45,
               ink="#BDBDBD", ink_op=0.55, ridge="#D0D0D0", water="#2B3A4C", wave="#41566E",
               island="#1C1D1F", bank="#6F93BE", road="#CFCFCF", station="#1C1D1F", seam="#3A3C40"),
})

def render(p):
    out = []
    out.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">')
    fr, fg, fb = p["fiber"]
    br, bg_, bb = p["blot"]
    out.append('<defs>'
               '<filter id="fiber" x="0" y="0" width="100%" height="100%">'
               '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>'
               f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 {fr}  0 0 0 0 {fg}  0 0 0 0 {fb}  0 0 0 -1.6 1.02"/>'
               '</filter>'
               '<filter id="blot" x="0" y="0" width="100%" height="100%">'
               '<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="3" result="n"/>'
               f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 {br}  0 0 0 0 {bg_}  0 0 0 0 {bb}  0 0 0 {p["blot_a"]} -0.18"/>'
               '</filter>'
               '</defs>')
    out.append(f'<rect width="{W}" height="{H}" fill="{p["bg"]}"/>')
    cols, rows = [0, 130, 260, W], [0, 211, 422, 633, H]
    k = 0
    for r in range(4):
        for c in range(3):
            out.append(f'<rect x="{cols[c]}" y="{rows[r]}" width="{cols[c+1]-cols[c]}" height="{rows[r+1]-rows[r]}" fill="{p["tones"][(k*5+r) % 6]}"/>')
            k += 1
    out.append(f'<rect width="{W}" height="{H}" filter="url(#blot)"/>')
    out.append(f'<rect width="{W}" height="{H}" filter="url(#fiber)" opacity="{p["fiber_op"]}"/>')
    buckets = {}
    for w, (x0, y0), (x1, y1) in texture:
        key = round(w * 4) / 4
        buckets.setdefault(key, []).append(f"M{f(x0)} {f(y0)}L{f(x1)} {f(y1)}")
    for w in sorted(buckets):
        op = min(0.24 + w * 0.2, 0.6) * p["ink_op"]
        out.append(f'<path d="{"".join(buckets[w])}" fill="none" stroke="{p["ink"]}" stroke-width="{w}" stroke-linecap="round" opacity="{op:.2f}"/>')
    out.append(f'<g fill="none" stroke="{p["ridge"]}" stroke-linecap="round" opacity="{0.55 * p["ink_op"]:.2f}">')
    for d in ridge_paths:
        out.append(f'<path d="{d}" stroke-width="1.8"/>')
    out.append('</g>')
    out.append(f'<path d="{smooth_d(north_bank)} L{f(south_bank[0][0])} {f(south_bank[0][1])} {smooth_d(south_bank)[1:].replace("M", "L", 1)} Z" fill="{p["water"]}"/>')
    out.append(f'<g fill="none" stroke="{p["wave"]}" stroke-width="0.9" stroke-linecap="round" opacity="0.9">')
    for x, y in waves:
        out.append(f'<path d="M{f(x)} {f(y)} q4 -3 8 0 t8 0 t8 0"/>')
    out.append('</g>')
    out.append(f'<g fill="{p["island"]}" stroke="{p["bank"]}" stroke-width="1.6">'
               '<ellipse cx="318" cy="688" rx="20" ry="7" transform="rotate(17 318 688)"/>'
               '<ellipse cx="34" cy="560" rx="13" ry="6" transform="rotate(30 34 560)"/>'
               '</g>')
    out.append(f'<g fill="none" stroke="{p["bank"]}" stroke-linecap="round">')
    for bank in (north_bank, south_bank):
        out.append(f'<path d="{smooth_d(bank)}" stroke-width="2.4"/>')
        shifted = [(x, y + (4 if bank is north_bank else -4)) for x, y in bank]
        out.append(f'<path d="{smooth_d(shifted)}" stroke-width="0.8" opacity="0.7"/>')
    out.append('</g>')
    out.append(f'<path d="{smooth_d(hongje)}" fill="none" stroke="{p["bank"]}" stroke-width="1.9" stroke-linecap="round"/>')
    out.append(f'<path d="{smooth_d([(x + 2.6, y + 1) for x, y in hongje])}" fill="none" stroke="{p["bank"]}" stroke-width="0.7" opacity="0.7"/>')
    out.append(f'<g fill="none" stroke="{p["road"]}" stroke-linecap="round">')
    for a, b in roads:
        (x0, y0), (x1, y1) = N[a], N[b]
        out.append(f'<path d="M{x0} {y0} L{x1} {y1}" stroke-width="1.35"/>')
        out.append(f'<path d="M{x0} {y0} L{x1} {y1}" stroke-width="3.6" stroke-dasharray="0 30"/>')
    out.append('</g>')
    out.append(f'<g fill="{p["station"]}" stroke="{p["road"]}" stroke-width="1.3">')
    for s in stations:
        x, y = N[s]
        out.append(f'<circle cx="{x}" cy="{y}" r="5"/>')
        out.append(f'<circle cx="{x}" cy="{y}" r="2" fill="{p["road"]}" stroke="none"/>')
    out.append('</g>')
    out.append(f'<g stroke="{p["seam"]}" stroke-width="0.8" opacity="0.55">')
    for x in cols[1:-1]:
        out.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{H}"/>')
    for y in rows[1:-1]:
        out.append(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>')
    out.append('</g>')
    out.append('</svg>')
    return "\n".join(out)

import os, sys
outdir = sys.argv[1] if len(sys.argv) > 1 else "."
for key, p in PAL.items():
    svg = render(p)
    open(os.path.join(outdir, f"map_{key}.svg"), "w", encoding="utf-8").write(svg)
    print(key, len(svg), "bytes")
