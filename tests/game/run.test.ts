import { describe, expect, it } from "vitest";
import { apply, canBuy, currentTarget, jokerDefs, newRun } from "../../src/game/run";
import { JOKERS, RULES } from "../../src/game/rules";
import { scoreHand } from "../../src/game/scoring";
import type { Action, Card, RunState, ShopOffer } from "../../src/game/types";
import { cards } from "./cards";

/** 손패를 원하는 카드로 바꾼 상태 */
function withHand(state: RunState, text: string, overrides: Partial<RunState["round"]> = {}): RunState {
  return { ...state, round: { ...state.round, hand: cards(text), selected: [], ...overrides } };
}

function run(state: RunState, ...actions: Action[]): RunState {
  return actions.reduce(apply, state);
}

const select = (...cardIds: string[]): Action[] => cardIds.map((cardId) => ({ type: "toggle_card", cardId }));

describe("newRun", () => {
  it("앤티 1 스몰 블라인드, 손패 8장, $4로 시작한다", () => {
    const state = newRun(1);
    expect(state).toMatchObject({ phase: "round", ante: 1, blindIndex: 0, money: RULES.startingMoney });
    expect(state.round.hand).toHaveLength(RULES.handSize);
    expect(state.round.drawPile).toHaveLength(52 - RULES.handSize);
  });

  it("같은 시드면 같은 손패", () => {
    expect(newRun(77).round.hand).toEqual(newRun(77).round.hand);
    expect(newRun(77).round.hand).not.toEqual(newRun(78).round.hand);
  });
});

describe("카드 고르기", () => {
  it("최대 5장까지, 다시 누르면 해제", () => {
    const state = withHand(newRun(1), "2h 3h 4h 5h 6h 7h 8h 9h");
    const ids = state.round.hand.map((c) => c.id);
    const six = run(state, ...select(...ids.slice(0, 6)));
    expect(six.round.selected).toHaveLength(5);
    expect(run(six, ...select(ids[0] as string)).round.selected).toHaveLength(4);
  });

  it("손에 없는 카드는 무시", () => {
    const state = newRun(1);
    expect(apply(state, { type: "toggle_card", cardId: "nothing" })).toBe(state);
  });
});

describe("플레이와 버리기", () => {
  it("아무것도 고르지 않으면 상태 그대로", () => {
    const state = newRun(1);
    expect(apply(state, { type: "play" })).toBe(state);
    expect(apply(state, { type: "discard" })).toBe(state);
  });

  it("버리기는 횟수를 줄이고 손패를 8장으로 채운다", () => {
    const state = newRun(1);
    const first = state.round.hand[0] as Card;
    const after = run(state, ...select(first.id), { type: "discard" });
    expect(after.round.discardsLeft).toBe(RULES.discards - 1);
    expect(after.round.hand).toHaveLength(8);
    expect(after.round.hand.map((c) => c.id)).not.toContain(first.id);
  });

  it("목표에 못 미치는 플레이는 점수를 더하고 핸드를 하나 쓴다", () => {
    const state = withHand(newRun(1), "Kh Kc 2s 3d 5c 7h 9s Jd");
    const after = run(state, ...select("hearts-13", "clubs-13"), { type: "play" });
    expect(after.round).toMatchObject({ score: 60, handsLeft: RULES.hands - 1 });
    expect(after.round.lastScore?.hand.type).toBe("pair");
    expect(after.stats).toEqual({ bestHand: 60, handsPlayed: 1 });
    expect(after.phase).toBe("round");
  });

  it("목표를 넘기면 정산 단계로", () => {
    const state = withHand(newRun(1), "Ah Kh Qh Jh Th 2c 3c 4c", { score: 250 });
    const after = run(state, ...select("hearts-14", "hearts-13", "hearts-12", "hearts-11", "hearts-10"), { type: "play" });
    expect(after.phase).toBe("cash_out");
    expect(after.cashOut?.total).toBe(3 + 3);
  });

  it("마지막 핸드에서 목표에 못 미치면 패배", () => {
    const state = withHand(newRun(1), "2h 5c 7s 9d Jh 3c 4d 8s", { handsLeft: 1 });
    expect(run(state, ...select("hearts-2"), { type: "play" }).phase).toBe("lost");
  });

  it("앤티 8 보스를 넘기면 정산 없이 승리", () => {
    const base = { ...newRun(1), ante: 8, blindIndex: 2 as const };
    const state = withHand(base, "Ah Kh Qh Jh Th 2c 3c 4c", { score: currentTarget(base) - 1 });
    expect(run(state, ...select("hearts-14"), { type: "play" }).phase).toBe("won");
  });
});

