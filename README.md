# ToolBox

일상생활에 필요한 계산·변환 도구를 한곳에 모은 웹 애플리케이션.
NAS의 Docker 컨테이너로 셀프 호스팅해서 사용한다.

## 핵심 컨셉

- **카테고리 분류** — 계산기 / 단위변환 / 금융 / 수학 / 날짜 / 건강 / 텍스트·개발 등으로 도구를 묶어서 탐색
- **즉시 검색** — 어떤 화면에서든 `Ctrl+K`로 도구 이름·키워드·초성 검색해서 바로 진입
- **도구별 독립 페이지** — `/tools/loan-repayment` 처럼 URL로 직접 접근·북마크 가능
- **플러그인식 확장** — 도구 하나가 폴더 하나. 파일만 추가하면 라우트·검색·카테고리에 자동 등록
- **서버 없는 구조** — 모든 계산은 브라우저에서. 개인 데이터는 밖으로 나가지 않는다

## 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Vue 3 (Composition API, `<script setup>`) |
| 언어 | TypeScript |
| 빌드 | Vite |
| 라우팅 | Vue Router 4 (도구 레지스트리에서 라우트 자동 생성) |
| 상태 | Pinia (설정·즐겨찾기·최근사용만) |
| 스타일 | Tailwind CSS |
| 검색 | Fuse.js + 한글 초성 매칭 |
| 테스트 | Vitest (계산 로직) + Vue Test Utils |
| 배포 | Docker multi-stage build → Nginx(alpine) 정적 서빙 |

## 문서

| 문서 | 내용 |
|---|---|
| [01-requirements.md](docs/01-requirements.md) | 요구사항 정리, 범위, 비기능 요구사항 |
| [02-architecture.md](docs/02-architecture.md) | 폴더 구조, 도구 레지스트리 설계, 검색 설계 |
| [03-tool-catalog.md](docs/03-tool-catalog.md) | 카테고리별 도구 목록과 우선순위 |
| [04-development-plan.md](docs/04-development-plan.md) | 단계별 개발 계획과 체크리스트 |
| [05-adding-a-tool.md](docs/05-adding-a-tool.md) | 새 도구 추가 가이드 |
| [06-deployment-nas.md](docs/06-deployment-nas.md) | Docker 이미지 빌드와 NAS 배포 |

## 빠른 시작 (구현 후)

```bash
# 로컬 개발
npm install
npm run dev          # http://localhost:5173

# 프로덕션 빌드
npm run build
npm run preview

# 컨테이너 실행
docker compose up -d --build   # http://localhost:8080
```
