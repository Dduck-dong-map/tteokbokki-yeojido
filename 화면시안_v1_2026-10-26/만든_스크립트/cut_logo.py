from PIL import Image
import numpy as np
src = Image.open(r"C:\Users\jltld\Documents\클로드\떡볶여지도\KakaoTalk_20261025_225207295.png").convert("RGB")
a = np.asarray(src).astype(np.int32)
R,G,B = a[...,0],a[...,1],a[...,2]
red = np.clip((R - (G+B)/2 - 25) * 3, 0, 255)          # 붓 빨강 마스크
lum = 0.299*R + 0.587*G + 0.114*B
ink = np.clip((150 - lum) * 2.4, 0, 255)                 # 먹 마스크(어두운 획만)

def kill_squiggle(mask, y0, y1):
    m = mask.copy()
    on = m > 12
    for x in range(m.shape[1]):
        col = on[:, x]
        y = y0
        while y < y1:
            if col[y]:
                s = y
                while y < m.shape[0] and col[y]: y += 1
                if y - s <= 4 and s >= y0: m[s:y, x] = 0
            else:
                y += 1
    return m

def clean_small(mask, min_area):
    from collections import deque
    on = mask > 60
    seen = np.zeros_like(on)
    H, W = on.shape
    out = mask.copy()
    for y in range(H):
        for x in range(W):
            if on[y,x] and not seen[y,x]:
                q = deque([(y,x)]); seen[y,x]=True; pts=[]
                while q:
                    cy,cx = q.popleft(); pts.append((cy,cx))
                    for dy,dx in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)):
                        ny,nx=cy+dy,cx+dx
                        if 0<=ny<H and 0<=nx<W and on[ny,nx] and not seen[ny,nx]:
                            seen[ny,nx]=True; q.append((ny,nx))
                if len(pts) < min_area:
                    for py,px in pts: out[py,px]=0
    return out

def save(mask, box, color, name, squig=None):
    x0,y0,x1,y1 = box
    m = mask[y0:y1, x0:x1].astype(np.float32)
    if squig: m = kill_squiggle(m, squig[0]-y0, squig[1]-y0)
    m[m < 45] = 0
    m = clean_small(m, 30)
    ys, xs = np.where(m > 30)
    m = m[max(ys.min()-6,0):ys.max()+7, max(xs.min()-6,0):xs.max()+7]
    h, w = m.shape
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[...,0], rgba[...,1], rgba[...,2] = color
    rgba[...,3] = np.clip(m, 0, 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(f"assets/{name}.png", optimize=True)
    print(name, w, h)

save(red, (60, 120, 640, 290), (192,0,0), "logo_red", squig=(236, 254))
save(red, (950, 650, 1310, 770), (192,0,0), "sign_red", squig=(740, 756))
save(ink, (60, 340, 1080, 610), (26,22,20), "slogan_ink")
