# 02. 아키텍처 설계

## 1. 전체 구조

```
브라우저 (Vue 3 SPA)
   │  모든 계산을 클라이언트에서 수행
   │  상태는 localStorage
   ▼
Nginx (alpine, 컨테이너 내부 :80)
   │  정적 파일 서빙 + SPA fallback(try_files → index.html)
   ▼
NAS Docker (호스트 :8080 → 컨테이너 :80)
```

백엔드 없음. 빌드 산출물(`dist/`)을 Nginx가 그대로 서빙하는 정적 SPA다.
서버가 없으므로 스케일·DB·인증 고민이 사라지고, NAS 리소스도 거의 쓰지 않는다.

## 2. 폴더 구조

```
ToolBox/
├─ docs/                          # 설계 문서
├─ public/
│  ├─ favicon.svg
│  └─ manifest.webmanifest        # PWA
├─ src/
│  ├─ main.ts
│  ├─ App.vue                     # <RouterView> + 전역 셸
│  │
│  ├─ core/                       # 도구와 무관한 플랫폼 코드
│  │  ├─ registry.ts              # 도구 자동 수집 + 색인
│  │  ├─ categories.ts            # 카테고리 정의 (단일 소스)
│  │  ├─ router.ts                # 레지스트리 → 라우트 생성
│  │  ├─ search.ts                # Fuse.js 인덱스 + 초성 매칭
│  │  ├─ types.ts                 # ToolMeta, Category 등 공용 타입
│  │  └─ storage.ts               # localStorage 래퍼 (스키마 버전 포함)
│  │
│  ├─ stores/                     # Pinia
│  │  ├─ settings.ts              # 테마, 숫자 포맷(1,000 구분자 등)
│  │  └─ usage.ts                 # 즐겨찾기, 최근 사용
│  │
│  ├─ layouts/
│  │  ├─ AppShell.vue             # 헤더 + 사이드바 + 콘텐츠 슬롯
│  │  └─ ToolLayout.vue           # 도구 페이지 공통 프레임
│  │
│  ├─ components/
│  │  ├─ ui/                      # 디자인 시스템 프리미티브
│  │  │  ├─ NumberField.vue       # 숫자 입력(천단위 구분, 단위 접미사)
│  │  │  ├─ SelectField.vue
│  │  │  ├─ ResultCard.vue        # 결과 강조 + 복사 버튼
│  │  │  ├─ DataTable.vue         # 상환 스케줄 등 표
│  │  │  ├─ FormulaNote.vue       # 접이식 계산식 설명
│  │  │  └─ CopyButton.vue
│  │  ├─ CommandPalette.vue       # Ctrl+K 검색
│  │  ├─ CategoryGrid.vue
│  │  ├─ ToolCard.vue
│  │  └─ FavoriteToggle.vue
│  │
│  ├─ composables/
│  │  ├─ useQuerySync.ts          # 입력 상태 ↔ URL 쿼리 양방향 동기화
│  │  ├─ useClipboard.ts
│  │  ├─ useHotkey.ts
│  │  └─ useRecentTools.ts
│  │
│  ├─ utils/
│  │  ├─ number.ts                # 반올림, 천단위, 통화 포맷
│  │  ├─ money.ts                 # 원 단위 정수 연산 (부동소수 방지)
│  │  └─ hangul.ts                # 초성 추출 / 초성 매칭
│  │
│  ├─ tools/                      # ★ 도구 하나 = 폴더 하나
│  │  ├─ calculator/
│  │  │  ├─ meta.ts
│  │  │  ├─ View.vue
│  │  │  ├─ logic.ts
│  │  │  └─ logic.spec.ts
│  │  ├─ unit-length/
│  │  ├─ loan-repayment/
│  │  └─ ...
│  │
│  └─ pages/
│     ├─ HomePage.vue
│     ├─ CategoryPage.vue
│     └─ NotFoundPage.vue
│
├─ docker/
│  └─ nginx.conf
├─ Dockerfile
├─ docker-compose.yml
├─ vite.config.ts
├─ tailwind.config.js
├─ tsconfig.json
└─ package.json
```

**핵심 원칙**: `core/`, `components/`, `utils/` 는 특정 도구를 알지 못한다.
의존 방향은 `tools/ → core·components·utils` 단방향이며, 그 반대는 없다.
그래서 도구를 추가/삭제해도 플랫폼 코드는 손대지 않는다.

## 3. 도구 레지스트리 (확장성의 핵심)

### 3.1 타입

```ts
// src/core/types.ts
export type CategoryId =
  | 'calculator' | 'unit' | 'finance' | 'math'
  | 'datetime' | 'health' | 'text' | 'random'

export interface ToolMeta {
  /** URL 슬러그. /tools/<id> — 한 번 정하면 바꾸지 않는다(북마크 보존) */
  id: string
  title: string
  /** 카드·검색 결과에 쓰이는 한 줄 설명 */
  description: string
  category: CategoryId
  /** 검색어. 한글/영문/오타/동의어를 넉넉히 넣는다 */
  keywords: string[]
  icon: string                 // lucide 아이콘 이름
  /** 홈 정렬 가중치. 낮을수록 앞 */
  order?: number
  /** false면 라우트·검색에서 완전히 제외 */
  enabled?: boolean
  /** 네트워크 필요 여부 (오프라인 배지 표시용) */
  requiresNetwork?: boolean
}

export interface ToolEntry extends ToolMeta {
  /** 동적 import — 라우트 진입 시에만 로드 */
  component: () => Promise<unknown>
}
```

### 3.2 자동 수집

