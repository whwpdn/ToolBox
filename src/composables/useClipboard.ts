import { ref } from 'vue'

/** 복사 성공 시 짧게 true가 되는 플래그를 함께 돌려준다(버튼 피드백용) */
export function useClipboard(resetMs = 1500) {
  const copied = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      clearTimeout(timer)
      timer = setTimeout(() => (copied.value = false), resetMs)
      return true
    } catch {
      // HTTPS가 아니거나 권한이 없으면 클립보드 API가 막힌다.
      // NAS를 http로 접속하는 경우가 있어 실패를 조용히 무시하지 않고 false를 돌려준다.
      return false
    }
  }

  return { copied, copy }
}
