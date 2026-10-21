// 행성 카드. 행성 그림은 얼굴 카드와 같은 도트 방식으로, 색 하나에서 밝은 면과 어두운 면을 만들어 그린다.
import { HANDS } from "../game/rules";
import type { PlanetDef } from "../game/types";
import { esc } from "./dom";

const SIZE = 18;

/** #rrggbb 두 색을 ratio(0~1)만큼 섞는다 */
function mix(color: string, other: string, ratio: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const parts = [0, 1, 2].map((i) => Math.round(channel(color, i) * (1 - ratio) + channel(other, i) * ratio));
  return `#${parts.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function planetPixels(planet: PlanetDef): string {
  const light = mix(planet.color, "#ffffff", 0.35);
  const dark = mix(planet.color, "#000000", 0.35);
  const outline = "#1d1b22";
  const center = (SIZE - 1) / 2;
  const radius = SIZE / 2 - 2;
  let rects = "";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - center;
      const dy = y - center;
      const distance = Math.hypot(dx, dy);
      if (distance > radius + 1) continue;
      // 왼쪽 위에서 빛이 온다고 보고, 빛 방향 성분으로 밝은 면과 어두운 면을 나눈다
      const lit = -(dx + dy) / (radius * 1.4);
      const fill = distance > radius ? outline : lit > 0.45 ? light : lit < -0.35 ? dark : planet.color;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`;
    }
  }
  if (planet.id === "saturn") {
    for (let x = 0; x < SIZE; x++) {
      const y = Math.round(center + (x - center) * -0.35);
      if (Math.abs(x - center) > radius - 2) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${light}"/>`;
    }
  }
  return `<svg class="planet__art" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

/** level은 지금 족보 레벨. 카드에는 산 뒤의 레벨을 함께 보여 준다 */
export function planetCard(planet: PlanetDef, level: number, footer: string): string {
  const hand = HANDS[planet.hand];
  return `
    <article class="planet">
      <div class="planet__face">${planetPixels(planet)}</div>
      <h3 class="joker__name">${esc(planet.name)}</h3>
      <p class="joker__desc">${esc(hand.name)} 레벨 ${level} -> ${level + 1}<br>칩 +${hand.levelChips}, 배수 +${hand.levelMult}</p>
      ${footer}
    </article>`;
}
