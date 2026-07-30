import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { tools } from './registry'
import { categories } from './categories'

/**
 * 라우트는 레지스트리에서 생성된다.
 * 도구를 추가할 때 이 파일을 수정할 일은 없다.
 */
const toolRoutes: RouteRecordRaw[] = tools.map((tool) => ({
  path: `/tools/${tool.id}`,
  name: `tool:${tool.id}`,
  component: tool.component,
  meta: { toolId: tool.id, title: tool.title },
}))

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { title: '홈' },
  },
  {
    path: '/c/:categoryId',
    name: 'category',
    component: () => import('@/pages/CategoryPage.vue'),
    beforeEnter: (to) => {
      const id = String(to.params.categoryId)
      return categories.some((c) => c.id === id) ? true : { name: 'not-found' }
    },
  },
  ...toolRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: '페이지를 찾을 수 없습니다' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, savedPosition) => savedPosition ?? { top: 0 },
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title && to.name !== 'home' ? `${title} · ToolBox` : 'ToolBox'
})
