# 도장이 맵기 1~5 · 느낌 다섯 가지 (2026-11-09)

사용자 11-09: 「도장이 맵기 1~5단계들 각각 다른 느낌으로 시안 4~5개만」 → 「일단 저화질로, 모델도 다양하게, 더 저렴한 걸로」 · 「확정되면 고화질, 초기 시안은 저렴하게 (지침)」.

보는 곳: 화면 설계 보드 `127.0.0.1:8765/design/index.html?focus=ch_v4` (CH-14, 왼쪽 위 기존 v02 → ①~⑤).
기준 그림: `../캐릭터시안_v3_2026-11-05/도장이_맵기1to5_v02.png` (매그니픽에 올린 참고 그림, 크레딧 0).

| 파일 | 느낌 | 모델 | 참고 그림 | 크레딧 |
| --- | --- | --- | --- | --- |
| 도장이_맵기_1_먹붓민화_GPT2.6_v01.png | 먹붓 민화풍 | GPT 2.6 저화질 1k 16:9 | v02 | 15 |
| 도장이_맵기_2_인주도장_Ideogram4.5_v01.png | 인주 도장 자국 (빨강 한 색, 누른 세기) | Ideogram 4.5 아주 낮음 16:9 | v02 | 10 |
| 도장이_맵기_3_말랑3D_Flux2Klein_v01.jpg | 말랑 3D 젤리 (녹아내림) | Flux.2 Klein 1k 16:9 | 없음 (넣으면 15) | 10 |
| 도장이_맵기_4_스티커_ZImage_v01.png | 굵은 선 이모티콘 스티커 | Z-Image 16:9 | 없음 (스타일 참고만 됨) | 5 |
| 도장이_맵기_5_먹는장면_GPT2.5_v01.png | 떡볶이 먹는 장면 (동작으로 맵기) | GPT 2.5 저화질 1k 16:9 | v02 | 15 |

**이번 55 · 잔액 11,948 → 11,893 (생성 뒤 확인, 계산값과 일치).** 처음 제안(GPT 2.5 다섯 장 75)보다 20 적다.

## 모델 고르기 (simulate_cost, 16:9 1장)

Classic Fast 1 · Z-Image 5 · P-Image Ideogram 아주 낮음 5 · Flux.1 Fast 5 · Flux.2 Klein 10 (참고 그림 넣으면 15) · Ideogram 4.5 아주 낮음 10 · GPT 2.6 / 2.5 저화질 15 · Krea 3 turbo 30 · Nano Banana 첫 판 50 · Nano Banana 2.1 1k 50 (**1k 가 가장 낮은 해상도**) · Seedream 4 50 · Nano Banana 2 Lite 60 · Qwen Image 3.0 60 · Recraft V4 60 · Grok Imagine 2 저화질 70 · Nano Banana 2 1k 75 · Flux.3 768p 75 · Ideogram Vector(SVG) 저화질 170 · Magnific One 시안 묶음 4장 250.

느낌마다 맞는 싼 모델: 기준 모양을 지켜야 하는 ①⑤ = GPT(참고 그림 따르기가 가장 좋음), 판화 질감 ② = Ideogram 4.5, 3D ③ = Flux.2 Klein, 굵은 선 스티커 ④ = Z-Image.

## 점검 (확대해서 봄)

- **① 먹붓 민화** · 먹 테두리·한지 결·4 의 민화 구름 김·5 의 붓 불꽃. 기존 v02 와 그림 결이 거의 같아 「다른 느낌」은 약하다.
- **② 인주 도장** · 빨강 한 색, 1 연하게 → 5 번지고 튐. 몸에 가는 흰 금(긁힌 선)이 그어졌고, 1~3 은 안쪽 테두리가 사라졌다. 1 이 매우 연하다. 5 입의 불이 혀처럼 보인다.
- **③ 말랑 3D** · 4 흘러내림 → 5 웅덩이. 2 부터 눈물이 있어 1~3 차이가 약하고, 3 은 놀람보다 울상이다. 5 는 거의 검정이라 얼굴이 묻힌다. 팔다리가 갈색이다.
- **④ 스티커** · 표정이 가장 크다. 도장 테두리·얼굴 칸이 없어져 젤리 사탕처럼 보인다. 스티커 테두리가 하나로 붙었다. 5 는 얼굴이 불에 덮였다. 1·2 사이에 손이 하나 더 있다.
- **⑤ 먹는 장면** · 동작으로 맵기가 읽힌다. **떡 그림 규칙(`../떡볶이리서치_v1_2026-11-05.md`)에 어긋난다**: 1·3 의 이쑤시개 떡이 길쭉하게 꿰여 핫바처럼 보이고, 3 은 떡 끝으로 꿰뚫었다. 컵 속 떡이 동그란 알이라 방울토마토처럼 보인다.

## 다음 (허락 뒤)

