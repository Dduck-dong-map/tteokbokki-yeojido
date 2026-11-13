# syntax=docker/dockerfile:1
# 떡볶여지도 앱 서버 (11-11) — 이 컴퓨터에서 배포처럼 띄워 보는 용도. docker-compose.yml 의 app 이 이 파일로 만든다 (db/README.md 「앱 서버」).
# ① 의존성 설치 → ② 빌드(next build, standalone) → ③ 실행에 필요한 것만 담은 작은 이미지
# NEXT_PUBLIC_* 는 빌드 때 코드에 박힌다 → 값을 바꾸면 다시 빌드한다 (pnpm app:up 이 매번 빌드한다).

FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_NAVER_MAP_KEY_ID=
ARG NEXT_PUBLIC_SAMPLE_DATA=
# 빌드는 DB 없이 파일 저장소(예시 데이터)로 한다. 화면은 요청 때마다 DB 에서 새로 읽으므로(connection) 상관없다.
# 빌드 때 정해지는 것: robots.txt · sitemap.xml(가게 목록) · 위 NEXT_PUBLIC_* 값
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_NAVER_MAP_KEY_ID=$NEXT_PUBLIC_NAVER_MAP_KEY_ID \
    NEXT_PUBLIC_SAMPLE_DATA=$NEXT_PUBLIC_SAMPLE_DATA \
    NEXT_OUTPUT=standalone \
    DATABASE_URL= \
    DATA_DIR=/tmp/build-data
RUN pnpm build

FROM node:24-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 DATA_DIR=/data
RUN mkdir -p /data/photos && chown -R node:node /data
COPY --from=build /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
