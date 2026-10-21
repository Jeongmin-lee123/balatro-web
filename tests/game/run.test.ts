import { describe, expect, it } from "vitest";
import { apply, canBuy, canPlay, currentTarget, newRun } from "../../src/game/run";
import { JOKERS, RULES } from "../../src/game/rules";
import type { Action, Card, RunState, ShopOffer } from "../../src/game/types";
import { cards } from "./cards";

/** 손패를 원하는 카드로 바꾸고, 블라인드 선택 화면이면 라운드로 들어간 상태 */
function withHand(state: RunState, text: string, overrides: Partial<RunState["round"]> = {}): RunState {
  const phase = state.phase === "blind_select" ? "round" : state.phase;
  return { ...state, phase, round: { ...state.round, hand: cards(text), selected: [], ...overrides } };
}

/** 새 판에서 스몰 블라인드를 선택해 라운드에 들어간 상태 */
function started(seed: number): RunState {
  return apply(newRun(seed), { type: "select_blind" });
}

function run(state: RunState, ...actions: Action[]): RunState {
  return actions.reduce(apply, state);
}

const select = (...cardIds: string[]): Action[] => cardIds.map((cardId) => ({ type: "toggle_card", cardId }));

describe("newRun", () => {
  it("앤티 1 스몰 블라인드 선택 화면, 손패 8장, $4로 시작한다", () => {
    const state = newRun(1);
    expect(state).toMatchObject({ phase: "blind_select", ante: 1, blindIndex: 0, money: RULES.startingMoney });
    expect(state.blindTags).toHaveLength(2);
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
    const state = started(1);
    expect(apply(state, { type: "toggle_card", cardId: "nothing" })).toBe(state);
  });
});

describe("플레이와 버리기", () => {
  it("아무것도 고르지 않으면 상태 그대로", () => {
    const state = started(1);
    expect(apply(state, { type: "play" })).toBe(state);
    expect(apply(state, { type: "discard" })).toBe(state);
  });

  it("버리기는 횟수를 줄이고 손패를 8장으로 채운다", () => {
    const state = started(1);
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
    expect(after.stats).toMatchObject({ bestHand: 60, handsPlayed: 1 });
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
    expect(next).toMatchObject({ phase: "blind_select", ante: 1, blindIndex: 1, shop: null });
    expect(next.round).toMatchObject({ score: 0, handsLeft: RULES.hands, discardsLeft: RULES.discards });
    const afterBoss = apply({ ...inShop(0), blindIndex: 2 }, { type: "next_round" });
    expect(afterBoss).toMatchObject({ ante: 2, blindIndex: 0 });
  });
});

describe("보스 블라인드", () => {
  /** 빅 블라인드 뒤 상점에서 다음 라운드를 누르고 보스를 선택해, 정한 보스의 라운드를 시작한 상태 */
  function atBoss(boss: string, ante = 2): RunState {
    const shop: RunState = { ...newRun(5), phase: "shop", ante, blindIndex: 1, boss, shop: { offers: [], rerollCost: 5 } };
    return run(shop, { type: "next_round" }, { type: "select_blind" });
  }

  it("같은 앤티 안에서는 보스가 그대로, 앤티가 바뀌면 새로 고른다", () => {
    const boss = atBoss("wall");
    expect(boss).toMatchObject({ blindIndex: 2, boss: "wall" });
    const nextAnte = apply({ ...boss, phase: "shop", shop: { offers: [], rerollCost: 5 } }, { type: "next_round" });
    expect(nextAnte).toMatchObject({ ante: 3, blindIndex: 0 });
    expect(nextAnte.bossesSeen.length).toBeGreaterThan(boss.bossesSeen.length);
  });

  it("벽은 목표 4배, 바늘은 1배이고 핸드가 1번", () => {
    expect(currentTarget(atBoss("wall"))).toBe(800 * 4);
    const needle = atBoss("needle");
    expect(currentTarget(needle)).toBe(800);
    expect(needle.round.handsLeft).toBe(1);
  });

  it("물은 버리기 0번", () => {
    expect(atBoss("water").round.discardsLeft).toBe(0);
  });

  it("점쟁이는 5장이 아니면 플레이할 수 없다", () => {
    const state = withHand(atBoss("psychic"), "Kh Kc 2s 3d 5c 7h 9s Jd");
    const two = run(state, ...select("hearts-13", "clubs-13"));
    expect(canPlay(two)).toBe(false);
    expect(apply(two, { type: "play" })).toBe(two);
    const five = run(two, ...select("spades-2", "diamonds-3", "clubs-5"), { type: "play" });
    expect(five.stats.handsPlayed).toBe(1);
  });

  it("팔은 낸 족보 레벨을 점수 계산 전에 내린다", () => {
    const base = atBoss("arm");
    const state = withHand({ ...base, handLevels: { ...base.handLevels, pair: 2 } }, "Kh Kc 2s 3d 5c 7h 9s Jd");
    const played = run(state, ...select("hearts-13", "clubs-13"), { type: "play" });
    expect(played.handLevels.pair).toBe(1);
    expect(played.round.lastScore).toMatchObject({ chips: 30, mult: 2 });
  });

  it("머리는 하트를 무효로 만든다", () => {
    const state = withHand(atBoss("head"), "Kh Kc 2s 3d 5c 7h 9s Jd");
    const played = run(state, ...select("hearts-13", "clubs-13"), { type: "play" });
    expect(played.round.lastScore).toMatchObject({ chips: 10 + 10, mult: 2 });
  });
});

