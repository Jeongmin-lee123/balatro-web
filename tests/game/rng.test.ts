import { describe, expect, it } from "vitest";
import { nextRandom, shuffle } from "../../src/game/rng";

describe("nextRandom", () => {
  it("같은 상태에서 항상 같은 값을 낸다", () => {
    expect(nextRandom(42)).toEqual(nextRandom(42));
  });

  it("0 이상 1 미만의 값을 낸다", () => {
    let state = 7;
    for (let i = 0; i < 1000; i++) {
      const [value, next] = nextRandom(state);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      state = next;
    }
  });
});

describe("shuffle", () => {
  const items = Array.from({ length: 20 }, (_, i) => i);

  it("같은 시드면 같은 순서, 다른 시드면 다른 순서", () => {
    expect(shuffle(items, 1)[0]).toEqual(shuffle(items, 1)[0]);
    expect(shuffle(items, 1)[0]).not.toEqual(shuffle(items, 2)[0]);
  });

  it("원본을 바꾸지 않고 원소를 잃지 않는다", () => {
    const [shuffled] = shuffle(items, 3);
    expect(items).toEqual(Array.from({ length: 20 }, (_, i) => i));
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
  });
});
