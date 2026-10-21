import { describe, expect, it } from "vitest";
import { blindName, blindReward, targetScore } from "../../src/game/blinds";

describe("targetScore", () => {
  it("스몰 x1, 빅 x1.5, 보스 x2", () => {
    expect([0, 1, 2].map((i) => targetScore(1, i as 0 | 1 | 2))).toEqual([300, 450, 600]);
  });

  it("안테 8 보스 = 100000", () => {
    expect(targetScore(8, 2)).toBe(100000);
  });

  it("없는 안테는 오류", () => {
    expect(() => targetScore(9, 0)).toThrow();
  });
});

describe("blindReward", () => {
  it("스몰 $3, 빅 $4, 보스 $5, 안테 8 보스 $8", () => {
    expect([blindReward(3, 0), blindReward(3, 1), blindReward(3, 2), blindReward(8, 2)]).toEqual([3, 4, 5, 8]);
  });
});

describe("blindName", () => {
  it("블라인드 이름", () => {
    expect(blindName(2)).toBe("보스 블라인드");
  });
});
