/**
 * WelcomeScreen.js
 * -----------------------------------------------------------------------
 * First screen visitors see: title, subtitle, animated gesture legend and
 * the main-page language picker (English / සිංහල). Exits on wave /
 * pinch-click / any key, calling onBegin().
 *
 * Every string here comes from uiStrings.js via t(), and the screen
 * re-renders itself when the visitor switches language -- so the picker
 * can be used from this very screen before starting.
 * -----------------------------------------------------------------------
 */
import { t, onLanguageChange } from "../data/i18n.js";
import { languageSwitcherHtml, bindLanguageSwitcher } from "./LanguageSwitcher.js";

export class WelcomeScreen {
  constructor(root, onBegin) {
    this.root = root;
    this.root.className = "welcome-screen hidden";
    this.onBegin = onBegin;
    this._build();
    onLanguageChange(() => this._build());
  }

  _build() {
    this.root.innerHTML = `
      <div class="welcome-screen__inner">
        <div class="welcome-screen__kicker">${t("welcomeKicker")}</div>
        <h1 class="welcome-screen__title">${t("welcomeTitleHtml")}</h1>
        <p class="welcome-screen__subtitle">${t("welcomeSubtitle")}</p>

        <div class="gesture-legend">
          <div class="gesture-legend__item"><span>👋</span><p>${t("legendWave")}</p></div>
          <div class="gesture-legend__item"><span>☝</span><p>${t("legendPoint")}</p></div>
          <div class="gesture-legend__item"><span>🤏</span><p>${t("legendPinch")}</p></div>
          <div class="gesture-legend__item"><span>↔</span><p>${t("legendRotate")}</p></div>
          <div class="gesture-legend__item"><span>✋</span><p>${t("legendPalm")}</p></div>
        </div>

        <button class="begin-btn" data-selectable id="begin-btn">${t("beginBtn")}</button>

        ${languageSwitcherHtml({ variant: "compact" })}
      </div>
    `;
    this.root.querySelector("#begin-btn").addEventListener("click", () => this.onBegin());
    bindLanguageSwitcher(this.root);
  }

  show() {
    this.root.classList.remove("hidden");
  }

  hide() {
    this.root.classList.add("hidden");
  }
}

