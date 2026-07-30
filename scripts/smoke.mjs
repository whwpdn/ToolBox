#!/usr/bin/env node
/**
 * 브라우저 스모크 테스트.
 *
 * 단위 테스트는 계산 로직만 검증한다. 이 스크립트는 그 위의 배선
 * (레지스트리 → 라우트 → 렌더, URL 동기화, 검색, localStorage)이 실제 브라우저에서
 * 동작하는지 확인한다. 빌드·타입검사가 통과해도 이 층은 깨질 수 있다.
 *
 *   npm run build && npm run preview &
 *   node scripts/smoke.mjs
 *
 * playwright-core 와 Chromium이 필요하다. 없으면 안내만 하고 종료한다(0).
 * CI에 편입할 때는 Playwright 설치 스텝을 추가하고 SMOKE_REQUIRED=1 로 실행한다.
 */
const BASE = process.env.SMOKE_BASE ?? 'http://localhost:4173'
const REQUIRED = process.env.SMOKE_REQUIRED === '1'

let chromium
try {
  ;({ chromium } = await import('playwright-core'))
} catch {
  const msg = 'playwright-core 가 없어 스모크 테스트를 건너뜁니다 (npm i -D playwright-core)'
  console.log(REQUIRED ? `✖ ${msg}` : `- ${msg}`)
  process.exit(REQUIRED ? 1 : 0)
}

/** Playwright가 관리하는 Chromium 경로. PLAYWRIGHT_BROWSERS_PATH 환경에 맞춰 찾는다 */
const executablePath = process.env.CHROMIUM_PATH

let browser
try {
  browser = await chromium.launch(executablePath ? { executablePath } : {})
} catch (e) {
  const msg = `Chromium 실행 실패: ${e.message.split('\n')[0]}`
  console.log(REQUIRED ? `✖ ${msg}` : `- ${msg} (건너뜀)`)
  process.exit(REQUIRED ? 1 : 0)
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

const results = []

async function check(label, path, assertion) {
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    const ok = await assertion()
    console.log(`${ok ? '✔' : '✖'} ${label}`)
    results.push(ok)
  } catch (e) {
    console.log(`✖ ${label} — ${e.message.split('\n')[0]}`)
    results.push(false)
  }
}

// 레지스트리가 라우트·카드를 실제로 만들어내는지
await check('홈에 모든 도구 카드가 렌더된다', '/', async () => {
  const cards = await page.locator('a[href^="/tools/"]').count()
  return cards >= 14
})

// 계산 결과가 화면까지 도달하는지 (스케줄 행 수까지 확인)
await check('대출 상환 스케줄이 기간만큼 렌더된다', '/tools/loan-repayment', async () => {
  const rows = await page.locator('tbody tr').count()
  return rows === 360
})

// 대출 한도 세 기준이 모두 표시되는지
await check('대출 한도가 DSR·DTI·LTV를 모두 표시한다', '/tools/loan-limit', async () => {
  const text = await page.locator('body').innerText()
  return ['DSR 기준 한도', 'DTI 기준 한도', 'LTV 기준 한도'].every((l) => text.includes(l))
})

// useQuerySync 양방향
await check('입력이 URL 쿼리에 반영된다', '/tools/bmi', async () => {
  await page.locator('input[type="text"]').first().fill('180')
  await page.waitForTimeout(600)
  return page.url().includes('heightCm=180')
})

await check('URL 쿼리가 입력으로 복원된다', '/tools/bmi?heightCm=160&weightKg=50', async () => {
  const text = await page.locator('body').innerText()
  return text.includes('19.53') // 50 / 1.6²
})

// 한글 초성 검색
await check('초성 검색이 동작한다 (ㄷㅊ → 대출)', '/', async () => {
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(300)
  await page.keyboard.type('ㄷㅊ')
  await page.waitForTimeout(400)
  const items = await page.locator('[role="dialog"] ul li').allInnerTexts()
  return items.some((t) => t.includes('대출'))
})

await check('영문 검색이 동작한다 (bmi)', '/', async () => {
  await page.keyboard.press('Control+k')
  await page.waitForTimeout(300)
  await page.keyboard.type('bmi')
  await page.waitForTimeout(400)
  const items = await page.locator('[role="dialog"] ul li').allInnerTexts()
  return items.some((t) => t.includes('BMI'))
})

// 계산기 파서
await check('계산기가 수식을 평가한다', '/tools/calculator', async () => {
  await page.locator('input[type="text"]').first().fill('(1200+800)*15%')
  await page.waitForTimeout(300)
  return /= 300/.test(await page.locator('body').innerText())
})

// localStorage 저장
await check('즐겨찾기가 localStorage에 저장된다', '/tools/bmi', async () => {
  await page.locator('button[aria-label="즐겨찾기 추가"]').first().click()
  await page.waitForTimeout(300)
  const stored = await page.evaluate(() => localStorage.getItem('toolbox.usage'))
  return stored?.includes('bmi') ?? false
})

await check('다크 모드가 전환된다', '/', async () => {
  await page.locator('button[aria-label="밝은/어두운 테마 전환"]').click()
  await page.waitForTimeout(300)
  return page.evaluate(() => document.documentElement.classList.contains('dark'))
})

await check('없는 도구 경로는 404를 보여준다', '/tools/nope-not-real', async () => {
  return (await page.locator('body').innerText()).includes('404')
})

// 모바일 레이아웃
await page.setViewportSize({ width: 360, height: 740 })
await check('모바일 360px에서 가로 스크롤이 없다', '/tools/loan-repayment', async () => {
  return !(await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  ))
})

await browser.close()

const passed = results.filter(Boolean).length
console.log(`\n${passed}/${results.length} 통과`)
if (errors.length) {
  console.log('\n콘솔 오류:')
  for (const e of errors) console.log(`  ${e}`)
}

process.exit(passed === results.length && errors.length === 0 ? 0 : 1)
