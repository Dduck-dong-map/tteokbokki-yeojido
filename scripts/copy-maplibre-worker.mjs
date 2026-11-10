// MapLibre 6 은 지도 그리기 일꾼(worker) 파일을 따로 불러온다.
// Next 번들러가 이 파일 위치를 못 찾아서, public/ 에 복사해 두고 TteokMap 에서 setWorkerUrl 로 알려 준다.
// npm run dev / build 전에 저절로 돈다(package.json predev·prebuild). 복사본은 깃에 올리지 않는다.
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("public/maplibre", { recursive: true });
cpSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/maplibre/maplibre-gl-worker.mjs");
