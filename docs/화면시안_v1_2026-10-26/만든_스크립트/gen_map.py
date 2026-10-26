# 떡볶여지도 지도 바탕(마포·서대문 일부) — 대동여지도 느낌 SVG
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

out = []
out.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">')
out.append('<defs>'
           '<filter id="fiber" x="0" y="0" width="100%" height="100%">'
           '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n"/>'
           '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.36  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 -1.6 1.02"/>'
           '</filter>'
           '<filter id="blot" x="0" y="0" width="100%" height="100%">'
           '<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" seed="3" result="n"/>'
           '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0.55 -0.18"/>'
           '</filter>'
           '</defs>')
# 한지 바탕 + 첩(이어 붙인 종이) 톤 차이
out.append(f'<rect width="{W}" height="{H}" fill="#ECE3D1"/>')
tones = ["#EFE7D6", "#E9DFCB", "#EDE4D2", "#E7DCC7", "#F0E9DA", "#EAE0CD"]
cols, rows = [0, 130, 260, W], [0, 211, 422, 633, H]
k = 0
for r in range(4):
    for c in range(3):
        out.append(f'<rect x="{cols[c]}" y="{rows[r]}" width="{cols[c+1]-cols[c]}" height="{rows[r+1]-rows[r]}" fill="{tones[(k*5+r) % len(tones)]}"/>')
        k += 1
out.append(f'<rect width="{W}" height="{H}" filter="url(#blot)"/>')
out.append(f'<rect width="{W}" height="{H}" filter="url(#fiber)" opacity="0.5"/>')

# 먹선 그물(굵기별로 묶어서)
buckets = {}
for w, (x0, y0), (x1, y1) in texture:
    key = round(w * 4) / 4
    buckets.setdefault(key, []).append(f"M{f(x0)} {f(y0)}L{f(x1)} {f(y1)}")
for w in sorted(buckets):
    op = min(0.24 + w * 0.2, 0.6)
    out.append(f'<path d="{"".join(buckets[w])}" fill="none" stroke="#3E2F23" stroke-width="{w}" stroke-linecap="round" opacity="{op:.2f}"/>')

# 이름 있는 산 등마루
out.append('<g fill="none" stroke="#2E231B" stroke-linecap="round" opacity="0.55">')
for d in ridge_paths:
    out.append(f'<path d="{d}" stroke-width="1.8"/>')
out.append('</g>')

# 한강
river = north_bank + south_bank
out.append(f'<path d="{smooth_d(north_bank)} L{f(south_bank[0][0])} {f(south_bank[0][1])} {smooth_d(south_bank)[1:].replace("M", "L", 1)} Z" fill="#87A3C9"/>')
# 물결
out.append('<g fill="none" stroke="#6E8FBA" stroke-width="0.9" stroke-linecap="round" opacity="0.9">')
for i in range(26):
    t = rnd.random()
    x = -10 + t * 410
    ytop = None
    for (x0, y0), (x1, y1) in zip(north_bank, north_bank[1:]):
        if x0 <= x <= x1:
            ytop = y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    if ytop is None:
        continue
    y = ytop + rnd.uniform(18, 96)
    out.append(f'<path d="M{f(x)} {f(y)} q4 -3 8 0 t8 0 t8 0"/>')
out.append('</g>')
# 밤섬·선유도
out.append('<g fill="#ECE3D1" stroke="#2D5B9A" stroke-width="1.6">'
           '<ellipse cx="318" cy="688" rx="20" ry="7" transform="rotate(17 318 688)"/>'
           '<ellipse cx="34" cy="560" rx="13" ry="6" transform="rotate(30 34 560)"/>'
           '</g>')
# 둑 두 줄
out.append('<g fill="none" stroke="#2D5B9A" stroke-linecap="round">')
for bank in (north_bank, south_bank):
    out.append(f'<path d="{smooth_d(bank)}" stroke-width="2.4"/>')
    shifted = [(x, y + (4 if bank is north_bank else -4)) for x, y in bank]
    out.append(f'<path d="{smooth_d(shifted)}" stroke-width="0.8" opacity="0.7"/>')
out.append('</g>')

# 홍제천
out.append(f'<path d="{smooth_d(hongje)}" fill="none" stroke="#2D5B9A" stroke-width="1.9" stroke-linecap="round"/>')
out.append(f'<path d="{smooth_d([(x + 2.6, y + 1) for x, y in hongje])}" fill="none" stroke="#2D5B9A" stroke-width="0.7" opacity="0.7"/>')

# 큰길 + 점
out.append('<g fill="none" stroke="#33261C" stroke-linecap="round">')
for a, b in roads:
    (x0, y0), (x1, y1) = N[a], N[b]
    out.append(f'<path d="M{x0} {y0} L{x1} {y1}" stroke-width="1.35"/>')
    out.append(f'<path d="M{x0} {y0} L{x1} {y1}" stroke-width="3.6" stroke-dasharray="0 30"/>')
out.append('</g>')
# 역참(동그라미)
out.append('<g fill="#F3ECDD" stroke="#33261C" stroke-width="1.3">')
for s in stations:
    x, y = N[s]
    out.append(f'<circle cx="{x}" cy="{y}" r="5"/>')
    out.append(f'<circle cx="{x}" cy="{y}" r="2" fill="#33261C" stroke="none"/>')
out.append('</g>')

# 첩 이음선
out.append('<g stroke="#8C7B63" stroke-width="0.8" opacity="0.55">')
for x in cols[1:-1]:
    out.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{H}"/>')
for y in rows[1:-1]:
    out.append(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>')
out.append('</g>')
out.append('</svg>')

open("assets/map_mapo.svg", "w", encoding="utf-8").write("\n".join(out))
print("ok", len(texture), "strokes,", sum(len(s) for s in out), "bytes")
