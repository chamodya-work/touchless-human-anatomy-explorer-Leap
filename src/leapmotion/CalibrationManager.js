/**
 * CalibrationManager.js
 * -----------------------------------------------------------------------
 * Maps raw Leap Motion coordinates (in whatever unit the adapter reads
 * them in, before the -1..1 normalization) to the actual usable screen
 * area, so a visitor doesn't need exaggerated reach-to-the-edges
 * movements to hit corner UI. Values are derived from a simple 4-point
 * calibration (see CalibrationScreen.js) and persisted to localStorage
 * so they survive a page reload / exhibition PC restart.
 *
 * Mapping model: independent per-axis min/max (not a full homography) --
 * simpler to reason about and to re-calibrate on-site, and sufficient
 * for a hand-tracked pointer (as opposed to e.g. a distorted camera lens
 * that would need a true perspective correction).
 * -----------------------------------------------------------------------
 */

const STORAGE_KEY = "anatomyExplorer.calibration.v1";

const DEFAULT_RANGE = {
  xMin: -0.5,
  xMax: 0.5,
  yMin: -0.4,
  yMax: 0.4,
};

export class CalibrationManager {
  constructor() {
    this.range = this._load() || { ...DEFAULT_RANGE };
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        typeof parsed.xMin === "number" &&
        typeof parsed.xMax === "number" &&
        typeof parsed.yMin === "number" &&
        typeof parsed.yMax === "number" &&
        parsed.xMax > parsed.xMin &&
        parsed.yMax > parsed.yMin
      ) {
        return parsed;
      }
    } catch (_) {
      /* corrupt/blocked storage -- fall back to defaults */
    }
    return null;
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.range));
    } catch (_) {
      console.warn("[CalibrationManager] Could not persist calibration to localStorage.");
    }
  }

  reset() {
    this.range = { ...DEFAULT_RANGE };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      /* ignore */
    }
  }

  isCalibrated() {
    try {
      return localStorage.getItem(STORAGE_KEY) != null;
    } catch (_) {
      return false;
    }
  }

  /**
   * Called by CalibrationScreen with the four raw corner samples:
   * { topLeft, topRight, bottomLeft, bottomRight } each {x,y}.
   */
  setFromCorners(corners) {
    const xs = [corners.topLeft.x, corners.topRight.x, corners.bottomLeft.x, corners.bottomRight.x];
    const ys = [corners.topLeft.y, corners.topRight.y, corners.bottomLeft.y, corners.bottomRight.y];
    const leftXs = [corners.topLeft.x, corners.bottomLeft.x];
    const rightXs = [corners.topRight.x, corners.bottomRight.x];
    const topYs = [corners.topLeft.y, corners.topRight.y];
    const bottomYs = [corners.bottomLeft.y, corners.bottomRight.y];

    this.range = {
      xMin: Math.min(...leftXs),
      xMax: Math.max(...rightXs),
      // Screen Y grows downward but our normalized hand-space Y grows
      // upward (matches existing HandTrackingController convention), so
      // "top" targets should read as the higher raw Y value.
      yMax: Math.max(...topYs),
      yMin: Math.min(...bottomYs),
    };
    this.save();
    return this.range;
  }

  /** Maps a raw {x,y,z} sample into the -1..1 range the app expects. */
  map(pos) {
    const { xMin, xMax, yMin, yMax } = this.range;
    const nx = ((pos.x - xMin) / (xMax - xMin)) * 2 - 1;
    const ny = ((pos.y - yMin) / (yMax - yMin)) * 2 - 1;
    return { x: nx, y: ny, z: pos.z ?? 0 };
  }
}

export const calibrationManager = new CalibrationManager();
