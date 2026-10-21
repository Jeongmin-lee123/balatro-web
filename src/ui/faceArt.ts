// J, Q, K 얼굴 도트. data/faces.json의 위쪽 절반 격자를 그리고, 180도 돌려 아래 절반을 붙인다.
// ui/ 중 data/를 직접 읽는 곳은 이 파일뿐이다. (design.md 2.3)
import facesJson from "../../data/faces.json";
import type { Rank, Suit } from "../game/types";

type Palette = Record<string, string>;

interface FaceData {
  base: Palette;
  robe: { red: Palette; black: Palette };
  faces: Record<string, { name: string; palette: Palette; half: string[] }>;
}

const FACES: FaceData = facesJson;

const RED_SUITS: readonly Suit[] = ["hearts", "diamonds"];

export function hasFace(rank: Rank): boolean {
  return String(rank) in FACES.faces;
}

function pixelRects(rows: readonly string[], palette: Palette, rotateFrom?: number): string {
  const width = rows[0]?.length ?? 0;
  let rects = "";
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === ".") return;
      const px = rotateFrom === undefined ? x : width - 1 - x;
      const py = rotateFrom === undefined ? y : rotateFrom - y;
      rects += `<rect x="${px}" y="${py}" width="1" height="1" fill="${palette[ch]}"/>`;
    });
  });
  return rects;
}

/** attrs는 바깥 svg에 붙일 위치와 크기 속성 (예: 'x="22" y="26" width="56" height="88"') */
export function facePortrait(rank: Rank, suit: Suit, attrs = ""): string {
  const face = FACES.faces[String(rank)];
  if (!face) throw new Error(`얼굴 카드가 아닙니다: ${rank}`);
  const robe = RED_SUITS.includes(suit) ? FACES.robe.red : FACES.robe.black;
  const palette = { ...FACES.base, ...face.palette, ...robe };
  const height = face.half.length;
  const width = face.half[0]?.length ?? 0;
  return (
    `<svg ${attrs} viewBox="0 0 ${width} ${height * 2}" shape-rendering="crispEdges">` +
    pixelRects(face.half, palette) +
    pixelRects(face.half, palette, height * 2 - 1) +
    "</svg>"
  );
}
