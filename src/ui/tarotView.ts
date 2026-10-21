// 타로 카드와 소모품 칸. 타로 그림은 아직 없어 로마 숫자와 이름을 크게 쓰는 글자 카드로 그린다.
import { sellValue } from "../game/shop";
import { canUseTarot, tarotDef, targetRange } from "../game/tarots";
import type { RunState, TarotDef } from "../game/types";
import { consumableSlots } from "../game/vouchers";
import { button, esc } from "./dom";

export function tarotCard(tarot: TarotDef, footer: string): string {
  return `
    <article class="tarot">
      <div class="tarot__face">
        <span class="tarot__numeral">${esc(tarot.numeral)}</span>
        <span class="tarot__title">${esc(tarot.name)}</span>
      </div>
      <h3 class="joker__name">${esc(tarot.name)}</h3>
      <p class="joker__desc">${esc(tarot.description)}</p>
      ${footer}
    </article>`;
}

/** 고른 카드가 필요한 타로는 몇 장을 골라야 하는지 알려 준다 */
function useHint(state: RunState, tarot: TarotDef): string {
  const range = targetRange(tarot.effect);
  if (!range) return "";
  if (state.phase !== "round") return "라운드 중에 손패를 골라 쓴다";
  return range.min === range.max ? `카드 ${range.max}장을 고른다` : `카드 ${range.min}~${range.max}장을 고른다`;
}

export function renderConsumableRow(state: RunState): string {
  const usable = state.phase === "blind_select" || state.phase === "round" || state.phase === "shop";
  const cards = state.consumables
    .map((id, index) => {
      const tarot = tarotDef(id);
      if (!usable) return tarotCard(tarot, "");
      const canUse = canUseTarot(state, index);
      const hint = canUse ? "" : useHint(state, tarot);
      const footer = `
        <div class="joker__tools">
          ${button({ action: { type: "use_consumable", index }, label: "사용", className: "btn btn--tiny btn--use", disabled: !canUse, key: `use-${index}` })}
          ${button({ action: { type: "sell_consumable", index }, label: `팔기 $${sellValue(tarot.price)}`, className: "btn btn--tiny btn--sell", key: `sell-c-${index}` })}
        </div>
        ${hint ? `<p class="joker__reason">${hint}</p>` : ""}`;
      return tarotCard(tarot, footer);
    })
    .join("");
  const slots = consumableSlots(state);
  const empty = Array.from({ length: slots - state.consumables.length }, () => `<div class="joker-slot" aria-hidden="true"></div>`).join("");
  return `
    <section class="joker-row consumable-row" aria-label="소모품">
      <div class="joker-row__head"><span>소모품</span><span>${state.consumables.length}/${slots}</span></div>
      <div class="joker-row__cards consumable-row__cards">${cards}${empty}</div>
    </section>`;
}
