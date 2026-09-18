/**
 * KeyboardInputAdapter.js
 * -----------------------------------------------------------------------
 * Accessibility fallback. Lets a visitor (or staff member) drive the
 * exhibit entirely from a keyboard, useful for testing and for visitors
 * who cannot use hand-tracking or a mouse.
 *
 * Arrow keys / WASD -> rotate model (mapped to onPinchStart+onPinchMove)
 * Enter / Space     -> select highlighted item (onPoint at center + pinch)
 * Escape            -> emulates "open palm" (pause interaction -- see main.js)
 * +/-               -> zoom (mapped through pinch depth)
 *
 * NOTE: "Backspace = back to menu" is handled directly in main.js as a
 * plain navigation shortcut, NOT routed through the gesture system --
 * it's app navigation, not a hand-gesture emulation, and open palm no
 * longer means "go back" (see CHANGELOG.md).
 * -----------------------------------------------------------------------
 */
export class KeyboardInputAdapter {
  constructor(controller) {
    this.controller = controller;
    this._rot = { x: 0, y: 0, z: 0 };
    this._onKeyDown = this._onKeyDown.bind(this);
    this._enabled = false;
  }

  start() {
    if (this._enabled) return;
    this._enabled = true;
    window.addEventListener("keydown", this._onKeyDown);
  }

  stop() {
    this._enabled = false;
    window.removeEventListener("keydown", this._onKeyDown);
  }

  _onKeyDown(e) {
    const step = 0.08;
    switch (e.key) {
      case "ArrowLeft":
      case "a":
        this._rot.x -= step;
        this._emitDrag();
        break;
      case "ArrowRight":
      case "d":
        this._rot.x += step;
        this._emitDrag();
        break;
      case "ArrowUp":
      case "w":
        this._rot.y += step;
        this._emitDrag();
        break;
      case "ArrowDown":
      case "s":
        this._rot.y -= step;
        this._emitDrag();
        break;
      case "+":
      case "=":
        this._rot.z = Math.min(1, this._rot.z + 0.1);
        this._emitDrag();
        break;
      case "-":
      case "_":
        this._rot.z = Math.max(-1, this._rot.z - 0.1);
        this._emitDrag();
        break;
      case "Enter":
      case " ":
        this.controller.onPinchStart({ ...this._rot });
        this.controller.onPinchEnd();
        break;
      case "Escape":
        // Emulates the open-palm "pause" gesture (see main.js) --
        // intentionally does NOT navigate anywhere on its own.
        this.controller.onOpenPalm();
        break;
      default:
        break;
    }
  }

  _emitDrag() {
    this.controller.onPinchStart(this._rot);
    this.controller.onPinchMove(this._rot);
  }
}
