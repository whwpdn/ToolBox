/**
 * 세율·대출 규제 비율 등 '정책 상수' 단일 소스.
 *
 * 이 값들은 법·규정 변경으로 바뀐다. 도구 코드에 숫자를 박아두면 나중에 어디를
 * 고쳐야 하는지 알 수 없어지므로, 반드시 여기서 import 해서 쓴다.
 * 값을 수정할 때는 POLICY_AS_OF 도 함께 갱신한다.
 */
export const POLICY_AS_OF = '2026-07'

/** 이자소득세 15.4% (소득세 14% + 지방소득세 1.4%) */
export const INTEREST_TAX_RATE = 0.154

/** 세금우대·비과세를 선택했을 때의 세율 */
export const INTEREST_TAX_FREE_RATE = 0

/** 부가가치세율 10% */
export const VAT_RATE = 0.1

/** 총부채원리금상환비율(DSR) 기본 한도 (%) */
export const DSR_LIMIT_PCT = 40

/** 총부채상환비율(DTI) 기본 한도 (%) */
export const DTI_LIMIT_PCT = 50

/**
 * 담보인정비율(LTV) 기본 한도 (%).
 * 규제지역·주택수·생애최초 여부에 따라 실제 값이 크게 달라지므로 도구에서 조정 가능하게 둔다.
 */
export const LTV_LIMIT_PCT = 70

/** 대출 한도 계산 시 쓰는 안내 문구 */
export const FINANCE_DISCLAIMER =
  `참고용 계산입니다. 실제 한도·금리·상환액은 금융기관의 심사 기준, 규제지역 여부, ` +
  `주택 수, 신용등급 등에 따라 달라집니다. (기준 ${POLICY_AS_OF})`
