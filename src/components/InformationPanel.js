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
import { getSystem, getDisclaimer } from "../data/anatomyData.js";
import { getModelInfo } from "../data/modelManifest.js";
import { t, getLang, onLanguageChange } from "../data/i18n.js";

export class InformationPanel {
  constructor(root) {
    this.root = root;
    this.root.className = "info-panel hidden";
    // What is currently on screen, so a language switch can re-render the
    // same content in the other language instead of clearing the panel.
    this._current = null;
    onLanguageChange(() => this._rerender());
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
    this._current = { kind: "system", systemId: system.id };
    this._renderSystem(system);
  }

  _renderSystem(system) {
    this._setBody(`
      <div class="info-panel__eyebrow">${system.icon} ${t("systemOverview")}</div>
      <h2 class="info-panel__title">${system.name}</h2>
      <p class="info-panel__function">${system.function}</p>

      <div class="info-panel__section">
        <h3>${t("keyStructures")}</h3>
        <ul class="info-panel__list">
          ${system.structures.map((s) => `<li>${s}</li>`).join("")}
        </ul>
      </div>

      <div class="info-panel__section info-panel__fact">
        <h3>${t("didYouKnow")}</h3>
        <p>${system.fact}</p>
      </div>

      <div class="info-panel__section info-panel__simple">
        <p>${system.simple}</p>
      </div>

      ${this._attributionLine(system.id)}
      <p class="info-panel__disclaimer">${getDisclaimer(getLang())}</p>
    `);
  }

  showPart(part, { realName, systemId } = {}) {
    // `fallbackPart` keeps custom/synthetic parts that aren't in the
    // system's own parts list working exactly as before.
    this._current = { kind: "part", systemId, partId: part.id, realName, fallbackPart: part };
    this._renderPart();
  }

  _renderPart() {
    const state = this._current;
    if (!state) return;
    const system = getSystem(state.systemId, getLang());
    const part = system?.parts?.find((p) => p.id === state.partId) || state.fallbackPart;
    if (!part) return;

    const realNameHtml = state.realName
      ? `<p class="info-panel__realname">${t("realStructure")} <em>${state.realName}</em></p>`
      : "";

    this._setBody(`
      <div class="info-panel__eyebrow">${t("selectedStructure")}</div>
      <h2 class="info-panel__title info-panel__title--highlight">${part.name}</h2>
      ${realNameHtml}
      <p class="info-panel__function">${part.function}</p>
      ${this._attributionLine(state.systemId)}
      <p class="info-panel__disclaimer">${getDisclaimer(getLang())}</p>
    `);
  }

  /** Re-renders whatever is showing in the newly selected language. */
  _rerender() {
    if (!this._current) return;
    if (this._current.kind === "system") {
      const system = getSystem(this._current.systemId, getLang());
      if (system) this._renderSystem(system);
    } else {
      this._renderPart();
    }
  }

  clear() {
    this._current = null;
    this.root.classList.add("hidden");
    this.root.innerHTML = "";
  }
}
