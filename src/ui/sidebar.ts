import { blindName } from "../game/blinds";
import { ANTE_COUNT } from "../game/rules";
import { currentTarget } from "../game/run";
import { handName } from "../game/scoring";
import type { RunState } from "../game/types";
import { esc } from "./dom";

const BLIND_CLASS = ["blind--small", "blind--big", "blind--boss"] as const;

function fmt(value: number): string {
  return value.toLocaleString("ko-KR");
}

function blindBlock(state: RunState): string {
  if (state.phase === "shop") {
    return `<div class="blind blind--shop"><span class="blind__name">상점</span><span class="blind__sub">다음 블라인드 전에 조커와 행성을 고른다</span></div>`;
  }
  return `
    <div class="blind ${BLIND_CLASS[state.blindIndex]}">
      <span class="blind__name">${esc(blindName(state.blindIndex))}</span>
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
    </dl>`;
}
