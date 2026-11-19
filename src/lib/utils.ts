import { createCn } from "cn/config"

// 클래스 합치기. 디자인 토큰으로 만든 우리 유틸 이름을 병합기에 알려 준다.
// 알려 주지 않으면 `text-body-large` 같은 글자 크기를 글자색으로 봐서, `text-<색>` 과 함께 쓰면 크기가 조용히 사라진다.
// 모서리·그림자·치수도 같은 까닭으로 적는다(뒤에 온 클래스가 이기게). 이름은 globals.css · tokens.css 의 @theme 과 맞춘다.
// `text-wordmark` 는 색과 글자 크기 양쪽에 정의된 이름이라 넣지 않는다.
export const cn = createCn({
  extend: {
    theme: {
      text: ["display-large", "display-medium", "heading-1", "heading-2", "heading-3", "heading-4", "body-large", "body-medium", "body-small", "caption", "overline", "map-label", "stamp-number"],
      radius: ["control", "badge"],
      shadow: ["elevation-1", "elevation-2", "elevation-3"],
      spacing: ["target-min", "field", "fab", "navbar", "icon-md", "icon-sm"],
    },
  },
})
