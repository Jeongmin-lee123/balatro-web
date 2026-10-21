import { packDef, packPrice, canPick } from "../../game/packs";
import { JOKERS, PLANETS, RULES, TAROTS } from "../../game/rules";
import type { PackChoice, PackOffer, RunState } from "../../game/types";
import { cardName, cardSvg } from "../cardView";
import { button, esc } from "../dom";
import { jokerCard } from "../jokerView";
import { planetCard } from "../planetView";
import { tarotCard } from "../tarotView";

/** 상점 팩 칸 하나. 팩 그림 대신 이름과 내용을 적은 상자 */
export function packOfferCard(state: RunState, offer: PackOffer | null, slot: number): string {
  if (!offer) return `<div class="pack pack--sold"><span>판매됨</span></div>`;
  const def = packDef(offer.id);
  const price = packPrice(offer);
  return `
    <article class="pack pack--${esc(def.content)}">
      <div class="pack__face"><span class="pack__name">${esc(def.name)}</span></div>
      <p class="joker__desc">${esc(def.description)}</p>
      ${button({ action: { type: "buy_pack", slot }, label: `사기 $${price}`, className: "btn btn--small btn--money", disabled: state.money < price, key: `pack-${slot}` })}
    </article>`;
}

function blockedReason(state: RunState, choice: PackChoice): string {
  if (choice.kind === "tarot" && state.consumables.length >= RULES.consumableSlots) return "소모품 칸이 가득 찼습니다";
  if (choice.kind === "joker") return "조커 칸이 가득 찼습니다";
  return "";
}

function choiceCard(state: RunState, choice: PackChoice, index: number): string {
  const ok = canPick(state, index);
  const footer =
    button({ action: { type: "pick_pack", index }, label: "고르기", className: "btn btn--small btn--play", disabled: !ok, key: `pick-${index}` }) +
    (ok ? "" : `<p class="joker__reason">${blockedReason(state, choice)}</p>`);
  switch (choice.kind) {
    case "tarot": {
      const tarot = TAROTS[choice.id];
      return tarot ? tarotCard(tarot, footer) : "";
    }
    case "planet": {
      const planet = PLANETS[choice.id];
      return planet ? planetCard(planet, state.handLevels[planet.hand], footer) : "";
    }
    case "joker": {
      const joker = JOKERS[choice.id];
      return joker ? jokerCard(joker, footer, choice.edition) : "";
    }
    case "card":
      return `
        <article class="pack-card">
          <div class="pack-card__face">${cardSvg(choice.card)}</div>
          <h3 class="joker__name">${esc(cardName(choice.card))}</h3>
          <p class="joker__desc">덱에 넣는다</p>
          ${footer}
        </article>`;
  }
}

export function renderPackScreen(state: RunState): string {
  const pack = state.pack;
  if (!pack) return "";
  const def = packDef(pack.id);
  return `
    <section class="panel pack-open" aria-labelledby="pack-title">
      <h2 id="pack-title" class="panel__title">${esc(def.name)}</h2>
      <p class="shop__next">${esc(def.description)}. 칸이 모자라면 조커나 소모품을 팔아 비울 수 있다.</p>
      <div class="pack-open__choices">${pack.choices.map((choice, index) => choiceCard(state, choice, index)).join("")}</div>
      ${button({ action: { type: "skip_pack" }, label: "건너뛰기", className: "btn btn--small", key: "skip-pack" })}
    </section>`;
}
