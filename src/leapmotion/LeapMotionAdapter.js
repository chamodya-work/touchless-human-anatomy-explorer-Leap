/**
 * LeapMotionAdapter.js
 * -----------------------------------------------------------------------
 * THIS is the one file that changes when you wire up the real Ultraleap
 * LM-010 SDK. The WebSocket connection logic below is UNCHANGED from the
 * version already validated against the exhibition's LM-010 -- this pass
 * only changed what happens to a frame AFTER it arrives: raw hand data
 * now flows through GestureStateMachine (src/interaction/GestureStateMachine.js)
 * for smoothing, hysteresis and confirm/release-frame stabilization,
 * instead of being turned into gesture events directly here. That
 * smoothing/stability layer is the fix for "pointing is unreliable /
 * pinch is unreliable / open palm causes unwanted resets" -- see
 * GestureStateMachine.js for the full explanation.
 *
 * Nothing else in the application needs to know anything about Leap
 * Motion. The medical application only ever talks to `handTracking`
 * (via GestureStateMachine's calls into it).
 *
 * ============================ HOW TO CONNECT REAL HARDWARE =============
 * The Ultraleap LM-010 exposes tracking data on your Windows machine via
 * the Ultraleap Tracking Service. There are two common ways to reach it
 * from a web app on Windows:
 *
 *  OPTION A — Ultraleap "WebSocket Bridge" style service
 *    1. Install "Ultraleap Hand Tracking Software" (Gemini) on Windows.
 *    2. Install/enable the Ultraleap WebSocket API (ships with the
 *       tracking service, typically ws://localhost:6437/v7.json or a
 *       compatible LeapJS-style protocol depending on your SDK version).
 *    3. Point WS_URL below at it. Frames are parsed by _handleFrame(),
 *       which now hands off to GestureStateMachine.update() -- see below.
 *
 *  OPTION B — Native bridge (recommended for LM-010 exhibition installs)
 *    A small native/Electron/Node helper using the official Ultraleap
 *    SDK, forwarding tracking data to the browser over a local
 *    WebSocket. Keep the same JSON frame shape (see _handleFrame), or
 *    adjust _extractHandSample() to match your bridge's shape.
 *
 * Until real hardware is connected, `connect()` fails quietly and the
 * app automatically falls back to mouse/keyboard control — see main.js.
 * ========================================================================
 */

import { handTracking } from "../interaction/HandTrackingController.js";
import { GestureStateMachine, GESTURE_CONFIG } from "../interaction/GestureStateMachine.js";
import { calibrationManager } from "./CalibrationManager.js";

// ---- CONFIGURE ME when wiring the real LM-010 --------------------------
// const WS_URL = "ws://localhost:6437/v7.json"; // <-- adjust to your Ultraleap service endpoint
const WS_URL = "ws://localhost:6437/v6.json";
const CONNECT_TIMEOUT_MS = 2500;
// --------------------------------------------------------------------------

// Re-exported so main.js / the debug & calibration UI can read/tune the
// SAME config object the state machine uses, without importing it twice.
export { GESTURE_CONFIG };

export class LeapMotionAdapter {
  constructor(controller = handTracking) {
    this.controller = controller;
    this.socket = null;
    this.connected = false;
    this._lastFrameTime = 0;

    // The stabilization layer. Exposed so main.js can wire the
    // calibration/debug UI to the exact same instance driving gestures.
    this.gestureStateMachine = new GestureStateMachine(
      controller,
      {},
      (pos) => calibrationManager.map(pos)
    );

    // Latest PRE-calibration sample, in the adapter's own normalized
    // space (roughly -0.5..0.5 before calibration remaps it). Read by
    // CalibrationScreen (to record corner targets) and DebugOverlay (to
    // plot the raw marker against the calibrated bounds).
    this.lastRawSample = { present: false, palm: { x: 0, y: 0, z: 0 }, indexTip: null };
  }

