# 도장이 맵기 1~5 · 디벨롭 그림 시안 2종 (2026-11-09)

사용자 11-09: CH-00 의 도장이 1~5 를 기준으로 「표정·색감 디벨롭, 이마 숫자 빼고」 → SVG 디벨롭(크레딧 0, 보드 CH-15, `../design/img/face_v2/`) → 「좋아 저비용으로 만들어봐 시안 2종류정도」.

보는 곳: 화면 설계 보드 `127.0.0.1:8765/design/index.html?focus=ch_face2` (CH-15 아래 「그림 시안 2종」).

| 파일 | 내용 | 모델 | 크레딧 |
| --- | --- | --- | --- |
| 참고_SVG디벨롭_A.png | 디벨롭 SVG 색 A 다섯 장을 한 장으로 (참고 그림) | 직접 렌더 | 0 |
| 도장이_맵기_디벨롭_a손그림_GPT2.6_v01.png | a 손그림 (색연필·과슈 · 한지 바탕) | GPT 2.6 저화질 1k 16:9 + 참고 | 15 |
| 도장이_맵기_디벨롭_b말랑3D_Flux2Klein_v01.jpg | b 말랑 3D (젤리 장난감) | Flux.2 Klein 1k 16:9 + 참고 | 15 |

**이번 30 · 잔액 11,893 → 11,863 (생성 뒤 확인, 계산값과 일치).** 모델 비교(simulate_cost, 참고 그림 넣고 1장): GPT 2.6 저화질 15 · Flux.2 Klein 15(참고 없으면 10) · Ideogram 4.5 아주 낮음 10.

## 점검

- **a 손그림** · 디벨롭 모양·표정·소품을 거의 그대로 따랐다. 고칠 점: 4 의 김이 막대 위 구름이라 닭다리·뼈처럼 보임, 5 입이 「C」 모양으로 읽힘.
- **b 말랑 3D** · 테두리가 도드라져 도장 같고 가장 매끈하다. 고칠 점: 2 가 머쓱한 웃음 → 시무룩한 입으로 바뀜, 5 몸이 거의 검정, 4 김이 뼈처럼 보임, 몸 아래 그림자가 붉게 번짐.
- 4 의 김 모양은 SVG 디벨롭에서 온 것 → 고르면 SVG 도 막대 없는 김 줄기로 같이 고친다.

## 다음 (허락 뒤)

a·b 중 하나 고르기 → 고칠 점만 넣어 싸게 1장 → 확정되면 고화질 마무리 모델 비교 뒤 허락.

## 프롬프트

### a 손그림 (GPT 2.6 저화질)

```
Redraw these five mascots as a finished cute character illustration, keeping the exact same designs, order, colors, expressions and props as the reference. Each is a squarish Korean seal stamp character with big softly rounded corners, a rounded inner border line, a small glossy highlight at the top left and a soft shadow under it. Render it hand-drawn: soft colored pencil and gouache texture, gentle hand-inked outlines, warm cream hanji paper background with subtle fibers. Keep from left to right: 1 peach body, closed happy crescent eyes, small smile, pink cheeks. 2 orange body, dot eyes with highlights, slightly worried brows, sheepish smile, one blue sweat drop with a white rim at the top right corner. 3 chili red body, big white round eyes, raised brows, small round open mouth, hatched blush, orange heat lines bursting from the top corners. 4 deep crimson body, eyes squeezed shut like > <, wavy trembling mouth, two thick blue tear streams, two white steam clouds above the head, trembling lines on both sides. 5 blackish maroon body, X eyes, wide open round mouth blasting a yellow-orange flame sideways to the right, three flames on top of the head. No numbers, no text, no letters, no arms or legs.
```

### b 말랑 3D (Flux.2 Klein)

```
Turn the five mascots in the reference into a cute soft 3D render, keeping the exact same designs, order, colors, expressions and props. Each is a squishy squarish character like a Korean seal stamp, made of glossy soft clay and jelly: big rounded corners, a slightly raised rounded inner border, a soft glossy highlight at the top left, sitting on a plain warm cream background with soft studio light and a soft contact shadow, front view, evenly spaced in one row. Left to right: 1 peach, closed happy crescent eyes, small smile, pink cheeks. 2 orange, dot eyes, slightly worried brows, sheepish smile, one blue sweat drop at the top right corner. 3 chili red, big white round eyes, raised brows, small round open mouth, blush, orange heat lines bursting from the top corners. 4 deep crimson, eyes squeezed shut like > <, wavy trembling mouth, two blue tear streams, two white steam puffs above. 5 blackish maroon, X eyes, wide open mouth blasting a yellow-orange flame sideways to the right, three small flames on top. No numbers, no text, no arms or legs.
```
