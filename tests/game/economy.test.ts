import { describe, expect, it } from "vitest";
import { cashOutLines, interest } from "../../src/game/economy";

describe("interest", () => {
  it.each([
    [0, 0],
    [4, 0],
    [5, 1],
    [24, 4],
    [25, 5],
    [100, 5],
  ])("$%i -> $%i", (money, expected) => {
    expect(interest(money)).toBe(expected);
  });
});

describe("cashOutLines", () => {
  it("보상 + 남은 핸드 x $1 + 이자", () => {
    const result = cashOutLines({ ante: 1, blindIndex: 1, handsLeft: 2, money: 12 });
    expect(result.lines.map((l) => l.amount)).toEqual([4, 2, 2]);
    expect(result.total).toBe(8);
  });

  it("0원인 줄은 빼지만 블라인드 보상 줄은 남긴다", () => {
    const result = cashOutLines({ ante: 1, blindIndex: 0, handsLeft: 0, money: 3 });
    expect(result.lines).toEqual([{ label: "스몰 블라인드", amount: 3 }]);
  });
});
