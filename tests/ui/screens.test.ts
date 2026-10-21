// 화면 함수는 상태를 받아 HTML 문자열을 돌려주는 순수 함수라 브라우저 없이 검사할 수 있다.
// 각 phase의 대표 상태를 넣어 오류 없이 그려지고 핵심 문구가 나오는지 본다.
import { describe, expect, it } from "vitest";
import { apply, jokerDefs, newRun } from "../../src/game/run";
import type { RunState } from "../../src/game/types";
import { renderJokerRow } from "../../src/ui/jokerView";
import { renderBlindSelectScreen } from "../../src/ui/screens/blindSelectScreen";
import { renderCashOutScreen } from "../../src/ui/screens/cashOutScreen";
import { renderEndScreen } from "../../src/ui/screens/endScreen";
import { renderPackScreen } from "../../src/ui/screens/packScreen";
import { renderRoundScreen } from "../../src/ui/screens/roundScreen";
import { renderShopScreen } from "../../src/ui/screens/shopScreen";
import { renderSidebar } from "../../src/ui/sidebar";
import { renderConsumableRow } from "../../src/ui/tarotView";

const records = { bestAnte: 3, bestHand: 1200, runs: 4, wins: 0 };

function shop(extra: Partial<RunState> = {}): RunState {
  return {
    ...newRun(41),
    phase: "shop",
    money: 30,
    voucherOffer: "crystal_ball",
    shop: {
      offers: [
        { kind: "joker", id: "greedy_joker", edition: "holographic" },
        { kind: "tarot", id: "star" },
      ],
      packs: [{ id: "arcana" }, { id: "buffoon" }],
      rerollCost: 5,
    },
    ...extra,
  };
}

describe("화면 함수", () => {
  it("블라인드 선택: 블라인드 3개와 선택, 건너뛰기", () => {
    const html = renderBlindSelectScreen(newRun(41));
    expect(html).toContain("스몰 블라인드");
    expect(html).toContain("보스 블라인드");
    expect(html).toContain('data-key="select-blind"');
    expect(html).toContain('data-key="skip-blind"');
  });

  it("라운드: 손패 8장과 플레이 버튼", () => {
    const html = renderRoundScreen(apply(newRun(41), { type: "select_blind" }));
    expect(html.match(/class="hand__card/g)).toHaveLength(8);
    expect(html).toContain('data-key="play"');
  });

  it("상점: 할인 가격, 에디션, 팩, 바우처", () => {
    const html = renderShopScreen(shop({ vouchers: ["clearance_sale"] }));
    expect(html).toContain("사기 $6");
    expect(html).toContain("홀로그래픽");
    expect(html).toContain("아르카나 팩");
    expect(html).toContain("수정 구슬");
  });

  it("팩 열기: 고르기 버튼과 건너뛰기", () => {
    const state: RunState = { ...shop(), phase: "pack_open", pack: { id: "arcana", choices: [{ kind: "tarot", id: "sun" }, { kind: "tarot", id: "moon" }] } };
    const html = renderPackScreen(state);
    expect(html.match(/data-key="pick-/g)).toHaveLength(2);
    expect(html).toContain('data-key="skip-pack"');
  });

  it("정산과 끝 화면", () => {
    const cashOut: RunState = { ...newRun(41), phase: "cash_out", cashOut: { lines: [{ label: "스몰 블라인드", amount: 3 }], total: 3 } };
    expect(renderCashOutScreen(cashOut)).toContain("$3 받기");
    expect(renderEndScreen({ ...newRun(41), phase: "lost" }, records)).toContain("패배");
  });

  it("사이드바, 조커 줄, 소모품 칸: 바우처와 칸 수를 반영한다", () => {
    const state = shop({
      vouchers: ["crystal_ball"],
      consumables: ["star"],
      jokers: [{ uid: "a", defId: "joker", paid: 2, edition: "negative" }],
    });
    expect(renderSidebar(state)).toContain("수정 구슬");
    expect(renderConsumableRow(state)).toContain("1/3");
    expect(renderJokerRow(state, jokerDefs(state.jokers))).toContain("1/6");
  });
});
