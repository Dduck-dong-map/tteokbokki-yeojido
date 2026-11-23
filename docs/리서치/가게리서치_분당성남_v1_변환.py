# 분당·성남 조사 엑셀 → 자료 묶음(stores-seongnam.json) 모양으로 바꾼다. 인자: 엑셀 경로, 출력 경로, (선택) 네이버 좌표 json
import openpyxl, json, re, sys
from datetime import date
SURVEYED = "2026-11-20"  # 조사일
src, out = sys.argv[1], sys.argv[2]
naver = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
ws = openpyxl.load_workbook(src, data_only=True)["가게 목록"]
rows = list(ws.iter_rows(values_only=True)); H = rows[0]
data = [dict(zip(H, r)) for r in rows[1:] if r[0] is not None]

GRADE = {"분식집": "bunsik", "떡볶이 전문": "specialist", "메뉴에 있음": "menu"}
STYLE = {"촉촉": "classic", "즉석": "instant", "짜장": "jjajang", "국물": "soup", "로제": "rose"}
RICE = {"밀떡": "wheat", "쌀떡": "rice", "가래떡": "garae"}
SIDES = {"순대": "sundae", "튀김": "twigim", "어묵": "eomuk", "김밥": "gimbap", "라볶이": "rabokki"}
USAGE = {"혼밥 가능": "solo", "포장": "takeout", "배달": "delivery", "주차": "parking"}
SHOP = {"시장": "market", "학교 앞": "school", "포장마차": "pojang"}
TASTE = {"달콤": "sweet", "단짠": "sweetsalty", "후추 맛": "pepper"}
GU = {"분당구": "bundang", "중원구": "jungwon", "수정구": "sujeong"}
CONF = {"높음": "high", "보통": "medium", "낮음": "low"}
GEO = {"번호": "building", "건물 이름": "building", "짧은 길": "rough", "큰길": "rough", "정류장": "rough"}
# 이미 운영 DB 에 있는 가게와 같아 보이는 줄 → 바로 넣지 않는다
DUP = {"sn-14": "운영 DB 의 수진분식(s-322630cb · 산성대로 204-5 F동 15-16호)과 같은 가게로 보임 — 같은 지하상가. 확인 필요"}
DAY = {"일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6}

def many(v, table):
    return [table[x.strip()] for x in str(v).split("·")] if v else []

def menu(v):
    items = [{"name": n.strip(" ,·"), "price": int(p.replace(",", ""))} for n, p in re.findall(r"(.+?)\s([\d,]+)원(?:,\s*|$)", v or "")]
    for m in items: assert 1 <= len(m["name"]) <= 40, m
    return items

def span(a, b):  # 「월~토」 → [1..6], 「화~일」 → [2..6,0]
    i, j, out = DAY[a], DAY[b], []
    while True:
        out.append(i)
        if i == j: break
        i = (i + 1) % 7
    return out

def hours(v):
    """앱은 요일 묶음 하나 + 시간 하나만 받는다 → 첫 시간대를 쓰고, 쉬는 요일을 뺀다. 나머지는 hoursNote 에 원문으로 남긴다."""
    if not v: return None
    if "24시간" in v: return {"days": list(range(7)), "open": "00:00", "close": "23:59"}
    t = re.search(r"(\d{1,2}):(\d{2})~(\d{1,2}):(\d{2})", v)
    if not t: return None
    o, c = f"{int(t[1]):02d}:{t[2]}", f"{int(t[3]):02d}:{t[4]}"
    if c == "24:00": c = "23:59"
    days = set()
    for a, b in re.findall(r"([일월화수목금토])~([일월화수목금토])", v): days |= set(span(a, b))
    if "평일" in v: days |= {1, 2, 3, 4, 5}
    if "주말" in v: days |= {0, 6}
    for d in re.findall(r"(?:^|[ ·,])([일월화수목금토])(?:·([일월화수목금토]))? \d", v): days |= {DAY[x] for x in d if x}
    if not days: days = set(range(7))
    off = re.search(r"((?:[일월화수목금토](?:요일)?[·,]?\s?)+)휴무", v)
    if off and "격주" not in v: days -= {DAY[x] for x in re.findall(r"[일월화수목금토]", off[1].replace("요일", ""))}
    return {"days": sorted(days), "open": o, "close": c}

def label(v):  # 가게 맵기 이름은 20자까지 → 설명은 빼고 앞머리만
    if not v: return None
    head = re.split(r"[(—,]", v)[0].strip()
    return head if 0 < len(head) <= 20 else None

stores = []
for d in data:
    state = d["정리 상태"]
    if not (state.startswith("바로 넣기") or state.startswith("빈 칸")): continue
    n = int(d["번호"]); sid = f"sn-{n:02d}"
    missing = [x.strip() for x in state.split(":")[1].split("·")] if ":" in state else []
    items = menu(d["메뉴"])
    price = int(d["대표 가격(원)"]) if d["대표 가격(원)"] else None
    if price:  # 대표 메뉴(대표 가격과 같은 떡볶이 줄)를 맨 앞에. 그런 줄이 없으면(인분 값으로 적은 가게) 순서를 그대로 둔다
        items.sort(key=lambda m: not (m["price"] == price and re.search(r"떡|볶이|쫄라", m["name"])))
    ev = d["최근 영업 근거일"]
    s = {"name": d["가게 이름"], "grade": GRADE[d["가게 종류"]], "address": d["주소"], "gu": GU[d["구"]], "dong": d["동"],
         "rice": many(d["떡"], RICE), "taste": many(d["맛 결"], TASTE)[:2], "sides": many(d["같이 먹기"], SIDES), "usage": many(d["이용"], USAGE),
         "menu": items, "lastConfirmedAt": ev}
    geo = naver.get(sid)
    # 「바로 넣기 가능」은 엑셀의 정리 상태를 그대로 따른다 (11-23). 아래 둘은 넣기를 막지 않고 메모(statusNote)로만 남긴다
    dup = DUP.get(sid)
    # 최근 영업 근거가 조사일 기준 180일(앱의 「바랜 도장」 기준)을 넘은 줄 — 바랜 도장으로 나오고 365일이 되면 목록에서 내려간다
    old = (date.fromisoformat(SURVEYED) - date.fromisoformat(d["최근 영업 근거일"])).days > 180
    if "핀" not in missing:
        s["lat"], s["lng"] = (geo["lat"], geo["lng"]) if geo else (float(d["위도"]), float(d["경도"]))
    if d["스타일"]: s["style"] = STYLE[d["스타일"]]
    if d["맵기(1~5)"]: s["spice"] = int(d["맵기(1~5)"])
    if label(d["가게 맵기 이름"]): s["spiceLabel"] = label(d["가게 맵기 이름"])
    if d["가게 유형"]: s["shopType"] = SHOP[d["가게 유형"]]
    if price: s["price"] = price; s["priceCheckedAt"] = d["가격 확인일"] or ev
    h = hours(d["영업시간"])
    if h: s["hours"] = h
    basis = " ".join(x for x in [d["근거 요약"], d["메모"], f"맵기 이름: {d['가게 맵기 이름']}" if d["가게 맵기 이름"] else None, "지역 체인" if d["체인"] else None] if x)
    stores.append({"id": sid, "store": s, "missing": missing, "research": {
        "confidence": CONF[d["신뢰도"]], "geo": "naver" if geo and "핀" not in missing else GEO[d["핀 정확도"]], "basis": basis,
        "hoursNote": " / ".join(x for x in [d["영업시간"], d["영업시간 메모"]] if x) or None, "statusNote": dup or (f"최근 영업 근거가 {d['최근 영업 근거일']} 로 오래됨 — 지금도 하는지 확인 필요" if old else None),
        "lastEvidence": ev, "lastEvidenceSource": d["최근 근거 링크"], "gapNotes": [f"빈 칸: {' · '.join(missing)}"] if missing else [],
        "sources": [x for x in re.split(r"[\s,]+", d["출처"] or "") if x.startswith("http")]}})
doc = {"id": "seongnam-v1", "title": "분당·성남 리서치 v1", "at": "2026-11-20", "who": "운영 · 분당·성남 리서치 v1",
       "doc": "docs/리서치/가게리서치_분당성남_v1_2026-11-20.xlsx",
       "geocoder": "네이버 지도 Geocoding (주소 → 좌표, 11-23) · 못 찾은 곳은 OpenStreetMap Nominatim (© OpenStreetMap contributors)" if naver else "OpenStreetMap Nominatim (© OpenStreetMap contributors)",
       "stores": stores}
json.dump(doc, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
ready = [r for r in stores if not r["missing"]]
print(len(stores), "곳 · 바로 넣기", len(ready))
for r in stores:
    s = r["store"]; h = s.get("hours")
    print(r["id"], "|", s["name"], "|", s.get("style"), s.get("spice"), s.get("price"), s.get("priceCheckedAt"), "|", f"{h['days']} {h['open']}~{h['close']}" if h else "-", "|", s["menu"][0] if s["menu"] else None, "|", s.get("spiceLabel"), "|", r["missing"])
