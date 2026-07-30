# 05. 새 도구 추가 가이드

도구 하나 = 폴더 하나. **플랫폼 코드는 건드리지 않는다.**

## 1. 폴더 만들기

```
src/tools/<tool-id>/
├─ meta.ts          # 도구 메타데이터 (필수)
├─ View.vue         # 도구 화면 (필수)
├─ logic.ts         # 순수 계산 함수 (계산이 있으면 필수)
└─ logic.spec.ts    # 로직 단위테스트 (logic.ts 가 있으면 필수)
```

`<tool-id>` 는 kebab-case, URL 슬러그가 된다 (`/tools/<tool-id>`).
**한 번 배포한 id는 바꾸지 않는다.**

## 2. `meta.ts`

```ts
import type { ToolMeta } from '@/core/types'

const meta: ToolMeta = {
  id: 'loan-limit',                 // 폴더명과 반드시 동일
  title: '대출 한도 계산기',
  description: '연소득과 기존 부채로 DSR·DTI·LTV 기준 대출 한도를 계산합니다',
  category: 'finance',
  keywords: [
    '대출한도', '대출', '한도', 'DSR', 'DTI', 'LTV',
    '주택담보대출', '주담대', '영끌', 'loan', 'limit',
  ],
  icon: 'landmark',
  order: 30,
}

export default meta
```

### keywords 작성 요령

내가 이 도구를 찾을 때 **실제로 칠 만한 말**을 다 넣는다. 인덱스 비용은 무시할 수준이다.

- 정식 명칭 + 줄임말 (`주택담보대출`, `주담대`)
- 구어체 (`영끌`, `얼마까지 빌릴 수 있나`)
- 영문 (`loan`, `limit`)
- 관련 지표 약어 (`DSR`, `LTV`)

초성 검색은 `title` 과 `keywords` 에서 자동 생성되므로 따로 넣지 않는다.

## 3. `logic.ts` — 순수 함수로

```ts
export interface LoanLimitInput {
  annualIncome: number      // 연소득 (원)
  existingAnnualPayment: number
  housePrice: number
  annualRatePct: number
  years: number
  dsrLimitPct: number
  ltvLimitPct: number
}

export interface LoanLimitResult {
  byDsr: number
  byLtv: number
  final: number             // min(byDsr, byLtv)
  binding: 'DSR' | 'LTV'
}

export function calcLoanLimit(input: LoanLimitInput): LoanLimitResult {
  // Vue·DOM·전역 상태를 참조하지 않는다
  // 입력 → 출력만. 예외 상황은 던지지 말고 0 또는 명시적 결과로 반환
}
```

규칙:
- Vue import 금지 (`ref`, `computed` 등 없음)
- 부작용 없음, 같은 입력이면 항상 같은 출력
- 금액 반환값은 **원 단위 정수** (`utils/money.ts` 의 `round0` 사용)
- 세율·규제 비율 같은 정책 상수는 `core/finance-policy.ts` 에서 import

## 4. `logic.spec.ts`

```ts
import { describe, expect, it } from 'vitest'
import { calcLoanLimit } from './logic'

describe('calcLoanLimit', () => {
  it('DSR이 더 빡빡하면 DSR 한도를 최종값으로 쓴다', () => {
    const r = calcLoanLimit({ /* ... */ })
    expect(r.final).toBe(r.byDsr)
    expect(r.binding).toBe('DSR')
  })

  it('연소득 0이면 한도는 0', () => { /* ... */ })

  it('엑셀 PMT 기준값과 일치한다', () => {
    // 외부 검증된 값을 회귀 테스트로 고정
  })
})
```

최소 케이스: 정상값 1개, 경계값(0·최대) 2개, 외부 검증값 1개.

## 5. `View.vue`

```vue
<script setup lang="ts">
import { computed, reactive } from 'vue'
import ToolLayout from '@/layouts/ToolLayout.vue'
import NumberField from '@/components/ui/NumberField.vue'
import ResultCard from '@/components/ui/ResultCard.vue'
import FormulaNote from '@/components/ui/FormulaNote.vue'
import { useQuerySync } from '@/composables/useQuerySync'
import { formatWon } from '@/utils/money'
import { calcLoanLimit } from './logic'

const input = reactive({
  annualIncome: 60_000_000,
  existingAnnualPayment: 0,
  housePrice: 500_000_000,
  annualRatePct: 4.5,
  years: 30,
  dsrLimitPct: 40,
  ltvLimitPct: 70,
})

useQuerySync(input)                                   // URL 쿼리 동기화
const result = computed(() => calcLoanLimit(input))
</script>

<template>
  <ToolLayout>
    <template #inputs>
      <NumberField v-model="input.annualIncome" label="연소득" suffix="원" thousands />
      <NumberField v-model="input.annualRatePct" label="금리" suffix="%" :step="0.1" />
      <!-- ... -->
    </template>

    <template #result>
      <ResultCard
        :label="`최종 한도 (${result.binding} 기준)`"
        :value="formatWon(result.final)"
        copyable
      />
      <!-- 보조 지표: DSR 한도 / LTV 한도 -->
    </template>

    <template #note>
      <FormulaNote>
        DSR = (신규 대출 연 원리금 + 기존 대출 연 원리금) ÷ 연소득<br>
        LTV = 대출금 ÷ 주택가격<br>
        실제 금융기관 심사 결과와 다를 수 있는 참고용 계산입니다.
      </FormulaNote>
    </template>
  </ToolLayout>
</template>
```

## 6. 확인

```bash
npm run test -- src/tools/loan-limit    # 로직 테스트
npm run dev                             # /tools/loan-limit 접속
```

체크리스트:
- [ ] 홈 → 해당 카테고리에 카드가 보인다
- [ ] `Ctrl+K` 에서 이름·키워드·초성으로 검색된다
- [ ] 즐겨찾기 토글이 동작한다
- [ ] 입력 변경 시 URL 쿼리가 바뀌고, 그 URL을 새로 열면 값이 복원된다
- [ ] 360px 폭에서 레이아웃이 깨지지 않는다
- [ ] 빈 입력·0·음수·아주 큰 값에서 `NaN`/`Infinity` 가 화면에 노출되지 않는다
- [ ] 키보드만으로 모든 입력에 도달·조작 가능하다

빌드 후 새 chunk 하나가 추가되고 초기 번들 크기는 그대로여야 한다:

```bash
npm run build   # dist/assets/loan-limit-<hash>.js 확인
```

## 7. 도구 임시 숨기기

삭제하지 않고 메타에 플래그만 준다. 라우트·검색·카테고리에서 모두 빠진다.

```ts
const meta: ToolMeta = { /* ... */ enabled: false }
```

## 8. 새 카테고리 추가

`src/core/categories.ts` 한 곳만 수정한다.

```ts
export const categories: Category[] = [
  // ...
  { id: 'travel', name: '여행', icon: 'plane', description: '환율·시차·짐 무게', order: 90 },
]
```

`CategoryId` 유니온 타입에도 `'travel'` 을 추가하면, 타입 검사가 오타를 잡아준다.

## 9. 커밋

```
feat(tool): 대출 한도 계산기 추가

- DSR / DTI / LTV 기준 한도 역산, 최솟값을 최종 한도로 제시
- 규제 비율은 finance-policy.ts 상수 사용 (기준일 2026-07)
- logic 단위테스트 6케이스 (엑셀 PMT 대조값 포함)
```
