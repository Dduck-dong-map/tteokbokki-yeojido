# 캐릭터 시안 v3 (2026-11-05)

사용자 11-05: 「떡 문 호랑이 중간 삽화의 매워하는 표정·맛있어하는 표정, 꼬치에 떡 하나만」 · 「도장이 맵기 1~5 표정 디벨롭」.
사용자 답: 떡 끝을 콕 찍어 물기 · 도장이 시안 a + 몸 색 단계별.

보는 곳: 화면 설계 보드 `127.0.0.1:8765/design/index.html?focus=ch_v3` (CH-12, 왼쪽 기존 → 오른쪽 이번). 표지 지도는 `../표지지도_v1_2026-11-05/`.

| 파일 | 내용 | 모델 | 참고 | 크레딧 |
| --- | --- | --- | --- | --- |
| 호랑이_나_매운표정_v01.png | 눈물·땀·김·내민 혀, 떡 하나 | GPT 2.5 저화질 1k 1:1 | 시안 「나」 | 15 |
| 호랑이_나_맛있는표정_v01.png | 감은 반달 눈·빨개진 볼, 떡 하나 | GPT 2.5 저화질 1k 1:1 | 시안 「나」 | 15 |
| 도장이_맵기1to5_v01.png | 1 미소 · 2 살짝 땀 · 3 화끈 · 4 눈물과 김 · 5 불 뿜기 | GPT 2.5 저화질 1k 16:9 | 도장이 시안 a | 15 |

**이번 묶음 95(표지 지도 50 포함) · 잔액 12,418 → 12,323. 생성 뒤 잔액 확인, 계산값과 일치.**

## ⚠ 호랑이 v01 은 꽂는 방향이 틀렸다 (사용자 11-05)

「떡을 세로로 꼬치에 꽂는 게 아니라 가로로 꽂게 만들어 줘. 떡볶이에 대해 리서치해서 학습해. 누가 떡볶이를 세로로 꽂아 먹냐?」

- 원인: 아래 v01 프롬프트에 「꼬치와 나란히 세우고 아래쪽 끝만 꿴다」고 썼다. 시안 「나」의 떡은 꼬치와 직각이었으니 원본을 내가 틀었다.
- 조사와 그림 규칙: [`../떡볶이리서치_v1_2026-11-05.md`](../../리서치/떡볶이리서치_v1_2026-11-05.md)
- 구도 참고 그림(떡과 꼬치 자리만 v01 위에 붙인 재료, 크레딧 0): `../design/img/char_v3_tiger_guide_spicy.jpg` · `char_v3_tiger_guide_tasty.jpg`. 매그니픽 등록 번호 매운 KL00T98kqp · 맛있는 79ttmcKJAL.
- **v02 2장을 만들었다.** 모델 비교(simulate_cost, 2장): GPT 2.5 저화질 1k **30** · 나노 바나나 2.1 1k 100 · 아이디어그램 4.5 정밀 수정 중간 160. 사용자 허락 뒤 GPT 2.5. **30 크레딧 · 잔액 12,323 → 12,293(확인, 계산값과 일치).**

| 파일 | 내용 | 참고 | 크레딧 |
| --- | --- | --- | --- |
| 호랑이_나_매운표정_v02.png | 떡 가로 · 꼬치 직각 | 구도 참고 그림(매운) | 15 |
| 호랑이_나_맛있는표정_v02.png | 떡 가로 · 꼬치 직각 | 구도 참고 그림(맛있는) | 15 |

## 윙크 버전도 떡 하나로 (사용자 11-06)

「기존 떡 문 호랑이 윙크 버전도 꼬치에 떡 하나만 꽂혀 있는 거 만들어 줘」 → `호랑이_나_윙크_떡하나_v01.png`.

