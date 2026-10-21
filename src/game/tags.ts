// 태그. 블라인드를 건너뛰면 받는다. 즉시 돈을 주는 태그와, 보관했다가 정해진 때 발동하는 태그가 있다.
import { nextRandom } from "./rng";
import { TAG_LIST, TAGS } from "./rules";
import type { RunState, TagDef, TagEffect } from "./types";

export function tagDef(id: string): TagDef {
  const tag = TAGS[id];
  if (!tag) throw new Error(`없는 태그: ${id}`);
  return tag;
}

/** 이번 앤티의 스몰, 빅 블라인드에 붙일 태그를 하나씩 고른다 (같은 태그가 둘 다 나올 수 있다) */
export function pickBlindTags(rngState: number, ante: number): { tags: string[]; rngState: number } {
  const pool = TAG_LIST.filter((tag) => tag.minAnte <= ante);
  const tags: string[] = [];
  let state = rngState;
  for (let i = 0; i < 2; i++) {
    const [value, next] = nextRandom(state);
    tags.push((pool[Math.floor(value * pool.length)] as TagDef).id);
    state = next;
  }
  return { tags, rngState: state };
}

/**
 * 받는 즉시 돈을 주는 태그의 금액. 보관하는 태그면 null.
 * stats.skips에는 이번 건너뛰기가 이미 더해져 있어야 한다.
 */
export function instantMoney(effect: TagEffect, state: Pick<RunState, "money" | "stats">): number | null {
  switch (effect.kind) {
    case "double_money":
      return Math.min(Math.max(state.money, 0), effect.max);
    case "money_per_hand":
      return effect.amount * state.stats.handsPlayed;
    case "money_per_unused_discard":
      return effect.amount * state.stats.unusedDiscards;
    case "money_per_skip":
      return effect.amount * state.stats.skips;
    case "boss_bonus":
    case "free_shop":
    case "free_reroll":
    case "hand_size":
      return null;
  }
}

/** 보관 중인 태그 중 kind가 맞는 것을 모두 꺼낸다. 꺼낸 태그와 남은 태그를 돌려준다 */
export function takeTags(held: readonly string[], kind: TagEffect["kind"]): { taken: TagDef[]; rest: string[] } {
  const taken = held.map(tagDef).filter((tag) => tag.effect.kind === kind);
  return { taken, rest: held.filter((id) => tagDef(id).effect.kind !== kind) };
}
