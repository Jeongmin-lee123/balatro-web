import { describe, expect, it } from "vitest";
import { canPick, openPack, packPrice, pickFromPack, rollPacks } from "../../src/game/packs";
import { PACK_LIST, RULES } from "../../src/game/rules";
import { apply, newRun } from "../../src/game/run";
import type { OpenPack, RunState } from "../../src/game/types";

/** 상점에 들어와 있고, 팩 칸을 정해 둔 상태 */
function inShop(packs: string[], extra: Partial<RunState> = {}): RunState {
  return {
    ...newRun(21),
    phase: "shop",
    money: 20,
    shop: { offers: [], packs: packs.map((id) => ({ id })), rerollCost: 5 },
    ...extra,
  };
}

function withPack(pack: OpenPack, extra: Partial<RunState> = {}): RunState {
  return { ...inShop([]), phase: "pack_open", pack, ...extra };
}

describe("rollPacks", () => {
  it("같은 시드면 같은 팩, weight 비율 근처로 나온다", () => {
    expect(rollPacks(5, 2)).toEqual(rollPacks(5, 2));
    const [packs] = rollPacks(9, 13200);
    const total = PACK_LIST.reduce((sum, pack) => sum + pack.weight, 0);
    for (const pack of PACK_LIST) {
      const rate = packs.filter((p) => p.id === pack.id).length / packs.length;
      expect(rate).toBeGreaterThan((pack.weight / total) * 0.85);
      expect(rate).toBeLessThan((pack.weight / total) * 1.15);
    }
  });
});

describe("openPack", () => {
  it("팩마다 정해진 장수와 종류", () => {
    const state = newRun(3);
    expect(openPack(state, "arcana").pack.choices.every((c) => c.kind === "tarot")).toBe(true);
    expect(openPack(state, "celestial").pack.choices).toHaveLength(3);
    expect(openPack(state, "buffoon").pack.choices).toHaveLength(2);
  });

  it("스탠다드 팩 카드는 새 id를 받고, 번호가 늘어난다", () => {
    const state = newRun(3);
    const opened = openPack(state, "standard");
    const ids = opened.pack.choices.map((c) => (c.kind === "card" ? c.card.id : ""));
    expect(new Set(ids).size).toBe(3);
    expect(ids.every((id) => /-n\d+$/.test(id))).toBe(true);
    expect(opened.nextUid).toBe(state.nextUid + 3);
  });

  it("스탠다드 팩은 일정 비율로 강화 카드가 나온다", () => {
    let state = newRun(4);
    let enhanced = 0;
    let total = 0;
    for (let i = 0; i < 400; i++) {
      const opened = openPack(state, "standard");
      for (const choice of opened.pack.choices) {
        total++;
        if (choice.kind === "card" && choice.card.enhancement) enhanced++;
      }
      state = { ...state, rngState: opened.rngState, nextUid: opened.nextUid };
    }
    expect(enhanced / total).toBeGreaterThan(RULES.standardEnhanceChance * 0.8);
    expect(enhanced / total).toBeLessThan(RULES.standardEnhanceChance * 1.2);
  });
});

describe("팩 사고 고르기", () => {
  it("사면 돈이 줄고 팩을 연다. 쿠폰 가격 0이면 공짜", () => {
    const opened = apply(inShop(["celestial"]), { type: "buy_pack", slot: 0 });
    expect(opened).toMatchObject({ phase: "pack_open", money: 16 });
    expect(opened.shop?.packs[0]).toBeNull();
    expect(packPrice({ id: "arcana", price: 0 })).toBe(0);
  });

  it("돈이 모자라면 못 산다", () => {
    const poor = inShop(["arcana"], { money: 3 });
    expect(apply(poor, { type: "buy_pack", slot: 0 })).toBe(poor);
  });

  it("행성은 바로 레벨업, 카드는 덱에 추가, 고르면 상점으로", () => {
    const planet = pickFromPack(withPack({ id: "celestial", choices: [{ kind: "planet", id: "mercury" }] }), 0);
    expect(planet).toMatchObject({ phase: "shop", pack: null });
    expect(planet.handLevels.pair).toBe(2);

    const card = { id: "hearts-14-n9", rank: 14 as const, suit: "hearts" as const, enhancement: "glass" as const };
    const added = pickFromPack(withPack({ id: "standard", choices: [{ kind: "card", card }] }), 0);
    expect(added.deck).toHaveLength(53);
    expect(added.deck.at(-1)).toEqual(card);
  });

  it("소모품 칸이 차면 타로는 못 고르고, 건너뛰기는 언제든", () => {
    const full = withPack({ id: "arcana", choices: [{ kind: "tarot", id: "star" }] }, { consumables: ["sun", "moon"] });
    expect(canPick(full, 0)).toBe(false);
    expect(apply(full, { type: "pick_pack", index: 0 })).toBe(full);
    expect(apply(full, { type: "skip_pack" })).toMatchObject({ phase: "shop", pack: null });
  });

  it("팩을 연 동안에도 소모품을 팔아 칸을 비울 수 있다", () => {
    const full = withPack({ id: "arcana", choices: [{ kind: "tarot", id: "star" }] }, { consumables: ["sun", "moon"] });
    const sold = apply(full, { type: "sell_consumable", index: 0 });
    expect(apply(sold, { type: "pick_pack", index: 0 }).consumables).toEqual(["moon", "star"]);
  });

  it("망원경이 있으면 천체 팩 첫 장은 가장 많이 낸 족보의 행성", () => {
    const state = { ...newRun(3), vouchers: ["telescope"], handPlays: { pair: 2, flush: 5 } };
    expect(openPack(state, "celestial").pack.choices[0]).toEqual({ kind: "planet", id: "jupiter" });
    const never = { ...newRun(3), vouchers: ["telescope"], handPlays: {} };
    expect(openPack(never, "celestial").pack.choices).toEqual(openPack({ ...never, vouchers: [] }, "celestial").pack.choices);
  });

  it("광대 팩 조커는 에디션과 함께 조커 줄에 들어간다", () => {
    const picked = pickFromPack(withPack({ id: "buffoon", choices: [{ kind: "joker", id: "joker", edition: "foil" }] }), 0);
    expect(picked.jokers.at(-1)).toMatchObject({ defId: "joker", edition: "foil" });
  });
});
