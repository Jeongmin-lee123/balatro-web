import { nextRandom } from "./rng";
import { JOKER_IDS } from "./rules";

/** 조커 목록에서 무작위로 count장을 고른다. 이미 가진 조커도 나올 수 있다 */
export function rollOffers(rngState: number, count: number): [string[], number] {
  const offers: string[] = [];
  let state = rngState;
  for (let i = 0; i < count; i++) {
    const [value, next] = nextRandom(state);
    state = next;
    offers.push(JOKER_IDS[Math.floor(value * JOKER_IDS.length)] as string);
  }
  return [offers, state];
}

/** 산 값의 절반을 내림, 최소 $1 */
export function sellValue(paid: number): number {
  return Math.max(1, Math.floor(paid / 2));
}
