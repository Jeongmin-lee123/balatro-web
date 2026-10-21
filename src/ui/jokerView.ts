import { RULES } from "../game/rules";
import { sellValue } from "../game/shop";
import type { JokerDef, OwnedJoker, RunState } from "../game/types";
import { button, esc } from "./dom";

/** 그림이 없으면 이름만 적힌 카드가 보이도록 img 실패 시 숨긴다. 그림은 scripts/process-joker-art.mjs가 만든다 */
export function jokerCard(def: JokerDef, footer: string): string {
  return `
    <article class="joker">
      <div class="joker__art">
        <span class="joker__fallback">${esc(def.name)}</span>
        <img src="jokers/${esc(def.id)}.png" alt="" width="71" height="95" loading="lazy" onerror="this.remove()">
      </div>
      <h3 class="joker__name">${esc(def.name)}</h3>
      <p class="joker__desc">${esc(def.description)}</p>
      ${footer}
    </article>`;
}

function ownedFooter(joker: OwnedJoker, index: number, count: number, def: JokerDef): string {
  const moveLeft = button({
    action: { type: "move_joker", uid: joker.uid, to: index - 1 },
    label: `${def.name} 왼쪽으로`,
    html: "&lt;",
    className: "btn btn--tiny",
    disabled: index === 0,
    key: `left-${joker.uid}`,
  });
  const moveRight = button({
    action: { type: "move_joker", uid: joker.uid, to: index + 1 },
    label: `${def.name} 오른쪽으로`,
    html: "&gt;",
    className: "btn btn--tiny",
    disabled: index === count - 1,
    key: `right-${joker.uid}`,
  });
  const sell = button({
    action: { type: "sell", uid: joker.uid },
    label: `팔기 $${sellValue(joker.paid)}`,
    className: "btn btn--tiny btn--sell",
    key: `sell-${joker.uid}`,
  });
  return `<div class="joker__tools">${moveLeft}${sell}${moveRight}</div>`;
}

export function renderJokerRow(state: RunState, defs: readonly JokerDef[]): string {
  const editable = state.phase === "round" || state.phase === "shop";
  const cards = state.jokers
    .map((joker, i) => {
      const def = defs[i];
      if (!def) return "";
      return jokerCard(def, editable ? ownedFooter(joker, i, state.jokers.length, def) : "");
    })
    .join("");
  const empty = Array.from({ length: RULES.jokerSlots - state.jokers.length }, () => `<div class="joker-slot" aria-hidden="true"></div>`).join("");
  return `
    <section class="joker-row" aria-label="조커">
      <div class="joker-row__head"><span>조커</span><span>${state.jokers.length}/${RULES.jokerSlots}</span></div>
      <div class="joker-row__cards">${cards}${empty}</div>
    </section>`;
}
