import { describe, expect, it } from "vitest";
import { JOKER_IDS } from "../../src/game/rules";
import { rollOffers, sellValue } from "../../src/game/shop";

describe("rollOffers", () => {
  it("같은 시드면 같은 진열", () => {
    expect(rollOffers(11, 2)).toEqual(rollOffers(11, 2));
  });

  it("요청한 장수만큼 있는 조커 id로", () => {
    const [offers] = rollOffers(5, 2);
    expect(offers).toHaveLength(2);
    for (const id of offers) expect(JOKER_IDS).toContain(id);
  });

  it("여러 번 굴리면 모든 조커가 나올 수 있다", () => {
    const [offers] = rollOffers(1, 500);
    expect(new Set(offers).size).toBe(JOKER_IDS.length);
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
