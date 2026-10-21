// 역대 기록. 브라우저 저장소가 막혀 있어도(사생활 보호 모드 등) 게임은 그대로 돌아가야 한다.
import type { RunState } from "../game/types";

export interface Records {
  bestAnte: number;
  bestHand: number;
  runs: number;
  wins: number;
}

const STORAGE_KEY = "balatro-web/records/v1";

const EMPTY: Records = { bestAnte: 0, bestHand: 0, runs: 0, wins: 0 };

export function loadRecords(): Records {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Records> | null;
    return { ...EMPTY, ...saved };
  } catch {
    return { ...EMPTY };
  }
}

/** 끝난 판 하나를 기록에 더하고, 더한 결과를 돌려준다 */
export function saveRun(state: RunState, previous: Records = loadRecords()): Records {
  const next: Records = {
    bestAnte: Math.max(previous.bestAnte, state.ante),
    bestHand: Math.max(previous.bestHand, state.stats.bestHand),
    runs: previous.runs + 1,
    wins: previous.wins + (state.phase === "won" ? 1 : 0),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장하지 못해도 이번 화면에는 계산한 기록을 보여 준다
  }
  return next;
}
