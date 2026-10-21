// 한 판의 상태 전이. 판 상태는 apply(state, action)으로만 바꾼다. (design.md D-006)
// 허용되지 않는 행동은 받은 상태를 그대로 돌려준다.
import { nextBlind, targetScore } from "./blinds";
import { createDeck, drawCards, sortHand } from "./deck";
import { cashOutLines } from "./economy";
import { nextRandom, shuffle } from "./rng";
import { ANTE_COUNT, JOKERS, RULES } from "./rules";
import { scoreHand } from "./scoring";
import { rollOffers, sellValue } from "./shop";
import type { Action, JokerDef, OwnedJoker, RoundState, RunState, SortBy } from "./types";

function dealRound(rngState: number, sortBy: SortBy): { round: RoundState; rngState: number } {
  const [deck, next] = shuffle(createDeck(), rngState);
  const { drawn, rest } = drawCards(deck, RULES.handSize);
  return {
    rngState: next,
    round: {
      drawPile: rest,
      hand: sortHand(drawn, sortBy),
      selected: [],
      handsLeft: RULES.hands,
      discardsLeft: RULES.discards,
      score: 0,
      lastScore: null,
      sortBy,
    },
  };
}

export function newRun(seed: number): RunState {
  const { round, rngState } = dealRound(seed >>> 0, "rank");
  return {
    seed,
    rngState,
    phase: "round",
    ante: 1,
    blindIndex: 0,
    money: RULES.startingMoney,
    jokers: [],
    nextUid: 1,
    round,
    cashOut: null,
    shop: null,
    stats: { bestHand: 0, handsPlayed: 0 },
  };
}

export function currentTarget(state: RunState): number {
  return targetScore(state.ante, state.blindIndex);
}

export function jokerDefs(jokers: readonly OwnedJoker[]): JokerDef[] {
  return jokers.map((joker) => {
    const def = JOKERS[joker.defId];
    if (!def) throw new Error(`없는 조커: ${joker.defId}`);
    return def;
  });
}

/** 고른 카드를 손에서 빼고 덱에서 채운다. 빠진 카드는 손패 순서대로 돌려준다 */
function takeSelected(round: RoundState): { taken: RoundState["hand"]; round: RoundState } {
  const taken = round.hand.filter((card) => round.selected.includes(card.id));
  const kept = round.hand.filter((card) => !round.selected.includes(card.id));
  const { drawn, rest } = drawCards(round.drawPile, taken.length);
  return { taken, round: { ...round, hand: sortHand([...kept, ...drawn], round.sortBy), drawPile: rest, selected: [] } };
}

function toggleCard(state: RunState, cardId: string): RunState {
  const { round } = state;
  if (!round.hand.some((card) => card.id === cardId)) return state;
  if (round.selected.includes(cardId)) {
    return { ...state, round: { ...round, selected: round.selected.filter((id) => id !== cardId) } };
  }
  if (round.selected.length >= RULES.maxSelect) return state;
  return { ...state, round: { ...round, selected: [...round.selected, cardId] } };
}

function play(state: RunState): RunState {
  if (state.round.selected.length === 0 || state.round.handsLeft === 0) return state;

  const { taken, round } = takeSelected(state.round);
  const result = scoreHand(taken, jokerDefs(state.jokers));
  const score = state.round.score + result.total;
  const handsLeft = state.round.handsLeft - 1;
  const stats = { bestHand: Math.max(state.stats.bestHand, result.total), handsPlayed: state.stats.handsPlayed + 1 };
  const next: RunState = { ...state, stats, round: { ...round, score, handsLeft, lastScore: result } };

  if (score >= currentTarget(state)) {
    if (state.ante === ANTE_COUNT && state.blindIndex === 2) return { ...next, phase: "won" };
    const cashOut = cashOutLines({ ante: state.ante, blindIndex: state.blindIndex, handsLeft, money: state.money });
    return { ...next, phase: "cash_out", cashOut };
  }
  return handsLeft === 0 ? { ...next, phase: "lost" } : next;
}

