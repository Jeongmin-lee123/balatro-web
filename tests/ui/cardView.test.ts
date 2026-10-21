import { describe, expect, it } from "vitest";
import { createDeck } from "../../src/game/deck";
import { cardSvg } from "../../src/ui/cardView";
import { facePortrait, hasFace } from "../../src/ui/faceArt";
import { cards } from "../game/cards";

describe("cardSvg", () => {
  it("52장 모두 그린다", () => {
    for (const card of createDeck()) expect(cardSvg(card)).toMatch(/^<svg[\s\S]*<\/svg>$/);
  });

  it("무늬를 유니코드 기호 문자로 쓰지 않는다", () => {
    for (const card of createDeck()) expect(cardSvg(card)).not.toMatch(/[♠-♧]/);
  });

  it("숫자 카드는 숫자만큼 무늬를 그린다 (귀퉁이 2개 제외)", () => {
    const [seven] = cards("7c");
    const icons = cardSvg(seven!).match(/viewBox="0 0 100 100"/g) ?? [];
    expect(icons).toHaveLength(7 + 2);
  });

  it("그림 카드는 도트 초상화를 넣는다", () => {
    const [king] = cards("Kh");
    expect(cardSvg(king!)).toContain('shape-rendering="crispEdges"');
  });

  it("읽을 수 있는 이름을 붙인다", () => {
    const [queen] = cards("Qs");
    expect(cardSvg(queen!)).toContain('aria-label="Q 스페이드"');
  });
});

describe("facePortrait", () => {
  it("J, Q, K만 얼굴이 있다", () => {
    expect([10, 11, 12, 13, 14].map((r) => hasFace(r as 10))).toEqual([false, true, true, true, false]);
  });

  it("빨간 무늬와 검은 무늬는 옷 색이 다르다", () => {
    expect(facePortrait(13, "hearts")).not.toEqual(facePortrait(13, "spades"));
    expect(facePortrait(13, "hearts")).toEqual(facePortrait(13, "diamonds"));
  });

  it("격자의 모든 글자에 색이 있다", () => {
    for (const rank of [11, 12, 13] as const) expect(facePortrait(rank, "clubs")).not.toContain("undefined");
  });
});
