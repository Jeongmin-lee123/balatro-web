import { blindName } from "../../game/blinds";
import { ANTE_COUNT } from "../../game/rules";
import type { RunState } from "../../game/types";
import type { Records } from "../../storage/records";
import { button, esc } from "../dom";

export function renderEndScreen(state: RunState, records: Records): string {
  const won = state.phase === "won";
  const message = won
    ? `앤티 ${ANTE_COUNT} 보스 블라인드까지 모두 통과했습니다.`
    : `앤티 ${state.ante} ${esc(blindName(state.blindIndex))}에서 끝났습니다. 새 게임을 눌러 다시 시작하세요.`;
  return `
    <section class="panel end ${won ? "end--won" : "end--lost"}" aria-labelledby="end-title">
      <h2 id="end-title" class="panel__title">${won ? "승리" : "패배"}</h2>
      <p class="end__message">${message}</p>
      <dl class="end__stats">
        <div><dt>이번 판 최고 한 손</dt><dd>${state.stats.bestHand.toLocaleString("ko-KR")}</dd></div>
        <div><dt>플레이한 핸드</dt><dd>${state.stats.handsPlayed}</dd></div>
        <div><dt>역대 최고 앤티</dt><dd>${records.bestAnte}</dd></div>
        <div><dt>역대 최고 한 손</dt><dd>${records.bestHand.toLocaleString("ko-KR")}</dd></div>
        <div><dt>승리 / 판</dt><dd>${records.wins} / ${records.runs}</dd></div>
      </dl>
      ${button({ action: { type: "new_run" }, label: "새 게임", className: "btn btn--play", key: "new-run" })}
    </section>`;
}
