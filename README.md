# ToolBox

일상생활에 필요한 계산·변환 도구를 한곳에 모은 웹 애플리케이션.
NAS의 Docker 컨테이너로 셀프 호스팅해서 사용한다.

## 핵심 컨셉

- **카테고리 분류** — 계산기 / 단위변환 / 금융 / 수학 / 날짜 / 건강 / 텍스트·개발 등으로 도구를 묶어서 탐색
- **즉시 검색** — 어떤 화면에서든 `Ctrl+K`로 도구 이름·키워드·한글 초성 검색해서 바로 진입
- **도구별 독립 페이지** — `/tools/loan-repayment` 처럼 URL로 직접 접근·북마크 가능
- **플러그인식 확장** — 도구 하나가 폴더 하나. 파일만 추가하면 라우트·검색·카테고리에 자동 등록
- **서버 없는 구조** — 모든 계산은 브라우저에서. 개인 데이터는 밖으로 나가지 않는다

## 현재 상태

**Phase 0~3 완료** — 코어 프레임워크와 MVP 도구 14개가 동작하고, Docker 이미지가 CI에서 자동 빌드된다.

| 항목 | 상태 |
|---|---|
| 도구 | 14개 (8개 카테고리 전부 최소 1개) |
| 단위 테스트 | 278개 통과 (계산 로직 전량) |
| 초기 번들 | 51.6 kB (gzip) — 목표 200 kB 이내 |
| 도구별 chunk | 0.8 ~ 3.4 kB (gzip), 진입 시에만 로드 |
| CI | 타입검사 · 린트 · 테스트 · 빌드 → Docker 이미지 GHCR 푸시 |

구현된 도구: 계산기, 퍼센트 계산기, 길이/무게/면적/온도 단위 변환, 이자 계산기,
대출 상환 계산기, 대출 한도 계산기, 날짜 계산기, 만 나이 계산기, BMI 계산기,
수학 공식 모음, 글자수 세기

다음 단계는 [04-development-plan.md](docs/04-development-plan.md)의 Phase 4 (확장 도구).

## 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Vue 3 (Composition API, `<script setup>`) | |
| 언어 | TypeScript (strict) | `noUncheckedIndexedAccess` 포함 |
| 빌드 | Vite 7 | |
| 라우팅 | Vue Router 4 | 도구 레지스트리에서 라우트 자동 생성 |
| 상태 | Pinia | 설정·즐겨찾기·최근사용만 |
| 스타일 | Tailwind CSS 4 | CSS-first 설정 (`@theme`), 설정 파일 없음 |
| 검색 | Fuse.js + 한글 초성 매칭 | 팔레트 첫 오픈 시 동적 로드 |
| 아이콘 | 로컬 SVG path 맵 | 아이콘 이름을 문자열로 다뤄야 해서 라이브러리 미사용 |
| 테스트 | Vitest | 계산 로직 단위 테스트 |
| 배포 | Docker multi-stage → Nginx(alpine) | amd64 + arm64 |

## 문서

| 문서 | 내용 |
|---|---|
| [01-requirements.md](docs/01-requirements.md) | 요구사항 정리, 범위, 비기능 요구사항 |
| [02-architecture.md](docs/02-architecture.md) | 폴더 구조, 도구 레지스트리 설계, 검색 설계 |
| [03-tool-catalog.md](docs/03-tool-catalog.md) | 카테고리별 도구 목록과 우선순위 |
| [04-development-plan.md](docs/04-development-plan.md) | 단계별 개발 계획과 진행 상황 |
| [05-adding-a-tool.md](docs/05-adding-a-tool.md) | 새 도구 추가 가이드 |
| [06-deployment-nas.md](docs/06-deployment-nas.md) | Docker 이미지 빌드와 NAS 배포 |

## 빠른 시작

```bash
npm install
npm run dev            # http://localhost:5173

npm run test           # 계산 로직 단위 테스트
npm run typecheck      # 타입 검사
npm run lint           # ESLint
npm run build          # 타입 검사 + 프로덕션 빌드
npm run preview        # 빌드 결과 확인
```

### 새 도구 추가

```bash
npm run new:tool -- savings finance "예금·적금 만기 계산기"
```

`src/tools/savings/` 에 `meta.ts` · `View.vue` · `logic.ts` · `logic.spec.ts` 골격이 생성되고,
레지스트리가 자동으로 수집해 라우트·검색·카테고리에 등록한다.
자세한 규칙은 [05-adding-a-tool.md](docs/05-adding-a-tool.md).

### 컨테이너 실행

```bash
# 직접 빌드
docker compose up -d --build          # http://localhost:8080

# CI가 만든 이미지 사용 (NAS 권장)
docker pull ghcr.io/whwpdn/toolbox:latest
docker compose up -d
```

NAS 배포 절차와 트러블슈팅은 [06-deployment-nas.md](docs/06-deployment-nas.md).

## 주의

금융·세금 관련 계산은 **참고용**이다. 실제 한도·금리·상환액은 금융기관의 심사 기준,
규제지역 여부, 주택 수, 신용등급 등에 따라 달라진다.
세율·규제 비율은 `src/core/finance-policy.ts` 에 기준 일자와 함께 모아두었다.
