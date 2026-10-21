import { describe, expect, it } from "vitest";
import { HAND_TYPES, JOKERS } from "../../src/game/rules";
import { cardChips, handBase, scoreHand } from "../../src/game/scoring";
import type { HandLevels, JokerDef } from "../../src/game/types";
import { cards, enhanced } from "./cards";

const jokers = (...idList: string[]): JokerDef[] => idList.map((id) => JOKERS[id] as JokerDef);

describe("cardChips", () => {
  it("숫자 그대로, 그림 카드 10, A 11", () => {
    expect(cards("2h 9s Tc Jd Qh Ks Ac").map(cardChips)).toEqual([2, 9, 10, 10, 10, 10, 11]);
  });
});

describe("scoreHand", () => {
  it("조커 없이 K 페어 = (10 + 10 + 10) x 2 = 60. 같이 낸 카드는 점수에 안 들어간다", () => {
    const result = scoreHand(cards("Kh Kc 4s"), []);
    expect(result).toMatchObject({ chips: 30, mult: 2, total: 60 });
  });

  it("K 페어 + 조커 = 30 x 6 = 180", () => {
    expect(scoreHand(cards("Kh Kc"), jokers("joker")).total).toBe(180);
  });

  it("추상적 조커 2장이면 각자 조커 수(2) x 3", () => {
    expect(scoreHand(cards("Kh Kc"), jokers("abstract_joker", "abstract_joker"))).toMatchObject({ chips: 30, mult: 14 });
  });

  it("하프 조커는 4장 플레이 때 효과가 없다", () => {
    expect(scoreHand(cards("Kh Kc 2s 3d"), jokers("half_joker")).mult).toBe(2);
    expect(scoreHand(cards("Kh Kc 2s"), jokers("half_joker")).mult).toBe(22);
  });

  it("탐욕스러운 조커는 점수 카드 중 다이아몬드만 센다", () => {
    expect(scoreHand(cards("Kd Kc 5d"), jokers("greedy_joker")).mult).toBe(2 + 3);
  });

  it("쾌활한 조커와 교활한 조커는 풀 하우스에도 반응한다", () => {
    const result = scoreHand(cards("3h 3d 3s 9c 9h"), jokers("jolly_joker", "sly_joker"));
    expect(result.chips).toBe(40 + 3 * 3 + 9 * 2 + 50);
    expect(result.mult).toBe(4 + 8);
  });

  it("계산 과정은 기본값, 카드와 카드 반응 조커, 독립 조커 순서", () => {
    const result = scoreHand(cards("Kh Kd"), jokers("joker", "greedy_joker"));
    expect(result.steps.map((s) => s.source)).toEqual(["원 페어", "K 하트", "K 다이아몬드", "탐욕스러운 조커", "조커"]);
  });

  it("T-019 조커: 투 페어에는 미친 조커(배수)와 영리한 조커(칩)가 같이 반응한다", () => {
    const result = scoreHand(cards("Kh Kc 4s 4d"), jokers("mad_joker", "clever_joker"));
    expect(result).toMatchObject({ chips: 20 + 28 + 80, mult: 2 + 10 });
  });

  it("T-019 조커: 스트레이트, 플러시, 트리플 조커는 그 족보가 없으면 반응하지 않는다", () => {
    const set = jokers("crazy_joker", "droll_joker", "wily_joker");
    expect(scoreHand(cards("5h 6d 7s 8c 9h"), set)).toMatchObject({ chips: 30 + 35, mult: 4 + 12 });
    expect(scoreHand(cards("2h 7h 9h Jh Kh"), set)).toMatchObject({ chips: 35 + (2 + 7 + 9 + 10 + 10), mult: 4 + 10 });
    expect(scoreHand(cards("7h 7d 7s"), set)).toMatchObject({ chips: 30 + 21 + 100, mult: 3 });
  });

  it("족보 레벨이 오르면 기본값에 레벨업 값을 더한다", () => {
    expect(handBase("pair", 1)).toEqual({ chips: 10, mult: 2 });
    expect(handBase("pair", 3)).toEqual({ chips: 10 + 15 * 2, mult: 2 + 1 * 2 });
    const levels = { ...Object.fromEntries(HAND_TYPES.map((t) => [t, 1])), pair: 3 } as HandLevels;
    expect(scoreHand(cards("Kh Kc"), [], levels)).toMatchObject({ chips: 40 + 20, mult: 4 });
  });

  it("무효 카드는 족보에는 들어가지만 칩과 카드 반응 조커가 없다", () => {
    const result = scoreHand(cards("Kd Kc"), jokers("greedy_joker", "gluttonous_joker"), undefined, {
      isDebuffed: (card) => card.suit === "clubs",
    });
    expect(result.hand.type).toBe("pair");
    expect(result).toMatchObject({ chips: 10 + 10, mult: 2 + 3 });
    expect(result.steps.find((s) => s.source === "K 클로버")?.note).toBe("무효");
  });

  it("부싯돌: 족보 기본값을 절반으로 (반올림, 최소 1)", () => {
    expect(scoreHand(cards("Ah"), [], undefined, { halveBase: true })).toMatchObject({ chips: 3 + 11, mult: 1 });
    expect(scoreHand(cards("7h 7d 7s"), [], undefined, { halveBase: true })).toMatchObject({ chips: 15 + 21, mult: 2 });
  });

  it("보너스 +30칩, 배수 카드 +4배수, 돌 카드 +50칩(숫자 칩 없음)", () => {
    expect(scoreHand([enhanced("Kh", "bonus"), ...cards("Kc")], [])).toMatchObject({ chips: 10 + 10 + 30 + 10, mult: 2 });
    expect(scoreHand([enhanced("Kh", "mult"), ...cards("Kc")], [])).toMatchObject({ chips: 30, mult: 2 + 4 });
    expect(scoreHand([...cards("Kh Kc"), enhanced("2s", "stone")], [])).toMatchObject({ chips: 30 + 50, mult: 2 });
  });

  it("곱하기는 그때까지의 배수에 곱한다: 유리 카드 뒤의 조커 +4는 곱해지지 않는다", () => {
    const result = scoreHand([enhanced("Kh", "glass"), ...cards("Kc")], jokers("joker"));
    expect(result.mult).toBe(2 * 2 + 4);
    expect(result.total).toBe(30 * 8);
  });

  it("강철 카드는 손에 들고 있을 때만 x1.5", () => {
    const steel = enhanced("Qs", "steel");
    expect(scoreHand(cards("Kh Kc"), [], undefined, { held: [steel] }).mult).toBe(3);
    expect(scoreHand([...cards("Kh Kc"), steel], []).mult).toBe(2);
  });

  it("무효 카드는 강화 효과도 없다", () => {
    const result = scoreHand([enhanced("Kc", "mult"), ...cards("Kh")], [], undefined, { isDebuffed: (c) => c.suit === "clubs" });
    expect(result.mult).toBe(2);
  });

  it("와일드 카드는 모든 무늬 조커에 반응한다", () => {
    const result = scoreHand([enhanced("Kc", "wild"), ...cards("Kh")], jokers("greedy_joker", "lusty_joker"));
    expect(result.mult).toBe(2 + 3 + 3 + 3);
  });

  it("행운과 유리는 난수로 정해진다. 난수를 주지 않으면 일어나지 않는다", () => {
    const hand = [enhanced("Kh", "lucky"), enhanced("Kc", "glass")];
    expect(scoreHand(hand, [])).toMatchObject({ money: 0, shattered: [] });
    const always = scoreHand(hand, [], undefined, { random: () => 0 });
    expect(always).toMatchObject({ money: 20, shattered: ["clubs-13"] });
    expect(always.mult).toBe((2 + 20) * 2);
    expect(scoreHand(hand, [], undefined, { random: () => 0.99 })).toMatchObject({ money: 0, shattered: [], mult: 4 });
  });

  it("로열 플러시는 이름만 다르고 스트레이트 플러시 값을 쓴다", () => {
    const result = scoreHand(cards("Ts Js Qs Ks As"), []);
    expect(result.steps[0]).toMatchObject({ source: "로열 플러시", chips: 100, mult: 8 });
  });
});
