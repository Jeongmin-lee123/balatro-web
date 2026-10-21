// 한 판의 상태 전이. 판 상태는 apply(state, action)으로만 바꾼다. (design.md D-006)
// 허용되지 않는 행동은 받은 상태를 그대로 돌려준다.
import { nextBlind, targetScore } from "./blinds";
import { bossDef, canPlayCount, isDebuffed, pickBoss, roundLimits } from "./bosses";
import { createDeck, drawCards, sortHand } from "./deck";
import { cashOutLines } from "./economy";
import { nextRandom, shuffle } from "./rng";
import { ANTE_COUNT, HAND_TYPES, JOKERS, PLANETS, RULES } from "./rules";
import { evaluateHand } from "./handEval";
import { scoreHand } from "./scoring";
import { offerPrice, rollOffers, sellValue } from "./shop";
import type { Action, BossDef, HandLevels, JokerDef, OwnedJoker, PlanetDef, RoundState, RunState, SortBy } from "./types";

function dealRound(rngState: number, sortBy: SortBy, boss: BossDef | null): { round: RoundState; rngState: number } {
  const [deck, next] = shuffle(createDeck(), rngState);
  const limits = roundLimits(boss?.effect ?? null);
  const { drawn, rest } = drawCards(deck, RULES.handSize);
  return {
    rngState: next,
    round: {
      drawPile: rest,
      hand: sortHand(drawn, sortBy),
      selected: [],
      handsLeft: limits.hands,
      discardsLeft: limits.discards,
      score: 0,
      lastScore: null,
      sortBy,
    },
  };
}

export function newRun(seed: number): RunState {
  const picked = pickBoss(seed >>> 0, 1, []);
  const { round, rngState } = dealRound(picked.rngState, "rank", null);
  return {
    seed,
    rngState,
    phase: "round",
    ante: 1,
    blindIndex: 0,
    money: RULES.startingMoney,
    jokers: [],
    handLevels: Object.fromEntries(HAND_TYPES.map((type) => [type, 1])) as HandLevels,
    boss: picked.boss,
    bossesSeen: picked.seen,
    nextUid: 1,
    round,
    cashOut: null,
    shop: null,
    stats: { bestHand: 0, handsPlayed: 0 },
  };
}

/** 보스 블라인드일 때만 이번 앤티의 보스를 돌려준다 */
export function activeBoss(state: Pick<RunState, "blindIndex" | "boss">): BossDef | null {
  return state.blindIndex === 2 ? bossDef(state.boss) : null;
}

export function currentTarget(state: RunState): number {
  return targetScore(state.ante, state.blindIndex, bossDef(state.boss).multiplier);
}

/** 고른 카드로 지금 플레이할 수 있는지. 화면의 플레이 버튼도 이 함수를 쓴다 */
export function canPlay(state: RunState): boolean {
  return state.round.handsLeft > 0 && canPlayCount(activeBoss(state)?.effect ?? null, state.round.selected.length);
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

/** 팔: 낸 족보의 레벨을 점수 계산 전에 1 내린다 (최소 1) */
function lowerPlayedLevel(levels: HandLevels, played: RoundState["hand"]): HandLevels {
  const type = evaluateHand(played).type;
  return { ...levels, [type]: Math.max(1, levels[type] - 1) };
}

function play(state: RunState): RunState {
  if (!canPlay(state)) return state;

  const effect = activeBoss(state)?.effect ?? null;
  const { taken, round } = takeSelected(state.round);
  const handLevels = effect?.kind === "lower_level" ? lowerPlayedLevel(state.handLevels, taken) : state.handLevels;
  const result = scoreHand(taken, jokerDefs(state.jokers), handLevels, {
    isDebuffed: effect ? (card) => isDebuffed(effect, card) : undefined,
    halveBase: effect?.kind === "halve_base",
  });
  const score = state.round.score + result.total;
  const handsLeft = state.round.handsLeft - 1;
  const stats = { bestHand: Math.max(state.stats.bestHand, result.total), handsPlayed: state.stats.handsPlayed + 1 };
  const next: RunState = { ...state, stats, handLevels, round: { ...round, score, handsLeft, lastScore: result } };

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

/** 상점 칸이 지금 살 수 있는 상태인지. 화면의 버튼 비활성화도 이 함수를 쓴다 */
export function canBuy(state: RunState, slot: number): boolean {
  const offer = state.shop?.offers[slot];
  if (!offer || state.money < offerPrice(offer)) return false;
  return offer.kind !== "joker" || state.jokers.length < RULES.jokerSlots;
}

function buy(state: RunState, slot: number): RunState {
  const offer = state.shop?.offers[slot];
  if (!state.shop || !offer || !canBuy(state, slot)) return state;
  const price = offerPrice(offer);
  const bought: RunState = {
    ...state,
    money: state.money - price,
    shop: { ...state.shop, offers: state.shop.offers.map((item, i) => (i === slot ? null : item)) },
  };

  if (offer.kind === "planet") {
    // 소모품 칸 없이 사는 즉시 레벨을 올린다 (design.md D-010)
    const hand = (PLANETS[offer.id] as PlanetDef).hand;
    return { ...bought, handLevels: { ...state.handLevels, [hand]: state.handLevels[hand] + 1 } };
  }
  return {
    ...bought,
    jokers: [...state.jokers, { uid: `j${state.nextUid}`, defId: offer.id, paid: price }],
    nextUid: state.nextUid + 1,
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
  const picked = ante === state.ante ? null : pickBoss(state.rngState, ante, state.bossesSeen);
  const boss = picked?.boss ?? state.boss;
  const bossesSeen = picked?.seen ?? state.bossesSeen;
  const { round, rngState } = dealRound(picked?.rngState ?? state.rngState, state.round.sortBy, activeBoss({ blindIndex, boss }));
  return { ...state, phase: "round", ante, blindIndex, boss, bossesSeen, round, rngState, shop: null };
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
