/**
 * IdleMode.js
 * -----------------------------------------------------------------------
 * Attract-mode overlay shown after IDLE_TIMEOUT_MS of no interaction.
 * Displays "Wave your hand to explore" over the rotating body demo.
 * Any gesture or interaction exits idle mode (handled by main.js, which
 * owns the idle timer since it must watch ALL app states).
 * -----------------------------------------------------------------------
 */
export const IDLE_TIMEOUT_MS = 30000;

export class IdleMode {
  constructor(root) {
    this.root = root;
    this.root.className = "idle-mode hidden";
    this.root.innerHTML = `
      <div class="idle-mode__inner">
        <div class="idle-mode__pulse">👋</div>
        <p class="idle-mode__text">Wave your hand to explore</p>
      </div>
    `;
  }

  show() {
    this.root.classList.remove("hidden");
  }

  hide() {
    this.root.classList.add("hidden");
  }
}
