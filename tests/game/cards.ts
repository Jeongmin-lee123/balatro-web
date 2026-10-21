// 테스트 공용 도구. "Ah Kd 5s" 같은 짧은 표기로 카드를 만든다 (T=10, J, Q, K, A / s h c d).
import type { Card, Enhancement, Seal, Suit } from "../../src/game/types";

const SUIT_CODES: Record<string, Suit> = { s: "spades", h: "hearts", c: "clubs", d: "diamonds" };
const RANK_CODES: Record<string, Card["rank"]> = { T: 10, J: 11, Q: 12, K: 13, A: 14 };

export function cards(text: string): Card[] {
  return text.split(" ").map((code) => {
    const rankCode = code.slice(0, -1);
    const suit = SUIT_CODES[code.slice(-1)] as Suit;
    const rank = RANK_CODES[rankCode] ?? (Number(rankCode) as Card["rank"]);
    return { id: `${suit}-${rank}`, rank, suit };
  });
}

export const ids = (list: readonly Card[]) => list.map((c) => c.id);

/** 카드 하나에 강화를 붙인다. 예: enhanced("Kh", "glass") */
export function enhanced(code: string, enhancement: Enhancement): Card {
  return { ...(cards(code)[0] as Card), enhancement };
}

/** 카드 하나에 봉인을 붙인다. 예: sealed("Kh", "red") */
export function sealed(code: string, seal: Seal, enhancement?: Enhancement): Card {
  return { ...(cards(code)[0] as Card), seal, ...(enhancement ? { enhancement } : {}) };
}
