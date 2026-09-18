/**
 * VirtualCursor.js
 * -----------------------------------------------------------------------
 * Renders a glowing on-screen cursor driven by the generic hand-tracking
 * "point" position, and handles selection of any DOM element marked
 * with [data-selectable] -- used by MainMenu buttons, Welcome/Idle
 * prompts, etc.
 *
 * TWO independent ways to select something, so a visitor is never stuck
 * if one doesn't work on a given sensor/setup:
 *
 *   1. PINCH -- point at it, pinch, release (the original design).
 *   2. DWELL -- point at it and hold still for DWELL_MS. A visible ring
 *      fills in around the cursor as feedback. This does NOT depend on
 *      pinch detection working at all, which is exactly the failure
 *      mode reported when pinch strength wasn't being read correctly
 *      from a real LM-010's data (see LeapMotionAdapter.js
 *      extractPinchStrength). Both remain active -- whichever the
 *      visitor's hand/sensor combination happens to make reliable wins.
 *
 * Both are gated to the Leap Motion backend only. Mouse/touch already
 * has native clicks; synthesizing a second selection on top of that
 * caused a real double-toggle bug (see CHANGELOG.md).
 * -----------------------------------------------------------------------
 */
import { handTracking, GESTURES } from "../interaction/HandTrackingController.js";

const DWELL_MS = 900;

export class VirtualCursor {
  constructor(root) {
    this.el = document.createElement("div");
    this.el.className = "virtual-cursor";
    this.el.innerHTML = `
      <svg class="virtual-cursor__ring" viewBox="0 0 40 40" width="40" height="40">
        <circle class="virtual-cursor__ring-track" cx="20" cy="20" r="17"/>
        <circle class="virtual-cursor__ring-fill" cx="20" cy="20" r="17"/>
      </svg>
    `;
    root.appendChild(this.el);
    this._ringFill = this.el.querySelector(".virtual-cursor__ring-fill");
    this._ringCircumference = 2 * Math.PI * 17;
    this._setRingProgress(0);

    this.hoverTarget = null;
    this.enabled = true;
    this._pinching = false;

    // Dwell-to-select state.
    this._dwellTarget = null;
    this._dwellStart = 0;
    this._dwellFiredFor = null; // target we already fired for -- must look away before it can refire

    // Light additional screen-space smoothing on top of whatever the
    // input backend already provides -- cheap insurance against visible
    // pixel-jitter regardless of source (mouse is already precise, but
    // this keeps behavior consistent and costs nothing noticeable).
    this._targetPos = null;
    this._currentPos = null;
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);

    this._onPoint = this._onPoint.bind(this);
    this._onPinchStart = this._onPinchStart.bind(this);
    this._onPinchEnd = this._onPinchEnd.bind(this);

    handTracking.on(GESTURES.POINT, this._onPoint);
    handTracking.on(GESTURES.PINCH_START, this._onPinchStart);
    handTracking.on(GESTURES.PINCH_MOVE, this._onPoint);
    handTracking.on(GESTURES.PINCH_END, this._onPinchEnd);
    handTracking.on(GESTURES.HAND_LOST, () => {
      this.el.classList.add("hidden");
      this._resetDwell();
    });
    handTracking.on(GESTURES.HAND_DETECTED, () => {
      this.el.classList.remove("hidden");
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.el.classList.toggle("hidden", !enabled);
    if (!enabled) this._resetDwell();
  }

  _screenPos(pos) {
    const x = ((pos.x + 1) / 2) * window.innerWidth;
    const y = ((1 - pos.y) / 2) * window.innerHeight;
    return { x, y };
  }

  _onPoint(pos) {
    if (!this.enabled) return;
    this._targetPos = this._screenPos(pos);
    if (!this._currentPos) this._currentPos = { ...this._targetPos };
  }

  _isLeapBackend() {
    return handTracking.state.backend === "leapmotion";
  }

  _setRingProgress(t) {
    // t in [0,1]. Hidden entirely at 0 so mouse users never see it.
    this._ringFill.style.strokeDasharray = `${this._ringCircumference}`;
    this._ringFill.style.strokeDashoffset = `${this._ringCircumference * (1 - t)}`;
    this.el.classList.toggle("virtual-cursor--dwelling", t > 0);
  }

  _resetDwell() {
    this._dwellTarget = null;
    this._dwellFiredFor = null;
    this._setRingProgress(0);
  }

  _tick() {
    this._raf = requestAnimationFrame(this._tick);
    if (!this._targetPos || !this._currentPos) return;

    this._currentPos.x += (this._targetPos.x - this._currentPos.x) * 0.45;
    this._currentPos.y += (this._targetPos.y - this._currentPos.y) * 0.45;
    this.el.style.transform = `translate(${this._currentPos.x}px, ${this._currentPos.y}px)`;

    const el = document.elementFromPoint(this._currentPos.x, this._currentPos.y);
    const selectable = el?.closest?.("[data-selectable]") || null;

    if (selectable !== this.hoverTarget) {
      this.hoverTarget?.classList.remove("gesture-hover");
      this.hoverTarget = selectable;
      this.hoverTarget?.classList.add("gesture-hover");
    }

    this._updateDwell(selectable);
  }

  /**
   * DWELL-TO-SELECT: hold the pointer on a selectable element for
   * DWELL_MS to activate it, independent of pinch. Only active for the
   * Leap Motion backend (mouse/touch already click natively).
   */
  _updateDwell(selectable) {
    if (!this._isLeapBackend() || !selectable) {
      this._resetDwell();
      return;
    }

    if (selectable !== this._dwellTarget) {
      this._dwellTarget = selectable;
      this._dwellStart = performance.now();
      this._setRingProgress(0);
      // Looking at a NEW element clears the "already fired" guard for
      // whatever we were previously dwelling on.
      if (this._dwellFiredFor !== selectable) this._dwellFiredFor = null;
      return;
    }

    if (this._dwellFiredFor === selectable) {
      // Already activated this element on this visit -- require the
      // visitor to look away and back before it can fire again, so a
      // held gaze doesn't repeatedly re-trigger the same button.
      return;
    }

    const elapsed = performance.now() - this._dwellStart;
    const t = Math.min(1, elapsed / DWELL_MS);
    this._setRingProgress(t);

    if (t >= 1) {
      this._dwellFiredFor = selectable;
      this._setRingProgress(0);
      selectable.dispatchEvent(new CustomEvent("gestureselect", { bubbles: true }));
      selectable.click?.();
    }
  }

  _onPinchStart() {
    if (!this.enabled) return;
    this._pinching = true;
    this.el.classList.add("virtual-cursor--pinch");
  }

  _onPinchEnd() {
    if (!this.enabled) return;
    this.el.classList.remove("virtual-cursor--pinch");
    // Only synthesize a DOM click for the Leap Motion backend. When the
    // mouse backend is active, a real native click already fired on
    // mousedown/mouseup for whatever's under the cursor -- also
    // synthesizing one here would double-toggle every button a mouse
    // user clicks (found via automated testing: toggle buttons like
    // "Blood Flow" would intermittently flip twice on one click).
    if (this._pinching && this.hoverTarget && this._isLeapBackend()) {
      this.hoverTarget.dispatchEvent(new CustomEvent("gestureselect", { bubbles: true }));
      this.hoverTarget.click?.();
    }
    this._pinching = false;
  }
}
