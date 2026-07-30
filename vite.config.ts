import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  /*
   * 포트는 환경변수로 덮어쓸 수 있게 둔다. 설정 파일을 고치지 않고 바꿀 수 있다.
   *   PORT=3000 npm run dev
   *   PREVIEW_PORT=8080 npm run preview
   * 다른 기기(폰 등)에서 접속해야 하면 --host 를 붙인다: npm run dev -- --host
   */
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  preview: {
    port: Number(process.env.PREVIEW_PORT) || 4173,
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        /*
         * 도구는 모두 View.vue 이므로 기본 규칙으로는 chunk 이름이 전부 'View'가 된다.
         * 번들 크기를 도구별로 추적할 수 있도록 폴더명을 chunk 이름으로 쓴다.
         */
        chunkFileNames(chunk) {
          const id = chunk.facadeModuleId ?? ''
          const match = /\/src\/tools\/([^/]+)\/View\.vue$/.exec(id)
          return match ? `assets/tool-${match[1]}-[hash].js` : 'assets/[name]-[hash].js'
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
})
