import { describe, expect, it } from "vitest";
import { JOKER_IDS, PLANET_IDS, RULES } from "../../src/game/rules";
import { offerPrice, rollOffers, sellValue } from "../../src/game/shop";

describe("rollOffers", () => {
  it("같은 시드면 같은 진열", () => {
    expect(rollOffers(11, 2)).toEqual(rollOffers(11, 2));
  });

  it("요청한 칸 수만큼, 종류에 맞는 id로", () => {
    const [offers] = rollOffers(5, 50);
    expect(offers).toHaveLength(50);
    for (const offer of offers) {
      expect(offer.kind === "joker" ? JOKER_IDS : PLANET_IDS).toContain(offer.id);
    }
  });

  it("조커와 행성이 rules.json 비율(20 : 4) 근처로 나온다", () => {
    const [offers] = rollOffers(1, 2400);
    const planets = offers.filter((offer) => offer.kind === "planet").length;
    const expected = 2400 * (RULES.shopWeights.planet / (RULES.shopWeights.joker + RULES.shopWeights.planet));
    expect(planets).toBeGreaterThan(expected * 0.8);
    expect(planets).toBeLessThan(expected * 1.2);
  });

  it("여러 번 굴리면 모든 조커와 행성이 나올 수 있다", () => {
    const [offers] = rollOffers(1, 2000);
    expect(new Set(offers.filter((o) => o.kind === "joker").map((o) => o.id)).size).toBe(JOKER_IDS.length);
    expect(new Set(offers.filter((o) => o.kind === "planet").map((o) => o.id)).size).toBe(PLANET_IDS.length);
  });
});

describe("offerPrice", () => {
  it("조커는 조커 가격, 행성은 $3", () => {
    expect(offerPrice({ kind: "joker", id: "greedy_joker" })).toBe(5);
    expect(offerPrice({ kind: "planet", id: "neptune" })).toBe(3);
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
