/**
 * DebugOverlay.js
 * -----------------------------------------------------------------------
 * Developer/staff diagnostic HUD, toggled with F9 (see main.js). Shows
 * exactly what the tracking pipeline sees, frame by frame, so the LM-010
 * can be calibrated and debugged on-site at the actual exhibition rather
 * than guessed at remotely:
 *
 *   Hand detected, tracking confidence, raw hand X/Y/Z, index fingertip
 *   detected + position, pinch distance/state, pointing state, current
 *   gesture-machine state, FPS, and per-frame latency.
 *
 * Also draws small on-screen markers for the raw palm position, raw
 * index fingertip, and the final mapped pointer position, plus the
 * calibrated interaction-zone rectangle — so a visitor standing in front
 * of the sensor and an operator watching the screen can immediately see
 * *why* a gesture did or didn't register.
 * -----------------------------------------------------------------------
 */
export class DebugOverlay {
  constructor(root, { gestureStateMachine, viewer, leapAdapter, calibrationManager }) {
    this.root = root;
    this.root.className = "debug-overlay hidden";
    this.gsm = gestureStateMachine;
    this.viewer = viewer;
    this.leapAdapter = leapAdapter;
    this.calibrationManager = calibrationManager;
    this._visible = false;

    this.root.innerHTML = `
      <pre class="debug-overlay__text" id="debug-text"></pre>
      <svg class="debug-overlay__svg" id="debug-svg"></svg>
    `;
    this._textEl = this.root.querySelector("#debug-text");
    this._svgEl = this.root.querySelector("#debug-svg");

    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  toggle() {
    this._visible = !this._visible;
    this.root.classList.toggle("hidden", !this._visible);
  }

  isVisible() {
    return this._visible;
  }

  _tick() {
    requestAnimationFrame(this._tick);
    if (!this._visible) return;

    const d = this.gsm?.debug || {};
    const raw = this.leapAdapter?.lastRawSample;
    const backend = this.leapAdapter?.connected ? "leapmotion" : "mouse/keyboard";
    const cal = this.calibrationManager?.range;

    const fmt = (v, digits = 3) => (typeof v === "number" ? v.toFixed(digits) : "—");
    const fmtPos = (p) => (p ? `x:${fmt(p.x)} y:${fmt(p.y)} z:${fmt(p.z)}` : "—");

    const pinchSourceWarning =
      raw?.pinchSource === "none" ? "  <-- NOT FOUND IN FRAME, pinch cannot work (see README)" : "";

    this._textEl.textContent = [
      `LEAP MOTION DEBUG MODE (F9)                backend: ${backend}`,
      `─────────────────────────────────────────────────────────`,
      `Hand detected:        ${d.present ? "YES" : "NO"}`,
      `Tracking confidence:  ${d.confidence != null ? fmt(d.confidence, 2) : "n/a"}`,
      `Gesture state:        ${d.state || "—"}`,
      `Raw palm:             ${fmtPos(d.rawPalm)}`,
      `Raw index fingertip:  ${fmtPos(d.rawIndexTip)}`,
      `Smoothed index:       ${fmtPos(d.smoothedIndex)}`,
      `Mapped pointer:       ${fmtPos(d.pointer)}`,
      `Pinch strength:       ${d.pinchStrength != null ? fmt(d.pinchStrength, 2) : "n/a"}`,
      `Pinch source:         ${raw?.pinchSource || "—"}${pinchSourceWarning}`,
      `Grab strength:        ${d.grabStrength != null ? fmt(d.grabStrength, 2) : "n/a"}`,
      `Frame latency:        ${d.latencyMs ?? "—"} ms`,
      `Render FPS:           ${this.viewer?.fps ?? "—"}`,
      `Calibration range:    x[${fmt(cal?.xMin)}, ${fmt(cal?.xMax)}]  y[${fmt(cal?.yMin)}, ${fmt(cal?.yMax)}]`,
      ``,
      `F9  toggle this overlay      F10  open calibration screen`,
    ].join("\n");

    this._drawMarkers(d, cal);
  }

  _drawMarkers(d, cal) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const toScreen = (p) => ({ x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h });

    let svg = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="none" stroke="rgba(124,243,255,0.25)" stroke-width="2" stroke-dasharray="10 8"/>`;

    if (d.pointer) {
      const p = toScreen(d.pointer);
      svg += `<circle cx="${p.x}" cy="${p.y}" r="14" fill="none" stroke="#7cf3ff" stroke-width="3"/>`;
      svg += `<circle cx="${p.x}" cy="${p.y}" r="2" fill="#7cf3ff"/>`;
    }
    if (d.rawIndexTip) {
      // Raw sample plotted against the calibrated range for a visual
      // sanity check of the calibration bounds.
      const nx = cal ? ((d.rawIndexTip.x - cal.xMin) / (cal.xMax - cal.xMin)) * 2 - 1 : d.rawIndexTip.x;
      const ny = cal ? ((d.rawIndexTip.y - cal.yMin) / (cal.yMax - cal.yMin)) * 2 - 1 : d.rawIndexTip.y;
      const p = toScreen({ x: nx, y: ny });
      svg += `<circle cx="${p.x}" cy="${p.y}" r="8" fill="rgba(255,181,69,0.85)"/>`;
    }

    this._svgEl.setAttribute("width", w);
    this._svgEl.setAttribute("height", h);
    this._svgEl.innerHTML = svg;
  }
}
