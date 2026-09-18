/**
 * WelcomeScreen.js
 * -----------------------------------------------------------------------
 * First screen visitors see: title, subtitle and animated gesture legend.
 * Exits on wave / pinch-click / any key, calling onBegin().
 * -----------------------------------------------------------------------
 */
export class WelcomeScreen {
  constructor(root, onBegin) {
    this.root = root;
    this.root.className = "welcome-screen hidden";
    this.onBegin = onBegin;
    this._build();
  }

  _build() {
    this.root.innerHTML = `
      <div class="welcome-screen__inner">
        <div class="welcome-screen__kicker">UNIVERSITY MEDICAL EXHIBITION</div>
        <h1 class="welcome-screen__title">TOUCHLESS HUMAN<br/>ANATOMY EXPLORER</h1>
        <p class="welcome-screen__subtitle">Explore the human body using your hands</p>

        <div class="gesture-legend">
          <div class="gesture-legend__item"><span>👋</span><p>Wave to start</p></div>
          <div class="gesture-legend__item"><span>☝</span><p>Point to select</p></div>
          <div class="gesture-legend__item"><span>🤏</span><p>Pinch to grab</p></div>
          <div class="gesture-legend__item"><span>↔</span><p>Move hand to rotate</p></div>
          <div class="gesture-legend__item"><span>✋</span><p>Open palm to return</p></div>
        </div>

        <button class="begin-btn" data-selectable id="begin-btn">Wave your hand to begin</button>
      </div>
    `;
    this.root.querySelector("#begin-btn").addEventListener("click", () => this.onBegin());
  }

  show() {
    this.root.classList.remove("hidden");
  }

  hide() {
    this.root.classList.add("hidden");
  }
}
