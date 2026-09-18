/**
 * GestureStateMachine.js
 * -----------------------------------------------------------------------
 * Turns noisy, frame-by-frame raw hand-tracking samples into the stable,
 * discrete gesture events the rest of the app consumes (via the shared
 * `handTracking` HandTrackingController). This is the fix for:
 *
 *   "pointing is unreliable, pinch detection is unreliable, gestures
 *    sometimes do not trigger, tracking frequently resets, open palm
 *    causes unwanted resets, selecting is difficult, users need to
 *    repeat gestures"
 *
 * Design (each one maps directly to a symptom above):
 *
 *  1. POSITION SMOOTHING (exponential moving average) + DEAD ZONE +
 *     VELOCITY LIMITING -> the on-screen pointer stops shaking / jumping
 *     from raw sensor jitter, but still follows deliberate movement
 *     immediately.
 *  2. PINCH HYSTERESIS (separate start/release thresholds, START higher
 *     than RELEASE) -> a hand held right at the pinch boundary can't
 *     rapidly flicker pinch/unpinch/pinch/unpinch.
 *  3. CONFIRM / RELEASE FRAME COUNTS -> a single noisy frame can never
 *     flip a gesture on its own; the raw condition must hold for several
 *     consecutive frames both to START and to STOP a gesture.
 *  4. EXPLICIT STATE MACHINE with PRIORITY -> only one discrete gesture
 *     is ever "active" at a time (pinching beats pointing; tracking-lost
 *     suspends everything rather than emitting arbitrary events).
 *  5. COOLDOWNS on discrete pulse gestures (open palm, swipe, wave) ->
 *     these fire once per deliberate gesture, not once per frame.
 *  6. TRACKING-LOSS GRACE PERIOD -> a single dropped frame (very common
 *     with real hardware) does NOT mean "hand lost"; only a sustained
 *     absence does, and even then the app is told to *suspend*
 *     interaction, never to reset anything (see main.js / AnatomyViewer).
 *
 * All thresholds are in GESTURE_CONFIG below and are intentionally
 * mutable at runtime -- the Calibration/Debug tooling (F9/F10) adjusts
 * these live so you can tune the exact exhibition PC + LM-010 unit
 * on-site, without editing code.
 * -----------------------------------------------------------------------
 */

export const GESTURE_CONFIG = {
  // Position smoothing: 0 = no smoothing (raw, jittery), close to 1 =
  // very smooth but laggy. 0.35-0.5 is a good starting point for LM-010.
  HAND_SMOOTHING: 0.4,

  // Pinch hysteresis band. START must be strictly greater than RELEASE.
  // NOTE: if pinch still won't trigger on your hardware after this
  // pass, press F9 and check "Pinch source" -- if it says "none", the
  // frame shape from your Ultraleap service isn't recognized at all
  // (see LeapMotionAdapter.extractPinchStrength) and no threshold
  // tuning here will help until that's fixed.
  PINCH_START_THRESHOLD: 0.55,
  PINCH_RELEASE_THRESHOLD: 0.3,

  // Consecutive frames the raw condition must hold before the state
  // machine commits to starting / releasing a pinch.
  GESTURE_CONFIRM_FRAMES: 3,
  GESTURE_RELEASE_FRAMES: 3,

  // Open palm ("pause") is deliberately slower to confirm than a pinch,
  // since it's a full-hand-relax rather than a precise fingertip action,
  // and firing it accidentally must never disrupt navigation.
  OPEN_PALM_CONFIRM_FRAMES: 10,
  OPEN_PALM_GRAB_MAX: 0.15,

  // Discrete "pulse" gestures (open palm, swipe, wave) cannot re-fire
  // more often than this, even if the raw condition keeps holding.
  GESTURE_COOLDOWN_MS: 700,

  // Cursor motion shaping.
  MAX_CURSOR_SPEED: 3.2, // normalized units/sec the smoothed pointer may move
  DEAD_ZONE: 0.0035, // ignore per-frame deltas smaller than this

  // Swipe / wave detection (unchanged in spirit from the original build,
  // just now gated by the same cooldown as other discrete gestures).
  SWIPE_VELOCITY_THRESHOLD: 900, // mm/s lateral palm speed
  WAVE_DIRECTION_CHANGES: 4,
  WAVE_WINDOW_MS: 1500,

  // A single dropped frame is normal for real hardware and must NOT be
  // treated as "hand lost" -- only sustained absence past this grace
  // period counts.
  TRACKING_LOST_GRACE_MS: 250,
};