```ts
// src/core/registry.ts
const metaModules = import.meta.glob<{ default: ToolMeta }>(
  '../tools/*/meta.ts',
  { eager: true },
)
const viewModules = import.meta.glob('../tools/*/View.vue')  // lazy

export const tools: ToolEntry[] = Object.entries(metaModules)
  .map(([path, mod]) => {
    const dir = path.replace('/meta.ts', '')
    const component = viewModules[`${dir}/View.vue`]
    if (!component) throw new Error(`${dir}: View.vue 없음`)
    return { ...mod.default, component }
  })
  .filter(t => t.enabled !== false)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title, 'ko'))

export const toolsByCategory = Object.groupBy(tools, t => t.category)
export const toolById = new Map(tools.map(t => [t.id, t]))
```

`meta.ts` 의 `id` 가 폴더명과 일치하는지, 중복된 `id` 가 없는지는 개발 모드에서 assert로 검사한다.

### 3.3 라우트 생성

```ts
// src/core/router.ts
const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue') },
  { path: '/c/:categoryId', name: 'category', component: () => import('@/pages/CategoryPage.vue') },
  ...tools.map(tool => ({
    path: `/tools/${tool.id}`,
    name: `tool:${tool.id}`,
    component: tool.component,
    meta: { tool },              // ToolLayout·브레드크럼·최근사용이 참조
  })),
  { path: '/:pathMatch(.*)*', component: () => import('@/pages/NotFoundPage.vue') },
]
```

라우터가 도구 목록을 하드코딩하지 않는다 → **파일 추가만으로 페이지가 생긴다.**

## 4. 검색 설계

```ts
// src/core/search.ts
const fuse = new Fuse(tools, {
  keys: [
    { name: 'title',       weight: 3 },
    { name: 'keywords',    weight: 2 },
    { name: 'description', weight: 1 },
  ],
  threshold: 0.4,          // 오타 허용
  ignoreLocation: true,
})

export function searchTools(query: string): ToolEntry[] {
  const q = query.trim()
  if (!q) return []

  // 1) 초성만 입력한 경우: ㄷㅊㅎㄷ → 대출한도
  if (isChoseongOnly(q)) {
    return tools.filter(t =>
      matchChoseong(t.title, q) || t.keywords.some(k => matchChoseong(k, q)))
  }
  // 2) 일반 퍼지 검색
  return fuse.search(q).map(r => r.item)
}
```

한글 초성 추출은 `utils/hangul.ts`:

```ts
const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
export const toChoseong = (s: string) =>
  [...s].map(ch => {
    const code = ch.charCodeAt(0) - 0xac00
    return code >= 0 && code <= 11171 ? CHOSEONG[Math.floor(code / 588)] : ch
  }).join('')
```

검색 인덱스는 레지스트리에서 만들어지므로, 도구를 추가하면 **검색에도 자동 반영된다.**

## 5. 도구 페이지 규격

모든 도구 `View.vue` 는 `ToolLayout` 안에서 동일한 골격을 따른다.

```vue
<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { calcLoanRepayment } from './logic'

const input = reactive({ principal: 100_000_000, rate: 4.5, months: 360, type: 'equal-total' })
useQuerySync(input)                                  // URL ↔ 입력 동기화 (F-24)
const result = computed(() => calcLoanRepayment(input))
</script>

<template>
  <ToolLayout>
    <template #inputs>  <!-- 좌: 입력 --> </template>
    <template #result>  <!-- 우: 결과 강조 + 표 --> </template>
    <template #note>    <FormulaNote>계산식 설명</FormulaNote> </template>
  </ToolLayout>
</template>
```

**계산 로직은 반드시 `logic.ts` 로 분리**한다. 이유:

- Vue 없이 순수 함수로 단위테스트 가능 (`logic.spec.ts`)
- 다른 도구에서 재사용 가능 (대출 상환 ↔ 대출 한도는 같은 원리금 공식을 공유)
- 리팩터링 시 UI와 계산의 회귀를 분리해서 판단 가능

## 6. 금액 계산 정밀도

`0.1 + 0.2 !== 0.3` 문제로 금액이 1원씩 틀리면 도구 신뢰가 무너진다.

- 화폐 금액은 **원 단위 정수**로 다루고, 표시 직전에만 포맷한다
- 월 이자율처럼 나눗셈이 필요한 중간 계산은 `number` 로 하되, 결과는 `Math.round` 로 원 단위 확정
- 상환 스케줄은 **마지막 회차에 잔액 보정**을 넣어 원금 합계가 정확히 대출금과 일치하게 한다
- `utils/money.ts` 에 `round0`, `sumWon`, `formatWon` 을 모아 도구들이 공유

## 7. 상태 관리 범위

| 데이터 | 위치 | 이유 |
|---|---|---|
| 도구 입력값 | 컴포넌트 로컬 + URL 쿼리 | 도구 간 공유 불필요, 링크 공유가 더 유용 |
| 즐겨찾기 / 최근사용 | Pinia `usage` + localStorage | 전역 노출 필요 |
| 테마 / 숫자 포맷 | Pinia `settings` + localStorage | 전역 노출 필요 |

localStorage 키에는 스키마 버전을 함께 저장해서, 나중에 구조가 바뀌면 마이그레이션하거나 안전하게 초기화한다.

## 8. 성능

- 도구는 전부 lazy chunk (`import.meta.glob` non-eager) → 홈 진입 시 도구 코드 미로드
- `meta.ts` 만 eager 이므로 카테고리·검색 인덱스 비용은 메타데이터 수준
- Fuse.js 는 명령 팔레트 첫 오픈 시 동적 import
- 차트가 필요한 도구는 해당 도구 chunk 안에서만 차트 라이브러리 로드
- Nginx: gzip/brotli, 해시 파일명 자산은 `immutable` 1년 캐시, `index.html` 은 no-cache
