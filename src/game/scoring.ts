// 점수 계산. 순서는 design.md 4.1을 따른다. 조커 순서가 결과를 바꾸므로 순서를 바꾸지 않는다.
// 곱하는 효과(유리, 강철)가 있어 단계마다 순서대로 누적한다 (design.md D-016).
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

/** 점수 계산에 거는 조건 */
export interface ScoreRules {
  /** 보스가 무효로 만든 카드 */
  isDebuffed?: (card: Card) => boolean;
  /** 부싯돌 보스: 족보 기본값 절반 */
  halveBase?: boolean;
  /** 내지 않고 손에 들고 있는 카드 (강철) */
  held?: readonly Card[];
  /** 0 이상 1 미만의 난수 (행운, 유리). 주지 않으면 확률 효과는 일어나지 않는다 */
  random?: () => number;
}

const LUCKY_MULT_CHANCE = 1 / 5;
const LUCKY_MONEY_CHANCE = 1 / 15;
const GLASS_BREAK_CHANCE = 1 / 4;

/** 원작처럼 절반을 반올림하고 최소 1 */
function halve(value: number): number {
  return Math.max(1, Math.round(value / 2));
}

/** 점수 카드 하나의 강화 효과. 행운 카드의 돈은 money로 따로 돌려준다 */
function enhancementSteps(card: Card, label: string, random?: () => number): { steps: ScoreStep[]; money: number } {
  switch (card.enhancement) {
    case "bonus":
      return { steps: [{ source: label, chips: 30, mult: 0, note: "보너스" }], money: 0 };
    case "mult":
      return { steps: [{ source: label, chips: 0, mult: 4, note: "배수 카드" }], money: 0 };
    case "glass":
      return { steps: [{ source: label, chips: 0, mult: 0, xMult: 2, note: "유리" }], money: 0 };
    case "lucky": {
      const steps: ScoreStep[] = [];
      let money = 0;
      if (random && random() < LUCKY_MULT_CHANCE) steps.push({ source: label, chips: 0, mult: 20, note: "행운" });
      if (random && random() < LUCKY_MONEY_CHANCE) {
        money = 20;
        steps.push({ source: label, chips: 0, mult: 0, note: "행운 $20" });
      }
      return { steps, money };
    }
    case "wild":
    case "steel":
    case "stone":
    case "gold":
    case undefined:
      return { steps: [], money: 0 };
  }
}

export function scoreHand(cards: readonly Card[], jokers: readonly JokerDef[], levels?: HandLevels, rules: ScoreRules = {}): ScoreResult {
  const hand = evaluateHand(cards);
  const level = levels?.[hand.type] ?? 1;
  const leveled = handBase(hand.type, level);
  const base = rules.halveBase ? { chips: halve(leveled.chips), mult: halve(leveled.mult) } : leveled;
  const note = rules.halveBase ? `레벨 ${level}, 절반` : `레벨 ${level}`;
  const steps: ScoreStep[] = [{ source: handName(hand), chips: base.chips, mult: base.mult, note }];
  const shattered: string[] = [];
  let money = 0;

  for (const card of hand.scoringCards) {
    const label = cardLabel(card);
    if (rules.isDebuffed?.(card)) {
      steps.push({ source: label, chips: 0, mult: 0, note: "무효" });
      continue;
    }
    steps.push({ source: label, chips: card.enhancement === "stone" ? 50 : cardChips(card), mult: 0, note: "" });
    const enhanced = enhancementSteps(card, label, rules.random);
    steps.push(...enhanced.steps);
    money += enhanced.money;
    for (const joker of jokers) {
      const gain = onCardScored(joker.effect, card);
      if (gain) steps.push({ source: joker.name, ...gain });
    }
    if (card.enhancement === "glass" && rules.random && rules.random() < GLASS_BREAK_CHANCE) shattered.push(card.id);
  }

  for (const card of rules.held ?? []) {
    if (card.enhancement === "steel" && !rules.isDebuffed?.(card)) {
      steps.push({ source: cardLabel(card), chips: 0, mult: 0, xMult: 1.5, note: "강철, 손에 있음" });
    }
  }

  const ctx = { hand, playedCount: cards.length, jokerCount: jokers.length };
  for (const joker of jokers) {
    const gain = onIndependent(joker.effect, ctx);
    if (gain) steps.push({ source: joker.name, ...gain });
  }

  let chips = 0;
  let mult = 0;
  for (const step of steps) {
    chips += step.chips;
    mult += step.mult;
    if (step.xMult !== undefined) mult *= step.xMult;
  }
  return { hand, chips, mult, total: Math.floor(chips * mult), steps, money, shattered };
}
