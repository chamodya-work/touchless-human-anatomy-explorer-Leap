/**
 * fade.js
 * -----------------------------------------------------------------------
 * Tiny reusable opacity tween so toggles (Blood Flow, Breathing Mode,
 * Brain Activity) fade smoothly in/out instead of instantly snapping
 * visible on/off -- part of the exhibition-quality animation pass.
 *
 * Usage:
 *   const fader = new OpacityFader(pointsMaterial, targetOpacityWhenOn);
 *   fader.setOn(true);   // starts fading in, sets object3D.visible = true
 *   fader.setOn(false);  // fades out, then sets object3D.visible = false
 *   fader.update(dt);    // call once per frame from userData.onFrame
 * -----------------------------------------------------------------------
 */
export class OpacityFader {
  constructor(object3D, targetOpacity = 1, duration = 0.4) {
    this.object3D = object3D;
    this.targetOpacity = targetOpacity;
    this.duration = duration;
    this.current = 0;
    this.goal = 0;
    object3D.visible = false;
    if (object3D.material) object3D.material.transparent = true;
    this._applyOpacity(0);
  }

  setOn(on) {
    this.goal = on ? this.targetOpacity : 0;
    if (on) this.object3D.visible = true;
  }

  update(dt) {
    if (Math.abs(this.current - this.goal) < 0.001) {
      this.current = this.goal;
      if (this.goal === 0 && this.object3D.visible) {
        this.object3D.visible = false;
      }
      return;
    }
    const rate = 1 / Math.max(0.05, this.duration);
    const step = rate * dt;
    this.current += Math.sign(this.goal - this.current) * step;
    this.current = Math.max(0, Math.min(this.targetOpacity, this.current));
    this._applyOpacity(this.current);
  }

  _applyOpacity(v) {
    if (this.object3D.material) this.object3D.material.opacity = v;
  }
}
