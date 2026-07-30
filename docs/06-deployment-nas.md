# 06. Docker 빌드 · NAS 배포

정적 SPA이므로 런타임에 Node가 필요 없다. 빌드는 Node 스테이지, 서빙은 Nginx alpine 스테이지로 분리해
최종 이미지를 수십 MB 수준으로 유지한다.

## 1. Dockerfile

```dockerfile
# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build          # → /app/dist

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
```

`.dockerignore`:

```
node_modules
dist
.git
docs
coverage
*.md
```

## 2. docker/nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json
               image/svg+xml application/manifest+json;

    # 해시가 붙은 자산은 영구 캐시
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # index.html 은 캐시하지 않는다 (배포 즉시 반영)
    location = /index.html {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    location = /healthz {
        access_log off;
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }

    # SPA fallback — /tools/loan-limit 직접 접근 지원
    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header Referrer-Policy no-referrer-when-downgrade;
}
```

`try_files ... /index.html` 이 없으면 `/tools/bmi` 를 새로고침할 때 404가 난다. SPA 배포에서 가장 흔한 실수.

## 3. docker-compose.yml

```yaml
services:
  toolbox:
    build: .
    image: toolbox:latest
    container_name: toolbox
    ports:
      - "8080:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1/healthz"]
      interval: 30s
      timeout: 3s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "5m"
        max-file: "3"
```

볼륨이 없다. 상태를 서버에 두지 않으므로 백업 대상도 없다 (사용자 설정은 브라우저 localStorage).

## 4. 로컬 확인

```bash
docker compose up -d --build
curl -I http://localhost:8080/healthz
curl -I http://localhost:8080/tools/bmi      # 200 + index.html 이어야 함
docker compose logs -f toolbox
```

## 5. NAS 배포

### 5-1. NAS 아키텍처 확인

```bash
ssh <nas> 'uname -m'    # x86_64 → amd64, aarch64 → arm64
```

CI가 amd64와 arm64 이미지를 모두 만들어 하나의 태그로 묶어두므로(멀티아키텍처 매니페스트),
`docker pull` 이 알아서 맞는 걸 가져온다. 아키텍처를 따로 지정할 필요는 없다.

### 5-2. 방법 A — CI가 만든 이미지 사용 (권장)

GitHub Actions가 푸시할 때마다 검증하고 `ghcr.io/whwpdn/toolbox` 로 이미지를 올린다.
NAS는 받아서 띄우기만 하면 되므로 빌드 부하가 없다.

```bash
ssh <nas>
mkdir -p /volume1/docker/toolbox && cd /volume1/docker/toolbox

# docker-compose.yml 만 가져다 두고 build: 줄을 지운다
curl -O https://raw.githubusercontent.com/whwpdn/ToolBox/main/docker-compose.yml

# GHCR 패키지를 private으로 뒀다면 먼저 로그인
#   GitHub → Settings → Developer settings → Personal access tokens
#   read:packages 권한만 있으면 충분하다
echo "<GITHUB_PAT>" | docker login ghcr.io -u whwpdn --password-stdin

docker compose pull
docker compose up -d
```

사용 가능한 태그:

| 태그 | 의미 |
|---|---|
| `latest` | 기본 브랜치 최신 |
| `<브랜치명>` | 해당 브랜치 최신 (예: `claude-daily-calculator-tools-plan-a20p8j`) |
| `sha-<short>` | 특정 커밋. 롤백할 때 쓴다 |
| `1.2.3` / `1.2` | `v*` 태그를 푸시했을 때 생성 |

### 5-3. 방법 B — NAS에서 직접 빌드

레지스트리를 쓰고 싶지 않을 때.

```bash
ssh <nas>
git clone https://github.com/whwpdn/ToolBox.git /volume1/docker/toolbox
cd /volume1/docker/toolbox
docker compose up -d --build
```

빌드 시 Node 의존성 설치로 메모리를 쓴다. 저사양 NAS(2GB 이하)에서 OOM이 나면 방법 A나 C를 쓴다.

### 5-4. 방법 C — 개발 PC에서 빌드 후 이미지 전송

레지스트리도 안 쓰고 NAS 빌드도 부담스러운 경우.

```bash
# 개발 PC (NAS가 arm64인 경우)
docker buildx build --platform linux/arm64 -t toolbox:latest --load .
docker save toolbox:latest | gzip > toolbox.tar.gz
scp toolbox.tar.gz <nas>:/volume1/docker/

# NAS
docker load < /volume1/docker/toolbox.tar.gz
docker compose up -d          # build: 줄을 지우고 image: toolbox:latest 로
```

## 6. 접속 · 공개 설정

| 방식 | 설정 | 비고 |
|---|---|---|
| 내부망 직접 | `http://<NAS-IP>:8080` | 기본. 이것만으로 충분 |
| 리버스 프록시 | Synology DSM → 제어판 → 로그인 포털 → 고급 → 역방향 프록시<br>`toolbox.<domain>` → `localhost:8080` | HTTPS 인증서 적용 가능 |
| 외부 공개 | 위 + 방화벽/포트포워딩 | 개인 도구이므로 굳이 열지 않는 편이 안전 |

DSM의 역방향 프록시를 쓸 때 WebSocket 설정은 필요 없다 (실시간 통신 없음).

## 7. 업데이트 절차

레지스트리 이미지를 쓰는 경우 (방법 A):

```bash
ssh <nas>
cd /volume1/docker/toolbox
docker compose pull
docker compose up -d
docker image prune -f          # 이전 이미지 정리
```

특정 커밋으로 롤백:

```bash
docker compose down
docker run -d --name toolbox -p 8080:80 --restart unless-stopped \
  ghcr.io/whwpdn/toolbox:sha-1a2b3c4
```

직접 빌드하는 경우 (방법 B):

```bash
cd /volume1/docker/toolbox
git pull
docker compose up -d --build
docker image prune -f
```

`index.html` 이 no-cache이므로 새로고침 한 번으로 새 버전이 적용된다.
PWA(Phase 5)를 붙인 뒤에는 서비스워커가 새 버전을 감지하면 "업데이트 있음" 배너를 띄우도록 한다.

## 8. 트러블슈팅

| 증상 | 원인 / 확인 |
|---|---|
| 도구 URL 새로고침 시 404 | `try_files ... /index.html` 누락 |
| 배포했는데 옛 화면 | 브라우저 캐시 또는 서비스워커. `index.html` no-cache 헤더 확인 (`curl -I`) |
| `exec format error` | 이미지 아키텍처 불일치. `uname -m` 과 빌드 플랫폼 대조 |
| 빌드 중 컨테이너 kill | NAS 메모리 부족 → 방법 B/C로 전환 |
| 8080 포트 충돌 | NAS 다른 서비스가 점유. compose에서 `8081:80` 등으로 변경 |
| 페이지는 뜨는데 자산 404 | Vite `base` 설정. 서브패스 배포면 `base: '/toolbox/'` 필요 |