- 방식: 원본 `../캐릭터시안_v2_2026-11-02/05_호랑이_나_떡문호랑이.png` 위에 구도 참고(떡 셋 지우기 · 꼬치 · 입 안, 크레딧 0)를 붙이고 고칠 자리 표시(마스크)를 만든 뒤 **부분 수정**. 입에 물린 맨 위 떡을 남겼다.
- 모델 비교(simulate_cost, 1장): GPT 2.5 통째 다시 **15** · 부분 수정 나노 바나나 2.1 **50** · Pro 50 · 아이디어그램 4.5 80 · GPT 2.5 95. 사용자가 나노 바나나 2.1 부분 수정을 고름. **50 크레딧 · 잔액 12,293 → 12,243(확인, 계산값과 일치).** 매그니픽 번호: 구도 rgMd8noxtc · 마스크 SyomfDTUb8 · 결과 CqZnF72EEy.
- 점검: 눈·코·입윗부분·이마 등 얼굴 윗부분(y 500 위) 픽셀 차이 **0**. 떡 한 개가 가로로 물렸고 꼬치는 가늘고 떡 옆면 가운데쯤에 거의 직각으로 들어간다. 원본 떡에 달렸던 소스 방울은 떡과 함께 사라졌다.
- 남은 점: 떡이 조금 짧고 둥글어 원기둥보다 덩어리에 가깝다 · 꼬치 끝이 앞발에 쥐었다기보다 발 가장자리에 닿아 있다 · 턱 왼쪽 털 점선이 원본보다 조금 많다 · 표시한 자리 밖도 떡 둘레에서 약 1.8% 픽셀이 달라졌다(떡 윗부분 등, 얼굴은 아님).

프롬프트:

```
Repaint only this area in the same hand-painted brush and watercolor style as the surrounding tiger illustration, seamlessly. The glossy orange-red Korean tteokbokki rice cake already in the tiger's open mouth is the ONLY rice cake: it stays exactly where it is, lying crosswise, and its lower edge and softly rounded left end are completed with the same dark brown outline and glossy sauce as its visible upper part. Under it, show the inside of the open mouth in dark maroon with a pink tongue, closed by a bold black brush line for the lower lip that joins the existing mouth outline. One very thin plain light wooden skewer, as slim as a toothpick, enters the side of the rice cake near the middle of its length at nearly a right angle and runs straight diagonally down to the left, over the lower lip, to the tiger's front paw, which holds it. Below the mouth, cream chin and chest fur with short black ink fur dashes that continue the existing ones. At the far left, the orange fur of the upper arm continues naturally. Only one rice cake, no other rice cakes, no row of pieces, no sauce puddle, no text.
```

## 도장이 이마 고추 제거 (사용자 11-06)

「도장이 캐릭터 맵기 단계에 이마에 고추 그림 제거해줘」 → `도장이_맵기1to5_v02.png`. 크레딧 0(직접 보정): 고추 픽셀만 골라 둘레 색으로 메우고 종이 결을 다시 얹었다. v01 과 비교해 고추 칸 다섯 곳 밖의 변경 픽셀 0 확인. **앞으로 도장이 프롬프트에서 `a small red chili mark on the forehead` 를 뺀다.** 원본 시안 a(`char_v1_1a`)의 고추는 손대지 않았다.

## 점검 결과

- 호랑이 v02: 떡 한 개가 입에 가로로 물렸고 꼬치가 가운데에 직각으로 들어간다. 표정·그림체는 v01 그대로. 남은 것: ① 떡 끝이 평평한 흰 단면이라 통나무처럼 보인다(사진 속 떡은 끝이 둥글다) ② 떡이 아직 진한 빨강이고 흰 떡은 양 끝에서만 보인다 ③ 꼬치가 굵어 망치 모양에 가깝다(매운 쪽이 더 굵다) ④ 매운 표정은 떡 아래 입 둘레가 뭉개졌다 ⑤ 맛있는 표정은 아랫입이 없어 떡이 턱 앞에 붙은 듯하고, 소스 방울이 입꼬리가 아니라 떡 끝에 달렸다. 48px 에서는 떡이 빨간 막대로 보인다.
- 호랑이 v01: 떡 한 개 · 표정 · 그림체는 맞다. **꽂는 방향이 틀렸고**, 떡이 길고 짙은 빨강으로 덮여 흰 떡이 안 보여 **핫바·소시지처럼 보인다.**
- 도장이: 다섯 단계 표정·몸 색 순서는 지시대로. 몸 색 표본(한 지점)을 웹 도장 색과 대조하면 1단계 #F49C5F ↔ #F2B78C, 2단계 #E2682B ↔ #E3814D 로 더 진하고, 3단계 #D70F1B ↔ #C8102E, 4단계 #85030D ↔ #8E0B1F, 5단계 #4A0002 ↔ #4A0710 은 가깝다. 2단계 땀방울은 크림색이라 잘 안 보이고 4단계 눈물은 회색. 48px 로 줄이면 1·2 표정 차이는 색으로만 구분된다.

## 다음 (허락 뒤)

