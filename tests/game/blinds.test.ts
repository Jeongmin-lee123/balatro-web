import { describe, expect, it } from "vitest";
import { blindName, blindReward, nextBlind, targetScore } from "../../src/game/blinds";

describe("targetScore", () => {
  it("스몰 x1, 빅 x1.5, 보스 x2", () => {
    expect([0, 1, 2].map((i) => targetScore(1, i as 0 | 1 | 2))).toEqual([300, 450, 600]);
  });

  it("앤티 8 보스 = 100000", () => {
    expect(targetScore(8, 2)).toBe(100000);
  });

  it("없는 앤티는 오류", () => {
    expect(() => targetScore(9, 0)).toThrow();
  });
});

describe("blindReward", () => {
  it("스몰 $3, 빅 $4, 보스 $5, 앤티 8 보스 $8", () => {
    expect([blindReward(3, 0), blindReward(3, 1), blindReward(3, 2), blindReward(8, 2)]).toEqual([3, 4, 5, 8]);
  });
});

describe("nextBlind", () => {
  it("스몰 -> 빅 -> 보스 -> 다음 앤티 스몰", () => {
    expect(nextBlind(2, 0)).toEqual({ ante: 2, blindIndex: 1 });
    expect(nextBlind(2, 1)).toEqual({ ante: 2, blindIndex: 2 });
    expect(nextBlind(2, 2)).toEqual({ ante: 3, blindIndex: 0 });
  });
});

describe("blindName", () => {
  it("블라인드 이름", () => {
    expect(blindName(2)).toBe("보스 블라인드");
  });
});
