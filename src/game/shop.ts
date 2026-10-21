import { editionDef, rollJokerEdition } from "./editions";
import { nextRandom } from "./rng";
import { JOKER_IDS, JOKERS, PLANET_IDS, PLANETS, RULES, TAROT_IDS, TAROTS } from "./rules";
import type { RunState, ShopItemKind, ShopOffer } from "./types";
import { discounted, modifiers } from "./vouchers";

const ITEM_IDS: Record<ShopItemKind, string[]> = { joker: JOKER_IDS, tarot: TAROT_IDS, planet: PLANET_IDS };

const ITEMS = { joker: JOKERS, tarot: TAROTS, planet: PLANETS };

export interface ShopRolls {
  shopWeights: Record<ShopItemKind, number>;
  editionRate: number;
}

const DEFAULT_ROLLS: ShopRolls = { shopWeights: RULES.shopWeights, editionRate: 1 };

/** shopWeights 비율로 종류를 고른 뒤, 그 종류 안에서 고르게 하나를 고른다 */
function rollOne(rngState: number, rolls: ShopRolls): [ShopOffer, number] {
  const weights = Object.entries(rolls.shopWeights) as [ShopItemKind, number][];
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  const [kindRoll, afterKind] = nextRandom(rngState);
  let threshold = kindRoll * total;
  const kind = weights.find(([, weight]) => (threshold -= weight) < 0)?.[0] ?? "joker";

  const ids = ITEM_IDS[kind];
  const [idRoll, afterId] = nextRandom(afterKind);
  const id = ids[Math.floor(idRoll * ids.length)] as string;
  if (kind !== "joker") return [{ kind, id }, afterId];
  const [edition, afterEdition] = rollJokerEdition(afterId, rolls.editionRate);
  return [edition ? { kind, id, edition } : { kind, id }, afterEdition];
}

/** 진열 count칸을 고른다. 이미 가진 조커도 나올 수 있다. rolls는 바우처를 반영한 비율 */
export function rollOffers(rngState: number, count: number, rolls: ShopRolls = DEFAULT_ROLLS): [ShopOffer[], number] {
  const offers: ShopOffer[] = [];
  let state = rngState;
  for (let i = 0; i < count; i++) {
    const [offer, next] = rollOne(state, rolls);
    offers.push(offer);
    state = next;
  }
  return [offers, state];
}

export function offerPrice(offer: ShopOffer): number {
  if (offer.price !== undefined) return offer.price;
  const def = ITEMS[offer.kind][offer.id];
  if (!def) throw new Error(`없는 상품: ${offer.kind} ${offer.id}`);
  return def.price + (offer.edition ? editionDef(offer.edition).price : 0);
}

/** 바우처 할인까지 적용한 상점 가격 */
export function itemCost(state: Pick<RunState, "vouchers">, offer: ShopOffer): number {
  return discounted(offerPrice(offer), modifiers(state.vouchers).discount);
}

/** 산 값의 절반을 내림, 최소 $1 */
export function sellValue(paid: number): number {
  return Math.max(1, Math.floor(paid / 2));
}
