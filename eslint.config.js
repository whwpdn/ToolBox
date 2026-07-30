import js from '@eslint/js'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },

  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: ts.parser },
    },
  },

  {
    rules: {
      // 브라우저 전역(window, document, HTMLElement 등)의 존재 여부는
      // TypeScript의 lib 설정이 이미 검사한다. no-undef는 중복이고 오탐만 낸다.
      'no-undef': 'off',
      // 도구 View.vue 는 파일명이 모두 같으므로 컴포넌트명 규칙을 강제하지 않는다
      'vue/multi-word-component-names': 'off',
      // TypeScript의 옵셔널 프로퍼티(?)로 이미 표현되므로 기본값을 강제하지 않는다
      'vue/require-default-prop': 'off',
      // 포매팅은 Prettier가 담당한다
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
)
