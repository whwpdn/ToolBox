/**
 * UI 프리미티브의 공용 타입.
 * <script setup> 안에서는 ES export가 불가능하므로 타입은 이 파일에 모은다.
 */

export interface SelectOption {
  value: string
  label: string
}

export interface Column {
  key: string
  label: string
  /** 숫자 열은 오른쪽 정렬 + tabular-nums 로 표시된다 */
  numeric?: boolean
}
