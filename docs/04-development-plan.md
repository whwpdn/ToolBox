# 04. 개발 계획

전체 6단계. 각 단계 끝에 **동작하는 상태로 커밋**하고, Phase 3 이후에는 NAS에서 실제로 띄워 확인한다.
혼자 개발 기준 예상 소요는 "작업일" 기준 감각치이며, 순서가 중요하고 기간은 유연하다.

---

## Phase 0 — 프로젝트 셋업 (0.5일)

목표: `npm run dev` 로 빈 페이지가 뜨고, lint·test·build가 통과하는 상태.

- [ ] `npm create vite@latest . -- --template vue-ts`
- [ ] 의존성: `vue-router` `pinia` `@vueuse/core` `fuse.js` `lucide-vue-next`
- [ ] 개발 의존성: `tailwindcss` `@tailwindcss/vite` `vitest` `@vue/test-utils` `eslint` `prettier` `typescript`
- [ ] `vite.config.ts`: `@` → `src` alias, `build.target: 'es2020'`
- [ ] `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`
- [ ] Tailwind: 색상 토큰(CSS 변수 기반 light/dark), 폰트(Pretendard), 간격 스케일
- [ ] npm scripts: `dev` `build` `preview` `test` `test:watch` `lint` `typecheck`
- [ ] `.gitignore`, `.editorconfig`, `.prettierrc`

**완료 기준**: `npm run build && npm run test && npm run typecheck` 모두 성공.

---

## Phase 1 — 코어 프레임워크 (2일)

목표: 도구가 0개여도 동작하는 플랫폼. 이후 모든 도구는 이 위에 얹기만 한다.

### 1-1. 타입 · 카테고리 · 레지스트리
- [ ] `core/types.ts` — `ToolMeta`, `ToolEntry`, `CategoryId`, `Category`
- [ ] `core/categories.ts` — 8개 카테고리 정의 (id, 이름, 아이콘, 설명, 순서)
- [ ] `core/registry.ts` — `import.meta.glob` 수집, `enabled` 필터, 정렬, 카테고리별 그룹핑
- [ ] 개발 모드 검증: `id` 중복, 폴더명 불일치, `View.vue` 누락 시 명확한 에러
- [ ] `registry.spec.ts` — 더미 메타로 수집·필터·정렬 검증

### 1-2. 라우팅 · 셸
- [ ] `core/router.ts` — 홈 / 카테고리 / 도구 / 404 라우트 자동 생성
- [ ] `layouts/AppShell.vue` — 헤더 + 사이드바(데스크톱) + 드로어(모바일)
- [ ] `layouts/ToolLayout.vue` — 제목·설명·즐겨찾기·브레드크럼 + `inputs`/`result`/`note` 슬롯
- [ ] `pages/HomePage.vue` — 즐겨찾기 → 최근사용 → 카테고리 그리드
- [ ] `pages/CategoryPage.vue` — 해당 카테고리 도구 카드 목록
- [ ] `pages/NotFoundPage.vue` — 검색 유도
- [ ] 라우트 전환 시 `document.title` 갱신, 스크롤 top 복귀

### 1-3. 검색
- [ ] `utils/hangul.ts` — 초성 추출, 초성 매칭 + 단위테스트
- [ ] `core/search.ts` — Fuse 인덱스, 초성/퍼지 분기
- [ ] `components/CommandPalette.vue` — `Ctrl+K`/`Cmd+K`/`/` 오픈, ↑↓ 이동, Enter 진입, Esc 닫기
- [ ] 결과 없음 상태 + 카테고리 추천

### 1-4. 상태 · UI 프리미티브
- [ ] `core/storage.ts` — 버전 포함 localStorage 래퍼, 파싱 실패 시 안전 초기화
- [ ] `stores/settings.ts` — 테마(system/light/dark), 숫자 포맷
- [ ] `stores/usage.ts` — 즐겨찾기 토글, 최근사용 push(최대 8, 중복 제거)
- [ ] `components/ui/` — `NumberField` `SelectField` `ResultCard` `DataTable` `CopyButton` `FormulaNote`
- [ ] `composables/useQuerySync.ts` — reactive 객체 ↔ URL 쿼리 (debounce, `replace` 사용)
- [ ] `utils/number.ts`, `utils/money.ts` + 단위테스트

**완료 기준**: 도구를 1개(임시 stub)만 넣어도 홈 카드 → 카테고리 → 도구 페이지 → 검색 진입 → 즐겨찾기가 전부 동작한다.

---

## Phase 2 — MVP 도구 14개 (4~5일)

한 도구씩 **`logic.ts` → `logic.spec.ts` → `View.vue`** 순서로 만든다. 로직 테스트 없이 UI를 먼저 만들지 않는다.