describe("정산과 상점", () => {
  /** 진열은 0번 칸 조커, 1번 칸 수성(원 페어 행성)으로 고정한다 */
  function inShop(money: number): RunState {
    const state = withHand({ ...newRun(3), money }, "Ah Kh Qh Jh Th 2c 3c 4c", { score: 299 });
    const shop = run(state, ...select("hearts-14"), { type: "play" }, { type: "collect" });
    const offers: ShopOffer[] = [
      { kind: "joker", id: "joker" },
      { kind: "planet", id: "mercury" },
    ];
    return { ...shop, shop: { ...(shop.shop as NonNullable<RunState["shop"]>), offers } };
  }

  it("정산을 받으면 돈이 늘고 상품이 진열된다", () => {
    const state = withHand({ ...newRun(3), money: 10 }, "Ah Kh Qh Jh Th 2c 3c 4c", { score: 299 });
    const shop = run(state, ...select("hearts-14"), { type: "play" }, { type: "collect" });
    expect(shop.phase).toBe("shop");
    expect(shop.money).toBe(10 + 3 + 3 + 2);
    expect(shop.shop?.offers).toHaveLength(RULES.shopSlots);
  });

  it("조커를 사면 돈이 줄고 칸이 빈다. 빈 칸은 다시 살 수 없다", () => {
    const shop = inShop(10);
    const bought = apply(shop, { type: "buy", slot: 0 });
    expect(bought.money).toBe(shop.money - (JOKERS.joker?.price as number));
    expect(bought.jokers).toHaveLength(1);
    expect(bought.shop?.offers[0]).toBeNull();
    expect(apply(bought, { type: "buy", slot: 0 })).toBe(bought);
  });

  it("행성을 사면 조커는 늘지 않고 그 족보 레벨이 오른다", () => {
    const shop = inShop(10);
    const bought = apply(shop, { type: "buy", slot: 1 });
    expect(bought.money).toBe(shop.money - 3);
    expect(bought.jokers).toHaveLength(0);
    expect(bought.handLevels.pair).toBe(2);
    expect(bought.handLevels.flush).toBe(1);
  });

  it("조커 칸이 가득 차도 행성은 살 수 있다", () => {
    const shop = inShop(50);
    const full = { ...shop, jokers: Array.from({ length: RULES.jokerSlots }, (_, i) => ({ uid: `x${i}`, defId: "joker", paid: 2 })) };
    expect(canBuy(full, 0)).toBe(false);
    expect(canBuy(full, 1)).toBe(true);
  });

  it("레벨이 오른 족보는 다음 라운드 점수에 반영된다", () => {
    const leveled = apply(inShop(10), { type: "buy", slot: 1 });
    const round = withHand(apply(leveled, { type: "next_round" }), "Kh Kc 2s 3d 5c 7h 9s Jd");
    const played = run(round, ...select("hearts-13", "clubs-13"), { type: "play" });
    expect(played.round.lastScore).toMatchObject({ chips: 25 + 20, mult: 3, total: 135 });
  });

  it("돈이 모자라면 살 수 없다", () => {
    const poor = { ...inShop(0), money: 0 };
    expect(apply(poor, { type: "buy", slot: 0 })).toBe(poor);
  });

  it("조커 칸이 가득 차면 살 수 없다", () => {
    const shop = inShop(50);
    const full = { ...shop, jokers: Array.from({ length: RULES.jokerSlots }, (_, i) => ({ uid: `x${i}`, defId: "joker", paid: 2 })) };
    expect(apply(full, { type: "buy", slot: 0 })).toBe(full);
  });

  it("다시 굴리기는 $5부터 $1씩 오른다", () => {
    const shop = inShop(20);
    const once = apply(shop, { type: "reroll" });
    const twice = apply(once, { type: "reroll" });
    expect(shop.money - twice.money).toBe(5 + 6);
    expect(twice.shop?.rerollCost).toBe(7);
  });

  it("팔면 산 값의 절반을 돌려받는다", () => {
    const shop = { ...inShop(0), jokers: [{ uid: "a", defId: "greedy_joker", paid: 5 }] };
    const sold = apply(shop, { type: "sell", uid: "a" });
    expect(sold.money).toBe(shop.money + 2);
    expect(sold.jokers).toEqual([]);
  });

  it("조커 순서를 바꾼다", () => {
    const jokers = ["a", "b", "c"].map((uid) => ({ uid, defId: "joker", paid: 2 }));
    const moved = apply({ ...inShop(0), jokers }, { type: "move_joker", uid: "c", to: 0 });
    expect(moved.jokers.map((j) => j.uid)).toEqual(["c", "a", "b"]);
  });

  it("다음 라운드는 빅 블라인드, 보스 다음은 다음 앤티 스몰", () => {
    const next = apply(inShop(0), { type: "next_round" });
    expect(next).toMatchObject({ phase: "round", ante: 1, blindIndex: 1, shop: null });
    expect(next.round).toMatchObject({ score: 0, handsLeft: RULES.hands, discardsLeft: RULES.discards });
    const afterBoss = apply({ ...inShop(0), blindIndex: 2 }, { type: "next_round" });
    expect(afterBoss).toMatchObject({ ante: 2, blindIndex: 0 });
  });
});