describe("블라인드 선택과 태그", () => {
  /** 스몰, 빅 블라인드의 태그를 정해 둔 새 판 */
  function withTags(small: string, big: string, extra: Partial<RunState> = {}): RunState {
    return { ...newRun(4), blindTags: [small, big], ...extra };
  }

  it("선택하면 라운드로, 손패는 선택 화면에서 나눠 둔 그대로", () => {
    const state = newRun(4);
    const selected = apply(state, { type: "select_blind" });
    expect(selected.phase).toBe("round");
    expect(selected.round.hand).toEqual(state.round.hand);
  });

  it("건너뛰면 그 블라인드의 태그를 받고 다음 블라인드 선택으로", () => {
    const skipped = apply(withTags("coupon", "d6"), { type: "skip_blind" });
    expect(skipped).toMatchObject({ phase: "blind_select", blindIndex: 1, tags: ["coupon"] });
    expect(skipped.stats.skips).toBe(1);
  });

  it("보스 블라인드는 건너뛸 수 없다", () => {
    const boss = { ...newRun(4), blindIndex: 2 as const };
    expect(apply(boss, { type: "skip_blind" })).toBe(boss);
  });

  it("경제 태그: 돈 두 배, 최대 +$40", () => {
    expect(apply(withTags("economy", "d6", { money: 7 }), { type: "skip_blind" }).money).toBe(14);
    expect(apply(withTags("economy", "d6", { money: 100 }), { type: "skip_blind" }).money).toBe(140);
  });

  it("속도 태그: 이번 건너뛰기까지 포함해 건너뛴 블라인드마다 $5", () => {
    const twice = run(withTags("coupon", "speed", { money: 0 }), { type: "skip_blind" }, { type: "skip_blind" });
    expect(twice.money).toBe(10);
  });

  it("손재주와 쓰레기 태그: 낸 핸드, 쓰지 않은 버리기마다 $1", () => {
    const stats = { bestHand: 0, handsPlayed: 6, skips: 0, unusedDiscards: 4 };
    expect(apply(withTags("handy", "d6", { money: 0, stats }), { type: "skip_blind" }).money).toBe(6);
    expect(apply(withTags("garbage", "d6", { money: 0, stats }), { type: "skip_blind" }).money).toBe(4);
  });

  it("저글링 태그: 다음에 선택한 라운드의 손패 +3장, 쓰고 나면 사라진다", () => {
    const skipped = apply(withTags("juggle", "d6"), { type: "skip_blind" });
    const selected = apply(skipped, { type: "select_blind" });
    expect(selected.round.hand).toHaveLength(RULES.handSize + 3);
    expect(selected.tags).toEqual([]);
  });

  it("쿠폰 태그는 다음 상점 처음 진열을 무료로, 주사위 태그는 다시 굴리기를 $0부터", () => {
    const state = withHand({ ...newRun(4), tags: ["coupon", "d6"] }, "Ah Kh Qh Jh Th 2c 3c 4c", { score: 299 });
    const shop = run(state, ...select("hearts-14"), { type: "play" }, { type: "collect" });
    expect(shop.shop?.offers.every((offer) => offer?.price === 0)).toBe(true);
    expect(shop.shop?.rerollCost).toBe(0);
    expect(shop.tags).toEqual([]);
  });

  it("투자 태그는 보스를 이긴 정산에 $25를 더하고, 보스가 아니면 그대로 보관한다", () => {
    const hand = "Ah Kh Qh Jh Th 2c 3c 4c";
    const small = withHand({ ...newRun(4), tags: ["investment"] }, hand, { score: 299 });
    const notBoss = run(small, ...select("hearts-14"), { type: "play" });
    expect(notBoss.tags).toEqual(["investment"]);

    const bossBase = { ...newRun(4), blindIndex: 2 as const, boss: "club", tags: ["investment"] };
    const boss = withHand(bossBase, hand, { score: currentTarget(bossBase) - 1 });
    const won = run(boss, ...select("hearts-14"), { type: "play" });
    expect(won.cashOut?.lines.at(-1)).toEqual({ label: "투자 태그", amount: 25 });
    expect(won.tags).toEqual([]);
  });

  it("라운드를 이기면 남은 버리기를 쓰레기 태그용으로 쌓는다", () => {
    const state = withHand(newRun(4), "Ah Kh Qh Jh Th 2c 3c 4c", { score: 299, discardsLeft: 2 });
    expect(run(state, ...select("hearts-14"), { type: "play" }).stats.unusedDiscards).toBe(2);
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

/** 가능한 조합을 실제 apply로 플레이해 보고 점수가 가장 높은 조합을 고른다. 보스 제약도 그대로 반영된다 */
function bestSelection(state: RunState): string[] {
  const hand = state.round.hand;
  let best: { ids: string[]; total: number } = { ids: [], total: -1 };
  for (let mask = 1; mask < 1 << hand.length; mask++) {
    const ids = hand.filter((_, i) => mask & (1 << i)).map((c) => c.id);
    if (ids.length > RULES.maxSelect) continue;
    const played = run(state, ...select(...ids), { type: "play" });
    const total = played.stats.handsPlayed > state.stats.handsPlayed ? (played.round.lastScore?.total ?? -1) : -1;
    if (total > best.total) best = { ids, total };
  }
  return best.ids;
}

function autoPlay(seed: number): { final: RunState; steps: number } {
  let state = newRun(seed);
  let steps = 0;
  while (state.phase !== "won" && state.phase !== "lost" && steps < 2000) {
    steps++;
    if (state.phase === "blind_select") state = apply(state, { type: "select_blind" });
    else if (state.phase === "round") state = run(state, ...select(...bestSelection(state)), { type: "play" });
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

  it("자동 플레이로 여러 시드를 돌리면 앤티 2 이상까지 가는 판이 있다", () => {
    const antes = [1, 2, 3, 4, 5, 6].map((seed) => autoPlay(seed).final.ante);
    expect(Math.max(...antes)).toBeGreaterThanOrEqual(2);
  });
});
