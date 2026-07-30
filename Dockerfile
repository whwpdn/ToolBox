# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# 의존성 레이어를 소스와 분리해 캐시 적중률을 높인다
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# 타입 검사와 테스트는 CI에서 수행한다. 이미지 빌드는 번들 생성만 담당한다.
RUN npx vite build

# ---- runtime stage ----
FROM nginx:stable-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1
