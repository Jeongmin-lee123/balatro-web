// 진행 중인 판 저장. RunState는 함수가 없는 순수 데이터라 JSON으로 그대로 저장한다.
import type { RunState } from "../game/types";

const STORAGE_KEY = "balatro-web/run";

/** RunState 모양을 바꾸면 올린다. 버전이 다른 저장은 버린다 */
export const SAVE_VERSION = 3;

interface SaveFile {
  version: number;
  state: RunState;
}

/** 버전이 맞아도 손으로 고친 값이나 깨진 값일 수 있으니 꼭 필요한 모양만 확인한다 */
function looksLikeRun(value: unknown): value is RunState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Partial<RunState>;
  return (
    typeof state.ante === "number" &&
    typeof state.phase === "string" &&
    typeof state.boss === "string" &&
    typeof state.handLevels === "object" &&
    Array.isArray(state.jokers) &&
    Array.isArray(state.deck) &&
    Array.isArray(state.consumables) &&
    Array.isArray(state.round?.hand)
  );
}

export function loadSavedRun(): RunState | null {
  try {
    const file = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<SaveFile> | null;
    if (!file || file.version !== SAVE_VERSION || !looksLikeRun(file.state)) return null;
    return file.state;
  } catch {
    return null;
  }
}

export function storeRun(state: RunState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, state } satisfies SaveFile));
  } catch {
    // 저장하지 못해도 지금 판은 계속한다
  }
}

export function clearSavedRun(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 지울 수 없으면 다음에 불러올 때 끝난 판으로 판정해 새 판을 연다
  }
}
