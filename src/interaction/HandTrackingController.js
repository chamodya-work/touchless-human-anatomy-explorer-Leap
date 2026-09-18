/**
 * HandTrackingController.js
 * -----------------------------------------------------------------------
 * Generic, SDK-agnostic hand interaction contract used by the whole
 * medical application. Nothing in /components, /anatomy or main.js talks
 * to Leap Motion / Ultraleap directly — everything talks to THIS class.
 *
 * Any tracking backend (Ultraleap LM-010 via the /leapmotion adapter, the
 * mouse fallback, a future camera-based tracker, etc.) simply calls the
 * emit* methods below with normalized data. This is what makes the
 * tracking hardware swappable without touching the medical application.
 *
 * Coordinate convention:
 *   position = { x, y } normalized to [-1, 1], origin at screen center,
 *   +x = right, +y = up. z (depth) is optional and only used for pinch
 *   "push/pull" zoom gestures: { x, y, z } where z grows as the hand
 *   moves toward the sensor.
 * -----------------------------------------------------------------------
 */

export const GESTURES = Object.freeze({
  HAND_DETECTED: "handDetected",
  HAND_LOST: "handLost",
  POINT: "point",
  PINCH_START: "pinchStart",
  PINCH_MOVE: "pinchMove",
  PINCH_END: "pinchEnd",
  OPEN_PALM: "openPalm",
  SWIPE_LEFT: "swipeLeft",
  SWIPE_RIGHT: "swipeRight",
  WAVE: "wave",
});

export class HandTrackingController {
  constructor() {
    this._listeners = new Map();
    Object.values(GESTURES).forEach((g) => this._listeners.set(g, new Set()));

    // Current tracking state, readable by UI components (e.g. GestureIndicator)
    this.state = {
      trackingAvailable: false, // true once ANY backend (leap or mouse) is active
      handPresent: false,
      isPinching: false,
      lastPosition: { x: 0, y: 0, z: 0 },
      backend: "none", // 'leapmotion' | 'mouse' | 'keyboard'
    };
  }

  // ---- subscription API -------------------------------------------------
  on(gesture, handler) {
    if (!this._listeners.has(gesture)) {
      throw new Error(`Unknown gesture type: ${gesture}`);
    }
    this._listeners.get(gesture).add(handler);
    return () => this._listeners.get(gesture).delete(handler); // unsubscribe fn
  }

  off(gesture, handler) {
    this._listeners.get(gesture)?.delete(handler);
  }

  _emit(gesture, payload) {
    this._listeners.get(gesture)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[HandTrackingController] listener error for ${gesture}:`, err);
      }
    });
  }

  setBackend(name) {
    this.state.backend = name;
  }

  // ---- called BY input adapters (LeapMotionAdapter, MouseInputAdapter) --
  onHandDetected() {
    this.state.trackingAvailable = true;
    this.state.handPresent = true;
    this._emit(GESTURES.HAND_DETECTED, {});
  }

  onHandLost() {
    this.state.handPresent = false;
    this.state.isPinching = false;
    this._emit(GESTURES.HAND_LOST, {});
  }

  onPoint(position) {
    this.state.lastPosition = position;
    this._emit(GESTURES.POINT, position);
  }

  onPinchStart(position) {
    this.state.isPinching = true;
    this.state.lastPosition = position || this.state.lastPosition;
    this._emit(GESTURES.PINCH_START, position);
  }

  onPinchMove(position) {
    this.state.lastPosition = position;
    this._emit(GESTURES.PINCH_MOVE, position);
  }

  onPinchEnd() {
    this.state.isPinching = false;
    this._emit(GESTURES.PINCH_END, {});
  }

  onOpenPalm() {
    this._emit(GESTURES.OPEN_PALM, {});
  }

  onSwipeLeft() {
    this._emit(GESTURES.SWIPE_LEFT, {});
  }

  onSwipeRight() {
    this._emit(GESTURES.SWIPE_RIGHT, {});
  }

  onWave() {
    this._emit(GESTURES.WAVE, {});
  }
}

// Singleton shared by the whole app — every adapter feeds this one instance,
// every UI component listens to this one instance.
export const handTracking = new HandTrackingController();
