// 바우처. 산 바우처를 반영한 규칙 값은 modifiers 하나에서만 계산한다.
// 손패 수, 핸드, 버리기, 상점 칸, 소모품 칸, 이자 상한 같은 값은 RULES를 직접 읽지 말고 이 함수를 거친다.
import { nextRandom } from "./rng";
import { RULES, VOUCHER_LIST, VOUCHERS } from "./rules";
import type { RunState, ShopItemKind, VoucherDef } from "./types";

export interface Modifiers {
  handSize: number;
  hands: number;
  discards: number;
  shopSlots: number;
  rerollBase: number;
  consumableSlots: number;
  interestCap: number;
  shopWeights: Record<ShopItemKind, number>;
  /** 조커 에디션 확률에 곱하는 값 */
  editionRate: number;
  /** 상점 가격 할인율 (0.25면 25%) */
  discount: number;
  /** 망원경: 천체 팩 첫 장이 가장 많이 낸 족보의 행성 */
  telescope: boolean;
}

export function voucherDef(id: string): VoucherDef {
  const voucher = VOUCHERS[id];
  if (!voucher) throw new Error(`없는 바우처: ${id}`);
  return voucher;
}

export function modifiers(vouchers: readonly string[]): Modifiers {
  const result: Modifiers = {
    handSize: RULES.handSize,
    hands: RULES.hands,
    discards: RULES.discards,
    shopSlots: RULES.shopSlots,
    rerollBase: RULES.rerollBase,
    consumableSlots: RULES.consumableSlots,
    interestCap: RULES.interestCap,
    shopWeights: { ...RULES.shopWeights },
    editionRate: 1,
    discount: 0,
    telescope: false,
  };
  for (const id of vouchers) {
    const { effect } = voucherDef(id);
    switch (effect.kind) {
      case "shop_slots":
        result.shopSlots += effect.amount;
        break;
      case "discount":
        result.discount = effect.percent / 100;
        break;
      case "edition_rate":
        result.editionRate *= effect.multiplier;
        break;
      case "reroll_discount":
        result.rerollBase = Math.max(0, result.rerollBase - effect.amount);
        break;
      case "consumable_slots":
        result.consumableSlots += effect.amount;
        break;
      case "hands":
        result.hands += effect.amount;
        break;
      case "discards":
        result.discards += effect.amount;
        break;
      case "shop_weight":
        result.shopWeights[effect.item] *= effect.multiplier;
        break;
      case "interest_cap":
        result.interestCap = Math.max(result.interestCap, effect.cap);
        break;
      case "hand_size":
        result.handSize += effect.amount;
        break;
      case "telescope":
        result.telescope = true;
        break;
    }
  }
  return result;
}

/** 할인을 적용한 가격. 원작처럼 절반은 내림으로 반올림한다. 0원(쿠폰)은 그대로 */
export function discounted(price: number, discount: number): number {
  if (price <= 0 || discount <= 0) return price;
  return Math.max(1, Math.ceil(price * (1 - discount) - 0.5));
}

/** 소모품 칸 수. 여러 곳에서 쓰여 따로 둔다 */
export function consumableSlots(state: Pick<RunState, "vouchers">): number {
  return modifiers(state.vouchers).consumableSlots;
}

/** 이번 앤티 상점에 낼 바우처. 아직 안 산 것 중 하나, 모두 샀으면 null */
export function pickVoucher(rngState: number, owned: readonly string[]): { voucher: string | null; rngState: number } {
  const pool = VOUCHER_LIST.filter((voucher) => !owned.includes(voucher.id));
  const [value, next] = nextRandom(rngState);
  const voucher = pool[Math.floor(value * pool.length)];
  return { voucher: voucher?.id ?? null, rngState: next };
}
