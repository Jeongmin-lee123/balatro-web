// 화면 공용 도구. 버튼은 data-action에 Action을 JSON으로 담고, 클릭은 루트 한 곳에서 받는다.
import type { Action } from "../game/types";

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function esc(text: string | number): string {
  return String(text).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

export interface ButtonOptions {
  action: Action;
  label: string;
  className?: string;
  disabled?: boolean;
  /** 다시 그린 뒤 키보드 초점을 되돌릴 때 쓰는 이름. 화면 안에서 겹치지 않게 한다 */
  key?: string;
  /** label 대신 넣을 HTML (카드 그림 등). label은 읽기 도구용 이름이 된다 */
  html?: string;
  pressed?: boolean;
}

export function button({ action, label, className = "btn", disabled = false, key, html, pressed }: ButtonOptions): string {
  const attrs = [
    `type="button"`,
    `class="${className}"`,
    `data-action="${esc(JSON.stringify(action))}"`,
    key ? `data-key="${esc(key)}"` : "",
    html ? `aria-label="${esc(label)}"` : "",
    pressed === undefined ? "" : `aria-pressed="${pressed}"`,
    disabled ? "disabled" : "",
  ].filter(Boolean);
  return `<button ${attrs.join(" ")}>${html ?? esc(label)}</button>`;
}

export function bindActions(root: HTMLElement, dispatch: (action: Action) => void): void {
  root.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
    if (!target || target.disabled) return;
    dispatch(JSON.parse(target.dataset.action as string) as Action);
  });
}

/** innerHTML을 바꾸면 초점이 사라지므로, data-key가 같은 요소로 되돌린다 */
export function replaceKeepingFocus(root: HTMLElement, html: string): void {
  const key = document.activeElement instanceof HTMLElement ? document.activeElement.dataset.key : undefined;
  root.innerHTML = html;
  if (!key) return;
  const again = root.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`);
  (again && !again.hasAttribute("disabled") ? again : root.querySelector<HTMLElement>("button:not([disabled])"))?.focus();
}
