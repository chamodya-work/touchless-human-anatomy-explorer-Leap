/**
 * MainMenu.js
 * -----------------------------------------------------------------------
 * Large floating system-selection buttons. Selectable by pointing +
 * pinching (via VirtualCursor / [data-selectable]) or plain mouse click.
 * -----------------------------------------------------------------------
 */
import { SYSTEM_ORDER, SYSTEMS } from "../data/anatomyData.js";

export class MainMenu {
  constructor(root, onSelect) {
    this.root = root;
    this.root.className = "main-menu hidden";
    this.onSelect = onSelect;
    this._build();
  }

  _build() {
    this.root.innerHTML = `
      <div class="main-menu__title">Select a body system</div>
      <div class="main-menu__grid">
        ${SYSTEM_ORDER.map(
          (id) => `
          <button class="menu-btn" data-selectable data-system="${id}">
            <span class="menu-btn__icon">${SYSTEMS[id].icon}</span>
            <span class="menu-btn__label">${SYSTEMS[id].label}</span>
            <span class="menu-btn__summary">${SYSTEMS[id].summary}</span>
          </button>`
        ).join("")}
      </div>
    `;

    this.root.querySelectorAll(".menu-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.onSelect(btn.dataset.system));
    });
  }

  show() {
    this.root.classList.remove("hidden");
  }

  hide() {
    this.root.classList.add("hidden");
  }
}
