import { describe, expect, it } from "vitest";
import { apply, newRun } from "../../src/game/run";
import { RULES, TAROT_IDS } from "../../src/game/rules";
import { canUseTarot, targetRange, tarotDef, useTarot } from "../../src/game/tarots";
import type { Action, RunState } from "../../src/game/types";
import { cards } from "./cards";

/** 라운드 중이고, 손패와 덱에 같은 카드가 들어 있고, 소모품 칸에 타로를 넣어 둔 상태 */
function withTarots(consumables: string[], hand = "Kh Kc 2s 3d 5c 7h 9s Ad", extra: Partial<RunState> = {}): RunState {
  const base = newRun(8);
  const handCards = cards(hand);
  const others = base.deck.filter((card) => !handCards.some((h) => h.id === card.id));
  return {
    ...base,
    phase: "round",
    consumables,
    deck: [...handCards, ...others],
    round: { ...base.round, hand: handCards, selected: [] },
    ...extra,
  };
}

const pick = (state: RunState, ...ids: string[]): RunState =>
  ids.reduce((s, cardId) => apply(s, { type: "toggle_card", cardId } satisfies Action), state);

describe("targetRange", () => {
  it("카드를 고르는 타로와 아닌 타로", () => {
    expect(targetRange(tarotDef("star").effect)).toEqual({ min: 1, max: 3 });
    expect(targetRange(tarotDef("death").effect)).toEqual({ min: 2, max: 2 });
    expect(targetRange(tarotDef("hermit").effect)).toBeNull();
  });
});

describe("고른 카드를 바꾸는 타로", () => {
  it("별: 고른 카드를 다이아몬드로, 덱에도 남는다", () => {
    const state = pick(withTarots(["star"]), "hearts-13", "clubs-13");
    const used = useTarot(state, 0);
    for (const id of ["hearts-13", "clubs-13"]) {
      expect(used.round.hand.find((c) => c.id === id)?.suit).toBe("diamonds");
      expect(used.deck.find((c) => c.id === id)?.suit).toBe("diamonds");
    }
    expect(used.consumables).toEqual([]);
    expect(used.round.selected).toEqual([]);
  });

  it("최대 장수를 넘게 고르거나 라운드가 아니면 쓸 수 없다", () => {
    const four = pick(withTarots(["star"]), "hearts-13", "clubs-13", "spades-2", "diamonds-3");
    expect(canUseTarot(four, 0)).toBe(false);
    expect(useTarot(four, 0)).toBe(four);
    expect(canUseTarot({ ...pick(withTarots(["star"]), "hearts-13"), phase: "shop" }, 0)).toBe(false);
  });

  it("힘: 숫자 +1, A 다음은 2", () => {
    const used = useTarot(pick(withTarots(["strength"]), "hearts-13", "diamonds-14"), 0);
    expect(used.deck.find((c) => c.id === "hearts-13")?.rank).toBe(14);
    expect(used.deck.find((c) => c.id === "diamonds-14")?.rank).toBe(2);
  });

  it("매달린 사람: 손패와 덱에서 없앤다", () => {
    const state = pick(withTarots(["hanged_man"]), "spades-2", "diamonds-3");
    const used = useTarot(state, 0);
    expect(used.round.hand).toHaveLength(6);
    expect(used.deck).toHaveLength(50);
    expect(used.deck.some((c) => c.id === "spades-2")).toBe(false);
  });

  it("죽음: 손패에서 왼쪽 카드가 오른쪽 카드와 같아진다", () => {
    // 숫자순 정렬이라 K 하트가 왼쪽, 2 스페이드가 오른쪽
    const used = useTarot(pick(withTarots(["death"]), "spades-2", "hearts-13"), 0);
    expect(used.deck.find((c) => c.id === "hearts-13")).toMatchObject({ rank: 2, suit: "spades" });
    expect(used.deck.find((c) => c.id === "spades-2")).toMatchObject({ rank: 2, suit: "spades" });
  });
});

describe("언제든 쓰는 타로", () => {
  it("은둔자: 돈 두 배, 최대 +$20", () => {
    expect(useTarot(withTarots(["hermit"], undefined, { money: 7 }), 0).money).toBe(14);
    expect(useTarot(withTarots(["hermit"], undefined, { money: 50 }), 0).money).toBe(70);
  });

  it("절제: 조커 판매가의 합", () => {
    const jokers = [
      { uid: "a", defId: "greedy_joker", paid: 5 },
      { uid: "b", defId: "joker", paid: 2 },
    ];
    expect(useTarot(withTarots(["temperance"], undefined, { money: 0, jokers }), 0).money).toBe(2 + 1);
  });

  it("황제: 빈 칸만큼 타로를 만든다 (자기 칸 포함)", () => {
    const used = useTarot(withTarots(["emperor", "star"]), 0);
    expect(used.consumables).toHaveLength(RULES.consumableSlots);
    expect(used.consumables[0]).toBe("star");
    for (const id of used.consumables) expect(TAROT_IDS).toContain(id);
  });

  it("심판: 조커 칸이 비어 있을 때 조커를 하나 만든다", () => {
    const used = useTarot(withTarots(["judgement"], undefined, { jokers: [] }), 0);
    expect(used.jokers).toHaveLength(1);
    const full = withTarots(["judgement"], undefined, {
      jokers: Array.from({ length: RULES.jokerSlots }, (_, i) => ({ uid: `x${i}`, defId: "joker", paid: 2 })),
    });
    expect(canUseTarot(full, 0)).toBe(false);
  });

  it("바보: 마지막으로 쓴 타로를 만든다. 쓴 적이 없으면 못 쓴다", () => {
    expect(canUseTarot(withTarots(["fool"]), 0)).toBe(false);
    const afterHermit = useTarot(withTarots(["hermit", "fool"]), 0);
    expect(afterHermit.lastTarot).toBe("hermit");
    const fooled = useTarot(afterHermit, 0);
    expect(fooled.consumables).toEqual(["hermit"]);
    expect(fooled.lastTarot).toBe("hermit");
  });
});

describe("판 전체 덱", () => {
  it("타로로 바꾼 카드는 다음 라운드 덱에도 남는다", () => {
    const used = useTarot(pick(withTarots(["star"]), "hearts-13"), 0);
    const shop: RunState = { ...used, phase: "shop", shop: { offers: [], rerollCost: 5 } };
    const next = apply(shop, { type: "next_round" });
    const all = [...next.round.hand, ...next.round.drawPile];
    expect(all).toHaveLength(52);
    expect(all.find((c) => c.id === "hearts-13")?.suit).toBe("diamonds");
  });

  it("상점에서 타로를 사면 소모품 칸에, 칸이 차면 못 산다. 팔면 $1", () => {
    const shop: RunState = { ...withTarots([]), phase: "shop", money: 10, shop: { offers: [{ kind: "tarot", id: "sun" }], rerollCost: 5 } };
    const bought = apply(shop, { type: "buy", slot: 0 });
    expect(bought).toMatchObject({ money: 7, consumables: ["sun"] });
    const full = { ...shop, consumables: ["star", "moon"] };
    expect(apply(full, { type: "buy", slot: 0 })).toBe(full);
    expect(apply(bought, { type: "sell_consumable", index: 0 })).toMatchObject({ money: 8, consumables: [] });
  });
});