export const STATE = Object.freeze({
  IDLE: "IDLE",
  HAND_DETECTED: "HAND_DETECTED",
  POINTING: "POINTING",
  PINCH_PENDING: "PINCH_PENDING",
  PINCHING: "PINCHING",
  PINCH_RELEASING: "PINCH_RELEASING",
  OPEN_PALM: "OPEN_PALM",
  TRACKING_LOST: "TRACKING_LOST",
});

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export class GestureStateMachine {
  /**
   * @param {HandTrackingController} controller - emits the generic events
   * @param {object} [config] - overrides merged onto GESTURE_CONFIG
   * @param {(pos:{x:number,y:number,z:number})=>{x:number,y:number,z:number}} [mapFn]
   *   optional calibration mapping applied to the smoothed index-tip
   *   position before it's emitted as a pointer position.
   */
  constructor(controller, config = {}, mapFn = null) {
    this.controller = controller;
    this.config = { ...GESTURE_CONFIG, ...config };
    this.mapFn = mapFn || ((p) => p);

    this.state = STATE.IDLE;
    this._absentMs = 0;

    this._smoothedIndex = { x: 0, y: 0, z: 0 };
    this._smoothedPalm = { x: 0, y: 0, z: 0 };
    this._hasSmoothed = false;
    this._lastEmittedPointer = { x: 0, y: 0, z: 0 };

    this._pinchConfirmCount = 0;
    this._pinchReleaseCount = 0;
    this._openPalmConfirmCount = 0;
    this._lastOpenPalmFired = -Infinity;
    this._lastSwipeFired = -Infinity;

    this._lastPalmXRaw = null;
    this._waveDirectionChanges = 0;
    this._lastWaveDirection = 0;
    this._lastWaveWindowStart = 0;
    this._lastWaveFired = -Infinity;

    this._now = 0;

    // Read by DebugOverlay -- always reflects the most recent update().
    this.debug = {
      present: false,
      rawPalm: null,
      rawIndexTip: null,
      smoothedIndex: null,
      pointer: null,
      pinchStrength: null,
      grabStrength: null,
      confidence: null,
      state: this.state,
      latencyMs: 0,
    };
  }

  setConfig(partial) {
    Object.assign(this.config, partial);
  }

  setMapFn(mapFn) {
    this.mapFn = mapFn || ((p) => p);
  }

  /**
   * @param {object} sample - raw normalized hand sample for this frame:
   *   { present, palm:{x,y,z}, indexTip:{x,y,z}|null, pinchStrength,
   *     grabStrength, extendedFingers, confidence }
   *   Positions are expected already-normalized to roughly [-1, 1]
   *   (the adapter feeding this class does that hardware-specific step).
   * @param {number} dt - seconds since the previous update() call
   */
  update(sample, dt) {
    const cfg = this.config;
    this._now += dt * 1000;
    dt = Math.min(0.25, Math.max(0, dt));

    this.debug.rawPalm = sample.palm;
    this.debug.rawIndexTip = sample.indexTip;
    this.debug.pinchStrength = sample.pinchStrength ?? null;
    this.debug.grabStrength = sample.grabStrength ?? null;
    this.debug.confidence = sample.confidence ?? null;
    this.debug.present = !!sample.present;

    // ---- presence / tracking-loss grace period -------------------------
    if (!sample.present) {
      this._absentMs += dt * 1000;
      if (this._absentMs >= cfg.TRACKING_LOST_GRACE_MS && this.state !== STATE.TRACKING_LOST) {
        this.state = STATE.TRACKING_LOST;
        this._resetGestureCounters();
        this.controller.onHandLost();
      }
      this.debug.state = this.state;
      return;
    }
    if (this._absentMs > 0 && this.state === STATE.TRACKING_LOST) {
      this.state = STATE.HAND_DETECTED;
      this.controller.onHandDetected();
    } else if (this.state === STATE.IDLE) {
      this.state = STATE.HAND_DETECTED;
      this.controller.onHandDetected();
    }
    this._absentMs = 0;

    // ---- smoothing (EMA) + dead zone + velocity limiting ---------------
    const alpha = clamp(1 - cfg.HAND_SMOOTHING, 0.02, 1);
    const rawIndex = sample.indexTip || sample.palm;

    if (!this._hasSmoothed) {
      this._smoothedIndex = { ...rawIndex };
      this._smoothedPalm = { ...sample.palm };
      this._hasSmoothed = true;
    } else {
      this._smoothedPalm = lerp3(this._smoothedPalm, sample.palm, alpha);

      const target = lerp3(this._smoothedIndex, rawIndex, alpha);
      let delta = {
        x: target.x - this._smoothedIndex.x,
        y: target.y - this._smoothedIndex.y,
        z: (target.z ?? 0) - (this._smoothedIndex.z ?? 0),
      };

      // Dead zone: ignore sub-threshold jitter entirely.
      const mag = Math.hypot(delta.x, delta.y);
      if (mag < cfg.DEAD_ZONE) {
        delta.x = 0;
        delta.y = 0;
      } else {
        // Velocity limiting: clamp how far the smoothed point may travel
        // in one frame so a single bad sample can't teleport the cursor.
        const maxStep = cfg.MAX_CURSOR_SPEED * dt;
        const stepMag = Math.hypot(delta.x, delta.y);
        if (stepMag > maxStep && stepMag > 0) {
          const scale = maxStep / stepMag;
          delta.x *= scale;
          delta.y *= scale;
        }
      }

      this._smoothedIndex = {
        x: this._smoothedIndex.x + delta.x,
        y: this._smoothedIndex.y + delta.y,
        z: target.z ?? this._smoothedIndex.z,
      };
    }

    const pointer = this.mapFn({ ...this._smoothedIndex });
    pointer.x = clamp(pointer.x, -1, 1);
    pointer.y = clamp(pointer.y, -1, 1);
    this._lastEmittedPointer = pointer;
    this.debug.smoothedIndex = { ...this._smoothedIndex };
    this.debug.pointer = { ...pointer };

    // ---- pinch: hysteresis + confirm/release frame counting -------------
    const pinchStrength = sample.pinchStrength ?? 0;
    const aboveStart = pinchStrength >= cfg.PINCH_START_THRESHOLD;
    const belowRelease = pinchStrength <= cfg.PINCH_RELEASE_THRESHOLD;

    if (this.state === STATE.PINCHING) {
      if (belowRelease) {
        this._pinchReleaseCount++;
        if (this._pinchReleaseCount >= cfg.GESTURE_RELEASE_FRAMES) {
          this.state = STATE.POINTING;
          this._pinchReleaseCount = 0;
          this.controller.onPinchEnd();
        } else {
          this.controller.onPinchMove(pointer);
        }
      } else {
        this._pinchReleaseCount = 0;
        this.controller.onPinchMove(pointer);
      }
    } else {
      // Not currently pinching -- pinching has PRIORITY over pointing:
      // while a pinch is pending confirmation we still move the cursor
      // (so hover feedback stays alive) but we do not evaluate open
      // palm / swipe, since a "pinch about to start" shouldn't also be
      // misread as a hand-relax gesture.
      if (aboveStart) {
        this._pinchConfirmCount++;
        if (this._pinchConfirmCount >= cfg.GESTURE_CONFIRM_FRAMES) {
          this.state = STATE.PINCHING;
          this._pinchConfirmCount = 0;
          this.controller.onPinchStart(pointer);
        } else {
          this.state = STATE.PINCH_PENDING;
          this.controller.onPoint(pointer);
        }
      } else {
        this._pinchConfirmCount = 0;
        if (this.state !== STATE.OPEN_PALM) this.state = STATE.POINTING;
        this.controller.onPoint(pointer);
      }
    }

    // ---- open palm: confirm frames + cooldown, priority below pinch -----
    const notPinchingOrPending = this.state !== STATE.PINCHING && this.state !== STATE.PINCH_PENDING;
    if (notPinchingOrPending) {
      const grabStrength = sample.grabStrength ?? 0;
      const fingersOk = sample.extendedFingers == null || sample.extendedFingers >= 4;
      const rawOpenPalm = grabStrength <= cfg.OPEN_PALM_GRAB_MAX && fingersOk;

      if (rawOpenPalm) {
        this._openPalmConfirmCount++;
        const cooledDown = this._now - this._lastOpenPalmFired > cfg.GESTURE_COOLDOWN_MS;
        if (this._openPalmConfirmCount >= cfg.OPEN_PALM_CONFIRM_FRAMES && cooledDown) {
          this.state = STATE.OPEN_PALM;
          this._lastOpenPalmFired = this._now;
          this._openPalmConfirmCount = 0;
          this.controller.onOpenPalm();
        }
      } else {
        this._openPalmConfirmCount = 0;
        if (this.state === STATE.OPEN_PALM) this.state = STATE.POINTING;
      }
    }

    // ---- swipe + wave: velocity-based, cooldown-gated -------------------
    if (this._lastPalmXRaw !== null && notPinchingOrPending) {
      const velocity = ((sample.palm.x - this._lastPalmXRaw) / dt) * 1; // already normalized units/sec
      const velocityMmS = velocity * 200; // rough normalized->mm/s for threshold comparability
      if (Math.abs(velocityMmS) > cfg.SWIPE_VELOCITY_THRESHOLD) {
        const cooledDown = this._now - this._lastSwipeFired > cfg.GESTURE_COOLDOWN_MS;
        if (cooledDown) {
          this._lastSwipeFired = this._now;
          if (velocity > 0) this.controller.onSwipeRight();
          else this.controller.onSwipeLeft();
        }
      }

      const direction = Math.sign(velocity);
      if (direction !== 0 && direction !== this._lastWaveDirection) {
        this._waveDirectionChanges++;
        this._lastWaveDirection = direction;
      }
      if (this._now - this._lastWaveWindowStart > cfg.WAVE_WINDOW_MS) {
        const cooledDown = this._now - this._lastWaveFired > cfg.GESTURE_COOLDOWN_MS;
        if (this._waveDirectionChanges >= cfg.WAVE_DIRECTION_CHANGES && cooledDown) {
          this._lastWaveFired = this._now;
          this.controller.onWave();
        }
        this._waveDirectionChanges = 0;
        this._lastWaveWindowStart = this._now;
      }
    }
    this._lastPalmXRaw = sample.palm.x;

    this.debug.state = this.state;
    this.debug.latencyMs = Math.round(dt * 1000);
  }

  _resetGestureCounters() {
    this._pinchConfirmCount = 0;
    this._pinchReleaseCount = 0;
    this._openPalmConfirmCount = 0;
    this._hasSmoothed = false;
  }
}

function lerp3(a, b, alpha) {
  return {
    x: a.x + (b.x - a.x) * alpha,
    y: a.y + (b.y - a.y) * alpha,
    z: (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * alpha,
  };
}