### 2-1. 계산기 · 단위 (1.5일)
- [ ] `calculator` — 키보드 입력, 연산자 우선순위, 백분율, 이력 표시
- [ ] `percentage` — 4가지 모드(A의 B%, A는 B의 몇%, 증감률, 증감 후 값)
- [ ] `unit-length` / `unit-weight` / `unit-temperature` / `unit-area`
  - 변환 계수는 `core/units.ts` 공용 테이블로 두고 4개 도구가 공유
  - 온도는 계수가 아닌 함수 변환이므로 별도 처리

### 2-2. 금융 (2일) — 가장 난도 높고 가치 높은 묶음
- [ ] `interest`
  - 단리: `A = P(1 + rt)`
  - 복리: `A = P(1 + r/n)^(nt)`, 주기 선택(연/반기/분기/월/일)
  - 이자소득세 15.4% 적용 토글, 연도별 누적 표
- [ ] `loan-repayment`
  - 원리금균등: `M = P·i·(1+i)^n / ((1+i)^n − 1)`
  - 원금균등: 매월 원금 = `P/n`, 이자 = 잔액 × i
  - 만기일시: 매월 이자만, 만기에 원금
  - 회차별 스케줄(원금/이자/잔액) 테이블 + CSV 복사
  - **마지막 회차 잔액 보정**으로 원금 합계 = 대출금 검증 (테스트로 고정)
- [ ] `loan-limit`
  - DSR = (해당 대출 연 원리금 + 기존 대출 연 원리금) / 연소득 ≤ 한도
  - DTI = (해당 대출 연 원리금 + 기존 대출 연 이자) / 연소득 ≤ 한도
  - LTV = 대출금 / 주택가격 ≤ 한도
  - 세 기준 각각의 최대 대출금을 역산하고 **최솟값을 최종 한도**로 제시
  - 규제 비율 기본값은 `core/finance-policy.ts` 에 기준일자와 함께 상수로 분리
  - 참고용 고지 문구 노출

### 2-3. 날짜 · 건강 · 수학 · 텍스트 (1일)
- [ ] `date-diff` — 두 날짜 차이(일/주/개월/년), 날짜 ± N일. 윤년·월말 경계 테스트
- [ ] `age` — 만 나이 / 세는 나이 / 다음 생일까지
- [ ] `bmi` — BMI, 판정 구간(대한비만학회 기준), 정상 체중 범위
- [ ] `formula-reference` — 공식 목록(검색 가능) + 값 입력 시 즉시 계산
- [ ] `char-count` — 공백 포함/제외, 단어·줄, UTF-8/EUC-KR 바이트

**완료 기준**: 14개 도구 전부 진입 가능, `logic` 테스트 커버리지 확보, 금융 3종은 손계산·엑셀(`PMT`)과 값 대조 완료.

---

## Phase 3 — Docker · NAS 배포 (0.5일)

- [ ] `Dockerfile` — node:22-alpine 빌드 스테이지 → nginx:alpine 런타임 스테이지
- [ ] `docker/nginx.conf` — SPA fallback, gzip, 자산 캐시 헤더, `/healthz`
- [ ] `docker-compose.yml` — 포트 매핑, `restart: unless-stopped`, healthcheck
- [ ] NAS 아키텍처 확인 후 필요 시 `docker buildx --platform linux/arm64` 빌드
- [ ] NAS에 배포 → 내부망 접속 확인 → 모바일 브라우저 확인
- [ ] (선택) NAS 리버스 프록시 + 서브도메인 연결

상세 절차는 [06-deployment-nas.md](06-deployment-nas.md).

**완료 기준**: NAS에서 컨테이너가 떠 있고, 폰으로 `http://<NAS-IP>:8080` 접속해 도구를 쓸 수 있다.

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
- [ ] **CI** — GitHub Actions: `typecheck` + `test` + `build`, main 병합 시 이미지 빌드·푸시
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

| 리스크 | 대응 |
|---|---|
| 금융 계산 결과가 실제와 미묘하게 다름 | 엑셀 `PMT`/`FV` 함수 및 은행 계산기와 값 대조를 테스트 케이스로 고정. "참고용" 고지 명시 |
| 도구가 늘면서 홈이 산만해짐 | 즐겨찾기·최근사용 우선 노출, 카테고리 접기, 검색 중심 UX |
| 규제 비율·세율 변경 | `finance-policy.ts` 단일 파일 + 기준일자 표기로 수정 지점 최소화 |
| 도구 추가가 귀찮아져서 방치 | 스캐폴드 스크립트(`npm run new:tool`)로 폴더·메타·테스트 골격 자동 생성 |
| NAS 아키텍처(ARM) 빌드 실패 | buildx 멀티플랫폼 빌드, 또는 NAS에서 직접 `docker compose build` |
| 초기 번들 비대화 | 도구 lazy chunk 유지, 빌드 시 번들 크기 확인, 무거운 라이브러리는 도구 chunk 내부로만 |