  connect() {
    return new Promise((resolve) => {
      let settled = false;
      const fail = () => {
        if (settled) return;
        settled = true;
        this.connected = false;
        resolve(false);
      };

      try {
        this.socket = new WebSocket(WS_URL);
      } catch (err) {
        console.warn("[LeapMotionAdapter] Could not open WebSocket:", err);
        fail();
        return;
      }

      const timeout = setTimeout(fail, CONNECT_TIMEOUT_MS);

      const succeed = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.connected = true;
        this.controller.setBackend("leapmotion");
        resolve(true);
      };

      this.socket.onopen = () => {
        // A successful WebSocket handshake is enough to select Leap as the
        // backend. The first tracking frame may arrive slightly later.
        succeed();
        // Some Ultraleap services require an enable-gestures handshake:
        // this.socket.send(JSON.stringify({ enableGestures: true, background: true }));
      };

      this.socket.onmessage = (event) => {
        succeed();
        this._safeHandleMessage(event);
      };

      this.socket.onerror = () => {
        clearTimeout(timeout);
        fail();
      };

      this.socket.onclose = () => {
        clearTimeout(timeout);
        if (this.connected) {
          this.connected = false;
          // Feed an "absent" sample so the state machine runs its own
          // grace-period logic rather than us declaring hand-lost
          // instantly on a transient socket hiccup.
          this._feedAbsentSample();
        }
        fail();
      };
    });
  }

  disconnect() {
    if (this.socket) {
      try {
        this.socket.close();
      } catch (_) {
        /* noop */
      }
    }
    this.connected = false;
  }

  _safeHandleMessage(event) {
    try {
      const frame = JSON.parse(event.data);
      this._handleFrame(frame);
    } catch (err) {
      console.error("[LeapMotionAdapter] Failed to parse tracking frame:", err);
    }
  }

  _feedAbsentSample() {
    const now = performance.now();
    const dt = this._lastFrameTime ? (now - this._lastFrameTime) / 1000 : 1 / 60;
    this._lastFrameTime = now;
    this.lastRawSample = { present: false, palm: { x: 0, y: 0, z: 0 }, indexTip: null };
    this.gestureStateMachine.update(this.lastRawSample, dt);
  }

  /**
   * Extracts a normalized, hardware-agnostic sample from one raw
   * Leap/Ultraleap frame and hands it to GestureStateMachine. This is
   * the ONLY place that understands the Ultraleap frame shape; if your
   * SDK/service version ships a different shape, this is what to edit.
   */
  _handleFrame(frame) {
    const now = performance.now();
    const dt = this._lastFrameTime ? (now - this._lastFrameTime) / 1000 : 1 / 60;
    this._lastFrameTime = now;

    const hands = frame?.hands || [];
    if (hands.length === 0) {
      this.lastRawSample = { present: false, palm: { x: 0, y: 0, z: 0 }, indexTip: null };
      this.gestureStateMachine.update(this.lastRawSample, dt);
      return;
    }

    const hand = hands[0];
    const palmMm = hand.palmPosition || [0, 0, 0];

    // Rough Leap interaction-box (mm) -> normalized space. This is
    // intentionally the SAME normalization as before; calibration
    // (CalibrationManager) then refines it per-exhibition rather than
    // this constant needing to be perfect out of the box.
    const palm = {
      x: palmMm[0] / 200,
      y: (palmMm[1] - 200) / 200,
      z: clamp(palmMm[2] / 200, -1, 1),
    };

    // Index fingertip: prefer real per-finger data if the SDK/service
    // provides it (fingers[].type === 1 is the index finger in the
    // standard Leap Motion finger ordering: 0 thumb, 1 index, 2 middle,
    // 3 ring, 4 pinky). Fall back to a fixed offset from the palm along
    // the hand's pointing direction if finger-level data isn't present
    // -- keeps pointing usable even against a minimal bridge
    // implementation that only forwards palm + pinch/grab strength.
    let indexTip = null;
    const indexFinger = hand.fingers?.find((f) => f.type === 1);
    // v6 WebSocket frames put fingers in the frame-level `pointables`
    // array, not in `hand.fingers`.
    const indexPointable = frame.pointables?.find(
      (p) => p.handId === hand.id && p.type === 1
    );
    const indexTipMm = indexFinger?.tipPosition || indexPointable?.tipPosition;
    if (indexTipMm) {
      const t = indexTipMm;
      indexTip = { x: t[0] / 200, y: (t[1] - 200) / 200, z: clamp(t[2] / 200, -1, 1) };
    } else if (hand.direction) {
      const [dx, dy, dz] = hand.direction;
      indexTip = {
        x: (palmMm[0] + dx * 80) / 200,
        y: (palmMm[1] + dy * 80 - 200) / 200,
        z: clamp((palmMm[2] + dz * 80) / 200, -1, 1),
      };
    } else {
      indexTip = palm;
    }

    // Extended-finger count, if the SDK/service reports per-finger
    // `extended` booleans. Used only to make open-palm detection a bit
    // more specific (require most fingers extended, not just low grab
    // strength); harmless if unavailable (falls back to null = "unknown"
    // and GestureStateMachine treats that as "don't gate on this").
    let extendedFingers = null;
    const fingerData = Array.isArray(hand.fingers)
      ? hand.fingers
      : frame.pointables?.filter((p) => p.handId === hand.id);
    if (Array.isArray(fingerData) && fingerData.some((f) => typeof f.extended === "boolean")) {
      extendedFingers = fingerData.filter((f) => f.extended).length;
    }

    // ---- pinch strength: try every shape we've seen in the wild -------
    // This is deliberately a fallback CHAIN, not a single field read.
    // Different Ultraleap/LeapJS service versions expose pinch
    // differently (or not at all), and getting this wrong silently
    // means "pinch never registers no matter how hard you try" -- which
    // is exactly the failure mode this was rewritten to avoid. Check
    // src/components/DebugOverlay.js (F9) "Pinch source" line to see
    // which of these paths is actually firing on your hardware.
    const pinchResult = extractPinchStrength(hand);

    this.lastRawSample = {
      present: true,
      palm,
      indexTip,
      pinchStrength: pinchResult.value,
      pinchSource: pinchResult.source, // for the debug overlay only
      grabStrength: hand.grabStrength ?? hand.grab_strength ?? 0,
      extendedFingers,
      confidence: hand.confidence ?? null,
    };

    this.gestureStateMachine.update(this.lastRawSample, dt);
  }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Tries, in order:
 *   1. A direct 0..1 pinchStrength field, under every field-name variant
 *      we've seen across Ultraleap/LeapJS service versions.
 *   2. A pinch DISTANCE field (mm), converted to a comparable 0..1 value.
 *   3. Computed directly from thumb-tip <-> index-tip Euclidean distance,
 *      if the frame includes per-finger tip positions at all -- this is
 *      the most universally-available fallback, since almost every
 *      Leap-like API exposes finger tip positions even when it doesn't
 *      expose a precomputed "pinch strength".
 *   4. 0, with source "none" (visible in the F9 debug overlay), meaning
 *      this frame shape genuinely doesn't give us enough to detect a
 *      pinch at all -- see README troubleshooting for what to do next.
 */
