import { describe, expect, it } from "vitest";
import { JOKERS } from "../../src/game/rules";
import { cardChips, scoreHand } from "../../src/game/scoring";
import type { JokerDef } from "../../src/game/types";
import { cards } from "./cards";

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

  it("로열 플러시는 이름만 다르고 스트레이트 플러시 값을 쓴다", () => {
    const result = scoreHand(cards("Ts Js Qs Ks As"), []);
    expect(result.steps[0]).toMatchObject({ source: "로열 플러시", chips: 100, mult: 8 });
  });
});
