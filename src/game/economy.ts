import { blindName, blindReward } from "./blinds";
import { RULES } from "./rules";
import type { BlindIndex, CashOut } from "./types";

/** 가진 돈 $5마다 $1, 최대 $5 */
export function interest(money: number, cap: number = RULES.interestCap): number {
  return Math.min(Math.floor(money / RULES.interestStep), cap);
}

export interface CashOutInput {
  ante: number;
  blindIndex: BlindIndex;
  handsLeft: number;
  /** 보상을 받기 전 가진 돈. 이자는 이 금액으로 계산한다 */
  money: number;
  /** 이자 상한 (바우처 종잣돈이면 $10) */
  interestCap?: number;
}

/** 라운드 정산. 블라인드 보상은 항상 보여 주고, 나머지는 0원이면 줄을 넣지 않는다 */
export function cashOutLines({ ante, blindIndex, handsLeft, money, interestCap = RULES.interestCap }: CashOutInput): CashOut {
  const lines = [
    { label: blindName(blindIndex), amount: blindReward(ante, blindIndex) },
    { label: `남은 핸드 ${handsLeft}`, amount: handsLeft * RULES.moneyPerHandLeft },
    { label: `이자 ($${RULES.interestStep}마다 $1, 최대 $${interestCap})`, amount: interest(money, interestCap) },
  ].filter((line, i) => i === 0 || line.amount > 0);
  return { lines, total: lines.reduce((sum, line) => sum + line.amount, 0) };
}
