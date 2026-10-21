// 한 판의 상태 전이. 판 상태는 apply(state, action)으로만 바꾼다. (design.md D-006)
// 허용되지 않는 행동은 받은 상태를 그대로 돌려준다.
import { nextBlind, targetScore } from "./blinds";
import { bossDef, canPlayCount, isDebuffed, pickBoss, roundLimits } from "./bosses";
import { createDeck, drawCards, sortHand } from "./deck";
import { cashOutLines } from "./economy";
import { evaluateHand } from "./handEval";
import { nextRandom, shuffle } from "./rng";
import { ANTE_COUNT, HAND_TYPES, JOKERS, PLANETS, RULES } from "./rules";
import { scoreHand } from "./scoring";
import { offerPrice, rollOffers, sellValue } from "./shop";
import { instantMoney, pickBlindTags, tagDef, takeTags } from "./tags";
import type {
  Action,
  BlindIndex,
  BossDef,
  CashOut,
  HandLevels,
  JokerDef,
  OwnedJoker,
  PlanetDef,
  RoundState,
  RunState,
  SortBy,
} from "./types";

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

/** 보스 블라인드일 때만 이번 앤티의 보스를 돌려준다 */
export function activeBoss(state: Pick<RunState, "blindIndex" | "boss">): BossDef | null {
  return state.blindIndex === 2 ? bossDef(state.boss) : null;
}

/**
 * 블라인드 선택 화면으로 들어간다. 앤티가 바뀌면 보스와 태그를 새로 고르고, 손패는 미리 나눠 둔다.
 * 새 판, 상점 다음, 건너뛰기가 모두 이 함수를 쓴다.
 */
function enterBlind(state: RunState, ante: number, blindIndex: BlindIndex, newAnte: boolean): RunState {
  let { rngState, boss, bossesSeen, blindTags } = state;
  if (newAnte) {
    const pickedBoss = pickBoss(rngState, ante, bossesSeen);
    const pickedTags = pickBlindTags(pickedBoss.rngState, ante);
    ({ boss, seen: bossesSeen } = pickedBoss);
    ({ tags: blindTags, rngState } = pickedTags);
  }
  const dealt = dealRound(rngState, state.round.sortBy, activeBoss({ blindIndex, boss }));
  return {
    ...state,
    phase: "blind_select",
    ante,
    blindIndex,
    boss,
    bossesSeen,
    blindTags,
    round: dealt.round,
    rngState: dealt.rngState,
    cashOut: null,
    shop: null,
  };
}

