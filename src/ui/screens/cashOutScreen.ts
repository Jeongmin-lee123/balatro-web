import type { RunState } from "../../game/types";
import { button, esc } from "../dom";

export function renderCashOutScreen(state: RunState): string {
  const cashOut = state.cashOut;
  if (!cashOut) return "";
  const lines = cashOut.lines
    .map((line) => `<li><span>${esc(line.label)}</span><span class="money">$${line.amount}</span></li>`)
    .join("");
  return `
    <section class="panel cash-out" aria-labelledby="cash-out-title">
      <h2 id="cash-out-title" class="panel__title">라운드 통과</h2>
      <p class="cash-out__score">${state.round.score.toLocaleString("ko-KR")}점</p>
      <ul class="cash-out__lines">${lines}</ul>
      ${button({ action: { type: "collect" }, label: `$${cashOut.total} 받기`, className: "btn btn--money", key: "collect" })}
    </section>`;
}
