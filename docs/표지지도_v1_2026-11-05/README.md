# 앱 표지 지도 시안 v1 (2026-11-05)

사용자 11-05: 「첫 화면에 사용할 대동여지도 느낌의 지도 이미지」. 사용자 답: 앱을 열 때 1~2초 뜨는 표지 · 한반도 전체. 웹 첫 화면의 움직이는 지도는 그대로 두고, 그 앞에 뜨는 그림이다.

보는 곳: 화면 설계 보드 `127.0.0.1:8765/design/index.html?focus=ch_v3` (CH-12). 웹에는 아직 넣지 않았다.

| 파일 | 모델 | 참고 | 크레딧 |
| --- | --- | --- | --- |
| 표지지도_a_한반도전체_v01.png (768×1376) | 나노 바나나 2.1 1k 9:16 | `../참고_대동여지도.jpg` | 50 |

모델 비교(simulate_cost, 장당): GPT 2.5 저화질 15(11-02 비교에서 윤곽 약함) · 나노 바나나 2.1 1k 50 / 2k 65 · 나노 바나나 프로 1k·2k 75(11-02 에서 참고 그림을 베끼는 경향) · GPT 2.5 중간 2k 65.

## 점검 결과

- 맞게 나온 것: 해안선·서남해 섬·제주가 참고와 매우 가깝다. 깨진 글자·흰 조각·붉은 인장 없음.
- **① 울릉도·독도가 없다.** 동해 영역(x 615~768, y 600~1200) 먹선 픽셀 0. 참고 원본 동쪽에는 울릉도가 보인다. 한국 지도 서비스라 넣는 쪽을 권한다.
- ② 북동쪽 끝이 오른쪽 가장자리에 닿아 살짝 잘렸다(오른쪽 끝 줄에 먹선 19픽셀).
- ③ 위쪽 5분의 1을 비우라는 지시를 안 따랐다. 땅이 맨 위 2.9%부터 시작 → 로고는 왼쪽 위(폭 약 35%)에만 들어가 작다.
- ④ 1k 라 확대하면 땅의 잔선이 뭉개진다. 표지로 쓰려면 고화질이 필요하다. 바탕 #E6DBC8 은 약간 누런 편.

## 다음 (허락 뒤)

참고 그림을 표지 비율 판에 미리 앉혀(위 여백 · 오른쪽 여백 · 울릉도·독도 자리, 크레딧 0) 나노 바나나 2.1 2k 로 다시 1장 = 65. 여백 지시를 프롬프트로만 주면 따르지 않아서, 구도를 참고 그림 자체에 담아 시험한다(아직 검증 전).

표지로 웹에 넣는 일은 그림을 고른 뒤 따로.

## 프롬프트

```
The reference is Daedongyeojido, the 1861 Korean woodblock map. Paint a complete map of the whole Korean peninsula in its style, from Baekdu mountain in the north to Jeju island in the south, following the reference's coastline, peninsula silhouette and island placement exactly. Fine dark-brown ink mountain ridges branch like tree roots across all of the land, indigo-blue rivers and a thin indigo coastline, many small islands scattered along the south and west coasts, Jeju as a separate island at the bottom. The whole background is one seamless sheet of pale, clean, neutral off-white hanji paper with very subtle fibers: no white gaps, no patchwork panels, no folded grid, no red seals. The peninsula sits in the lower four fifths of the image; the top fifth is left as empty plain paper. No text, no letters, no Chinese characters, no labels, no border, no frame. Portrait.
```
