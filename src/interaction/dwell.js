/**
 * dwell.js
 * -----------------------------------------------------------------------
 * Timing shared by the two dwell-to-select paths, so "point at it and hold
 * still" feels identical wherever it is used:
 *
 *   - DOM controls (menu tiles, Back button, toggles) -> VirtualCursor
 *   - 3D anatomical parts (Heart, Brain, ...)         -> AnatomyViewer
 *
 * Dwell is a SECOND, independent way to select alongside pinch. It relies
 * only on pointer position, so it keeps working on a setup where pinch
 * detection is unreliable (see CHANGELOG.md) -- which is why both paths
 * must use the same duration rather than each picking their own.
 * -----------------------------------------------------------------------
 */

/** How long the pointer must stay on the same target to activate it. */
export const DWELL_MS = 900;
