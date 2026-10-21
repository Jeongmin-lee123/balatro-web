import { describe, expect, it } from "vitest";
import { evaluateHand } from "../../src/game/handEval";
import { cards, enhanced, ids } from "./cards";

describe("evaluateHand: 족보 판정", () => {
  it.each([
    ["Ah", "high_card"],
    ["Kh Kd", "pair"],
    ["Kh Kd 5s 5c", "two_pair"],
    ["7h 7d 7s", "three_of_a_kind"],
    ["9h Td Js Qc Kh", "straight"],
    ["Ah 2d 3s 4c 5h", "straight"],
    ["2h 7h 9h Jh Kh", "flush"],
    ["3h 3d 3s 9c 9h", "full_house"],
    ["8h 8d 8s 8c", "four_of_a_kind"],
    ["5d 6d 7d 8d 9d", "straight_flush"],
  ])("%s -> %s", (hand, expected) => {
    expect(evaluateHand(cards(hand)).type).toBe(expected);
  });

  it("Q-K-A-2-3은 스트레이트가 아니다", () => {
    expect(evaluateHand(cards("Qh Kd As 2c 3h")).type).toBe("high_card");
  });

  it("4장으로는 스트레이트나 플러시가 될 수 없다", () => {
    expect(evaluateHand(cards("5h 6h 7h 8h")).type).toBe("high_card");
  });

  it("10-J-Q-K-A 스트레이트 플러시는 로열로 표시한다", () => {
    expect(evaluateHand(cards("Ts Js Qs Ks As")).isRoyal).toBe(true);
    expect(evaluateHand(cards("Ah 2h 3h 4h 5h")).isRoyal).toBe(false);
  });

  it("5장을 넘으면 오류", () => {
    expect(() => evaluateHand(cards("2h 3h 4h 5h 6h 7h"))).toThrow();
  });
});

describe("evaluateHand: 점수 카드", () => {
  it("하이 카드는 가장 높은 1장만", () => {
    expect(ids(evaluateHand(cards("4c Jd 9s")).scoringCards)).toEqual(["diamonds-11"]);
  });

  it("페어는 짝 두 장만, 플레이한 순서대로", () => {
    expect(ids(evaluateHand(cards("Kh 2s 9c Kd 4h")).scoringCards)).toEqual(["hearts-13", "diamonds-13"]);
  });

  it("포카드는 나머지 1장을 뺀다", () => {
    expect(evaluateHand(cards("8h 8d 2s 8s 8c")).scoringCards).toHaveLength(4);
  });

  it("플러시와 풀 하우스는 5장 모두", () => {
    expect(evaluateHand(cards("2h 7h 9h Jh Kh")).scoringCards).toHaveLength(5);
    expect(evaluateHand(cards("3h 3d 3s 9c 9h")).scoringCards).toHaveLength(5);
  });
});

describe("evaluateHand: 포함 족보", () => {
  it("풀 하우스는 원 페어, 투 페어, 트리플을 포함한다", () => {
    expect(evaluateHand(cards("3h 3d 3s 9c 9h")).contains).toEqual(
      expect.arrayContaining(["full_house", "three_of_a_kind", "two_pair", "pair"]),
    );
  });

  it("포카드는 원 페어와 트리플을 포함하지만 투 페어는 아니다", () => {
    const { contains } = evaluateHand(cards("8h 8d 8s 8c"));
    expect(contains).toEqual(expect.arrayContaining(["pair", "three_of_a_kind"]));
    expect(contains).not.toContain("two_pair");
  });

  it("페어가 섞인 플러시는 원 페어를 포함한다", () => {
    expect(evaluateHand(cards("2h 2h 9h Jh Kh")).contains).toContain("pair");
  });

  it("스트레이트 플러시는 스트레이트와 플러시를 포함한다", () => {
    expect(evaluateHand(cards("5d 6d 7d 8d 9d")).contains).toEqual(
      expect.arrayContaining(["straight", "flush"]),
    );
  });
});

describe("evaluateHand: 강화 카드", () => {
  it("와일드 카드는 어느 무늬로도 플러시를 만든다", () => {
    const hand = [...cards("2h 7h 9h Jh"), enhanced("Ks", "wild")];
    expect(evaluateHand(hand).type).toBe("flush");
  });

  it("돌 카드는 족보 판정에서 빠지지만 점수 카드에는 들어간다", () => {
    const stone = enhanced("Ks", "stone");
    const result = evaluateHand([...cards("7h 7d"), stone]);
    expect(result.type).toBe("pair");
    expect(ids(result.scoringCards)).toEqual(["hearts-7", "diamonds-7", "spades-13"]);
  });

  it("돌 카드만 내면 하이 카드이고 돌 카드가 점수에 들어간다", () => {
    const result = evaluateHand([enhanced("Ks", "stone")]);
    expect(result.type).toBe("high_card");
    expect(result.scoringCards).toHaveLength(1);
  });

  it("돌 카드가 끼면 5장이어도 스트레이트가 되지 않는다", () => {
    expect(evaluateHand([...cards("5h 6d 7s 8c"), enhanced("9h", "stone")]).type).toBe("high_card");
  });
});

describe("evaluateHand: 비밀 족보", () => {
  it("같은 숫자 5장은 파이브 카드, 원 페어와 트리플과 포카드를 포함한다", () => {
    const result = evaluateHand(cards("7h 7d 7s 7c 7h"));
    expect(result.type).toBe("five_of_a_kind");
    expect(result.contains).toEqual(expect.arrayContaining(["pair", "three_of_a_kind", "four_of_a_kind"]));
    expect(result.contains).not.toContain("two_pair");
    expect(result.scoringCards).toHaveLength(5);
  });

  it("같은 무늬 풀 하우스는 플러시 하우스", () => {
    expect(evaluateHand(cards("Kh Kh Kh 4h 4h")).type).toBe("flush_house");
  });

  it("같은 무늬 파이브 카드는 플러시 파이브", () => {
    expect(evaluateHand(cards("Ah Ah Ah Ah Ah")).type).toBe("flush_five");
  });

  it("와일드 카드로도 플러시 하우스가 된다", () => {
    expect(evaluateHand([...cards("Kh Kh Kh 4h"), enhanced("4s", "wild")]).type).toBe("flush_house");
  });
});
