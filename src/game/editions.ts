// 에디션. 지금은 조커에만 붙는다. 효과 종류별 처리는 이 파일에 둔다.
import { nextRandom } from "./rng";
import { EDITION_LIST, EDITIONS, RULES } from "./rules";
import type { EditionDef, EditionId, OwnedJoker, ScoreStep } from "./types";

export function editionDef(id: EditionId): EditionDef {
  return EDITIONS[id];
}

/** 0 이상 1 미만의 값 하나로 에디션을 정한다. data/editions.json 순서대로 확률 구간을 나눈다 */
export function editionFromRoll(value: number): EditionId | undefined {
  let threshold = value;
  for (const edition of EDITION_LIST) {
    threshold -= edition.chance;
    if (threshold < 0) return edition.id;
  }
  return undefined;
}

/** 상점 조커 하나에 붙을 에디션 */
export function rollJokerEdition(rngState: number): [EditionId | undefined, number] {
  const [value, next] = nextRandom(rngState);
  return [editionFromRoll(value), next];
}

/** 조커 칸 = 기본 칸 + 네거티브 조커 수 */
export function jokerSlots(jokers: readonly OwnedJoker[]): number {
  return RULES.jokerSlots + jokers.filter((joker) => joker.edition && editionDef(joker.edition).effect.kind === "slot").length;
}

/** 조커 효과 전에 더하는 에디션(호일, 홀로그래픽) */
export function editionBefore(id: EditionId | undefined, source: string): ScoreStep | null {
  if (!id) return null;
  const { effect, name } = editionDef(id);
  if (effect.kind === "chips") return { source, chips: effect.chips, mult: 0, note: name };
  if (effect.kind === "mult") return { source, chips: 0, mult: effect.mult, note: name };
  return null;
}

/** 조커 효과 뒤에 곱하는 에디션(폴리크롬) */
export function editionAfter(id: EditionId | undefined, source: string): ScoreStep | null {
  if (!id) return null;
  const { effect, name } = editionDef(id);
  return effect.kind === "x_mult" ? { source, chips: 0, mult: 0, xMult: effect.xMult, note: name } : null;
}
