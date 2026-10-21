import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import { apply, newRun } from "./game/run";
import type { Action, RunState } from "./game/types";
import { loadRecords, saveRun } from "./storage/records";
import { bindActions } from "./ui/dom";
import { render } from "./ui/render";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app 요소가 없습니다");
const root = app;

const isOver = (state: RunState) => state.phase === "won" || state.phase === "lost";

let state = newRun(Math.floor(Math.random() * 4294967296));
let records = loadRecords();

function dispatch(action: Action): void {
  const next = apply(state, action);
  if (next === state) return;
  if (isOver(next) && !isOver(state)) records = saveRun(next, records);
  state = next;
  render(root, state, records);
}

bindActions(root, dispatch);
render(root, state, records);
