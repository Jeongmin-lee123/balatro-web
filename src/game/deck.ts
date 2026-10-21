import type { Card, Rank, SortBy, Suit } from "./types";

/** 원작의 무늬 정렬 순서 */
export const SUITS: readonly Suit[] = ["spades", "hearts", "clubs", "diamonds"];

const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const SUIT_NAMES: Record<Suit, string> = {
  spades: "스페이드",
  hearts: "하트",
  clubs: "클로버",
  diamonds: "다이아몬드",
};

/** 카드 귀퉁이에 적는 글자 */
export function rankLabel(rank: Rank): string {
  return ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Partial<Record<Rank, string>>)[rank] ?? String(rank);
}

/** 예: "K 하트". 돌 카드는 숫자와 무늬가 없다 */
export function cardLabel(card: Card): string {
  if (card.enhancement === "stone") return "돌 카드";
  return `${rankLabel(card.rank)} ${SUIT_NAMES[card.suit]}`;
}

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `${suit}-${rank}`, rank, suit })));
}

export function drawCards(pile: readonly Card[], count: number): { drawn: Card[]; rest: Card[] } {
  return { drawn: pile.slice(0, count), rest: pile.slice(count) };
}

/** 숫자순은 높은 숫자부터, 무늬순은 무늬끼리 모은 뒤 높은 숫자부터 */
export function sortHand(cards: readonly Card[], by: SortBy): Card[] {
  const suitOrder = (card: Card) => SUITS.indexOf(card.suit);
  return [...cards].sort((a, b) =>
    by === "rank"
      ? b.rank - a.rank || suitOrder(a) - suitOrder(b)
      : suitOrder(a) - suitOrder(b) || b.rank - a.rank,
  );
}
