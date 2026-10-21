import { nextRandom } from "./rng";
import { JOKER_IDS, JOKERS, PLANET_IDS, PLANETS, RULES } from "./rules";
import type { ShopItemKind, ShopOffer } from "./types";

const ITEM_IDS: Record<ShopItemKind, string[]> = { joker: JOKER_IDS, planet: PLANET_IDS };

/** rules.json의 shopWeights 비율로 종류를 고른 뒤, 그 종류 안에서 고르게 하나를 고른다 */
function rollOne(rngState: number): [ShopOffer, number] {
  const weights = Object.entries(RULES.shopWeights) as [ShopItemKind, number][];
  const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
  const [kindRoll, afterKind] = nextRandom(rngState);
  let threshold = kindRoll * total;
  const kind = weights.find(([, weight]) => (threshold -= weight) < 0)?.[0] ?? "joker";

  const ids = ITEM_IDS[kind];
  const [idRoll, afterId] = nextRandom(afterKind);
  return [{ kind, id: ids[Math.floor(idRoll * ids.length)] as string }, afterId];
}

/** 진열 count칸을 고른다. 이미 가진 조커도 나올 수 있다 */
export function rollOffers(rngState: number, count: number): [ShopOffer[], number] {
  const offers: ShopOffer[] = [];
  let state = rngState;
  for (let i = 0; i < count; i++) {
    const [offer, next] = rollOne(state);
    offers.push(offer);
    state = next;
  }
  return [offers, state];
}

export function offerPrice(offer: ShopOffer): number {
  const def = offer.kind === "joker" ? JOKERS[offer.id] : PLANETS[offer.id];
  if (!def) throw new Error(`없는 상품: ${offer.kind} ${offer.id}`);
  return def.price;
}

/** 산 값의 절반을 내림, 최소 $1 */
export function sellValue(paid: number): number {
  return Math.max(1, Math.floor(paid / 2));
}
