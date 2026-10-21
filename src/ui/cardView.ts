// 트럼프 카드 SVG. 무늬는 SVG 경로로 그린다. 유니코드 무늬 기호는 기기에 따라 이모지로 바뀌어 보인다.
import { cardLabel, rankLabel } from "../game/deck";
import { editionDef } from "../game/editions";
import type { Card, EditionId, Enhancement, Rank, Seal, Suit } from "../game/types";
import { facePortrait, hasFace } from "./faceArt";

const SUIT_SHAPES: Record<Suit, string> = {
  spades:
    '<path d="M50 6 C80 30 96 46 96 62 C96 76 85 84 73 84 C64 84 56 79 53 72 C54 82 58 90 66 96 L34 96 C42 90 46 82 47 72 C44 79 36 84 27 84 C15 84 4 76 4 62 C4 46 20 30 50 6 Z"/>',
  hearts:
    '<path d="M50 90 C20 66 4 50 4 31 C4 16 15 6 28 6 C38 6 46 12 50 21 C54 12 62 6 72 6 C85 6 96 16 96 31 C96 50 80 66 50 90 Z"/>',
  diamonds: '<path d="M50 4 L86 50 L50 96 L14 50 Z"/>',
  clubs:
    '<circle cx="50" cy="28" r="21"/><circle cx="27" cy="57" r="21"/><circle cx="73" cy="57" r="21"/><path d="M45 50 L55 50 C55 74 59 86 68 96 L32 96 C41 86 45 74 45 50 Z"/>',
};

// 카드 판(100 x 140) 위의 무늬 자리. 아래 절반(y > 70)은 거꾸로 그린다.
const L = 30;
const C = 50;
const R = 70;
const PIPS: Partial<Record<Rank, [number, number][]>> = {
  2: [[C, 28], [C, 112]],
  3: [[C, 28], [C, 70], [C, 112]],
  4: [[L, 28], [R, 28], [L, 112], [R, 112]],
  5: [[L, 28], [R, 28], [C, 70], [L, 112], [R, 112]],
  6: [[L, 28], [R, 28], [L, 70], [R, 70], [L, 112], [R, 112]],
  7: [[L, 28], [R, 28], [C, 49], [L, 70], [R, 70], [L, 112], [R, 112]],
  8: [[L, 28], [R, 28], [C, 49], [L, 70], [R, 70], [C, 91], [L, 112], [R, 112]],
  9: [[L, 28], [R, 28], [L, 56], [R, 56], [C, 70], [L, 84], [R, 84], [L, 112], [R, 112]],
  10: [[L, 28], [R, 28], [C, 42], [L, 56], [R, 56], [L, 84], [R, 84], [C, 98], [L, 112], [R, 112]],
};

function suitColor(suit: Suit): string {
  return suit === "hearts" || suit === "diamonds" ? "var(--suit-red)" : "var(--suit-black)";
}

/** (x, y)를 중심으로 size 크기의 무늬 하나 */
export function suitIcon(suit: Suit, x: number, y: number, size: number, flip = false): string {
  const turn = flip ? ' transform="rotate(180 50 50)"' : "";
  return (
    `<svg x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" viewBox="0 0 100 100">` +
    `<g${turn} fill="${suitColor(suit)}">${SUIT_SHAPES[suit]}</g></svg>`
  );
}

function cardCenter(card: Card): string {
  if (card.rank === 14) return suitIcon(card.suit, 50, 70, 44);
  if (hasFace(card.rank)) {
    return (
      `<rect x="21" y="25" width="58" height="90" fill="none" stroke="${suitColor(card.suit)}" stroke-width="2"/>` +
      facePortrait(card.rank, card.suit, 'x="22" y="26" width="56" height="88"')
    );
  }
  return (PIPS[card.rank] ?? []).map(([x, y]) => suitIcon(card.suit, x, y, 17, y > 70)).join("");
}

function cardCorner(card: Card): string {
  const label = rankLabel(card.rank);
  return (
    `<text x="10" y="19" text-anchor="middle" font-family="Galmuri11, monospace" font-weight="700" ` +
    `font-size="${label.length > 1 ? 12 : 16}" fill="${suitColor(card.suit)}">${label}</text>` +
    suitIcon(card.suit, 10, 28, 10)
  );
}