- 사용자가 느낌 하나를 고르면 고칠 점만 넣어 싼 모델로 1장 더 → 확정되면 고화질 마무리 모델을 비교해 다시 허락.
- 다섯 칸 자르기 · 몸 색을 웹 도장 색에 맞추기는 크레딧 0.

## 프롬프트

### ① 먹붓 민화 (GPT 2.6, 참고 v02)

```
Redraw the five mascots from the reference as a traditional Korean folk painting (minhwa) illustration: bold, slightly uneven black ink brush outlines, flat mineral-pigment colors with soft brush texture, on aged hanji mulberry paper with visible fibers. Keep the same mascot design: a square Korean seal stamp body with softly rounded corners, a double inner border line, a lighter square face panel, stubby black arms and legs, nothing on the forehead. Five characters in one evenly spaced horizontal row, all the same size, front-facing, spiciness rising from left to right with the body color darkening step by step. 1 (leftmost): peach apricot body, calm closed-eye smile. 2: warm orange body, small smile, one sweat drop. 3: chili red body, round surprised eyes, flushed cheeks. 4: deep crimson body, eyes squeezed shut with tears, steam drawn as curling folk-painting cloud scrolls above the head. 5 (rightmost): blackish red body, dizzy eyes, breathing a stylized folk-painting flame. No text, no numbers, no letters.
```

### ② 인주 도장 (Ideogram 4.5 아주 낮음, 참고 v02)

```
Five cute mascots printed on cream hanji paper with real red cinnabar seal ink, like actual Korean seal stamp impressions: one red ink color only, rough stamp texture with speckles and uneven ink coverage, paper showing through. Each mascot is a square seal stamp shape with softly rounded corners and a double inner border line, a simple cute face carved in negative space, tiny stubby arms and legs. Five in one evenly spaced horizontal row, same size, spiciness rising from left to right shown by ink pressure. 1 (leftmost): a faint, light pink, barely pressed impression, calm smile. 2: light red, half pressed, small smile and one sweat drop. 3: solid red, clean full impression, surprised round eyes. 4: heavy dark red, pressed hard, ink smudging at the edges, crying face with little steam marks. 5 (rightmost): deep red pressed so hard the ink bleeds and splatters around it, dizzy X eyes and a flame shape. Red ink only on cream paper. No text, no numbers, no letters.
```

### ③ 말랑 3D (Flux.2 Klein, 참고 없음)

```
3D render of five cute mascots shaped like a square Korean seal stamp, made of soft squishy glossy jelly and clay toy material: squarish body with rounded corners, a raised double border around a lighter square face panel, simple dot eyes, tiny stubby dark brown arms and legs. They stand in one evenly spaced row on a plain warm cream background, soft studio lighting, front view. Spiciness rises from left to right and the body color darkens: 1 peach apricot, firm and calm with a closed-eye smile; 2 warm orange, slightly softer, one sweat drop; 3 bright chili red, surprised round eyes, flushed cheeks; 4 deep crimson, starting to melt and droop, tears and steam; 5 blackish red, melting into a glossy puddle, steam and a small flame on top. Cute collectible toy style. No text, no numbers.
```

### ④ 스티커 (Z-Image, 참고 없음)

```
Sticker sheet of five cute emoticon mascots, each a square Korean seal stamp character with rounded corners, a double inner border line and a lighter square face panel, stubby black arms and legs. Thick bold black outlines, flat bright colors, a white die-cut sticker border around each, big exaggerated facial expressions that read clearly at tiny size, expressive arm poses. Five in one evenly spaced row on a plain light cream background, spiciness rising from left to right with body color darkening: 1 peach apricot, happy closed-eye smile, waving; 2 orange, nervous smile with a big blue sweat drop; 3 red, shocked wide eyes and open mouth, hands on cheeks; 4 crimson, bawling with big blue tear streams and steam clouds; 5 dark maroon, fire blasting out of its mouth, flames on its head. No text, no numbers, no letters.
```

### ⑤ 먹는 장면 (GPT 2.5, 참고 v02)

```
Keep this exact same mascot design and soft flat cute style from the reference: a square Korean seal stamp character with softly rounded corners, a double inner border line, a lighter square face panel, stubby black arms and legs, nothing on the forehead, plain hanji paper background, body color darkening from left to right exactly as in the reference. Draw five characters in one evenly spaced horizontal row, each eating Korean tteokbokki from a small paper cup, showing rising spiciness through action. 1 (leftmost): holds a toothpick with one glossy red rice cake and takes a happy bite. 2: chews while fanning its mouth with one hand, one sweat drop. 3: drops the toothpick in shock, eyes wide, steam rising. 4: gulps from a big cup of water with tears streaming. 5 (rightmost): pours a whole water jug over its head while breathing a burst of flame. Each rice cake is a short plump cylinder; the toothpick pierces the middle of its side at a right angle, never through its end. Only one rice cake on a toothpick. No text, no numbers, no letters.
```
