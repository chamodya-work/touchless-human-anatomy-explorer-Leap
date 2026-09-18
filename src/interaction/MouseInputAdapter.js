/**
 * MouseInputAdapter.js
 * -----------------------------------------------------------------------
 * Development / accessibility fallback input backend.
 * Translates mouse + touch input into the same generic gesture events
 * that LeapMotionAdapter produces, feeding the shared HandTrackingController.
 *
 * Mapping:
 *   mousemove              -> onPoint(position)
 *   mousedown + drag        -> onPinchStart / onPinchMove (drag = "pinch & move")
 *   mouseup                 -> onPinchEnd
 *   wheel                   -> treated as depth (z) push/pull, feeds onPinchMove z
 *   double-click / Space    -> onOpenPalm (return to menu)
 *   short idle->move burst  -> onWave (used to exit idle / welcome screens)
 * -----------------------------------------------------------------------
 */

export class MouseInputAdapter {
  constructor(controller, targetElement = window) {
    this.controller = controller;
    this.target = targetElement;
    this._dragging = false;
    this._depth = 0;
    this._lastMoveTime = 0;
    this._moveBurst = 0;
    this._enabled = false;

    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onDoubleClick = this._onDoubleClick.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
  }

  start() {
    if (this._enabled) return;
    this._enabled = true;
    this.controller.setBackend("mouse");
    this.controller.onHandDetected(); // mouse presence == "hand" always available
    window.addEventListener("mousemove", this._onMouseMove);
    window.addEventListener("mousedown", this._onMouseDown);
    window.addEventListener("mouseup", this._onMouseUp);
    window.addEventListener("wheel", this._onWheel, { passive: true });
    window.addEventListener("dblclick", this._onDoubleClick);
    window.addEventListener("touchstart", this._onTouchStart, { passive: true });
    window.addEventListener("touchmove", this._onTouchMove, { passive: true });
    window.addEventListener("touchend", this._onTouchEnd);
  }

  stop() {
    this._enabled = false;
    window.removeEventListener("mousemove", this._onMouseMove);
    window.removeEventListener("mousedown", this._onMouseDown);
    window.removeEventListener("mouseup", this._onMouseUp);
    window.removeEventListener("wheel", this._onWheel);
    window.removeEventListener("dblclick", this._onDoubleClick);
    window.removeEventListener("touchstart", this._onTouchStart);
    window.removeEventListener("touchmove", this._onTouchMove);
    window.removeEventListener("touchend", this._onTouchEnd);
  }

  _normalize(clientX, clientY) {
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -((clientY / window.innerHeight) * 2 - 1);
    return { x, y, z: this._depth };
  }

  _detectWave(now) {
    // A few rapid direction changes within ~1.2s reads as a "wave"
    if (now - this._lastMoveTime < 220) {
      this._moveBurst++;
      if (this._moveBurst > 5) {
        this._moveBurst = 0;
        this.controller.onWave();
      }
    } else {
      this._moveBurst = 0;
    }
    this._lastMoveTime = now;
  }

  _onMouseMove(e) {
    const pos = this._normalize(e.clientX, e.clientY);
    this._detectWave(performance.now());
    if (this._dragging) {
      this.controller.onPinchMove(pos);
    } else {
      this.controller.onPoint(pos);
    }
  }

  _onMouseDown(e) {
    this._dragging = true;
    this.controller.onPinchStart(this._normalize(e.clientX, e.clientY));
  }

  _onMouseUp() {
    if (this._dragging) {
      this._dragging = false;
      this.controller.onPinchEnd();
    }
  }

  _onWheel(e) {
    this._depth += e.deltaY > 0 ? -0.05 : 0.05;
    this._depth = Math.max(-1, Math.min(1, this._depth));
    this.controller.onPinchMove({ ...this.controller.state.lastPosition, z: this._depth });
  }

  _onDoubleClick() {
    this.controller.onOpenPalm();
  }

  _onTouchStart(e) {
    const t = e.touches[0];
    if (!t) return;
    this._dragging = true;
    this.controller.onPinchStart(this._normalize(t.clientX, t.clientY));
  }

  _onTouchMove(e) {
    const t = e.touches[0];
    if (!t) return;
    this.controller.onPinchMove(this._normalize(t.clientX, t.clientY));
  }

  _onTouchEnd() {
    this._dragging = false;
    this.controller.onPinchEnd();
  }
}
