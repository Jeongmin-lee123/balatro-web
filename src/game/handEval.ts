import type { Card, HandResult, HandType, Rank } from "./types";

/** 높은 족보부터. 판정은 이 순서로 처음 맞는 것을 고른다 */
const HAND_ORDER: readonly HandType[] = [
  "straight_flush",
  "four_of_a_kind",
  "full_house",
  "flush",
  "straight",
  "three_of_a_kind",
  "two_pair",
  "pair",
  "high_card",
];

function groupByRank(cards: readonly Card[]): Map<Rank, Card[]> {
  const groups = new Map<Rank, Card[]>();
  for (const card of cards) groups.set(card.rank, [...(groups.get(card.rank) ?? []), card]);
  return groups;
}

function isFlush(cards: readonly Card[]): boolean {
  return cards.length === 5 && cards.every((card) => card.suit === cards[0]?.suit);
}

/** A는 10-J-Q-K-A의 높은 카드와 A-2-3-4-5의 낮은 카드 둘 다 된다. Q-K-A-2-3처럼 돌아가는 것은 안 된다 */
function isStraight(cards: readonly Card[]): boolean {
  if (cards.length !== 5) return false;
  const ranks = [...new Set(cards.map((card) => card.rank))].sort((a, b) => a - b);
  if (ranks.length !== 5) return false;
  const lowAce = ranks.join(",") === "2,3,4,5,14";
  return lowAce || (ranks[4] as number) - (ranks[0] as number) === 4;
}

function containedHands(cards: readonly Card[], groups: Map<Rank, Card[]>): Set<HandType> {
  const sizes = [...groups.values()].map((group) => group.length);
  const pairsOrMore = sizes.filter((size) => size >= 2).length;
  const flush = isFlush(cards);
  const straight = isStraight(cards);

  const found = new Set<HandType>(["high_card"]);
  if (pairsOrMore >= 1) found.add("pair");
  if (pairsOrMore >= 2) found.add("two_pair");
  if (sizes.some((size) => size >= 3)) found.add("three_of_a_kind");
  if (sizes.includes(3) && sizes.includes(2)) found.add("full_house");
  if (sizes.some((size) => size >= 4)) found.add("four_of_a_kind");
  if (flush) found.add("flush");
  if (straight) found.add("straight");
  if (flush && straight) found.add("straight_flush");
  return found;
}

function scoringCardsFor(type: HandType, cards: readonly Card[], groups: Map<Rank, Card[]>): Card[] {
  const ranksWithAtLeast = (size: number) =>
    new Set([...groups.entries()].filter(([, group]) => group.length >= size).map(([rank]) => rank));

  switch (type) {
    case "straight_flush":
    case "flush":
    case "straight":
    case "full_house":
      return [...cards];
    case "four_of_a_kind": {
      const ranks = ranksWithAtLeast(4);
      return cards.filter((card) => ranks.has(card.rank));
    }
    case "three_of_a_kind": {
      const ranks = ranksWithAtLeast(3);
      return cards.filter((card) => ranks.has(card.rank));
    }
    case "two_pair":
    case "pair": {
      const ranks = ranksWithAtLeast(2);
      return cards.filter((card) => ranks.has(card.rank));
    }
    case "high_card": {
      const highest = cards.reduce((best, card) => (card.rank > best.rank ? card : best));
      return [highest];
    }
  }
}

/** 플레이한 카드 1~5장의 족보를 판정한다. 카드 순서는 바꾸지 않는다 */
export function evaluateHand(cards: readonly Card[]): HandResult {
  if (cards.length === 0 || cards.length > 5) throw new Error(`카드는 1~5장이어야 합니다: ${cards.length}장`);

  const groups = groupByRank(cards);
  const contains = containedHands(cards, groups);
  const type = HAND_ORDER.find((hand) => contains.has(hand)) ?? "high_card";
  const ranks = new Set(cards.map((card) => card.rank));

  return {
    type,
    scoringCards: scoringCardsFor(type, cards, groups),
    contains: HAND_ORDER.filter((hand) => contains.has(hand)),
    isRoyal: type === "straight_flush" && ranks.has(14) && ranks.has(10),
  };
}
