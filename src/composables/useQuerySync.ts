import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toNumber } from '@/utils/number'

/**
 * 도구 입력값 ↔ URL 쿼리 양방향 동기화.
 *
 * 계산 결과를 링크로 공유하고 북마크할 수 있게 하는 것이 목적이다.
 * - 마운트 시 URL의 쿼리를 입력 객체에 반영 (타입은 기존 값 기준으로 추론)
 * - 이후 입력이 바뀌면 replace로 URL을 갱신 (뒤로가기 히스토리를 오염시키지 않는다)
 */
export function useQuerySync<T extends Record<string, string | number | boolean>>(
  state: T,
  options: { debounceMs?: number } = {},
): void {
  const route = useRoute()
  const router = useRouter()
  const debounceMs = options.debounceMs ?? 300
  const defaults = { ...state } as T

  onMounted(() => {
    for (const key of Object.keys(defaults) as Array<keyof T & string>) {
      const raw = route.query[key]
      if (raw === undefined || raw === null) continue
      const text = Array.isArray(raw) ? raw[0] : raw
      if (text === null || text === undefined) continue

      const current = defaults[key]
      if (typeof current === 'number') {
        state[key] = toNumber(text, current) as T[typeof key]
      } else if (typeof current === 'boolean') {
        state[key] = (text === 'true') as T[typeof key]
      } else {
        state[key] = text as T[typeof key]
      }
    }
  })

  let timer: ReturnType<typeof setTimeout> | undefined

  watch(
    () => ({ ...state }),
    (value) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const query: Record<string, string> = {}
        for (const [key, v] of Object.entries(value)) {
          // 기본값과 같은 항목은 URL에 싣지 않는다 (링크를 짧게 유지)
          if (v === defaults[key]) continue
          query[key] = String(v)
        }
        void router.replace({ query })
      }, debounceMs)
    },
    { deep: true },
  )
}
