// 부스터 팩. 상점에서 사서 열면 몇 장 중 1장을 고른다. (design.md D-017)
import { SUITS } from "./deck";
import { editionFromRoll } from "./editions";
import { addJoker, hasJokerRoom, usePlanet } from "./inventory";
import { nextRandom } from "./rng";
import { JOKER_IDS, JOKERS, PACK_LIST, PACKS, PLANET_IDS, RULES, TAROT_IDS } from "./rules";
import type { Card, Enhancement, OpenPack, PackChoice, PackDef, PackOffer, Rank, RunState, Seal } from "./types";

const ENHANCEMENTS: readonly Enhancement[] = ["bonus", "mult", "wild", "glass", "steel", "stone", "gold", "lucky"];
const RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const SEALS: readonly Seal[] = ["red", "blue", "gold", "purple"];

export function packDef(id: string): PackDef {
  const pack = PACKS[id];
  if (!pack) throw new Error(`없는 팩: ${id}`);
  return pack;
}

export function packPrice(offer: PackOffer): number {
  return offer.price ?? packDef(offer.id).price;
}

/** 0 이상 1 미만의 난수를 차례로 꺼내는 함수와, 다 쓴 뒤의 상태를 읽는 함수 */
function randomSource(rngState: number): { next: () => number; state: () => number } {
  let current = rngState;
  return {
    next: () => {
      const [value, after] = nextRandom(current);
      current = after;
      return value;
    },
    state: () => current,
  };
}

function pickFrom<T>(items: readonly T[], value: number): T {
  return items[Math.floor(value * items.length)] as T;
}

/** 상점 팩 칸 count개를 weight 비율로 고른다 */
export function rollPacks(rngState: number, count: number): [PackOffer[], number] {
  const random = randomSource(rngState);
  const total = PACK_LIST.reduce((sum, pack) => sum + pack.weight, 0);
  const offers = Array.from({ length: count }, () => {
    let threshold = random.next() * total;
    const pack = PACK_LIST.find((candidate) => (threshold -= candidate.weight) < 0) ?? (PACK_LIST[0] as PackDef);
    return { id: pack.id };
  });
  return [offers, random.state()];
}

/** 스탠다드 팩의 카드 한 장: 무늬와 숫자는 무작위, 일정 확률로 강화와 봉인 */
function standardCard(random: () => number, serial: number): Card {
  const suit = pickFrom(SUITS, random());
  const rank = pickFrom(RANKS, random());
  const enhancement = random() < RULES.standardEnhanceChance ? pickFrom(ENHANCEMENTS, random()) : undefined;
  const seal = random() < RULES.standardSealChance ? pickFrom(SEALS, random()) : undefined;
  return { id: `${suit}-${rank}-n${serial}`, rank, suit, ...(enhancement ? { enhancement } : {}), ...(seal ? { seal } : {}) };
}

/** 팩을 연다. 카드 id에 쓰는 번호(nextUid)도 함께 돌려준다 */
export function openPack(state: RunState, packId: string): { pack: OpenPack; rngState: number; nextUid: number } {
  const def = packDef(packId);
  const random = randomSource(state.rngState);
  let nextUid = state.nextUid;
  const choices: PackChoice[] = Array.from({ length: def.choices }, () => {
    switch (def.content) {
      case "tarot":
        return { kind: "tarot", id: pickFrom(TAROT_IDS, random.next()) };
      case "planet":
        return { kind: "planet", id: pickFrom(PLANET_IDS, random.next()) };
      case "joker": {
        const id = pickFrom(JOKER_IDS, random.next());
        const edition = editionFromRoll(random.next());
        return edition ? { kind: "joker", id, edition } : { kind: "joker", id };
      }
      case "card":
        return { kind: "card", card: standardCard(random.next, nextUid++) };
    }
  });
  return { pack: { id: packId, choices }, rngState: random.state(), nextUid };
}

export function canPick(state: RunState, index: number): boolean {
  const choice = state.pack?.choices[index];
  if (!choice) return false;
  if (choice.kind === "tarot") return state.consumables.length < RULES.consumableSlots;
  if (choice.kind === "joker") return hasJokerRoom(state, choice.edition);
  return true;
}

/** 고른 것을 받고 팩을 닫는다 */
export function pickFromPack(state: RunState, index: number): RunState {
  const choice = state.pack?.choices[index];
  if (!choice || !canPick(state, index)) return state;
  const closed: RunState = { ...state, phase: "shop", pack: null };
  switch (choice.kind) {
    case "tarot":
      return { ...closed, consumables: [...state.consumables, choice.id] };
    case "planet":
      return { ...closed, handLevels: usePlanet(state.handLevels, choice.id) };
    case "card":
      return { ...closed, deck: [...state.deck, choice.card] };
    case "joker": {
      const def = JOKERS[choice.id];
      return def ? addJoker(closed, def.id, def.price, choice.edition) : closed;
    }
  }
}
