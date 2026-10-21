import { blindName, nextBlind, targetScore } from "../../game/blinds";
import { JOKERS, RULES } from "../../game/rules";
import type { RunState } from "../../game/types";
import { button, esc } from "../dom";
import { jokerCard } from "../jokerView";

export function renderShopScreen(state: RunState): string {
  const shop = state.shop;
  if (!shop) return "";
  const full = state.jokers.length >= RULES.jokerSlots;

  const offers = shop.offers
    .map((defId, slot) => {
      const def = defId ? JOKERS[defId] : undefined;
      if (!def) return `<div class="joker-slot joker-slot--sold"><span>판매됨</span></div>`;
      const reason = full ? "조커 칸이 가득 찼습니다" : state.money < def.price ? "돈이 모자랍니다" : "";
      const buy = button({
        action: { type: "buy", slot },
        label: `사기 $${def.price}`,
        className: "btn btn--small btn--money",
        disabled: reason !== "",
        key: `buy-${slot}`,
      });
      return jokerCard(def, `${buy}${reason ? `<p class="joker__reason">${reason}</p>` : ""}`);
    })
    .join("");

  const next = nextBlind(state.ante, state.blindIndex);
  return `
    <section class="panel shop" aria-labelledby="shop-title">
      <h2 id="shop-title" class="panel__title">상점</h2>
      <div class="shop__offers">${offers}</div>
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
      <p class="shop__next">다음: 앤티 ${next.ante} ${esc(blindName(next.blindIndex))}, 목표 ${targetScore(next.ante, next.blindIndex).toLocaleString("ko-KR")}점</p>
    </section>`;
}