- 호랑이 v02 를 사용자가 확인한 뒤, 고칠 점이 있으면 다시 허락을 받는다.
- 도장이: 고른 뒤 다섯 칸으로 자르고 색 보정(크레딧 0).
- 고화질 마무리는 고른 뒤 모델을 비교해 다시 허락.

## 프롬프트

### v02 (가로 떡 · 참고 = 구도 참고 그림)

매운 표정. 맛있는 표정은 첫 문단의 표정 괄호를 `both eyes closed in happy upward crescents, rosy blush on the chubby cheeks` 로, 떡을 무는 부분을 `held contentedly between its lips with two small fangs resting on it` 로, 꼬치를 `One very thin plain wooden stick, as slim as a toothpick` 로, 끝의 혀 문장을 `A tiny smear of sauce at the corner of the mouth.` 로 바꿨다.

```
The reference is a rough layout paste-up of a finished tiger illustration. Redraw it as one seamless finished illustration, keeping the tiger, the framing, the expression (eyes squeezed shut, big tears, steam puffs, sweat drops, red tongue lolling out) and the brush-textured ink style exactly as they are. The pasted object is crude; repaint it in the same hand-painted brush style as the tiger, and repaint the blank cream patch behind the stick as the tiger's natural cream chest fur with its ink strokes.

The object is exactly ONE Korean tteokbokki rice cake, lying HORIZONTALLY, level from left to right, crosswise in the tiger's open mouth, clamped between its upper fangs, exactly where the guide places it. It is a short, plump cylinder about three times as long as it is thick, with softly rounded cut ends. Its surface is a bright orange-red, glossy, slightly translucent gochujang sauce with pale creamy-white rice cake showing through at both cut ends and in thin patches along the top, plus a few sesame seeds. It must not look like a sausage or a corn dog.

One thin plain wooden stick pierces the side of the rice cake at the middle of its length, at a right angle to the rice cake, forming a T shape. The stick runs diagonally down to the tiger's front paw, which holds its lower end. The stick is never in line with the rice cake's length. Only one rice cake, never a row of pieces. The tongue hangs below the rice cake. No text.
```

### v01 (세로로 꽂아 틀림, 기록용)

매운 표정 (맛있는 표정은 (2)만 다름)

```
Keep this exact same tiger character and art style from the reference: same head shape, same brush-textured orange fur, same bold black ink stripes, same round ears, same hanji paper background and same head-and-shoulders framing. Change only two things. (1) The skewer now holds exactly ONE rice cake: a single long, thick, cylindrical Korean tteokbokki rice cake, glossy with red gochujang sauce and a few sesame seeds, standing lengthwise in line with a thin wooden skewer that pierces only its bottom end. Only one rice cake, never a row of pieces. The tiger's front paw holds the skewer and the top end of the rice cake is in its mouth. (2) New expression, overwhelmed by the spiciness: no wink, both eyes squeezed shut with big tears streaming down, flushed red cheeks, sweat drops flying off the forehead, red tongue lolling out beside the rice cake, small steam puffs rising from both ears. Cute and funny. No text.
```

맛있는 표정 (2)

```
(2) New expression, pure delight at how tasty it is: no wink, both eyes closed in happy upward crescents, rosy blush on the cheeks, chubby cheeks puffed out as if chewing contentedly, a tiny smear of sauce at the corner of the mouth. Cute and warm. No text.
```

도장이

```
Keep this exact same mascot design from the reference: a square Korean seal stamp character with soft rounded corners, a double inner border line, a lighter square face panel, a small red chili mark on the forehead, stubby black arms and legs, soft flat cute emoticon style, plain hanji paper background. Draw exactly FIVE characters in one evenly spaced horizontal row, all the same size, standing front-facing, showing a rising spice level from left to right, with the body color darkening step by step. Character 1 (leftmost): peach apricot body #F2B78C, pale cream face, relaxed closed smiling eyes, gentle smile. Character 2: warm orange body #E3814D, cream face, dot eyes, small smile, one sweat drop on the temple. Character 3: bright chili red body #C8102E, pale pink face, wide round surprised eyes, small open round mouth, flushed cheeks. Character 4: deep crimson body #8E0B1F, pink-red face, eyes squeezed shut with tears streaming down, wavy trembling mouth, steam puffs rising from the head. Character 5 (rightmost): very dark blackish red body #4A0710, red face, X-shaped dizzy eyes, wide-open mouth breathing a burst of orange flame, small flames on top of the head. No numbers, no text, no letters.
```
