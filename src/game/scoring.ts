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

export function scoreHand(cards: readonly Card[], jokers: readonly JokerDef[], levels?: HandLevels): ScoreResult {
  const hand = evaluateHand(cards);
  const level = levels?.[hand.type] ?? 1;
  const base = handBase(hand.type, level);
  const steps: ScoreStep[] = [{ source: handName(hand), chips: base.chips, mult: base.mult, note: `레벨 ${level}` }];

  for (const card of hand.scoringCards) {
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
