/**
 * 계산기 수식 평가기.
 *
 * eval()이나 new Function()을 쓰지 않는다. 입력이 사용자 자신의 것이라 해도
 * 임의 코드 실행 경로를 남기지 않는 편이 낫고, 연산자 우선순위·괄호 처리를
 * 직접 다뤄야 백분율(%)이나 부호 처리 같은 계산기 고유 동작을 넣을 수 있다.
 *
 * 문법: 숫자, + - × ÷, 괄호, 단항 부호, 접미 %
 */

export interface EvalResult {
  value: number | null
  /** 계산 불가 사유 (사용자에게 보여줄 짧은 메시지) */
  error: string | null
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'percent' }

const OPERATORS: Record<string, '+' | '-' | '*' | '/'> = {
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '×': '*',
  '÷': '/',
  '−': '-',
}

type TokenizeResult = { tokens: Token[]; error: null } | { tokens: null; error: string }

const INVALID_CHAR = '사용할 수 없는 문자가 있습니다'
const TOO_LARGE = '계산 결과가 너무 큽니다'

function tokenize(input: string): TokenizeResult {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]!

    if (ch === ' ') {
      i += 1
      continue
    }

    if (/[0-9.]/.test(ch)) {
      // 천단위 구분자(1,000)와 가독성용 밑줄(1_000)은 숫자 내부에서 허용하고 걷어낸다
      let numText = ''
      while (i < input.length && /[0-9._,]/.test(input[i]!)) {
        numText += input[i]
        i += 1
      }
      const cleaned = numText.replace(/[,_]/g, '')
      // '1.2.3', '.' 같은 입력 차단
      if (!/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return { tokens: null, error: INVALID_CHAR }
      const value = Number(cleaned)
      if (!Number.isFinite(value)) return { tokens: null, error: TOO_LARGE }
      tokens.push({ type: 'number', value })
      continue
    }

    if (ch in OPERATORS) {
      tokens.push({ type: 'op', value: OPERATORS[ch]! })
      i += 1
      continue
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen' })
      i += 1
      continue
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen' })
      i += 1
      continue
    }

    if (ch === '%') {
      tokens.push({ type: 'percent' })
      i += 1
      continue
    }

    return { tokens: null, error: INVALID_CHAR }
  }

  return { tokens, error: null }
}

/**
 * 재귀 하강 파서.
 *   expr   → term (('+' | '-') term)*
 *   term   → unary (('*' | '/') unary)*
 *   unary  → ('+' | '-') unary | postfix
 *   postfix→ primary '%'*
 *   primary→ number | '(' expr ')'
 */
class Parser {
  private pos = 0

  constructor(private readonly tokens: Token[]) {}

  parse(): number {
    const value = this.expr()
    if (this.pos < this.tokens.length) throw new Error('수식을 해석할 수 없습니다')
    return value
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private expr(): number {
    let left = this.term()
    for (;;) {
      const token = this.peek()
      if (token?.type !== 'op' || (token.value !== '+' && token.value !== '-')) break
      this.pos += 1
      const right = this.term()
      left = token.value === '+' ? left + right : left - right
    }
    return left
  }

  private term(): number {
    let left = this.unary()
    for (;;) {
      const token = this.peek()
      if (token?.type !== 'op' || (token.value !== '*' && token.value !== '/')) break
      this.pos += 1
      const right = this.unary()
      if (token.value === '/') {
        if (right === 0) throw new Error('0으로 나눌 수 없습니다')
        left /= right
      } else {
        left *= right
      }
    }
    return left
  }

  private unary(): number {
    const token = this.peek()
    if (token?.type === 'op' && (token.value === '+' || token.value === '-')) {
      this.pos += 1
      const value = this.unary()
      return token.value === '-' ? -value : value
    }
    return this.postfix()
  }

  private postfix(): number {
    let value = this.primary()
    while (this.peek()?.type === 'percent') {
      this.pos += 1
      value /= 100
    }
    return value
  }

  private primary(): number {
    const token = this.peek()
    if (!token) throw new Error('수식이 완성되지 않았습니다')

    if (token.type === 'number') {
      this.pos += 1
      return token.value
    }

    if (token.type === 'lparen') {
      this.pos += 1
      const value = this.expr()
      if (this.peek()?.type !== 'rparen') throw new Error('괄호가 닫히지 않았습니다')
      this.pos += 1
      return value
    }

    throw new Error('수식을 해석할 수 없습니다')
  }
}

/** 수식 문자열을 계산한다. 실패해도 예외를 던지지 않고 error 를 채워 돌려준다. */
export function evaluate(expression: string): EvalResult {
  const trimmed = expression.trim()
  if (!trimmed) return { value: null, error: null }

  const { tokens, error } = tokenize(trimmed)
  if (!tokens) return { value: null, error }
  if (tokens.length === 0) return { value: null, error: null }

  try {
    const value = new Parser(tokens).parse()
    if (!Number.isFinite(value)) return { value: null, error: TOO_LARGE }
    return { value, error: null }
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : '계산할 수 없습니다' }
  }
}

/** 입력 중인 수식이 계산 가능한 상태인지 (실시간 미리보기 표시 여부 판단용) */
export function isComplete(expression: string): boolean {
  return evaluate(expression).value !== null
}
