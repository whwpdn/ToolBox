import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { load, save } from '@/core/storage'

export type ThemeMode = 'system' | 'light' | 'dark'

const KEY = 'settings'
const VERSION = 1

interface SettingsData {
  theme: ThemeMode
}

/**
 * index.html 의 인라인 스크립트가 같은 키를 읽어 첫 페인트 전에 테마를 적용한다.
 * 저장 구조를 바꿀 때는 그 스크립트도 함께 수정해야 한다.
 */
export const useSettingsStore = defineStore('settings', () => {
  const initial = load<SettingsData>(KEY, VERSION, { theme: 'system' })
  const theme = ref<ThemeMode>(initial.theme)

  function applyTheme() {
    const dark =
      theme.value === 'dark' ||
      (theme.value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode
  }

  /** 헤더 토글용: light ↔ dark 만 순환 (system은 최초 상태로만 존재) */
  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'light' : 'dark')
  }

  watch(
    theme,
    (value) => {
      save<SettingsData>(KEY, VERSION, { theme: value })
      applyTheme()
    },
    { immediate: true },
  )

  // 시스템 설정을 따라가는 동안에는 OS 테마 변경에 반응한다
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'system') applyTheme()
  })

  return { theme, setTheme, toggleTheme }
})
