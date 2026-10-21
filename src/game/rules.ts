// data/*.json을 읽어 타입을 붙여 내보낸다. 게임 코드에서 JSON을 직접 import하는 곳은 여기뿐이다.
import handsJson from "../../data/hands.json";
import blindsJson from "../../data/blinds.json";
import rulesJson from "../../data/rules.json";
import jokersJson from "../../data/jokers.json";
import planetsJson from "../../data/planets.json";
import bossesJson from "../../data/bosses.json";
import tagsJson from "../../data/tags.json";
import tarotsJson from "../../data/tarots.json";
import editionsJson from "../../data/editions.json";
import packsJson from "../../data/packs.json";
import type { BossDef, EditionDef, EditionId, HandType, JokerDef, PackDef, PlanetDef, ShopItemKind, TagDef, TarotDef } from "./types";

export interface HandInfo {
  name: string;
  chips: number;
  mult: number;
  levelChips: number;
  levelMult: number;
}

export interface BlindInfo {
  name: string;
  multiplier: number;
  reward: number;
}

export const HANDS: Record<HandType, HandInfo> = handsJson;

export const BLINDS: { anteBase: number[]; blinds: BlindInfo[]; finalBossReward: number } = blindsJson;

export const RULES: Omit<typeof rulesJson, "shopWeights"> & { shopWeights: Record<ShopItemKind, number> } = rulesJson;

const jokerList = jokersJson as JokerDef[];

export const JOKERS: Record<string, JokerDef> = Object.fromEntries(jokerList.map((joker) => [joker.id, joker]));

/** 상점 진열 순서를 고정하기 위해 data/jokers.json 순서를 그대로 쓴다 */
export const JOKER_IDS: string[] = jokerList.map((joker) => joker.id);

const planetList = planetsJson as PlanetDef[];

export const PLANETS: Record<string, PlanetDef> = Object.fromEntries(planetList.map((planet) => [planet.id, planet]));

export const PLANET_IDS: string[] = planetList.map((planet) => planet.id);

const tarotList = tarotsJson as TarotDef[];

export const TAROTS: Record<string, TarotDef> = Object.fromEntries(tarotList.map((tarot) => [tarot.id, tarot]));

export const TAROT_IDS: string[] = tarotList.map((tarot) => tarot.id);

/** data/bosses.json 순서 그대로. 보스 고르기의 후보 순서가 바뀌지 않게 한다 */
export const BOSS_LIST = bossesJson as BossDef[];

export const BOSSES: Record<string, BossDef> = Object.fromEntries(BOSS_LIST.map((boss) => [boss.id, boss]));

/** data/tags.json 순서 그대로 */
export const TAG_LIST = tagsJson as TagDef[];

export const TAGS: Record<string, TagDef> = Object.fromEntries(TAG_LIST.map((tag) => [tag.id, tag]));

/** data/editions.json 순서 그대로. 상점 확률은 이 순서로 구간을 나눈다 */
export const EDITION_LIST = editionsJson as EditionDef[];

export const EDITIONS = Object.fromEntries(EDITION_LIST.map((edition) => [edition.id, edition])) as Record<EditionId, EditionDef>;

/** data/packs.json 순서 그대로. 팩 진열 비율은 weight */
export const PACK_LIST = packsJson as PackDef[];

export const PACKS: Record<string, PackDef> = Object.fromEntries(PACK_LIST.map((pack) => [pack.id, pack]));

export const ANTE_COUNT = BLINDS.anteBase.length;

export const HAND_TYPES = Object.keys(HANDS) as HandType[];
