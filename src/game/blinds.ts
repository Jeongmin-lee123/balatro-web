import { ANTE_COUNT, BLINDS } from "./rules";
import type { BlindIndex } from "./types";

function blindInfo(blindIndex: BlindIndex) {
  const info = BLINDS.blinds[blindIndex];
  if (!info) throw new Error(`없는 블라인드: ${blindIndex}`);
  return info;
}

export function blindName(blindIndex: BlindIndex): string {
  return blindInfo(blindIndex).name;
}

export function targetScore(ante: number, blindIndex: BlindIndex): number {
  const base = BLINDS.anteBase[ante - 1];
  if (base === undefined) throw new Error(`없는 앤티: ${ante}`);
  return Math.floor(base * blindInfo(blindIndex).multiplier);
}

/** 스몰 -> 빅 -> 보스 -> 다음 앤티 스몰 */
export function nextBlind(ante: number, blindIndex: BlindIndex): { ante: number; blindIndex: BlindIndex } {
  return blindIndex === 2 ? { ante: ante + 1, blindIndex: 0 } : { ante, blindIndex: (blindIndex + 1) as BlindIndex };
}

/** 마지막 앤티의 보스는 보상이 따로 정해져 있다 */
export function blindReward(ante: number, blindIndex: BlindIndex): number {
  if (blindIndex === 2 && ante === ANTE_COUNT) return BLINDS.finalBossReward;
  return blindInfo(blindIndex).reward;
}
