import { describe, expect, it } from "vitest";
import { JOKER_IDS, PLANET_IDS, RULES, TAROT_IDS } from "../../src/game/rules";
import { offerPrice, planetPool, rollOffers, sellValue } from "../../src/game/shop";
import type { ShopItemKind } from "../../src/game/types";

/** 비밀 족보를 내기 전에 나올 수 있는 상품 */
const IDS: Record<ShopItemKind, string[]> = { joker: JOKER_IDS, tarot: TAROT_IDS, planet: planetPool({}) };

describe("rollOffers", () => {
  it("같은 시드면 같은 진열", () => {
    expect(rollOffers(11, 2)).toEqual(rollOffers(11, 2));
  });

  it("요청한 칸 수만큼, 종류에 맞는 id로", () => {
    const [offers] = rollOffers(5, 50);
    expect(offers).toHaveLength(50);
    for (const offer of offers) expect(IDS[offer.kind]).toContain(offer.id);
  });

  it("종류마다 rules.json shopWeights 비율 근처로 나온다", () => {
    const [offers] = rollOffers(1, 2800);
    const weights = Object.entries(RULES.shopWeights) as [ShopItemKind, number][];
    const total = weights.reduce((sum, [, w]) => sum + w, 0);
    for (const [kind, weight] of weights) {
      const count = offers.filter((offer) => offer.kind === kind).length;
      expect(count).toBeGreaterThan(2800 * (weight / total) * 0.8);
      expect(count).toBeLessThan(2800 * (weight / total) * 1.2);
    }
  });

  it("여러 번 굴리면 모든 상품이 나올 수 있다", () => {
    const [offers] = rollOffers(1, 3000);
    for (const kind of Object.keys(IDS) as ShopItemKind[]) {
      expect(new Set(offers.filter((o) => o.kind === kind).map((o) => o.id)).size).toBe(IDS[kind].length);
    }
  });
});

describe("planetPool", () => {
  it("비밀 행성은 그 족보를 낸 뒤에만 들어간다", () => {
    expect(planetPool({})).toHaveLength(PLANET_IDS.length - 3);
    expect(planetPool({ five_of_a_kind: 1 })).toContain("planet_x");
    expect(planetPool({ five_of_a_kind: 1 })).not.toContain("eris");
  });

  it("상점 진열도 넘겨준 행성 목록만 쓴다", () => {
    const [offers] = rollOffers(2, 3000, { shopWeights: { joker: 0, tarot: 0, planet: 1 }, editionRate: 1, planetIds: ["eris"] });
    expect(new Set(offers.map((o) => o.id))).toEqual(new Set(["eris"]));
  });
});

describe("offerPrice", () => {
  it("조커는 조커 가격, 타로와 행성은 $3, 덮어쓴 가격이 있으면 그 가격", () => {
    expect(offerPrice({ kind: "joker", id: "greedy_joker" })).toBe(5);
    expect(offerPrice({ kind: "tarot", id: "star" })).toBe(3);
    expect(offerPrice({ kind: "planet", id: "neptune" })).toBe(3);
    expect(offerPrice({ kind: "joker", id: "greedy_joker", price: 0 })).toBe(0);
  });

  it("없는 상품은 오류", () => {
    expect(() => offerPrice({ kind: "planet", id: "sun" })).toThrow();
  });
});

describe("sellValue", () => {
  it.each([
    [2, 1],
    [3, 1],
    [5, 2],
    [1, 1],
  ])("$%i에 산 조커는 $%i", (paid, expected) => {
    expect(sellValue(paid)).toBe(expected);
  });
});
