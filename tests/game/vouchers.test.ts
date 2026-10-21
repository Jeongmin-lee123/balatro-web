import { describe, expect, it } from "vitest";
import { RULES, VOUCHER_LIST } from "../../src/game/rules";
import { apply, canBuyVoucher, newRun } from "../../src/game/run";
import { itemCost } from "../../src/game/shop";
import { discounted, modifiers, pickVoucher } from "../../src/game/vouchers";
import type { RunState } from "../../src/game/types";

function inShop(extra: Partial<RunState> = {}): RunState {
  return { ...newRun(31), phase: "shop", money: 30, shop: { offers: [], packs: [], rerollCost: 5 }, ...extra };
}

describe("modifiers", () => {
  it("바우처가 없으면 rules.json 그대로", () => {
    expect(modifiers([])).toMatchObject({
      handSize: RULES.handSize,
      hands: RULES.hands,
      discards: RULES.discards,
      shopSlots: RULES.shopSlots,
      consumableSlots: RULES.consumableSlots,
      interestCap: RULES.interestCap,
      discount: 0,
      editionRate: 1,
    });
  });

  it("바우처마다 해당 값만 바뀐다", () => {
    const all = modifiers(VOUCHER_LIST.map((v) => v.id));
    expect(all).toMatchObject({
      handSize: RULES.handSize + 1,
      hands: RULES.hands + 1,
      discards: RULES.discards + 1,
      shopSlots: RULES.shopSlots + 1,
      consumableSlots: RULES.consumableSlots + 1,
      rerollBase: RULES.rerollBase - 2,
      interestCap: 10,
      discount: 0.25,
      editionRate: 2,
    });
    expect(all.shopWeights.tarot).toBe(RULES.shopWeights.tarot * 2);
    expect(all.shopWeights.joker).toBe(RULES.shopWeights.joker);
  });
});

describe("discounted", () => {
  it("25% 할인, 딱 절반(.5)은 내림: $5 -> $4, $3 -> $2, $2 -> $1, $10 -> $7, 0원은 그대로", () => {
    expect([5, 3, 2, 10, 0].map((p) => discounted(p, 0.25))).toEqual([4, 2, 1, 7, 0]);
  });

  it("재고 정리 세일을 사면 상점 가격이 내려간다", () => {
    const offer = { kind: "joker" as const, id: "greedy_joker" };
    expect(itemCost({ vouchers: [] }, offer)).toBe(5);
    expect(itemCost({ vouchers: ["clearance_sale"] }, offer)).toBe(4);
  });
});

describe("pickVoucher", () => {
  it("이미 산 바우처는 고르지 않고, 다 샀으면 null", () => {
    const owned = VOUCHER_LIST.slice(1).map((v) => v.id);
    expect(pickVoucher(3, owned).voucher).toBe(VOUCHER_LIST[0]?.id);
    expect(pickVoucher(3, VOUCHER_LIST.map((v) => v.id)).voucher).toBeNull();
  });

  it("새 판은 앤티 1 바우처가 정해져 있고, 앤티가 바뀌면 다시 고른다", () => {
    const run = newRun(7);
    expect(run.voucherOffer).not.toBeNull();
    const afterBoss = apply(inShop({ blindIndex: 2, voucherOffer: null }), { type: "next_round" });
    expect(afterBoss.ante).toBe(2);
    expect(afterBoss.voucherOffer).not.toBeNull();
  });
});

describe("바우처 사기", () => {
  it("$10을 내고 산 목록에 더한다. 돈이 모자라면 못 산다", () => {
    const shop = inShop({ voucherOffer: "grabber" });
    const bought = apply(shop, { type: "buy_voucher" });
    expect(bought).toMatchObject({ money: 20, vouchers: ["grabber"], voucherOffer: null });
    const poor = inShop({ voucherOffer: "grabber", money: 9 });
    expect(canBuyVoucher(poor)).toBe(false);
    expect(apply(poor, { type: "buy_voucher" })).toBe(poor);
  });

  it("그래버와 페인트 붓은 다음 라운드부터 핸드와 손패가 는다", () => {
    const shop = inShop({ vouchers: ["grabber", "paint_brush"] });
    const next = apply(apply(shop, { type: "next_round" }), { type: "select_blind" });
    expect(next.round.handsLeft).toBe(RULES.hands + 1);
    expect(next.round.hand).toHaveLength(RULES.handSize + 1);
  });

  it("수정 구슬을 사면 타로를 3장까지 가질 수 있다", () => {
    const shop = inShop({ vouchers: ["crystal_ball"], consumables: ["star", "moon"], shop: { offers: [{ kind: "tarot", id: "sun" }], packs: [], rerollCost: 5 } });
    expect(apply(shop, { type: "buy", slot: 0 }).consumables).toHaveLength(3);
  });

  it("종잣돈이 있으면 이자 상한이 $10", () => {
    const hand = newRun(2).round;
    const state: RunState = { ...newRun(2), phase: "round", money: 60, vouchers: ["seed_money"], round: { ...hand, score: 299 } };
    const won = apply(apply(state, { type: "toggle_card", cardId: hand.hand[0]!.id }), { type: "play" });
    expect(won.cashOut?.lines.find((line) => line.label.startsWith("이자"))?.amount).toBe(10);
  });
});
