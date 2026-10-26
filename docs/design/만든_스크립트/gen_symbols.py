# 떡볶여지도 보드(design/index.html)용 「색을 바꿀 수 있는 지도」 만들기
# gen_map_v2 · gen_street_v2 의 지형을 그대로 쓰고, 색 자리를 CSS 변수(var(--paper) 등)로 바꿔
# index.html 의 <!--MAPS:START--> ~ <!--MAPS:END--> 사이에 <symbol> 두 개로 넣는다.
# 사용: python -I gen_symbols.py   (이 폴더에서)
import os, re, sys, runpy, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
BOARD = os.path.join(HERE, "..", "index.html")
tmp = tempfile.mkdtemp()

def load(name):
    old = sys.argv
    sys.argv = [name, tmp]           # 원래 스크립트의 팔레트별 파일은 임시 폴더로
    try:
        return runpy.run_path(os.path.join(HERE, name))
    finally:
        sys.argv = old

def to_style(svg):
    # 표시 속성에는 var() 를 못 쓰므로 fill/stroke="var(..)" 를 한 개의 style 속성으로 옮긴다
    def tag(mo):
        t = mo.group(0)
        props = re.findall(r'\s(fill|stroke)="(var\([^)]*\))"', t)
        if not props:
            return t
        t = re.sub(r'\s(fill|stroke)="var\([^)]*\)"', "", t)
        name = re.match(r"<([a-zA-Z]+)", t).group(1)
        style = ";".join(f"{k}:{v}" for k, v in props)
        return "<" + name + f' style="{style}"' + t[len(name) + 1:]
    return re.sub(r"<[a-zA-Z][^>]*>", tag, svg)

m = load("gen_map_v2.py")
draw = m["render"](dict(
    bg="var(--paper)",
    tones=["rgba(255,255,255,0.22)", "rgba(0,0,0,0.035)", "rgba(255,255,255,0.12)", "rgba(0,0,0,0.05)", "rgba(255,255,255,0.28)", "rgba(0,0,0,0.02)"],
    fiber=(0.4, 0.4, 0.4), fiber_op=0.3, blot=(0.5, 0.5, 0.5), blot_a=0.3,
    ink="var(--m-ink)", ink_op=0.9, ridge="var(--m-ink2)", water="var(--m-water)", wave="var(--m-wave)",
    island="var(--paper)", bank="var(--m-bank)", road="var(--m-road)", station="var(--paper)", seam="var(--m-seam)"))
s = load("gen_street_v2.py")
street = s["render"](dict(
    block="var(--s-block)", road="var(--s-road)", case="var(--s-case)", main="var(--s-main)", mainCase="var(--s-maincase)",
    express="var(--s-express)", water="var(--m-water)", park="var(--s-park)", bank="var(--m-bank)"))

defs = re.search(r"<defs>(.*?)</defs>", draw, re.S).group(1)
draw_body = re.search(r"</defs>(.*)</svg>", draw, re.S).group(1)
street_body = re.search(r"<svg[^>]*>(.*)</svg>", street, re.S).group(1)
block = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + defs + "</defs>"
         '<symbol id="map-draw" viewBox="0 0 390 844">' + to_style(draw_body) + "</symbol>"
         '<symbol id="map-street" viewBox="0 0 390 844">' + to_style(street_body) + "</symbol></svg>")
assert 'fill="var(' not in block and 'stroke="var(' not in block

html = open(BOARD, encoding="utf-8").read()
a, b = html.index("<!--MAPS:START-->"), html.index("<!--MAPS:END-->")
html = html[:a] + "<!--MAPS:START-->" + block + html[b:]
open(BOARD, "w", encoding="utf-8").write(html)
print("maps", len(block), "chars ->", os.path.normpath(BOARD))
