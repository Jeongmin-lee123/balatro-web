// 시드 난수 (mulberry32). 상태값을 RunState에 넣어 두면 같은 시드와 행동으로 같은 판이 나온다.

/** 0 이상 1 미만의 값과 다음 상태를 돌려준다 */
export function nextRandom(state: number): [number, number] {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = Math.imul(next ^ (next >>> 15), next | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** 원본을 바꾸지 않고 섞은 새 배열을 돌려준다 (Fisher-Yates) */
export function shuffle<T>(items: readonly T[], state: number): [T[], number] {
  const result = [...items];
  let current = state;
  for (let i = result.length - 1; i > 0; i--) {
    const [value, next] = nextRandom(current);
    current = next;
    const j = Math.floor(value * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return [result, current];
}
