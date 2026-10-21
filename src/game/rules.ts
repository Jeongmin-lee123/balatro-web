// data/*.json을 읽어 타입을 붙여 내보낸다. 게임 코드에서 JSON을 직접 import하는 곳은 여기뿐이다.
import handsJson from "../../data/hands.json";
import blindsJson from "../../data/blinds.json";
import rulesJson from "../../data/rules.json";
import jokersJson from "../../data/jokers.json";
import type { HandType, JokerDef } from "./types";

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

export const RULES = rulesJson;

const jokerList = jokersJson as JokerDef[];

export const JOKERS: Record<string, JokerDef> = Object.fromEntries(jokerList.map((joker) => [joker.id, joker]));

/** 상점 진열 순서를 고정하기 위해 data/jokers.json 순서를 그대로 쓴다 */
export const JOKER_IDS: string[] = jokerList.map((joker) => joker.id);

export const ANTE_COUNT = BLINDS.anteBase.length;
