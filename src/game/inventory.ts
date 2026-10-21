// 판 상태에 물건을 더하는 공용 함수. 상점, 타로, 부스터 팩이 같은 규칙으로 조커와 행성을 받게 한다.
import { jokerSlots } from "./editions";
import { PLANETS } from "./rules";
import type { EditionId, HandLevels, RunState } from "./types";

/** 조커를 받을 칸이 있는지. 네거티브 조커는 칸을 하나 더 만들어 주므로 칸이 차 있어도 받을 수 있다 */
export function hasJokerRoom(state: Pick<RunState, "jokers">, edition?: EditionId): boolean {
  return edition === "negative" || state.jokers.length < jokerSlots(state.jokers);
}

/** 조커를 조커 줄 끝에 더한다. paid는 판매가 계산에 쓴다 */
export function addJoker(state: RunState, defId: string, paid: number, edition?: EditionId): RunState {
  const joker = { uid: `j${state.nextUid}`, defId, paid, ...(edition ? { edition } : {}) };
  return { ...state, jokers: [...state.jokers, joker], nextUid: state.nextUid + 1 };
}

/** 행성 카드를 쓴다: 그 행성의 족보 레벨 +1 (design.md D-010) */
export function usePlanet(levels: HandLevels, planetId: string): HandLevels {
  const planet = PLANETS[planetId];
  if (!planet) throw new Error(`없는 행성: ${planetId}`);
  return { ...levels, [planet.hand]: levels[planet.hand] + 1 };
}