function extractPinchStrength(hand) {
  const direct =
    hand.pinchStrength ?? hand.pinch_strength ?? hand.pinch?.strength ?? hand.grab?.pinchStrength;
  if (typeof direct === "number") {
    return { value: clamp(direct, 0, 1), source: "field" };
  }

  const distance = hand.pinchDistance ?? hand.pinch_distance ?? hand.pinch?.distance;
  if (typeof distance === "number") {
    return { value: pinchStrengthFromDistance(distance), source: "distance" };
  }

  const computed = computePinchStrengthFromFingers(hand);
  if (computed != null) {
    return { value: computed, source: "computed" };
  }

  return { value: 0, source: "none" };
}

/** Thumb-tip to index-tip distance -> a comparable 0..1 pinch strength.
 *  Works off raw fingertip positions, which are present in nearly every
 *  Leap-like frame format even when a precomputed strength isn't. */
function computePinchStrengthFromFingers(hand) {
  if (!Array.isArray(hand.fingers)) return null;
  const thumb = hand.fingers.find((f) => f.type === 0);
  const index = hand.fingers.find((f) => f.type === 1);
  const thumbTip = thumb?.tipPosition;
  const indexTip = index?.tipPosition;
  if (!thumbTip || !indexTip) return null;

  const dx = thumbTip[0] - indexTip[0];
  const dy = thumbTip[1] - indexTip[1];
  const dz = thumbTip[2] - indexTip[2];
  const distanceMm = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return pinchStrengthFromDistance(distanceMm);
}

/** Some SDK versions report pinch as a distance (mm) rather than a 0..1
 *  strength. Approximate a comparable 0..1 value: ~15mm or less = fully
 *  pinched (fingertips together, accounting for finger width), ~55mm+ =
 *  fully open (a relaxed hand's natural thumb-index gap). */
function pinchStrengthFromDistance(distanceMm) {
  if (typeof distanceMm !== "number") return 0;
  return clamp(1 - (distanceMm - 15) / 40, 0, 1);
}
