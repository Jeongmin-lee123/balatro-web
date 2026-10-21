// 점수 계산. 순서는 design.md 4.1을 따른다. 조커 순서가 결과를 바꾸므로 순서를 바꾸지 않는다.
import { cardLabel } from "./deck";
import { evaluateHand } from "./handEval";
import { onCardScored, onIndependent } from "./jokers";
import { HANDS } from "./rules";
import type { Card, HandLevels, HandResult, HandType, JokerDef, ScoreResult, ScoreStep } from "./types";

/** 2~10은 숫자 그대로, J/Q/K는 10, A는 11 */
export function cardChips(card: Card): number {
  if (card.rank === 14) return 11;
  return Math.min(card.rank, 10);
}

export function handName(hand: HandResult): string {
  return hand.isRoyal ? "로열 플러시" : HANDS[hand.type].name;
}

/** 레벨 1은 기본값, 레벨이 하나 오를 때마다 레벨업 값을 더한다 */
export function handBase(type: HandType, level: number): { chips: number; mult: number } {
  const info = HANDS[type];
  return { chips: info.chips + info.levelChips * (level - 1), mult: info.mult + info.levelMult * (level - 1) };
}

/** 보스 블라인드가 점수 계산에 거는 제약 */
export interface ScoreRules {
  isDebuffed?: (card: Card) => boolean;
  halveBase?: boolean;
}

/** 원작처럼 절반을 반올림하고 최소 1 */
function halve(value: number): number {
  return Math.max(1, Math.round(value / 2));
}

export function scoreHand(cards: readonly Card[], jokers: readonly JokerDef[], levels?: HandLevels, rules: ScoreRules = {}): ScoreResult {
  const hand = evaluateHand(cards);
  const level = levels?.[hand.type] ?? 1;
  const leveled = handBase(hand.type, level);
  const base = rules.halveBase ? { chips: halve(leveled.chips), mult: halve(leveled.mult) } : leveled;
  const note = rules.halveBase ? `레벨 ${level}, 절반` : `레벨 ${level}`;
  const steps: ScoreStep[] = [{ source: handName(hand), chips: base.chips, mult: base.mult, note }];

  for (const card of hand.scoringCards) {
    if (rules.isDebuffed?.(card)) {
      steps.push({ source: cardLabel(card), chips: 0, mult: 0, note: "무효" });
      continue;
    }
    steps.push({ source: cardLabel(card), chips: cardChips(card), mult: 0, note: "" });
    for (const joker of jokers) {
      const gain = onCardScored(joker.effect, card);
      if (gain) steps.push({ source: joker.name, ...gain });
    }
  }

  const ctx = { hand, playedCount: cards.length, jokerCount: jokers.length };
  for (const joker of jokers) {
    const gain = onIndependent(joker.effect, ctx);
    if (gain) steps.push({ source: joker.name, ...gain });
  }

  const chips = steps.reduce((sum, step) => sum + step.chips, 0);
  const mult = steps.reduce((sum, step) => sum + step.mult, 0);
  return { hand, chips, mult, total: Math.floor(chips * mult), steps };
}
