/**
 * MainMenu.js
 * -----------------------------------------------------------------------
 * Large floating system-selection buttons. Selectable by pointing +
 * pinching (via VirtualCursor / [data-selectable]) or plain mouse click.
 *
 * This is also the main page's language picker: the English / සිංහල
 * buttons above the grid switch the whole application, and the grid
 * re-renders itself in the chosen language.
 * -----------------------------------------------------------------------
 */
import { SYSTEM_ORDER, getSystem } from "../data/anatomyData.js";
import { t, getLang, onLanguageChange } from "../data/i18n.js";
import { languageSwitcherHtml, bindLanguageSwitcher } from "./LanguageSwitcher.js";

export class MainMenu {
  constructor(root, onSelect) {
    this.root = root;
    this.root.className = "main-menu hidden";
    this.onSelect = onSelect;
    this._build();
    onLanguageChange(() => this._build());
  }

  _build() {
    const lang = getLang();
    this.root.innerHTML = `
      ${languageSwitcherHtml()}
      <div class="main-menu__title">${t("menuTitle")}</div>
      <div class="main-menu__grid">
        ${SYSTEM_ORDER.map((id) => {
          const system = getSystem(id, lang);
          return `
          <button class="menu-btn" data-selectable data-system="${id}">
            <span class="menu-btn__icon">${system.icon}</span>
            <span class="menu-btn__label">${system.label}</span>
            <span class="menu-btn__summary">${system.summary}</span>
          </button>`;
        }).join("")}
      </div>
    `;

    this.root.querySelectorAll(".menu-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.onSelect(btn.dataset.system));
    });
    bindLanguageSwitcher(this.root);
  }

  show() {
    this.root.classList.remove("hidden");
  }

  hide() {
    this.root.classList.add("hidden");
  }
}
