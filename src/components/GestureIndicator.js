/**
 * GestureIndicator.js
 * -----------------------------------------------------------------------
 * Small always-visible HUD in the corner showing: current tracking
 * backend/status, and a contextual gesture hint ("Point to select",
 * "Pinch to rotate", etc). Helps first-time visitors understand how to
 * interact within a few seconds, as required by the brief.
 * -----------------------------------------------------------------------
 */
import { handTracking, GESTURES } from "../interaction/HandTrackingController.js";
import { t, onLanguageChange } from "../data/i18n.js";

// Maps a context key (set by main.js as the app changes state) to the
// uiStrings key holding the hint for it.
const HINT_KEYS = {
  menu: "hintMenu",
  explorer: "hintExplorer",
  welcome: "hintWelcome",
  idle: "hintIdle",
};

export class GestureIndicator {
  constructor(root) {
    this.root = root;
    this._context = "welcome";
    this.root.innerHTML = `
      <div class="gesture-indicator">
        <div class="gi-status">
          <span class="gi-dot" id="gi-dot"></span>
          <span id="gi-status-text">${t("statusSearching")}</span>
        </div>
        <div class="gi-hint" id="gi-hint"></div>
      </div>
    `;
    this.dot = this.root.querySelector("#gi-dot");
    this.statusText = this.root.querySelector("#gi-status-text");
    this.hintEl = this.root.querySelector("#gi-hint");

    handTracking.on(GESTURES.HAND_DETECTED, () => this._refreshStatus());
    handTracking.on(GESTURES.HAND_LOST, () => this._refreshStatus());

    // Language switch: re-render the hint and the current tracking status.
    onLanguageChange(() => {
      this.setContext(this._context);
      this._refreshStatus();
    });

    this.setContext(this._context);
    this._refreshStatus();
  }

  setContext(contextKey) {
    this._context = contextKey;
    const key = HINT_KEYS[contextKey];
    this.hintEl.innerHTML = key ? t(key) : "";
  }

  _refreshStatus() {
    const { backend, handPresent, trackingAvailable } = handTracking.state;
    if (backend === "leapmotion") {
      this.dot.className = "gi-dot " + (handPresent ? "gi-dot--live" : "gi-dot--waiting");
      this.statusText.textContent = handPresent ? t("statusActive") : t("statusNotDetected");
    } else if (backend === "mouse") {
      this.dot.className = "gi-dot gi-dot--fallback";
      this.statusText.textContent = t("statusMouse");
    } else if (!trackingAvailable) {
      this.dot.className = "gi-dot gi-dot--waiting";
      this.statusText.textContent = t("statusSearching");
    }
  }
}