/** 강화 카드의 바탕색과 아래쪽에 적는 짧은 표시. 색은 tokens.css의 --enh-* 변수 */
const ENHANCEMENT_LOOK: Record<Enhancement, { fill: string; mark: string; name: string }> = {
  bonus: { fill: "var(--enh-bonus)", mark: "+30", name: "보너스" },
  mult: { fill: "var(--enh-mult)", mark: "+4", name: "배수" },
  wild: { fill: "var(--enh-wild)", mark: "와일드", name: "와일드" },
  glass: { fill: "var(--enh-glass)", mark: "x2", name: "유리" },
  steel: { fill: "var(--enh-steel)", mark: "x1.5", name: "강철" },
  stone: { fill: "var(--enh-stone)", mark: "+50", name: "돌" },
  gold: { fill: "var(--enh-gold)", mark: "$3", name: "금" },
  lucky: { fill: "var(--enh-lucky)", mark: "행운", name: "행운" },
};

/** 읽기 도구용 이름. 예: "K 하트, 유리, 빨강 봉인" */
export function cardName(card: Card): string {
  const parts = [cardLabel(card)];
  if (card.enhancement && card.enhancement !== "stone") parts.push(ENHANCEMENT_LOOK[card.enhancement].name);
  if (card.seal) parts.push(SEAL_NAMES[card.seal]);
  if (card.edition) parts.push(editionDef(card.edition).name);
  return parts.join(", ");
}

/** 에디션 카드는 조커와 같은 색으로 테두리를 두껍게 */
const EDITION_STROKE: Partial<Record<EditionId, string>> = {
  foil: "var(--ed-foil)",
  holographic: "var(--ed-holo)",
  polychrome: "var(--ed-poly-b)",
};

const SEAL_NAMES: Record<Seal, string> = { red: "빨강 봉인", blue: "파랑 봉인", gold: "금 봉인", purple: "보라 봉인" };

/** 봉인은 오른쪽 위 빈 귀퉁이에 색 도장으로 */
function sealMark(seal: Seal): string {
  return `<rect x="80" y="6" width="13" height="13" rx="2" fill="var(--seal-${seal})" stroke="var(--suit-black)" stroke-width="1.5"/>`;
}

function enhancementMark(enhancement: Enhancement): string {
  return `<text x="50" y="135" text-anchor="middle" font-family="Galmuri11, monospace" font-weight="700" font-size="9" fill="var(--suit-black)">${ENHANCEMENT_LOOK[enhancement].mark}</text>`;
}

/** 돌 카드는 숫자와 무늬 없이 돌 무늬만 그린다 */
function stoneFace(): string {
  const specks = [
    [22, 30], [64, 24], [40, 52], [76, 60], [28, 84], [58, 92], [44, 112], [72, 108],
  ]
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="8" height="6" fill="var(--enh-stone-dark)"/>`)
    .join("");
  return specks + enhancementMark("stone");
}

export function cardSvg(card: Card): string {
  const fill = card.enhancement ? ENHANCEMENT_LOOK[card.enhancement].fill : "var(--card)";
  const stroke = (card.edition && EDITION_STROKE[card.edition]) ?? "var(--card-edge)";
  const background = `<rect x="2" y="2" width="96" height="136" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="${card.edition ? 4 : 2}"/>`;
  if (card.enhancement === "stone") {
    return `<svg class="card-svg" viewBox="0 0 100 140" role="img" aria-label="${cardName(card)}">${background}${stoneFace()}${card.seal ? sealMark(card.seal) : ""}</svg>`;
  }
  const corner = cardCorner(card);
  return (
    `<svg class="card-svg" viewBox="0 0 100 140" role="img" aria-label="${cardName(card)}">` +
    background +
    corner +
    `<g transform="rotate(180 50 70)">${corner}</g>` +
    cardCenter(card) +
    (card.enhancement ? enhancementMark(card.enhancement) : "") +
    (card.seal ? sealMark(card.seal) : "") +
    "</svg>"
  );
}
