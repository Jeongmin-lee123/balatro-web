import { blindName } from "../game/blinds";
import { ANTE_COUNT } from "../game/rules";
import { activeBoss, currentTarget } from "../game/run";
import { handName } from "../game/scoring";
import { tagDef } from "../game/tags";
import type { RunState } from "../game/types";
import { button, esc } from "./dom";

const BLIND_CLASS = ["blind--small", "blind--big", "blind--boss"] as const;

function fmt(value: number): string {
  return value.toLocaleString("ko-KR");
}

function blindBlock(state: RunState): string {
  if (state.phase === "blind_select") {
    return `<div class="blind blind--shop"><span class="blind__name">블라인드 선택</span><span class="blind__sub">선택하거나, 스몰과 빅은 건너뛰고 태그를 받는다</span></div>`;
  }
  if (state.phase === "shop") {
    return `<div class="blind blind--shop"><span class="blind__name">상점</span><span class="blind__sub">다음 블라인드 전에 조커, 타로, 행성을 고른다</span></div>`;
  }
  const boss = activeBoss(state);
  const bossLine = boss ? `<span class="blind__boss">${esc(boss.name)}: ${esc(boss.description)}</span>` : "";
  return `
    <div class="blind ${BLIND_CLASS[state.blindIndex]}">
      <span class="blind__name">${esc(blindName(state.blindIndex))}</span>
      ${bossLine}
      <span class="blind__sub">목표 점수</span>
      <span class="blind__target">${fmt(currentTarget(state))}</span>
    </div>`;
}

function scoreBlock(state: RunState): string {
  const last = state.round.lastScore;
  return `
    <div class="stat stat--score">
      <span class="stat__label">라운드 점수</span>
      <span class="stat__value">${fmt(state.round.score)}</span>
    </div>
    <div class="cxm-wrap">
      <span class="cxm-wrap__hand">${last ? esc(handName(last.hand)) : "&nbsp;"}</span>
      <div class="cxm">
        <span class="cxm__chips">${last ? fmt(last.chips) : 0}</span>
        <span class="cxm__x">X</span>
        <span class="cxm__mult">${last ? fmt(last.mult) : 0}</span>
      </div>
    </div>`;
}

export function renderSidebar(state: RunState): string {
  const inRound = state.phase === "round" || state.phase === "cash_out";
  return `
    <h1 class="logo">발라트로</h1>
    ${blindBlock(state)}
    ${inRound ? scoreBlock(state) : ""}
    <dl class="counters">
      ${
        inRound
          ? `<div class="counter counter--hands"><dt>핸드</dt><dd>${state.round.handsLeft}</dd></div>
      <div class="counter counter--discards"><dt>버리기</dt><dd>${state.round.discardsLeft}</dd></div>`
          : ""
      }
      <div class="counter counter--money"><dt>돈</dt><dd>$${state.money}</dd></div>
      <div class="counter counter--ante"><dt>앤티</dt><dd>${state.ante}<small>/${ANTE_COUNT}</small></dd></div>
    </dl>
    ${heldTags(state)}
    ${state.phase === "won" || state.phase === "lost" ? "" : restartMenu()}`;
}

/** 받아 두고 아직 발동하지 않은 태그 */
function heldTags(state: RunState): string {
  if (state.tags.length === 0) return "";
  const items = state.tags.map((id) => tagDef(id)).map((tag) => `<li title="${esc(tag.description)}">${esc(tag.name)}</li>`).join("");
  return `<div class="held-tags"><span>보관 중인 태그</span><ul>${items}</ul></div>`;
}

/** 진행 중인 판은 자동 저장되므로, 새로 시작할 때는 한 번 더 확인한다 */
function restartMenu(): string {
  return `
    <details class="restart">
      <summary>새 게임</summary>
      <p>지금 판은 저장되어 있습니다. 새로 시작하면 지금 판은 사라집니다.</p>
      ${button({ action: { type: "new_run" }, label: "지금 판 버리고 새로 시작", className: "btn btn--small btn--discard", key: "restart" })}
    </details>`;
}
