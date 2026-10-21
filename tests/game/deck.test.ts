import { describe, expect, it } from "vitest";
import { createDeck, drawCards, sortHand } from "../../src/game/deck";
import type { Card } from "../../src/game/types";

const card = (rank: Card["rank"], suit: Card["suit"]): Card => ({ id: `${suit}-${rank}`, rank, suit });

describe("createDeck", () => {
  it("중복 없는 52장", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map((c) => c.id)).size).toBe(52);
  });
});

describe("drawCards", () => {
  it("앞에서부터 뽑고 나머지를 돌려준다", () => {
    const deck = createDeck();
    const { drawn, rest } = drawCards(deck, 8);
    expect(drawn).toEqual(deck.slice(0, 8));
    expect(rest).toHaveLength(44);
  });

  it("남은 장수보다 많이 뽑으면 있는 만큼만", () => {
    const { drawn, rest } = drawCards([card(2, "hearts")], 3);
    expect(drawn).toHaveLength(1);
    expect(rest).toHaveLength(0);
  });
});

describe("sortHand", () => {
  const hand = [card(5, "clubs"), card(14, "hearts"), card(5, "spades"), card(9, "clubs")];

  it("숫자순: 높은 숫자부터, 같은 숫자는 무늬 순서", () => {
    expect(sortHand(hand, "rank").map((c) => c.id)).toEqual(["hearts-14", "clubs-9", "spades-5", "clubs-5"]);
  });

  it("무늬순: 스페이드, 하트, 클로버, 다이아몬드 순서로 모은다", () => {
    expect(sortHand(hand, "suit").map((c) => c.id)).toEqual(["spades-5", "hearts-14", "clubs-9", "clubs-5"]);
  });
});
