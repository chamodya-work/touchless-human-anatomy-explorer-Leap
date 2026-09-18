/**
 * CalibrationScreen.js
 * -----------------------------------------------------------------------
 * Staff-only maintenance screen (toggled with F10 — see main.js) for
 * calibrating the Leap Motion LM-010's usable interaction area to the
 * actual screen, so visitors don't need exaggerated reach-to-the-edge
 * movements. Walks through four large on-screen targets (top-left,
 * top-right, bottom-left, bottom-right); the operator points at each one
 * and pinches to confirm. Values are handed to CalibrationManager, which
 * persists them and re-maps all subsequent pointer positions.
 *
 * This is a staff tool, not part of the visitor experience — it is only
 * reachable via a keyboard shortcut, matching the exhibition requirement
 * that ordinary visitors never need anything beyond point / pinch / open
 * palm.
 * -----------------------------------------------------------------------
 */
import { handTracking, GESTURES } from "../interaction/HandTrackingController.js";
import { calibrationManager } from "../leapmotion/CalibrationManager.js";

const TARGETS = ["topLeft", "topRight", "bottomLeft", "bottomRight"];
const TARGET_LABELS = {
  topLeft: "TOP LEFT",
  topRight: "TOP RIGHT",
  bottomLeft: "BOTTOM LEFT",
  bottomRight: "BOTTOM RIGHT",
};

export class CalibrationScreen {
  /**
   * @param {HTMLElement} root
   * @param {object} deps
   * @param {import('../leapmotion/LeapMotionAdapter.js').LeapMotionAdapter} deps.leapAdapter
   * @param {import('../interaction/GestureStateMachine.js').GestureStateMachine} deps.gestureStateMachine
   */
  constructor(root, { leapAdapter, gestureStateMachine }) {
    this.root = root;
    this.root.className = "calibration-screen hidden";
    this.leapAdapter = leapAdapter;
    this.gestureStateMachine = gestureStateMachine;
    this._active = false;
    this._targetIndex = -1;
    this._captured = {};
    this._unsubscribePinch = null;
  }

  open() {
    this._active = true;
    this.root.classList.remove("hidden");
    this._renderIntro();
  }

  close() {
    this._active = false;
    this.root.classList.add("hidden");
    this.root.innerHTML = "";
    this._unsubscribePinch?.();
    this._unsubscribePinch = null;
  }

  isOpen() {
    return this._active;
  }

  _renderIntro() {
    const leapConnected = this.leapAdapter?.connected;
    const calibrated = calibrationManager.isCalibrated();

    this.root.innerHTML = `
      <div class="calibration-panel">
        <h2>LEAP MOTION CALIBRATION</h2>
        ${
          leapConnected
            ? `<p>Status: <strong>LM-010 connected</strong>${calibrated ? " · custom calibration active" : " · using default range"}</p>
               <p class="calibration-hint">Point at each target as it appears and pinch to confirm.</p>
               <div class="calibration-actions">
                 <button class="mode-toggle" data-selectable id="cal-start">▶ Start Calibration</button>
                 <button class="mode-toggle" data-selectable id="cal-reset">⟲ Reset to Default</button>
                 <button class="mode-toggle" data-selectable id="cal-close">✕ Close (F10)</button>
               </div>`
            : `<p>Leap Motion is not currently connected — calibration has nothing to adjust.</p>
               <p class="calibration-hint">Connect the LM-010 and reload, then press F10 again.</p>
               <div class="calibration-actions">
                 <button class="mode-toggle" data-selectable id="cal-close">✕ Close (F10)</button>
               </div>`
        }
      </div>
    `;

    this.root.querySelector("#cal-start")?.addEventListener("click", () => this._beginSequence());
    this.root.querySelector("#cal-reset")?.addEventListener("click", () => {
      calibrationManager.reset();
      this.gestureStateMachine?.setMapFn((p) => calibrationManager.map(p));
      this._renderIntro();
    });
    this.root.querySelector("#cal-close").addEventListener("click", () => this.close());
  }

  _beginSequence() {
    this._targetIndex = 0;
    this._captured = {};
    this._renderTarget();

    this._unsubscribePinch = handTracking.on(GESTURES.PINCH_START, () => this._captureCurrentTarget());
  }

  _renderTarget() {
    const key = TARGETS[this._targetIndex];
    const positions = {
      topLeft: { top: "8%", left: "6%" },
      topRight: { top: "8%", right: "6%" },
      bottomLeft: { bottom: "8%", left: "6%" },
      bottomRight: { bottom: "8%", right: "6%" },
    };
    const pos = positions[key];
    const style = Object.entries(pos)
      .map(([k, v]) => `${k}:${v}`)
      .join(";");

    this.root.innerHTML = `
      <div class="calibration-panel calibration-panel--sequence">
        <h2>CALIBRATION — TARGET ${this._targetIndex + 1} / 4</h2>
        <p class="calibration-hint">Point at the highlighted circle and pinch to confirm.</p>
      </div>
      <div class="calibration-target" style="${style}">
        <span>${TARGET_LABELS[key]}</span>
      </div>
    `;
  }

  _captureCurrentTarget() {
    const key = TARGETS[this._targetIndex];
    const raw = this.leapAdapter?.lastRawSample;
    if (!raw || !raw.present) return; // ignore pinches with no live hand sample

    this._captured[key] = { x: raw.indexTip?.x ?? raw.palm.x, y: raw.indexTip?.y ?? raw.palm.y };
    this._targetIndex++;

    if (this._targetIndex >= TARGETS.length) {
      calibrationManager.setFromCorners(this._captured);
      this.gestureStateMachine?.setMapFn((p) => calibrationManager.map(p));
      this._unsubscribePinch?.();
      this._unsubscribePinch = null;
      this._renderDone();
    } else {
      this._renderTarget();
    }
  }

  _renderDone() {
    this.root.innerHTML = `
      <div class="calibration-panel">
        <h2>CALIBRATION COMPLETE</h2>
        <p>The interaction area has been saved and applied.</p>
        <div class="calibration-actions">
          <button class="mode-toggle" data-selectable id="cal-close">✕ Close (F10)</button>
        </div>
      </div>
    `;
    this.root.querySelector("#cal-close").addEventListener("click", () => this.close());
  }
}