describe("apply", () => {
  it("맞지 않는 단계의 행동은 무시한다", () => {
    const state = newRun(1);
    expect(apply(state, { type: "buy", slot: 0 })).toBe(state);
    expect(apply(state, { type: "collect" })).toBe(state);
  });

  it("새 게임은 어느 단계에서든 처음부터", () => {
    const lost = { ...newRun(1), phase: "lost" as const, ante: 4 };
    expect(apply(lost, { type: "new_run", seed: 9 })).toEqual(newRun(9));
  });
});

/** 매번 가장 높은 점수의 조합을 내고, 살 수 있는 첫 조커를 사는 단순한 자동 플레이 */
function bestSelection(state: RunState): string[] {
  const hand = state.round.hand;
  const defs = jokerDefs(state.jokers);
  let best: { ids: string[]; total: number } = { ids: [], total: -1 };
  for (let mask = 1; mask < 1 << hand.length; mask++) {
    const picked = hand.filter((_, i) => mask & (1 << i));
    if (picked.length > RULES.maxSelect) continue;
    const { total } = scoreHand(picked, defs);
    if (total > best.total) best = { ids: picked.map((c) => c.id), total };
  }
  return best.ids;
}

function autoPlay(seed: number): { final: RunState; steps: number } {
  let state = newRun(seed);
  let steps = 0;
  while (state.phase !== "won" && state.phase !== "lost" && steps < 2000) {
    steps++;
    if (state.phase === "round") state = run(state, ...select(...bestSelection(state)), { type: "play" });
    else if (state.phase === "cash_out") state = apply(state, { type: "collect" });
    else if (state.phase === "shop") state = run(state, { type: "buy", slot: 0 }, { type: "buy", slot: 1 }, { type: "next_round" });
  }
  return { final: state, steps };
}

describe("한 판 전체", () => {
  it("자동 플레이가 승리나 패배로 끝나고, 같은 시드면 결과가 같다", () => {
    const first = autoPlay(2026);
    expect(["won", "lost"]).toContain(first.final.phase);
    expect(first.steps).toBeLessThan(2000);
    expect(autoPlay(2026).final).toEqual(first.final);
  });

  it("자동 플레이는 적어도 앤티 2까지 간다", () => {
    expect(autoPlay(2026).final.ante).toBeGreaterThanOrEqual(2);
  });
});
