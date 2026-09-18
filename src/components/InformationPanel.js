/**
 * InformationPanel.js
 * -----------------------------------------------------------------------
 * Floating glass information panel shown next to the 3D model. Two modes:
 *   - system overview (name, function, structures list, fact, simple text)
 *   - part detail (single selected structure name + function, plus the
 *     REAL anatomical mesh name when the system uses a real GLB asset,
 *     e.g. "Femur" category -> "left femur")
 *
 * Content swaps use a quick fade+rise transition (see .info-panel__body
 * in styles.css) so updates never feel like an abrupt DOM jump.
 * -----------------------------------------------------------------------
 */
import { DISCLAIMER } from "../data/anatomyData.js";
import { getModelInfo } from "../data/modelManifest.js";

export class InformationPanel {
  constructor(root) {
    this.root = root;
    this.root.className = "info-panel hidden";
  }

  _setBody(html) {
    this.root.classList.remove("hidden");
    // Retrigger the CSS fade-in by removing+reflowing+adding the class.
    this.root.innerHTML = `<div class="info-panel__body">${html}</div>`;
    const body = this.root.querySelector(".info-panel__body");
    // Force reflow so the animation restarts on every content swap.
    void body.offsetWidth;
    body.classList.add("info-panel__body--in");
  }

  _attributionLine(systemId) {
    const info = getModelInfo(systemId);
    if (!info || info.type !== "glb") return "";
    return `<p class="info-panel__attribution">${info.attribution} &middot; ${info.license}</p>`;
  }

  showSystem(system) {
    this._setBody(`
      <div class="info-panel__eyebrow">${system.icon} SYSTEM OVERVIEW</div>
      <h2 class="info-panel__title">${system.name}</h2>
      <p class="info-panel__function">${system.function}</p>

      <div class="info-panel__section">
        <h3>Key Structures</h3>
        <ul class="info-panel__list">
          ${system.structures.map((s) => `<li>${s}</li>`).join("")}
        </ul>
      </div>

      <div class="info-panel__section info-panel__fact">
        <h3>Did you know?</h3>
        <p>${system.fact}</p>
      </div>

      <div class="info-panel__section info-panel__simple">
        <p>${system.simple}</p>
      </div>

      ${this._attributionLine(system.id)}
      <p class="info-panel__disclaimer">${DISCLAIMER}</p>
    `);
  }

  showPart(part, { realName, systemId } = {}) {
    const realNameHtml = realName
      ? `<p class="info-panel__realname">Real structure: <em>${realName}</em></p>`
      : "";
    this._setBody(`
      <div class="info-panel__eyebrow">SELECTED STRUCTURE</div>
      <h2 class="info-panel__title info-panel__title--highlight">${part.name}</h2>
      ${realNameHtml}
      <p class="info-panel__function">${part.function}</p>
      ${this._attributionLine(systemId)}
      <p class="info-panel__disclaimer">${DISCLAIMER}</p>
    `);
  }

  clear() {
    this.root.classList.add("hidden");
    this.root.innerHTML = "";
  }
}
