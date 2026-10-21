import { editionDef, jokerSlots } from "../game/editions";
import { sellValue } from "../game/shop";
import type { EditionId, JokerDef, OwnedJoker, RunState } from "../game/types";
import { button, esc } from "./dom";

/** 그림이 없으면 이름만 적힌 카드가 보이도록 img 실패 시 숨긴다. 그림은 scripts/process-joker-art.mjs가 만든다 */
export function jokerCard(def: JokerDef, footer: string, edition?: EditionId): string {
  const tag = edition ? `<p class="edition-tag edition-tag--${edition}">${esc(editionDef(edition).name)} ${esc(editionDef(edition).description)}</p>` : "";
  return `
    <article class="joker${edition ? ` joker--${edition}` : ""}">
      <div class="joker__art">
        <span class="joker__fallback">${esc(def.name)}</span>
        <img src="jokers/${esc(def.id)}.png" alt="" width="256" height="384" loading="lazy" onerror="this.remove()">
      </div>
      <h3 class="joker__name">${esc(def.name)}</h3>
      ${tag}
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
  const editable = state.phase === "blind_select" || state.phase === "round" || state.phase === "shop";
  const cards = state.jokers
    .map((joker, i) => {
      const def = defs[i];
      if (!def) return "";
      return jokerCard(def, editable ? ownedFooter(joker, i, state.jokers.length, def) : "", joker.edition);
    })
    .join("");
  const slots = jokerSlots(state.jokers);
  const empty = Array.from({ length: slots - state.jokers.length }, () => `<div class="joker-slot" aria-hidden="true"></div>`).join("");
  return `
    <section class="joker-row" aria-label="조커">
      <div class="joker-row__head"><span>조커</span><span>${state.jokers.length}/${slots}</span></div>
      <div class="joker-row__cards" style="--slots: ${slots}">${cards}${empty}</div>
    </section>`;
}
