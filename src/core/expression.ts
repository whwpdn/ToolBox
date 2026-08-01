/**
 * 수식 평가기 (계산기 · 공학용 계산기 공용).
 *
 * eval()이나 new Function()을 쓰지 않는다. 입력이 사용자 자신의 것이라 해도
 * 임의 코드 실행 경로를 남기지 않는 편이 낫고, 연산자 우선순위·괄호·각도 단위 같은
 * 계산기 고유 동작을 직접 다뤄야 하기 때문이다.
 *
 * 문법 (우선순위 낮은 것부터):
 *   expr    → term (('+' | '-') term)*
 *   term    → unary (('*' | '/') unary)*
 *   unary   → ('+' | '-') unary | power
 *   power   → postfix ('^' unary)?        // 우결합, 지수에 부호 허용 (2^-1)
 *   postfix → primary ('%' | '!')*
 *   primary → number | constant | func '(' expr ')' | '(' expr ')'
 */

export type AngleMode = 'deg' | 'rad'

export interface EvalOptions {
  /** 삼각함수의 인자·반환 단위. 기본 rad */
  angle?: AngleMode
}

export interface EvalResult {
  value: number | null
  /** 계산 불가 사유 (사용자에게 보여줄 짧은 메시지) */
  error: string | null
}

const INVALID_CHAR = '사용할 수 없는 문자가 있습니다'
const TOO_LARGE = '계산 결과가 너무 큽니다'
const DIV_ZERO = '0으로 나눌 수 없습니다'

type Token =
  | { type: 'number'; value: number }
  | { type: 'op'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'ident'; value: string }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'percent' }
  | { type: 'bang' }

const OPERATORS: Record<string, '+' | '-' | '*' | '/' | '^'> = {
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '^': '^',
  '×': '*',
  '÷': '/',
  '−': '-',
}

/** 인자 1개를 받는 함수. 각도 모드가 필요한 함수는 별도로 분기한다 */
const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  log2: Math.log2,
  exp: Math.exp,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sign: Math.sign,
}

/** 인자를 각도로 받는 삼각함수 */
const TRIG: Record<string, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
}

/** 결과가 각도인 역삼각함수 */
const INVERSE_TRIG: Record<string, (x: number) => number> = {
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
}

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  π: Math.PI,
  e: Math.E,
}

export const FUNCTION_NAMES = [
  ...Object.keys(TRIG),
  ...Object.keys(INVERSE_TRIG),
  ...Object.keys(FUNCTIONS),
]

type TokenizeResult = { tokens: Token[]; error: null } | { tokens: null; error: string }

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

    // 함수·상수 이름
    if (/[a-zA-Zπ]/.test(ch)) {
      let name = ''
      while (i < input.length && /[a-zA-Z0-9π]/.test(input[i]!)) {
        name += input[i]
        i += 1
      }
      tokens.push({ type: 'ident', value: name.toLowerCase() })
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
    if (ch === '!') {
      tokens.push({ type: 'bang' })
      i += 1
      continue
    }

    return { tokens: null, error: INVALID_CHAR }
  }

  return { tokens, error: null }
}

const DEG_TO_RAD = Math.PI / 180

/** 팩토리얼. 170! 을 넘으면 Infinity가 되므로 미리 막는다 */
function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new Error('팩토리얼은 0 이상 정수만 가능합니다')
  if (n > 170) throw new Error(TOO_LARGE)
  let acc = 1
  for (let k = 2; k <= n; k += 1) acc *= k
  return acc
}

class Parser {
  private pos = 0

  constructor(
    private readonly tokens: Token[],
    private readonly angle: AngleMode,
  ) {}

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
        if (right === 0) throw new Error(DIV_ZERO)
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
    return this.power()
  }

  private power(): number {
    const base = this.postfix()
    const token = this.peek()
    if (token?.type === 'op' && token.value === '^') {
      this.pos += 1
      // 우결합: 2^3^2 = 2^(3^2). 지수에 부호를 허용하기 위해 unary로 내려간다
      return base ** this.unary()
    }
    return base
  }

  private postfix(): number {
    let value = this.primary()
    for (;;) {
      const token = this.peek()
      if (token?.type === 'percent') {
        this.pos += 1
        value /= 100
      } else if (token?.type === 'bang') {
        this.pos += 1
        value = factorial(value)
      } else {
        break
      }
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

    if (token.type === 'ident') {
      this.pos += 1
      return this.identifier(token.value)
    }

    throw new Error('수식을 해석할 수 없습니다')
  }

  private identifier(name: string): number {
    // 상수는 인자를 받지 않는다
    const constant = CONSTANTS[name]
    if (constant !== undefined) return constant

    const isFunction = name in TRIG || name in INVERSE_TRIG || name in FUNCTIONS
    if (!isFunction) throw new Error(`알 수 없는 함수입니다: ${name}`)

    if (this.peek()?.type !== 'lparen') throw new Error(`${name} 뒤에 괄호가 필요합니다`)
    this.pos += 1
    const arg = this.expr()
    if (this.peek()?.type !== 'rparen') throw new Error('괄호가 닫히지 않았습니다')
    this.pos += 1

    return this.applyFunction(name, arg)
  }

  private applyFunction(name: string, arg: number): number {
    const trig = TRIG[name]
    if (trig) {
      const radians = this.angle === 'deg' ? arg * DEG_TO_RAD : arg
      const result = trig(radians)
      // tan(90°)는 수학적으로 정의되지 않지만 부동소수로는 거대한 수가 나온다.
      // 사용자에게 1.633e16 을 보여주는 것보다 정의되지 않음을 알리는 편이 정확하다.
      if (name === 'tan' && Math.abs(result) > 1e15) {
        throw new Error('정의되지 않는 값입니다')
      }
      return result
    }

    const inverse = INVERSE_TRIG[name]
    if (inverse) {
      if ((name === 'asin' || name === 'acos') && (arg < -1 || arg > 1)) {
        throw new Error(`${name}의 입력은 -1 ~ 1 이어야 합니다`)
      }
      const result = inverse(arg)
      return this.angle === 'deg' ? result / DEG_TO_RAD : result
    }

    const fn = FUNCTIONS[name]!
    if (name === 'sqrt' && arg < 0) throw new Error('음수의 제곱근은 계산할 수 없습니다')
    if ((name === 'ln' || name === 'log' || name === 'log2') && arg <= 0) {
      throw new Error('로그의 입력은 0보다 커야 합니다')
    }
    return fn(arg)
  }
}

/** 수식 문자열을 계산한다. 실패해도 예외를 던지지 않고 error 를 채워 돌려준다. */
export function evaluate(expression: string, options: EvalOptions = {}): EvalResult {
  const trimmed = expression.trim()
  if (!trimmed) return { value: null, error: null }

  const { tokens, error } = tokenize(trimmed)
  if (!tokens) return { value: null, error }
  if (tokens.length === 0) return { value: null, error: null }

  try {
    const value = new Parser(tokens, options.angle ?? 'rad').parse()
    if (!Number.isFinite(value)) return { value: null, error: TOO_LARGE }
    return { value, error: null }
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : '계산할 수 없습니다' }
  }
}

/** 입력 중인 수식이 계산 가능한 상태인지 (실시간 미리보기 표시 여부 판단용) */
export function isComplete(expression: string, options: EvalOptions = {}): boolean {
  return evaluate(expression, options).value !== null
}
