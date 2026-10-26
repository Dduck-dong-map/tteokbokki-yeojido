# 팔레트 v2 대비 계산(WCAG): 글자/면, 버튼 글자/주 버튼, 강조/윗줄, 제보 글자/제보 버튼, 흐린 글자/면, 도장 숫자/도장
def lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
def cr(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)
P = {
 "V1": dict(surface="#FBF7EF", bar="#F4EDE0", ink="#1A1614", ink3="#5C5046", primary="#C00000", onPrimary="#F6EFE3", accent="#C00000", fab="#C00000", onFab="#F6EFE3"),
 "A":  dict(surface="#FBF7EF", bar="#F4EDE0", ink="#1F1A17", ink3="#5C5046", primary="#2A2421", onPrimary="#F6EFE3", accent="#2D5B9A", fab="#2D5B9A", onFab="#F6F1E6"),
 "B":  dict(surface="#FAFAF5", bar="#F1F0E7", ink="#18211E", ink3="#52605A", primary="#2F6B62", onPrimary="#F3F8F5", accent="#2B6259", fab="#2F6B62", onFab="#F3F8F5"),
 "C":  dict(surface="#FDF7EB", bar="#F4E9D4", ink="#2A1D14", ink3="#6A5440", primary="#5A3A22", onPrimary="#FBF3E4", accent="#7A4A16", fab="#E3A93C", onFab="#2A1D14"),
 "D":  dict(surface="#FFFFFF", bar="#FFFFFF", ink="#151515", ink3="#666666", primary="#151515", onPrimary="#FFFFFF", accent="#151515", fab="#151515", onFab="#FFFFFF"),
 "E":  dict(surface="#1D2637", bar="#121925", ink="#F3ECDF", ink3="#A69E8F", primary="#F0A23A", onPrimary="#1A1206", accent="#F5B862", fab="#F0A23A", onFab="#1A1206"),
}
for k, p in P.items():
    print(k, "글자 %.1f" % cr(p["ink"], p["surface"]), "흐린 %.1f" % cr(p["ink3"], p["surface"]),
          "버튼 %.1f" % cr(p["onPrimary"], p["primary"]), "강조 %.1f" % cr(p["accent"], p["bar"]), "제보 %.1f" % cr(p["onFab"], p["fab"]))
S = {"v1": (["#A6521B","#BC3A12","#C00000","#9E0012","#6E0A0E"], ["#F6EFE3"]*5),
     "v2": (["#F2B78C","#E3814D","#C8102E","#8E0B1F","#4A0710"], ["#3A1408","#2E0F05","#FFF4E6","#FFF4E6","#FFF4E6"]),
     "밤": (["#F6C08A","#EE8752","#C92A30","#9C1430","#6C0E22"], ["#2B1006","#2B1006","#FFF4E6","#FFF4E6","#FFF4E6"])}
for k, (bg, fg) in S.items():
    print("도장", k, " ".join("%d:%.1f(L%.2f)" % (i+1, cr(b, f), lum(b)) for i, (b, f) in enumerate(zip(bg, fg))))
print("맵기태그 v2 %.1f" % cr("#9A0F25", "#F6DCD9"), "밤 %.1f" % cr("#FFB4AE", "#4A1E22"))
