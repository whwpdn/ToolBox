/**
 * 기본 계산기는 공용 수식 평가기를 그대로 쓴다.
 * 공학용 계산기(calculator-sci)와 같은 파서를 공유하므로,
 * 여기서 sin(30) 같은 식을 입력해도 동작한다. 버튼만 사칙연산으로 제한한 것이다.
 */
export { evaluate, isComplete, type EvalResult } from '@/core/expression'