function discard(state: RunState): RunState {
  if (state.round.selected.length === 0 || state.round.discardsLeft === 0) return state;
  const { round } = takeSelected(state.round);
  return { ...state, round: { ...round, discardsLeft: state.round.discardsLeft - 1 } };
}

function collect(state: RunState): RunState {
  if (!state.cashOut) return state;
  const [offers, rngState] = rollOffers(state.rngState, RULES.shopSlots);
  return {
    ...state,
    rngState,
    phase: "shop",
    money: state.money + state.cashOut.total,
    cashOut: null,
    shop: { offers, rerollCost: RULES.rerollBase },
  };
}

function buy(state: RunState, slot: number): RunState {
  const defId = state.shop?.offers[slot];
  const def = defId ? JOKERS[defId] : undefined;
  if (!state.shop || !def || state.money < def.price || state.jokers.length >= RULES.jokerSlots) return state;
  const offers = state.shop.offers.map((offer, i) => (i === slot ? null : offer));
  return {
    ...state,
    money: state.money - def.price,
    jokers: [...state.jokers, { uid: `j${state.nextUid}`, defId: def.id, paid: def.price }],
    nextUid: state.nextUid + 1,
    shop: { ...state.shop, offers },
  };
}

function sell(state: RunState, uid: string): RunState {
  const joker = state.jokers.find((owned) => owned.uid === uid);
  if (!joker) return state;
  return { ...state, money: state.money + sellValue(joker.paid), jokers: state.jokers.filter((owned) => owned.uid !== uid) };
}

function reroll(state: RunState): RunState {
  if (!state.shop || state.money < state.shop.rerollCost) return state;
  const [offers, rngState] = rollOffers(state.rngState, RULES.shopSlots);
  return {
    ...state,
    rngState,
    money: state.money - state.shop.rerollCost,
    shop: { offers, rerollCost: state.shop.rerollCost + RULES.rerollStep },
  };
}

function moveJoker(state: RunState, uid: string, to: number): RunState {
  const from = state.jokers.findIndex((owned) => owned.uid === uid);
  if (from < 0 || to < 0 || to >= state.jokers.length || from === to) return state;
  const jokers = [...state.jokers];
  const [moved] = jokers.splice(from, 1);
  jokers.splice(to, 0, moved as OwnedJoker);
  return { ...state, jokers };
}

function nextRound(state: RunState): RunState {
  const { ante, blindIndex } = nextBlind(state.ante, state.blindIndex);
  const { round, rngState } = dealRound(state.rngState, state.round.sortBy);
  return { ...state, phase: "round", ante, blindIndex, round, rngState, shop: null };
}

function newRunFrom(state: RunState, seed?: number): RunState {
  if (seed !== undefined) return newRun(seed);
  const [value] = nextRandom(state.rngState);
  return newRun(Math.floor(value * 4294967296));
}

/** 행동마다 허용되는 단계. 여기에 없는 단계에서 온 행동은 무시한다 */
const ALLOWED: Record<Action["type"], readonly RunState["phase"][]> = {
  toggle_card: ["round"],
  play: ["round"],
  discard: ["round"],
  sort: ["round"],
  collect: ["cash_out"],
  buy: ["shop"],
  sell: ["round", "shop"],
  reroll: ["shop"],
  move_joker: ["round", "shop"],
  next_round: ["shop"],
  new_run: ["round", "cash_out", "shop", "won", "lost"],
};

export function apply(state: RunState, action: Action): RunState {
  if (!ALLOWED[action.type].includes(state.phase)) return state;

  switch (action.type) {
    case "toggle_card":
      return toggleCard(state, action.cardId);
    case "play":
      return play(state);
    case "discard":
      return discard(state);
    case "sort":
      return { ...state, round: { ...state.round, sortBy: action.by, hand: sortHand(state.round.hand, action.by) } };
    case "collect":
      return collect(state);
    case "buy":
      return buy(state, action.slot);
    case "sell":
      return sell(state, action.uid);
    case "reroll":
      return reroll(state);
    case "move_joker":
      return moveJoker(state, action.uid, action.to);
    case "next_round":
      return nextRound(state);
    case "new_run":
      return newRunFrom(state, action.seed);
  }
}
