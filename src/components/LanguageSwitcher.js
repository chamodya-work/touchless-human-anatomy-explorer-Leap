/**
 * LanguageSwitcher.js
 * -----------------------------------------------------------------------
 * The English / සිංහල picker shown on the main page (Welcome screen and
 * Main menu). Deliberately a plain helper rather than a component class:
 * both hosts already own their root element and simply re-render
 * themselves when onLanguageChange() fires, so all that's needed here is
 * the markup plus one click binding.
 *
 * The buttons carry [data-selectable] so the virtual cursor can highlight
 * and activate them by pointing + pinching, exactly like a menu button --
 * VirtualCursor activates targets through a native .click(), so a normal
 * "click" listener is all it takes.
 * -----------------------------------------------------------------------
 */
import { LANGUAGES, LANGUAGE_ORDER, getLang, setLang, t } from "../data/i18n.js";

/**
 * @param {{variant?: "default"|"compact", showNote?: boolean}} [options]
 *   variant  - "compact" is the tighter version used on the Welcome screen
 *   showNote - set false to hide the "you can change this" helper line
 */
export function languageSwitcherHtml({ variant = "default", showNote = true } = {}) {
  const active = getLang();
  return `
    <div class="lang-switcher lang-switcher--${variant}" data-lang-switcher>
      <span class="lang-switcher__label">🌐 ${t("chooseLanguage")}</span>
      <div class="lang-switcher__options" role="group" aria-label="${t("chooseLanguage")}">
        ${LANGUAGE_ORDER.map(
          (id) => `
          <button type="button"
                  class="lang-btn${id === active ? " lang-btn--active" : ""}"
                  data-selectable
                  data-lang="${id}"
                  aria-pressed="${id === active}">
            ${LANGUAGES[id].nativeLabel}
          </button>`
        ).join("")}
      </div>
      ${showNote ? `<span class="lang-switcher__note">${t("languageNote")}</span>` : ""}
    </div>
  `;
}

/**
 * Wires every language button inside `root`. Safe to call again after a
 * re-render (it rebinds the fresh elements).
 */
export function bindLanguageSwitcher(root) {
  root.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      // Keep the tap from bubbling into whatever is behind the switcher
      // (the Welcome screen, for instance, begins on any click).
      event.preventDefault();
      event.stopPropagation();
      setLang(btn.dataset.lang);
    });
  });
}
