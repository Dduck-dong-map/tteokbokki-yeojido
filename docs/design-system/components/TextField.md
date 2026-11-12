# TextField

입력칸은 채운형(`background-tertiary` 바탕 + `border-strong` 테두리)이다. **라벨은 항상 칸 위에 보인다**. placeholder 는 예시만 담는다.

- 글자는 18px(`body-large`): 16px 이상이라 iOS 가 확대하지 않는다. 높이 `field-height` 56px.
- 필수는 라벨 끝 「(필수)」 글자로. 도움말·오류는 `aria-describedby` 로 칸과 묶인다.
- 오류: `border-error` 테두리 + 오류 아이콘 + 고치는 방법 한 문장, `aria-invalid="true"`, `role="alert"`.
- 포커스: 테두리가 `interactive-primary` 로 굵어지고 바깥에 `border-focus`.
- 쓰는 쪽이 줄 것: `label`, 필요하면 `help`·`error`·`required`·`autoComplete`.
