// 보스 블라인드. 효과는 data/bosses.json의 "종류 + 값"으로 정하고, 종류별 처리는 이 파일에 둔다.
import { nextRandom } from "./rng";
import { BOSS_LIST, BOSSES, RULES } from "./rules";
import type { BossDef, BossEffect, Card } from "./types";

export function bossDef(id: string): BossDef {
  const boss = BOSSES[id];
  if (!boss) throw new Error(`없는 보스: ${id}`);
  return boss;
}

/**
 * 이번 앤티의 보스를 고른다. 앤티 조건이 맞는 보스 중 아직 안 나온 보스에서 고르고,
 * 모두 나왔으면 다시 전체에서 고른다. 고른 보스는 seen에 더해 돌려준다.
 */
export function pickBoss(rngState: number, ante: number, seen: readonly string[]): { boss: string; seen: string[]; rngState: number } {
  const eligible = BOSS_LIST.filter((boss) => boss.minAnte <= ante);
  const fresh = eligible.filter((boss) => !seen.includes(boss.id));
  const pool = fresh.length > 0 ? fresh : eligible;
  const [value, next] = nextRandom(rngState);
  const boss = (pool[Math.floor(value * pool.length)] as BossDef).id;
  const restart = fresh.length === 0;
  return { boss, seen: restart ? [boss] : [...seen, boss], rngState: next };
}

/** 무효 카드는 족보 판정에는 들어가지만 칩을 더하지 않고, 카드에 반응하는 조커도 발동하지 않는다 */
export function isDebuffed(effect: BossEffect, card: Card): boolean {
  // 돌 카드는 숫자와 무늬가 없다. 와일드는 원래 무늬로 판정한다
  if (card.enhancement === "stone") return false;
  if (effect.kind === "debuff_suit") return card.suit === effect.suit;
  if (effect.kind === "debuff_face") return card.rank >= 11 && card.rank <= 13;
  return false;
}

/** 라운드 시작 때의 핸드, 버리기 횟수 */
export function roundLimits(effect: BossEffect | null): { hands: number; discards: number } {
  return {
    hands: effect?.kind === "hands" ? effect.count : RULES.hands,
    discards: effect?.kind === "discards" ? effect.count : RULES.discards,
  };
}

/** 낼 수 있는 장수인지. 점쟁이는 정해진 장수만 낼 수 있다 */
export function canPlayCount(effect: BossEffect | null, count: number): boolean {
  if (count === 0) return false;
  return effect?.kind === "must_play" ? count === effect.count : true;
}
