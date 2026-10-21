import { blindName, blindReward, targetScore } from "../../game/blinds";
import { bossDef } from "../../game/bosses";
import { tagDef } from "../../game/tags";
import type { BlindIndex, RunState } from "../../game/types";
import { button, esc } from "../dom";

const BLIND_CLASS = ["blind--small", "blind--big", "blind--boss"] as const;

function blindColumn(state: RunState, index: BlindIndex): string {
  const boss = index === 2 ? bossDef(state.boss) : null;
  const target = targetScore(state.ante, index, boss?.multiplier);
  const tagId = state.blindTags[index];
  const tag = tagId ? tagDef(tagId) : null;
  const status = index < state.blindIndex ? "지남" : index > state.blindIndex ? "다음" : "";

  const detail = boss
    ? `<p class="choice__detail"><b>${esc(boss.name)}</b><br>${esc(boss.description)}</p>`
    : tag
      ? `<p class="choice__detail">건너뛰면 <b>${esc(tag.name)}</b><br>${esc(tag.description)}</p>`
      : "";

  const actions =
    index === state.blindIndex
      ? `<div class="choice__actions">
          ${button({ action: { type: "select_blind" }, label: "선택", className: "btn btn--play", key: "select-blind" })}
          ${tag && !boss ? button({ action: { type: "skip_blind" }, label: "건너뛰기", className: "btn btn--small", key: "skip-blind" }) : ""}
        </div>`
      : `<p class="choice__status">${status}</p>`;

  return `
    <article class="choice ${index === state.blindIndex ? "is-current" : "is-other"}">
      <h3 class="choice__name ${BLIND_CLASS[index]}">${esc(blindName(index))}</h3>
      <p class="choice__target"><small>목표 점수</small>${target.toLocaleString("ko-KR")}</p>
      <p class="choice__reward">보상 <span class="money">$${blindReward(state.ante, index)}</span></p>
      ${detail}
      ${actions}
    </article>`;
}

export function renderBlindSelectScreen(state: RunState): string {
  return `
    <section class="panel blind-select" aria-labelledby="blind-select-title">
      <h2 id="blind-select-title" class="panel__title">앤티 ${state.ante} 블라인드 선택</h2>
      <div class="blind-select__row">${([0, 1, 2] as const).map((index) => blindColumn(state, index)).join("")}</div>
    </section>`;
}
