import { evaluateHand } from "../../game/handEval";
import { isDebuffed } from "../../game/bosses";
import { RULES } from "../../game/rules";
import { activeBoss, activeDebuff, canPlay } from "../../game/run";
import { handBase, handName } from "../../game/scoring";
import type { RunState, ScoreResult } from "../../game/types";
import { cardName, cardSvg } from "../cardView";
import { button, esc } from "../dom";

function signed(value: number): string {
  return value > 0 ? `+${value}` : "";
}

function scorePanel(score: ScoreResult | null): string {
  if (!score) {
    return `<section class="steps steps--empty" aria-live="polite"><p>카드를 1~5장 골라 플레이하면 점수 계산 과정이 여기에 나옵니다.</p></section>`;
  }
  const rows = score.steps
    .map(
      (step) => `
      <li class="steps__row">
        <span class="steps__source">${esc(step.source)}${step.note ? `<small>${esc(step.note)}</small>` : ""}</span>
        <span class="steps__chips">${signed(step.chips)}</span>
        <span class="steps__mult">${step.xMult !== undefined ? `x${step.xMult}` : signed(step.mult)}</span>
      </li>`,
    )
    .join("");
  return `
    <section class="steps" aria-live="polite" aria-label="점수 계산 과정">
      <ol class="steps__list">${rows}</ol>
      <p class="steps__total">
        <span class="cxm__chips">${score.chips}</span><span class="cxm__x">X</span><span class="cxm__mult">${score.mult.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</span>
        <span class="steps__equals">= ${score.total.toLocaleString("ko-KR")}점</span>
      </p>
    </section>`;
}

/** 고른 카드로 어떤 족보가 되는지 미리 보여 준다 */
function preview(state: RunState): string {
  const picked = state.round.hand.filter((card) => state.round.selected.includes(card.id));
  if (picked.length === 0) return `<p class="preview">고른 카드 없음</p>`;
  const hand = evaluateHand(picked);
  const level = state.handLevels[hand.type];
  const base = handBase(hand.type, level);
  return `<p class="preview"><b>${esc(handName(hand))}</b> <small>레벨 ${level}</small> <span class="cxm__chips">${base.chips}</span><span class="cxm__x">X</span><span class="cxm__mult">${base.mult}</span></p>`;
}

export function renderRoundScreen(state: RunState): string {
  const { round } = state;
  const effect = activeBoss(state)?.effect ?? null;
  const debuff = activeDebuff(state);
  const cards = round.hand
    .map((card) => {
      const selected = round.selected.includes(card.id);
      const full = !selected && round.selected.length >= RULES.maxSelect;
      const debuffed = debuff !== null && isDebuffed(debuff, card);
      return button({
        action: { type: "toggle_card", cardId: card.id },
        label: debuffed ? `${cardName(card)} (무효)` : cardName(card),
        html: cardSvg(card),
        className: `hand__card${selected ? " is-selected" : ""}${debuffed ? " is-debuffed" : ""}`,
        pressed: selected,
        disabled: full,
        key: `card-${card.id}`,
      });
    })
    .join("");

  const nothing = round.selected.length === 0;
  return `
    ${scorePanel(round.lastScore)}
    <section class="hand-area" aria-label="손패">
      ${preview(state)}
      <div class="hand">${cards}</div>
      <div class="hand-actions">
        ${button({ action: { type: "play" }, label: "플레이", className: "btn btn--play", disabled: !canPlay(state), key: "play" })}
        <div class="sort">
          <span class="sort__label">정렬</span>
          ${button({ action: { type: "sort", by: "rank" }, label: "숫자", className: "btn btn--small", pressed: round.sortBy === "rank", key: "sort-rank" })}
          ${button({ action: { type: "sort", by: "suit" }, label: "무늬", className: "btn btn--small", pressed: round.sortBy === "suit", key: "sort-suit" })}
        </div>
        ${button({ action: { type: "discard" }, label: `버리기`, className: "btn btn--discard", disabled: nothing || round.discardsLeft === 0, key: "discard" })}
      </div>
      <p class="hand-hint">${round.drawPile.length}장 남은 덱 / ${effect?.kind === "must_play" ? `이번 블라인드는 ${effect.count}장을 내야 합니다` : `최대 ${RULES.maxSelect}장 선택`}</p>
    </section>`;
}
