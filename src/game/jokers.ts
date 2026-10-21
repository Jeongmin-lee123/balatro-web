// 조커 효과 종류별 함수. 새 종류를 추가하면 types.ts의 JokerEffect와 테스트도 함께 추가한다. (design.md 4.2)
import { SUIT_NAMES } from "./deck";
import { HANDS } from "./rules";
import type { Card, HandResult, JokerEffect, ScoreStep } from "./types";

export interface JokerContext {
  hand: HandResult;
  playedCount: number;
  jokerCount: number;
}

export type JokerGain = Omit<ScoreStep, "source">;

/** 점수 카드 하나가 계산될 때마다 반응하는 효과 */
export function onCardScored(effect: JokerEffect, card: Card): JokerGain | null {
  switch (effect.kind) {
    case "suit_mult":
      // 와일드는 어느 무늬로도 치고, 돌 카드는 무늬가 없다
      return card.enhancement !== "stone" && (card.suit === effect.suit || card.enhancement === "wild")
        ? { chips: 0, mult: effect.mult, note: `${SUIT_NAMES[effect.suit]} 카드` }
        : null;
    case "flat_mult":
    case "contains_mult":
    case "contains_chips":
    case "small_hand_mult":
    case "per_joker_mult":
      return null;
  }
}

/** 카드 계산이 모두 끝난 뒤 조커 줄을 왼쪽부터 한 번씩 도는 효과 */
export function onIndependent(effect: JokerEffect, ctx: JokerContext): JokerGain | null {
  switch (effect.kind) {
    case "flat_mult":
      return { chips: 0, mult: effect.mult, note: "" };
    case "contains_mult":
      return ctx.hand.contains.includes(effect.hand)
        ? { chips: 0, mult: effect.mult, note: `${HANDS[effect.hand].name} 포함` }
        : null;
    case "contains_chips":
      return ctx.hand.contains.includes(effect.hand)
        ? { chips: effect.chips, mult: 0, note: `${HANDS[effect.hand].name} 포함` }
        : null;
    case "small_hand_mult":
      return ctx.playedCount <= effect.maxCards
        ? { chips: 0, mult: effect.mult, note: `${ctx.playedCount}장 플레이` }
        : null;
    case "per_joker_mult":
      return { chips: 0, mult: effect.mult * ctx.jokerCount, note: `조커 ${ctx.jokerCount}장` };
    case "suit_mult":
      return null;
  }
}
