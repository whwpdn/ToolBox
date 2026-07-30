import type { ToolMeta } from '@/core/types'

const meta: ToolMeta = {
  id: 'loan-limit',
  title: '대출 한도 계산기',
  description: '연소득·기존 부채·주택가격으로 DSR·DTI·LTV 기준 최대 대출 한도를 역산',
  category: 'finance',
  keywords: [
    '대출한도',
    '한도',
    '대출',
    'DSR',
    'DTI',
    'LTV',
    '총부채원리금상환비율',
    '담보인정비율',
    '주택담보대출',
    '주담대',
    '영끌',
    '얼마까지',
    '소득기준',
    'loan',
    'limit',
    'affordability',
  ],
  icon: 'landmark',
  order: 20,
}

export default meta
