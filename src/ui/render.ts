// 상태의 phase를 보고 알맞은 화면을 고른다. 화면은 상태를 읽기만 하고 고치지 않는다.
import { jokerDefs } from "../game/run";
import type { RunState } from "../game/types";
import type { Records } from "../storage/records";
import { replaceKeepingFocus } from "./dom";
import { renderJokerRow } from "./jokerView";
import { renderBlindSelectScreen } from "./screens/blindSelectScreen";
import { renderCashOutScreen } from "./screens/cashOutScreen";
import { renderEndScreen } from "./screens/endScreen";
import { renderRoundScreen } from "./screens/roundScreen";
import { renderShopScreen } from "./screens/shopScreen";
import { renderSidebar } from "./sidebar";
import { renderConsumableRow } from "./tarotView";

function mainArea(state: RunState, records: Records): string {
  switch (state.phase) {
    case "blind_select":
      return renderBlindSelectScreen(state);
    case "round":
      return renderRoundScreen(state);
    case "cash_out":
      return renderCashOutScreen(state);
    case "shop":
      return renderShopScreen(state);
    case "won":
    case "lost":
      return renderEndScreen(state, records);
  }
}

export function render(root: HTMLElement, state: RunState, records: Records): void {
  replaceKeepingFocus(
    root,
    `<div class="table" data-phase="${state.phase}">
      <aside class="table__side">${renderSidebar(state)}</aside>
      <main class="table__main">
        <div class="top-row">
          ${renderJokerRow(state, jokerDefs(state.jokers))}
          ${renderConsumableRow(state)}
        </div>
        ${mainArea(state, records)}
      </main>
      <footer class="table__foot">Balatro(LocalThunk) 비공식 팬 제작. 원작 그림과 소리는 쓰지 않았습니다.</footer>
    </div>`,
  );
}
