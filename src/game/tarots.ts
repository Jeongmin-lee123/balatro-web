// 타로 카드. 고른 카드를 바꾸는 타로는 라운드 중에만, 나머지는 블라인드 선택, 라운드, 상점에서 쓴다.
// 카드를 바꾸면 손패와 판 전체 덱(state.deck)을 함께 바꿔 다음 라운드에도 남게 한다.
import { sortHand } from "./deck";
import { jokerSlots } from "./editions";
import { nextRandom } from "./rng";
import { JOKER_IDS, JOKERS, RULES, TAROT_IDS, TAROTS } from "./rules";
import { sellValue } from "./shop";
import type { Card, EditionId, Rank, RunState, TarotDef, TarotEffect } from "./types";

/** 운명의 수레바퀴가 붙이는 에디션 (네거티브 제외) */
const WHEEL_EDITIONS: readonly EditionId[] = ["foil", "holographic", "polychrome"];

export function tarotDef(id: string): TarotDef {
  const tarot = TAROTS[id];
  if (!tarot) throw new Error(`없는 타로: ${id}`);
  return tarot;
}

/** 고른 카드가 필요한 타로면 고를 수 있는 장수 범위, 아니면 null */
export function targetRange(effect: TarotEffect): { min: number; max: number } | null {
  switch (effect.kind) {
    case "enhance":
    case "convert_suit":
    case "raise_rank":
    case "destroy":
      return { min: 1, max: effect.max };
    case "copy_left":
      return { min: 2, max: 2 };
    case "double_money":
    case "joker_sell_value":
    case "create_tarots":
    case "create_joker":
    case "repeat_last":
    case "add_edition":
      return null;
  }
}

/** 이 타로를 쓰고 나면 비는 칸까지 포함한 소모품 빈 칸 수 */
function roomAfterUse(state: RunState): number {
  return RULES.consumableSlots - (state.consumables.length - 1);
}

export function canUseTarot(state: RunState, index: number): boolean {
  const id = state.consumables[index];
  if (!id) return false;
  const { effect } = tarotDef(id);
  const range = targetRange(effect);
  if (range) {
    const count = state.round.selected.length;
    return state.phase === "round" && count >= range.min && count <= range.max;
  }
  if (effect.kind === "create_joker") return state.jokers.length < jokerSlots(state.jokers);
  if (effect.kind === "add_edition") return state.jokers.some((joker) => !joker.edition);
  if (effect.kind === "repeat_last") return state.lastTarot !== null && roomAfterUse(state) > 0;
  return true;
}

/** 손패와 덱에서 같은 id의 카드를 함께 바꾼다 */
function updateCards(state: RunState, change: (card: Card) => Card | null): RunState {
  const apply = (cards: readonly Card[]) => cards.map(change).filter((card): card is Card => card !== null);
  return {
    ...state,
    deck: apply(state.deck),
    round: { ...state.round, hand: sortHand(apply(state.round.hand), state.round.sortBy), selected: [] },
  };
}

/** K 다음은 A, A 다음은 2 */
function raised(rank: Rank): Rank {
  return (rank === 14 ? 2 : rank + 1) as Rank;
}

function randomValues(count: number, rngState: number): [number[], number] {
  const values: number[] = [];
  let state = rngState;
  for (let i = 0; i < count; i++) {
    const [value, next] = nextRandom(state);
    values.push(value);
    state = next;
  }
  return [values, state];
}

function randomIds(pool: readonly string[], count: number, rngState: number): [string[], number] {
  const [values, next] = randomValues(count, rngState);
  return [values.map((value) => pool[Math.floor(value * pool.length)] as string), next];
}

function applyEffect(state: RunState, effect: TarotEffect): RunState {
  const selected = new Set(state.round.selected);
  switch (effect.kind) {
    case "enhance":
      return updateCards(state, (card) => (selected.has(card.id) ? { ...card, enhancement: effect.enhancement } : card));
    case "convert_suit":
      return updateCards(state, (card) => (selected.has(card.id) ? { ...card, suit: effect.suit } : card));
    case "raise_rank":
      return updateCards(state, (card) => (selected.has(card.id) ? { ...card, rank: raised(card.rank) } : card));
    case "destroy":
      return updateCards(state, (card) => (selected.has(card.id) ? null : card));
    case "copy_left": {
      // 손패에서 왼쪽에 있는 카드가 오른쪽 카드의 숫자와 무늬를 받는다
      const [left, right] = state.round.hand.filter((card) => selected.has(card.id));
      if (!left || !right) return state;
      return updateCards(state, (card) => (card.id === left.id ? { ...card, rank: right.rank, suit: right.suit } : card));
    }
    case "double_money":
      return { ...state, money: state.money + Math.min(Math.max(state.money, 0), effect.max) };
    case "joker_sell_value": {
      const total = state.jokers.reduce((sum, joker) => sum + sellValue(joker.paid), 0);
      return { ...state, money: state.money + Math.min(total, effect.max) };
    }
    case "create_tarots": {
      const room = RULES.consumableSlots - state.consumables.length;
      const [ids, rngState] = randomIds(TAROT_IDS, Math.min(effect.count, room), state.rngState);
      return { ...state, rngState, consumables: [...state.consumables, ...ids] };
    }
    case "create_joker": {
      const [[id], rngState] = randomIds(JOKER_IDS, 1, state.rngState);
      const def = JOKERS[id as string];
      if (!def) return state;
      const joker = { uid: `j${state.nextUid}`, defId: def.id, paid: def.price };
      return { ...state, rngState, jokers: [...state.jokers, joker], nextUid: state.nextUid + 1 };
    }
    case "repeat_last":
      return state.lastTarot ? { ...state, consumables: [...state.consumables, state.lastTarot] } : state;
    case "add_edition": {
      const [[hit, pickJoker, pickEdition], rngState] = randomValues(3, state.rngState);
      if ((hit as number) >= effect.chance) return { ...state, rngState };
      const plain = state.jokers.filter((joker) => !joker.edition);
      const target = plain[Math.floor((pickJoker as number) * plain.length)];
      const edition = WHEEL_EDITIONS[Math.floor((pickEdition as number) * WHEEL_EDITIONS.length)];
      if (!target || !edition) return { ...state, rngState };
      return { ...state, rngState, jokers: state.jokers.map((joker) => (joker.uid === target.uid ? { ...joker, edition } : joker)) };
    }
  }
}

/** 타로를 쓰고 소모품 칸에서 뺀다. 효과는 칸을 뺀 뒤에 적용해 빈 칸을 셀 수 있게 한다 */
export function useTarot(state: RunState, index: number): RunState {
  if (!canUseTarot(state, index)) return state;
  const id = state.consumables[index] as string;
  const { effect } = tarotDef(id);
  const removed: RunState = {
    ...state,
    consumables: state.consumables.filter((_, i) => i !== index),
    lastTarot: effect.kind === "repeat_last" ? state.lastTarot : id,
  };
  return applyEffect(removed, effect);
}
