import { describe, expect, it } from "vitest";
import { jokerSlots, rollJokerEdition } from "../../src/game/editions";
import { EDITION_LIST, JOKERS, RULES } from "../../src/game/rules";
import { scoreHand } from "../../src/game/scoring";
import { offerPrice, rollOffers } from "../../src/game/shop";
import type { JokerDef } from "../../src/game/types";
import { cards } from "./cards";

describe("rollJokerEdition", () => {
  it("에디션별 확률이 data/editions.json 근처로 나온다", () => {
    const counts = new Map<string, number>();
    let rng = 1;
    const total = 200000;
    for (let i = 0; i < total; i++) {
      const [edition, next] = rollJokerEdition(rng);
      rng = next;
      if (edition) counts.set(edition, (counts.get(edition) ?? 0) + 1);
    }
    for (const edition of EDITION_LIST) {
      const rate = (counts.get(edition.id) ?? 0) / total;
      expect(rate).toBeGreaterThan(edition.chance * 0.8);
      expect(rate).toBeLessThan(edition.chance * 1.2);
    }
  });

  it("상점 조커에만 에디션이 붙는다", () => {
    const [offers] = rollOffers(3, 3000);
    expect(offers.some((o) => o.kind === "joker" && o.edition)).toBe(true);
    expect(offers.some((o) => o.kind !== "joker" && o.edition)).toBe(false);
  });
});

describe("가격과 칸", () => {
  it("에디션 가격을 더한다: 폴리크롬 조커($2)는 $7", () => {
    expect(offerPrice({ kind: "joker", id: "joker", edition: "polychrome" })).toBe(7);
  });

  it("네거티브 조커마다 칸이 하나 는다", () => {
    const plain = { uid: "a", defId: "joker", paid: 2 };
    expect(jokerSlots([plain])).toBe(RULES.jokerSlots);
    expect(jokerSlots([plain, { ...plain, uid: "b", edition: "negative" as const }])).toBe(RULES.jokerSlots + 1);
  });
});

describe("조커 에디션 점수 순서", () => {
  const joker = [JOKERS.joker as JokerDef];

  it("호일 +50칩, 홀로그래픽 +10배수", () => {
    expect(scoreHand(cards("Kh Kc"), joker, undefined, { jokerEditions: ["foil"] })).toMatchObject({ chips: 80, mult: 6 });
    expect(scoreHand(cards("Kh Kc"), joker, undefined, { jokerEditions: ["holographic"] })).toMatchObject({ chips: 30, mult: 16 });
  });

  it("폴리크롬은 그 조커 효과까지 더한 뒤 곱한다: (2 + 4) x 1.5", () => {
    expect(scoreHand(cards("Kh Kc"), joker, undefined, { jokerEditions: ["polychrome"] }).mult).toBe(9);
  });
});
