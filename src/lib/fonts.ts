// 글꼴 시험 (11-04 사용자 요청): 주소 끝에 ?logo=euljiro&head=yeongwol 처럼 붙이면 그 글꼴로 바뀌고 이 브라우저에 기억된다.
// 원래대로는 ?logo=png&head=base. 목록은 보드(docs/design/index.html) 「글꼴 고르기」와 같다.
// 지금은 글꼴을 인터넷에서 불러온다. 하나로 정하면 파일을 받아 우리 서버에 두고, 쓰는 글자만 줄여서 넣는다.

// bold = 사용자 사진처럼 로고 획을 덧칠해 굵게 (같은 글꼴을 겹쳐 재 보니 0.02em 일 때 사진과 가장 같았다)
type FontOption = { id: string; family: string; url?: string; google?: string; bold?: boolean };

const CDN = "https://cdn.jsdelivr.net/gh/projectnoonnu/";

export const FONTS: FontOption[] = [
  // 사용자 사진의 글꼴. 조선100년체는 로고·브랜드명·슬로건에 쓸 수 없다(눈누 요약) → ?logo= 는 시험만, ?head= 는 가능
  { id: "chosun", family: "Joseon100Years", url: CDN + "noonfonts_2206-02@1.0/ChosunCentennial.woff2", bold: true },
  { id: "galmat", family: "Galmat", url: CDN + "naverfont_04@1.0/Galmetgol.woff", bold: true },
  { id: "euljiro", family: "Euljiro", url: CDN + "noonfonts_twelve@1.0/BMEULJIRO.woff" },
  { id: "euljiro10", family: "Euljiro10YearsLater", url: CDN + "noonfonts_20-10-21@1.0/BMEuljiro10yearslater.woff" },
  { id: "sumunjang", family: "GyeongbokgungSumunjangTitle", url: CDN + "2511-3@1.0/Sumunjang_TitleB.woff2" },
  { id: "hanseokbong", family: "GapyeongHanseokbongBigBrush", url: CDN + "noonfonts_2312-1@1.1/GapyeongHanseokbong-Bold.woff2" },
  { id: "chungju", family: "ChungjuKimsaeng", url: CDN + "noonfonts_2312-1@1.1/ChungjuKimSaengTTF.woff2" },
  { id: "police", family: "NostalgicPoliceVibe", url: CDN + "2601-6@1.0/Griun_PolSensibility-Rg.woff2" },
  { id: "shilla", family: "Shilla", url: CDN + "noonfonts_2206-02@1.0/Shilla_CultureB-Bold.woff2" },
  { id: "dokrip", family: "Independent", url: CDN + "noonfonts_twelve@1.1/Dokrip.woff" },
  { id: "arirang", family: "JeongseonArirang", url: CDN + "noonfonts_2001@1.1/JSArirang-RegularA1.woff" },
  { id: "yeongwol", family: "Yeongwol", url: CDN + "2507-2@1.0/YeongwolTTF-Regular.woff2" },
  { id: "rock", family: "Jeongmeokbawi", url: CDN + "noonfonts_2001@1.1/SangSangRockOTF.woff" },
  { id: "sunsin", family: "LeeSunShin", url: CDN + "noonfonts_two@1.0/YiSunShinRegular.woff" },
  { id: "flower", family: "FlowerRoad", url: CDN + "noonfonts_three@1.0/SangSangFlowerRoad.woff" },
  { id: "nanumbrush", family: "Nanum Brush Script", google: "Nanum Brush Script" },
  { id: "yeonsung", family: "Yeon Sung", google: "Yeon Sung" },
  { id: "eastsea", family: "East Sea Dokdo", google: "East Sea Dokdo" },
  { id: "dokdo", family: "Dokdo", google: "Dokdo" },
  { id: "nanumpen", family: "Nanum Pen Script", google: "Nanum Pen Script" },
  { id: "songmyung", family: "Song Myung", google: "Song Myung" },
];

// 첫 그림 전에 도는 작은 스크립트 (PALETTE_BOOT 와 같은 방식)
export const FONT_BOOT = `(function(){try{var F=${JSON.stringify(Object.fromEntries(FONTS.map((f) => [f.id, f])))};var q=new URLSearchParams(location.search);var d=document.documentElement;[['logo','--font-logo'],['head','--font-head']].forEach(function(r){var k='ddy-font-'+r[0];var v=q.get(r[0]);if(v!==null){if(F[v])localStorage.setItem(k,v);else localStorage.removeItem(k);}var f=F[v!==null?v:localStorage.getItem(k)];if(!f)return;d.dataset[r[0]]=f.id;d.style.setProperty(r[1],"'"+f.family+"'");if(r[0]==='logo'&&f.bold){var t=document.createElement('style');t.textContent='.logo-text{-webkit-text-stroke:.02em #c00000;paint-order:stroke fill}';document.head.appendChild(t);}if(f.google){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family='+encodeURIComponent(f.google)+'&display=swap';document.head.appendChild(l);}else{var s=document.createElement('style');s.textContent="@font-face{font-family:'"+f.family+"';src:url('"+f.url+"');font-display:swap}";document.head.appendChild(s);}});}catch(e){}})();`;
