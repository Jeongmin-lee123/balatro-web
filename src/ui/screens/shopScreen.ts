import { blindName, nextBlind, targetScore } from "../../game/blinds";
import { bossDef } from "../../game/bosses";
import { jokerSlots } from "../../game/editions";
import { JOKERS, PLANETS, TAROTS } from "../../game/rules";
import { canBuy, canBuyVoucher } from "../../game/run";
import { itemCost } from "../../game/shop";
import type { RunState, ShopOffer } from "../../game/types";
import { consumableSlots, voucherDef } from "../../game/vouchers";
import { button, esc } from "../dom";
import { jokerCard } from "../jokerView";
import { planetCard } from "../planetView";
import { packOfferCard } from "./packScreen";
import { tarotCard } from "../tarotView";

function blockedReason(state: RunState, offer: ShopOffer): string {
  if (offer.kind === "joker" && offer.edition !== "negative" && state.jokers.length >= jokerSlots(state.jokers)) return "조커 칸이 가득 찼습니다";
  if (offer.kind === "tarot" && state.consumables.length >= consumableSlots(state)) return "소모품 칸이 가득 찼습니다";
  if (state.money < itemCost(state, offer)) return "돈이 모자랍니다";
  return "";
}

function offerCard(state: RunState, offer: ShopOffer | null, slot: number): string {
  if (!offer) return `<div class="joker-slot joker-slot--sold"><span>판매됨</span></div>`;
  const reason = canBuy(state, slot) ? "" : blockedReason(state, offer);
  const footer =
    button({
      action: { type: "buy", slot },
      label: `사기 $${itemCost(state, offer)}`,
      className: "btn btn--small btn--money",
      disabled: reason !== "",
      key: `buy-${slot}`,
    }) + (reason ? `<p class="joker__reason">${reason}</p>` : "");

  if (offer.kind === "tarot") {
    const tarot = TAROTS[offer.id];
    return tarot ? tarotCard(tarot, footer) : "";
  }
  if (offer.kind === "planet") {
    const planet = PLANETS[offer.id];
    return planet ? planetCard(planet, state.handLevels[planet.hand], footer) : "";
  }
  const joker = JOKERS[offer.id];
  return joker ? jokerCard(joker, footer, offer.edition) : "";
}

/** 이번 앤티의 바우처. 사면 판 내내 규칙이 바뀐다. 다음 앤티에 새로 나온다 */
function voucherCard(state: RunState): string {
  if (!state.voucherOffer) return `<div class="pack pack--sold"><span>바우처 없음</span></div>`;
  const voucher = voucherDef(state.voucherOffer);
  return `
    <article class="pack pack--voucher">
      <div class="pack__face"><span class="pack__name">${esc(voucher.name)}</span><span class="pack__kind">바우처</span></div>
      <p class="joker__desc">${esc(voucher.description)}</p>
      ${button({ action: { type: "buy_voucher" }, label: `사기 $${voucher.price}`, className: "btn btn--small btn--money", disabled: !canBuyVoucher(state), key: "voucher" })}
    </article>`;
}

export function renderShopScreen(state: RunState): string {
  const shop = state.shop;
  if (!shop) return "";
  const next = nextBlind(state.ante, state.blindIndex);
  // 다음이 보스면 이번 앤티의 보스가 정해져 있다. 다음 앤티의 보스는 앤티가 바뀔 때 고른다
  const boss = next.blindIndex === 2 ? bossDef(state.boss) : null;
  const target = targetScore(next.ante, next.blindIndex, boss?.multiplier);
  const bossNote = boss ? ` (${esc(boss.name)}: ${esc(boss.description)})` : "";
  return `
    <section class="panel shop" aria-labelledby="shop-title">
      <h2 id="shop-title" class="panel__title">상점</h2>
      <div class="shop__offers">${shop.offers.map((offer, slot) => offerCard(state, offer, slot)).join("")}</div>
      <div class="shop__packs" aria-label="부스터 팩과 바우처">
        ${shop.packs.map((offer, slot) => packOfferCard(state, offer, slot)).join("")}
        ${voucherCard(state)}
      </div>
      <div class="shop__actions">
        ${button({
          action: { type: "reroll" },
          label: `다시 굴리기 $${shop.rerollCost}`,
          className: "btn btn--small",
          disabled: state.money < shop.rerollCost,
          key: "reroll",
        })}
        ${button({ action: { type: "next_round" }, label: "다음 라운드", className: "btn btn--play", key: "next-round" })}
      </div>
      <p class="shop__next">다음: 앤티 ${next.ante} ${esc(blindName(next.blindIndex))}${bossNote}, 목표 ${target.toLocaleString("ko-KR")}점</p>
    </section>`;
}
