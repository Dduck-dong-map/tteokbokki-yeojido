# 도장이 맵기 1~5 · 단순판 (2026-11-10)

사용자 11-10: CH-15 그림 시안 a 손그림 · b 말랑 3D 「둘 다 안 어울려, 기존 디자인에 충실하게 심플하게」 · 색 A(지도 도장 색) · 「1장 뽑기(15)」.

보는 곳: 화면 설계 보드 `127.0.0.1:8765/design/index.html?focus=ch_face3` (CH-16).

| 파일 | 내용 | 모델 | 크레딧 |
| --- | --- | --- | --- |
| `../design/img/face_v3/1~5.svg` | 단순판 SVG (기존 face_1~5 그대로, 숫자만 뺌) · 스크립트 `../만든_스크립트/face_v3_2026-11-10.py` | 직접 그림 | 0 |
| 참고_SVG단순판_v3.png (.html) | 단순판 SVG 다섯 장을 한 줄로 (참고 그림, 크롬 headless 로 찍음) | 직접 렌더 | 0 |
| 도장이_맵기_단순판_GPT2.6_v01.png | 단순판 그림 1장 (보드에는 캐릭터 띠만 잘라 `../design/img/char_v6_dojang_simple.jpg`) | GPT 2.6 저화질 1k 16:9 + 참고 | 15 |

**이번 15 · 잔액 11,863 → 11,848 (생성 뒤 확인, simulate_cost 계산값 15 와 일치).**

## 단순판 SVG — 기존에서 바꾼 것 셋뿐

1. 이마 숫자를 뺐다 → 얼굴을 8 만큼 올려 몸 가운데로.
2. 5 머리 불꽃이 그림 칸 위로 잘리던 것 → 그림 칸을 위로 넓힘(viewBox `0 -14 120 134`, 다섯 장 모두 같은 칸).
3. 2 땀방울에 얇은 크림 테두리 → 주황 몸 위에서도 보임.

그대로: 모서리 8 · 얇은 안쪽 테두리 · 한 색 몸 · 표정 선 · 4 김은 기존 물결 선 세 줄 · 색 A. 광·그라데이션·그림자·새 소품 없음.

## 점검 (확대해서 봄)

- 기존 모양·표정·소품을 그대로 따랐다. 4 김은 물결 선이라 뼈처럼 안 보인다. 광·그림자·종이 결 없음.
- 색이 A 와 조금 다르다 (재 봄: 1 #FCBE95 ← #F2B78C · 2 #F47C42 ← #E3814D · 3 #C80727 ← #C8102E · 4 #9F0516 ← #8E0B1F · 5 #57050B ← #4A0710). 선이 SVG 보다 조금 가늘다.
- SVG 와 거의 같아서 웹 아이콘으로는 SVG 를 그대로 쓰는 편이 정확하고 크레딧도 안 든다.

## 다음 (🔴)

이 단순판으로 확정할지 → 확정되면 웹 가게 상세 도장 뒤집기(FlipStamp)·지도 도장 표정을 단순판 SVG 로 맞출지(크레딧 0, 허락 뒤).

## 프롬프트 (GPT 2.6 저화질, 참고 그림 = 참고_SVG단순판_v3.png)

```
Redraw these five mascots as a clean, finished flat 2D vector icon set, keeping the exact same designs, order, colors, proportions and expressions as the reference. Each is a flat square Korean seal stamp character with slightly rounded corners and a thin inner border line, filled with one solid color. Keep it simple and faithful: flat solid colors only, no gradients, no gloss or highlights, no drop shadows, no paper texture, no 3D, no thick outline around the body, plain warm cream background, evenly spaced in one row, front view. Left to right: 1 peach, closed happy arc eyes, small smile. 2 orange, two dot eyes, small smile, one small blue sweat drop at the top right corner. 3 red, big round white eyes with dark pupils, small round open mouth, pink cheeks. 4 deep crimson, eyes squeezed shut like > <, small wavy mouth, two straight blue tear streaks, three short wavy steam lines above the head. 5 blackish maroon, X eyes, open mouth with tongue out, three orange flames on top of the head. Even line weight, tidy and balanced, like a polished app icon set. No numbers, no text, no letters, no arms or legs.
```