export function newRun(seed: number): RunState {
  const blank: RunState = {
    seed,
    rngState: seed >>> 0,
    phase: "blind_select",
    ante: 1,
    blindIndex: 0,
    money: RULES.startingMoney,
    jokers: [],
    handLevels: Object.fromEntries(HAND_TYPES.map((type) => [type, 1])) as HandLevels,
    boss: "",
    bossesSeen: [],
    blindTags: [],
    tags: [],
    nextUid: 1,
    round: { drawPile: [], hand: [], selected: [], handsLeft: 0, discardsLeft: 0, score: 0, lastScore: null, sortBy: "rank" },
    cashOut: null,
    shop: null,
    stats: { bestHand: 0, handsPlayed: 0, skips: 0, unusedDiscards: 0 },
  };
  return enterBlind(blank, 1, 0, true);
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

/** 저글링 태그: 고른 라운드의 손패를 늘린다 */
function selectBlind(state: RunState): RunState {
  const { taken, rest } = takeTags(state.tags, "hand_size");
  const extra = taken.reduce((sum, tag) => sum + (tag.effect.kind === "hand_size" ? tag.effect.amount : 0), 0);
  const { drawn, rest: drawPile } = drawCards(state.round.drawPile, extra);
  const hand = sortHand([...state.round.hand, ...drawn], state.round.sortBy);
  return { ...state, phase: "round", tags: rest, round: { ...state.round, hand, drawPile } };
}

/** 스몰, 빅 블라인드만 건너뛸 수 있다. 태그를 받고 다음 블라인드 선택으로 넘어간다 */
function skipBlind(state: RunState): RunState {
  const tagId = state.blindTags[state.blindIndex];
  if (state.blindIndex === 2 || !tagId) return state;
  const stats = { ...state.stats, skips: state.stats.skips + 1 };
  const money = instantMoney(tagDef(tagId).effect, { money: state.money, stats });
  const rewarded: RunState =
    money === null ? { ...state, stats, tags: [...state.tags, tagId] } : { ...state, stats, money: state.money + money };
  const next = nextBlind(state.ante, state.blindIndex);
  return enterBlind(rewarded, next.ante, next.blindIndex, false);
}

/**
 * 고른 카드를 손에서 빼고 덱에서 채운다. 빠진 카드는 손패 순서대로 돌려준다.
 * extraDiscards만큼 남은 손패에서 무작위로 더 버린 뒤 채운다 (갈고리 보스).
 */
function takeSelected(
  round: RoundState,
  rngState: number,
  extraDiscards = 0,
): { taken: RoundState["hand"]; round: RoundState; rngState: number } {
  const taken = round.hand.filter((card) => round.selected.includes(card.id));
  const held = round.hand.filter((card) => !round.selected.includes(card.id));
  const [order, nextRng] = extraDiscards > 0 ? shuffle(held, rngState) : [held, rngState];
  const kept = order.slice(extraDiscards);
  const { drawn, rest } = drawCards(round.drawPile, round.hand.length - kept.length);
  return {
    taken,
    rngState: nextRng,
    round: { ...round, hand: sortHand([...kept, ...drawn], round.sortBy), drawPile: rest, selected: [] },
  };
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

/** 라운드를 이겼을 때의 정산. 보스를 이기면 투자 태그가 발동한다 */
function winRound(state: RunState): RunState {
  const base = cashOutLines({ ante: state.ante, blindIndex: state.blindIndex, handsLeft: state.round.handsLeft, money: state.money });
  const { taken, rest } = state.blindIndex === 2 ? takeTags(state.tags, "boss_bonus") : { taken: [], rest: state.tags };
  const bonus = taken.map((tag) => ({ label: tag.name, amount: tag.effect.kind === "boss_bonus" ? tag.effect.amount : 0 }));
  const cashOut: CashOut = { lines: [...base.lines, ...bonus], total: base.total + bonus.reduce((sum, line) => sum + line.amount, 0) };
  const stats = { ...state.stats, unusedDiscards: state.stats.unusedDiscards + state.round.discardsLeft };
  return { ...state, phase: "cash_out", cashOut, tags: rest, stats };
}

function play(state: RunState): RunState {
  if (!canPlay(state)) return state;

  const effect = activeBoss(state)?.effect ?? null;
  const hook = effect?.kind === "discard_random" ? effect.count : 0;
  const { taken, round, rngState } = takeSelected(state.round, state.rngState, hook);
  const handLevels = effect?.kind === "lower_level" ? lowerPlayedLevel(state.handLevels, taken) : state.handLevels;
  const result = scoreHand(taken, jokerDefs(state.jokers), handLevels, {
    isDebuffed: effect ? (card) => isDebuffed(effect, card) : undefined,
    halveBase: effect?.kind === "halve_base",
  });
  const score = state.round.score + result.total;
  const handsLeft = state.round.handsLeft - 1;
  const stats = { ...state.stats, bestHand: Math.max(state.stats.bestHand, result.total), handsPlayed: state.stats.handsPlayed + 1 };
  const next: RunState = { ...state, rngState, stats, handLevels, round: { ...round, score, handsLeft, lastScore: result } };

  if (score >= currentTarget(state)) {
    if (state.ante === ANTE_COUNT && state.blindIndex === 2) return { ...next, phase: "won" };
    return winRound(next);
  }
  return handsLeft === 0 ? { ...next, phase: "lost" } : next;
}

function discard(state: RunState): RunState {
  if (state.round.selected.length === 0 || state.round.discardsLeft === 0) return state;
  const { round } = takeSelected(state.round, state.rngState);
  return { ...state, round: { ...round, discardsLeft: state.round.discardsLeft - 1 } };
}

/** 정산을 받고 상점으로. 쿠폰 태그는 처음 진열을 무료로, 주사위 태그는 다시 굴리기를 $0부터 */
function collect(state: RunState): RunState {
  if (!state.cashOut) return state;
  const [rolled, rngState] = rollOffers(state.rngState, RULES.shopSlots);
  const coupon = takeTags(state.tags, "free_shop");
  const d6 = takeTags(coupon.rest, "free_reroll");
  const offers = coupon.taken.length > 0 ? rolled.map((offer) => ({ ...offer, price: 0 })) : rolled;
  return {
    ...state,
    rngState,
    phase: "shop",
    money: state.money + state.cashOut.total,
    cashOut: null,
    tags: d6.rest,
    shop: { offers, rerollCost: d6.taken.length > 0 ? 0 : RULES.rerollBase },
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
  const next = nextBlind(state.ante, state.blindIndex);
  return enterBlind(state, next.ante, next.blindIndex, next.ante !== state.ante);
}

function newRunFrom(state: RunState, seed?: number): RunState {
  if (seed !== undefined) return newRun(seed);
  const [value] = nextRandom(state.rngState);
  return newRun(Math.floor(value * 4294967296));
}

/** 행동마다 허용되는 단계. 여기에 없는 단계에서 온 행동은 무시한다 */
const ALLOWED: Record<Action["type"], readonly RunState["phase"][]> = {
  select_blind: ["blind_select"],
  skip_blind: ["blind_select"],
  toggle_card: ["round"],
  play: ["round"],
  discard: ["round"],
  sort: ["round"],
  collect: ["cash_out"],
  buy: ["shop"],
  sell: ["blind_select", "round", "shop"],
  reroll: ["shop"],
  move_joker: ["blind_select", "round", "shop"],
  next_round: ["shop"],
  new_run: ["blind_select", "round", "cash_out", "shop", "won", "lost"],
};

export function apply(state: RunState, action: Action): RunState {
  if (!ALLOWED[action.type].includes(state.phase)) return state;

  switch (action.type) {
    case "select_blind":
      return selectBlind(state);
    case "skip_blind":
      return skipBlind(state);
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
