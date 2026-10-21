import { beforeEach, describe, expect, it } from "vitest";
import { apply, newRun } from "../../src/game/run";
import { clearSavedRun, loadSavedRun, SAVE_VERSION, storeRun } from "../../src/storage/savedRun";

/** vitest는 node 환경이라 localStorage가 없다. 같은 동작을 하는 대역을 넣는다 */
function installStorage(): Map<string, string> {
  const data = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
  };
  return data;
}

describe("savedRun", () => {
  let data: Map<string, string>;
  beforeEach(() => {
    data = installStorage();
  });

  it("저장한 판을 그대로 불러온다", () => {
    const state = apply(newRun(9), { type: "toggle_card", cardId: newRun(9).round.hand[0]!.id });
    storeRun(state);
    expect(loadSavedRun()).toEqual(state);
  });

  it("저장이 없으면 null, 지우면 null", () => {
    expect(loadSavedRun()).toBeNull();
    storeRun(newRun(1));
    clearSavedRun();
    expect(loadSavedRun()).toBeNull();
  });

  it("버전이 다르거나 모양이 깨진 저장은 버린다", () => {
    data.set("balatro-web/run", JSON.stringify({ version: SAVE_VERSION + 1, state: newRun(1) }));
    expect(loadSavedRun()).toBeNull();
    data.set("balatro-web/run", JSON.stringify({ version: SAVE_VERSION, state: { ante: "x" } }));
    expect(loadSavedRun()).toBeNull();
    data.set("balatro-web/run", "{not json");
    expect(loadSavedRun()).toBeNull();
  });

  it("저장소가 막혀 있어도 오류를 내지 않는다", () => {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(() => storeRun(newRun(1))).not.toThrow();
    expect(loadSavedRun()).toBeNull();
    expect(() => clearSavedRun()).not.toThrow();
  });
});
