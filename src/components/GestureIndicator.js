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

const HINTS = {
  menu: "☝ Point &amp; pinch (or hold still) to select &nbsp;·&nbsp; ✋ Open palm to pause",
  explorer: "↔ Pinch &amp; drag to rotate &nbsp;·&nbsp; ☝ Point &amp; hold to inspect &nbsp;·&nbsp; ✋ Open palm to pause",
  welcome: "👋 Wave to begin",
  idle: "👋 Wave your hand to explore",
};

export class GestureIndicator {
  constructor(root) {
    this.root = root;
    this.root.innerHTML = `
      <div class="gesture-indicator">
        <div class="gi-status">
          <span class="gi-dot" id="gi-dot"></span>
          <span id="gi-status-text">Searching for hand tracking…</span>
        </div>
        <div class="gi-hint" id="gi-hint"></div>
      </div>
    `;
    this.dot = this.root.querySelector("#gi-dot");
    this.statusText = this.root.querySelector("#gi-status-text");
    this.hintEl = this.root.querySelector("#gi-hint");

    handTracking.on(GESTURES.HAND_DETECTED, () => this._refreshStatus());
    handTracking.on(GESTURES.HAND_LOST, () => this._refreshStatus());
    this._refreshStatus();
  }

  setContext(contextKey) {
    this.hintEl.innerHTML = HINTS[contextKey] || "";
  }

  _refreshStatus() {
    const { backend, handPresent, trackingAvailable } = handTracking.state;
    if (backend === "leapmotion") {
      this.dot.className = "gi-dot " + (handPresent ? "gi-dot--live" : "gi-dot--waiting");
      this.statusText.textContent = handPresent
        ? "Hand tracking active"
        : "Hand not detected — interaction paused";
    } else if (backend === "mouse") {
      this.dot.className = "gi-dot gi-dot--fallback";
      this.statusText.textContent = "Mouse control (hand tracking unavailable)";
    } else if (!trackingAvailable) {
      this.dot.className = "gi-dot gi-dot--waiting";
      this.statusText.textContent = "Searching for hand tracking…";
    }
  }
}
