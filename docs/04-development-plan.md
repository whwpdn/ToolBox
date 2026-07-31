# 04. 개발 계획

전체 6단계. 각 단계 끝에 **동작하는 상태로 커밋**하고, Phase 3 이후에는 NAS에서 실제로 띄워 확인한다.
혼자 개발 기준 예상 소요는 "작업일" 기준 감각치이며, 순서가 중요하고 기간은 유연하다.

**진행 상황: Phase 0 ~ 3 완료.** Phase 4(확장 도구)가 다음 작업이다.

---

## Phase 0 — 프로젝트 셋업 ✅

목표: `npm run dev` 로 빈 페이지가 뜨고, lint·test·build가 통과하는 상태.

- [x] Vite + Vue 3 + TypeScript 스캐폴드
- [x] 의존성: `vue-router` `pinia` `fuse.js`
- [x] 개발 의존성: `tailwindcss` `@tailwindcss/vite` `vitest` `eslint` `prettier` `typescript` `vue-tsc`
- [x] `vite.config.ts`: `@` → `src` alias, `build.target: 'es2020'`, 도구별 chunk 이름 지정
- [x] `tsconfig.json`: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`
- [x] Tailwind 4: `@theme` 색상 토큰(light/dark), 클래스 기반 다크 모드
- [x] npm scripts: `dev` `build` `preview` `test` `test:watch` `lint` `typecheck` `new:tool`
- [x] `.gitignore`, `.prettierrc.json`, `eslint.config.js`

**완료 기준 충족**: `npm run typecheck && npm run lint && npm run test && npm run build` 모두 성공.

계획과 달라진 점:

- **`@vueuse/core` 제외** — 실제로 필요한 게 클립보드뿐이어서 직접 구현이 더 짧았다.
- **`lucide-vue-next` 제외** — 아이콘 이름을 메타데이터 문자열로 다뤄야 해서 동적 참조가 되고,
  그러면 tree-shaking이 안 돼 세트 전체가 번들에 들어간다. `AppIcon.vue` 의 SVG path 맵으로 대체.
- **`@vue/test-utils`·jsdom 제외** — 테스트를 순수 로직에 집중시켰다. 근거는
  [02-architecture.md](02-architecture.md) 의 '테스트 범위' 절.
- **ESLint 10 사용** — 9에서는 전이 의존성 보안 권고가 남았고 10에서 해소됐다. `npm audit` 0건.
- **`tailwind.config.js` 없음** — Tailwind 4는 CSS-first 설정이라 `styles/main.css` 에서 정의한다.

---

## Phase 1 — 코어 프레임워크 ✅

목표: 도구가 0개여도 동작하는 플랫폼. 이후 모든 도구는 이 위에 얹기만 한다.

### 1-1. 타입 · 카테고리 · 레지스트리

- [x] `core/types.ts` — `ToolMeta`, `ToolEntry`, `CategoryId`, `Category`
- [x] `core/categories.ts` — 8개 카테고리 정의 (id, 이름, 아이콘, 설명, 순서)
- [x] `core/registry.ts` — `import.meta.glob` 수집, `enabled` 필터, 정렬, 카테고리별 그룹핑
- [x] 개발 모드 검증: `id` 중복, 폴더명 불일치, `View.vue` 누락, 미등록 카테고리 시 명확한 에러
- [ ] ~~`registry.spec.ts`~~ — 보류. `import.meta.glob` 은 Vite 변환 시점에 정적 치환되므로
      Vitest(node 환경)에서 더미 모듈을 주입할 방법이 마땅치 않다. 대신 레지스트리의 검증 로직은
      앱 부팅 시 즉시 throw 하도록 만들어, 규칙을 어기면 개발 서버가 바로 실패한다.
      `core/units.spec.ts` 로 변환 테이블은 별도 검증.

### 1-2. 라우팅 · 셸

- [x] `core/router.ts` — 홈 / 카테고리 / 도구 / 404 라우트 자동 생성
- [x] `layouts/AppShell.vue` — 헤더 + 사이드바(데스크톱) + 드로어(모바일)
- [x] `layouts/ToolLayout.vue` — 제목·설명·즐겨찾기·브레드크럼 + `inputs`/`result`/`note` 슬롯
- [x] `pages/HomePage.vue` — 즐겨찾기 → 최근사용 → 카테고리 그리드
- [x] `pages/CategoryPage.vue` — 해당 카테고리 도구 카드 목록
- [x] `pages/NotFoundPage.vue` — 검색 유도
- [x] 라우트 전환 시 `document.title` 갱신, 스크롤 top 복귀

### 1-3. 검색

- [x] `utils/hangul.ts` — 초성 추출, 초성 매칭 + 단위테스트
- [x] `core/search.ts` — Fuse 인덱스, 초성/퍼지 분기
- [x] `components/CommandPalette.vue` — `Ctrl+K`/`Cmd+K`/`/` 오픈, ↑↓ 이동, Enter 진입, Esc 닫기
- [x] 결과 없음 상태 + 카테고리 추천

### 1-4. 상태 · UI 프리미티브

- [x] `core/storage.ts` — 버전 포함 localStorage 래퍼, 파싱 실패 시 안전 초기화
- [x] `stores/settings.ts` — 테마(system/light/dark). 숫자 포맷 설정은 실제 필요가 없어 넣지 않았다
- [x] `stores/usage.ts` — 즐겨찾기 토글, 최근사용 push(최대 8, 중복 제거), 삭제된 도구 id 자동 정리
- [x] `components/ui/` — `AppIcon` `NumberField` `DateField` `SelectField` `ResultCard` `DataTable` `CopyButton` `FormulaNote`
- [x] `composables/useQuerySync.ts` — reactive 객체 ↔ URL 쿼리 (debounce, `replace` 사용)
- [x] `utils/number.ts`, `utils/money.ts` + 단위테스트

**완료 기준**: 도구를 1개(임시 stub)만 넣어도 홈 카드 → 카테고리 → 도구 페이지 → 검색 진입 → 즐겨찾기가 전부 동작한다.

---

## Phase 2 — MVP 도구 14개 ✅

한 도구씩 **`logic.ts` → `logic.spec.ts` → `View.vue`** 순서로 만든다. 로직 테스트 없이 UI를 먼저 만들지 않는다.

### 2-1. 계산기 · 단위 (1.5일)

- [x] `calculator` — 키보드 입력, 연산자 우선순위, 백분율, 이력 표시
- [x] `percentage` — 4가지 모드(A의 B%, A는 B의 몇%, 증감률, 증감 후 값)
- [x] `unit-length` / `unit-weight` / `unit-temperature` / `unit-area`
  - 변환 계수는 `core/units.ts` 공용 테이블로 두고 4개 도구가 공유
  - 온도는 계수가 아닌 함수 변환이므로 별도 처리

### 2-2. 금융 (2일) — 가장 난도 높고 가치 높은 묶음

- [x] `interest`
  - 단리: `A = P(1 + rt)`
  - 복리: `A = P(1 + r/n)^(nt)`, 주기 선택(연/반기/분기/월/일)
  - 이자소득세 15.4% 적용 토글, 연도별 누적 표
- [x] `loan-repayment`
  - 원리금균등: `M = P·i·(1+i)^n / ((1+i)^n − 1)`
  - 원금균등: 매월 원금 = `P/n`, 이자 = 잔액 × i
  - 만기일시: 매월 이자만, 만기에 원금
  - 회차별 스케줄(원금/이자/잔액) 테이블 + CSV 복사
  - **마지막 회차 잔액 보정**으로 원금 합계 = 대출금 검증 (테스트로 고정)
- [x] `loan-limit`
  - DSR = (해당 대출 연 원리금 + 기존 대출 연 원리금) / 연소득 ≤ 한도
  - DTI = (해당 대출 연 원리금 + 기존 대출 연 이자) / 연소득 ≤ 한도
  - LTV = 대출금 / 주택가격 ≤ 한도
  - 세 기준 각각의 최대 대출금을 역산하고 **최솟값을 최종 한도**로 제시
    (어느 기준이 병목인지 `binding` 으로 표시)
  - 소득 기준 역산은 `loan-repayment` 의 `monthlyPayment` 역함수를 사용하고,
    왕복 검증 테스트로 두 함수가 서로의 역임을 고정
  - 규제 비율 기본값은 `core/finance-policy.ts` 에 기준일자와 함께 상수로 분리
  - 참고용 고지 문구 노출

### 2-3. 날짜 · 건강 · 수학 · 텍스트 (1일)

- [x] `date-diff` — 두 날짜 차이(일/주/개월/년), 날짜 ± N일. 윤년·월말 경계 테스트
- [x] `age` — 만 나이 / 세는 나이 / 다음 생일까지
- [x] `bmi` — BMI, 판정 구간(대한비만학회 기준), 정상 체중 범위
- [x] `formula-reference` — 공식 목록(검색 가능) + 값 입력 시 즉시 계산
- [x] `char-count` — 공백 포함/제외, 단어·줄, UTF-8/EUC-KR 바이트

**완료 기준 충족**: 14개 도구 전부 진입 가능, 계산 로직 단위 테스트 **284개** 통과,
`loan-repayment` 는 엑셀 `PMT` 값(1억/4.5%/30년 → 506,685원 등)과 대조해 테스트로 고정.

브라우저 검증(Chromium): 홈 렌더, 상환 스케줄 360행, 입력↔URL 동기화, 초성 검색,
수식 평가, 즐겨찾기 저장, 다크 모드, 404, 모바일 360px 무오버플로 — 11/11 통과, 콘솔 오류 0건.

---

## Phase 3 — Docker · CI 이미지 자동 빌드 ✅

- [x] `Dockerfile` — node:22-alpine 빌드 스테이지 → nginx:stable-alpine 런타임 스테이지
- [x] `docker/nginx.conf` — SPA fallback, gzip, 자산 캐시 헤더, `/healthz`, CSP
- [x] `docker-compose.yml` — 포트 매핑, `restart: unless-stopped`, healthcheck, 로그 로테이션
- [x] `.github/workflows/ci.yml`
  - `verify` 잡: 타입검사 → 린트 → 테스트 → 빌드 → 번들 크기 리포트
  - `image` 잡: amd64 단일 이미지로 **실제 컨테이너를 띄워 검증**한 뒤
    amd64 + arm64 멀티아키텍처로 GHCR 푸시 (`ghcr.io/whwpdn/toolbox`)
  - 컨테이너 검증 항목: `/healthz`, index.html 서빙, SPA fallback(`/tools/bmi` → 200),
    자산 `immutable` 캐시 헤더, index.html `no-cache` 헤더
  - GitHub Actions 캐시(`type=gha`)로 재빌드 단축, PR에서는 푸시하지 않음

### 남은 작업 (사용자 환경에서만 가능)

- [ ] NAS 아키텍처 확인 (`uname -m`)
- [ ] NAS에 배포 → 내부망 접속 확인 → 모바일 브라우저 확인
- [ ] (선택) NAS 리버스 프록시 + 서브도메인 + HTTPS 연결

상세 절차는 [06-deployment-nas.md](06-deployment-nas.md).

> **주의**: 이 저장소의 컨테이너 검증은 CI에서 수행된다. 개발 샌드박스에는 Docker 데몬이
> 없어 로컬 이미지 빌드는 실행하지 못했다. 첫 푸시 후 Actions 결과를 확인할 것.

---

## Phase 4 — 확장 도구 (P1, 3~4일)

배포된 상태에서 실제로 쓰면서 필요한 순서대로 추가한다. 도구 추가는 Phase 1 구조 덕분에 **폴더 하나 = 1~3시간** 작업이어야 한다. 그보다 오래 걸리면 플랫폼(공용 컴포넌트) 쪽에 부족한 게 있다는 신호로 보고 그걸 먼저 보강한다.

우선 순서 제안:

1. `savings` 예금·적금 만기 — 금융 로직 재사용
2. `vat` 부가세 · `salary` 연봉 실수령액
3. `unit-volume` / `unit-speed` / `unit-data`
4. `dday` · `workdays` · `timezone`
5. `bmr` · `electricity` · `fuel-cost`
6. `json-format` · `base64` · `hash` · `color-convert`
7. `gcd-lcm` · `radix` · `statistics`
8. `lotto`

---

## Phase 5 — 고도화 (2일, 선택)

- [ ] **PWA** — `vite-plugin-pwa`, 정적 자산 precache, 홈 화면 추가, 오프라인 동작
- [ ] **입력 프리셋** — 도구별 자주 쓰는 입력 저장 (예: 내 대출 조건)
- [ ] **결과 공유** — URL 복사 버튼, 결과 이미지 저장
- [ ] **차트** — 상환 스케줄·복리 성장 곡선 (경량 라이브러리 또는 직접 SVG)
- [ ] **키보드 내비게이션** 전면 점검, 스크린리더 라벨 검증
- [x] ~~**CI**~~ — Phase 3에서 완료 (검증 + 멀티아키텍처 이미지 푸시)
- [ ] **E2E 회귀 테스트** — Phase 2에서 수동으로 돌린 브라우저 검증을 Playwright로 CI에 편입
- [ ] **i18n 구조** — 문자열 추출만 해두고 한국어 단일 로케일 유지

---

## 개발 규칙

1. **계산 로직은 `logic.ts`, 테스트 필수.** UI 없이 검증 가능한 상태를 유지한다.
2. **도구는 플랫폼을 수정하지 않고 추가된다.** 도구 때문에 `core/` 를 고쳐야 하면 그건 플랫폼 개선 커밋으로 분리한다.
3. **금액은 원 단위 정수.** 부동소수 결과를 그대로 표시하지 않는다.
4. **기준값(세율·규제비율)은 상수 파일에 기준일자와 함께.** 도구 코드에 숫자를 박지 않는다.
5. **커밋은 도구/기능 단위**로 작게. `feat(tool): 대출 상환 계산기 추가` 형태.
6. **`id` 는 불변.** 배포 후 슬러그를 바꾸면 북마크가 깨진다. 바꿔야 하면 리다이렉트를 남긴다.

## 리스크와 대응

| 리스크                                | 대응                                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| 금융 계산 결과가 실제와 미묘하게 다름 | 엑셀 `PMT`/`FV` 함수 및 은행 계산기와 값 대조를 테스트 케이스로 고정. "참고용" 고지 명시 |
| 도구가 늘면서 홈이 산만해짐           | 즐겨찾기·최근사용 우선 노출, 카테고리 접기, 검색 중심 UX                                 |
| 규제 비율·세율 변경                   | `finance-policy.ts` 단일 파일 + 기준일자 표기로 수정 지점 최소화                         |
| 도구 추가가 귀찮아져서 방치           | 스캐폴드 스크립트(`npm run new:tool`)로 폴더·메타·테스트 골격 자동 생성                  |
| NAS 아키텍처(ARM) 빌드 실패           | buildx 멀티플랫폼 빌드, 또는 NAS에서 직접 `docker compose build`                         |
| 초기 번들 비대화                      | 도구 lazy chunk 유지, 빌드 시 번들 크기 확인, 무거운 라이브러리는 도구 chunk 내부로만    |
