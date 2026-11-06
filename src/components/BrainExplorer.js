/**
 * BrainExplorer.js
 * -----------------------------------------------------------------------
 * Interactive brain mode: select lobes/cerebellum/brain stem/deep
 * structures, plus an optional "Brain Activity" visualization of
 * animated neural connections.
 *
 * Loads the REAL Allen Human Reference Atlas brain (HuBMAP, CC BY 4.0 --
 * see ATTRIBUTION.md), tagging every one of its 286 real structures via
 * brainClassifier.js. Falls back to the procedural placeholder brain if
 * the real GLB is missing or fails to load.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { loadAnatomyModel } from "../anatomy/ModelLoader.js";
import { classifyBrainRegion } from "../anatomy/brainClassifier.js";
import { buildBrainModel } from "../anatomy/brainModel.js";
import { getModelInfo } from "../data/modelManifest.js";
import { getSystem } from "../data/anatomyData.js";
import { PALETTE } from "../anatomy/materials.js";
import { t, getLang, onLanguageChange } from "../data/i18n.js";

const REGION_COLORS = {
  frontal: 0xcf7a92,
  parietal: 0xc4738a,
  temporal: 0xbf6f8a,
  occipital: 0xb56a86,
  cerebellum: 0xe0a5c0,
  brainstem: 0xf0c4d8,
  deepBrain: 0xa8637f,
};

function materialFor(partId) {
  return new THREE.MeshStandardMaterial({
    color: REGION_COLORS[partId] || 0xc4738a,
    roughness: 0.55,
    metalness: 0.02,
  });
}

export class BrainExplorer {
  constructor({ viewer, infoPanel, controlsRoot }) {
    this.viewer = viewer;
    this.infoPanel = infoPanel;
    this.controlsRoot = controlsRoot;
    this.system = getSystem("brain", getLang());
    this._usedRealModel = false;
    this._langUnsub = null;
  }

  async mount() {
    this.controlsRoot.innerHTML = `<p class="model-status" id="brain-status">${t("modelLoading")}</p>`;
    // Resolve the content in whichever language is currently selected.
    this.system = getSystem("brain", getLang());
    let model;
    let usedRealModel = false;

    try {
      const info = getModelInfo("brain");
      model = await loadAnatomyModel(info.path, { orient: info.orient });

      const selectable = [];
      model.traverse((obj) => {
        if (obj.isMesh) {
          const partId = classifyBrainRegion(obj.name);
          obj.userData.brainName = obj.name;
          obj.userData.partId = partId;
          obj.material = materialFor(partId);
          if (partId) selectable.push(obj);
        }
      });
      model.userData.selectableParts = selectable;
      usedRealModel = true;
    } catch (err) {
      console.error("[BrainExplorer] Real GLB failed to load, falling back to procedural placeholder:", err);
      model = buildBrainModel();
    }

    this.viewer.setModelAnimated(model, { selectable: model.userData.selectableParts });
    this.viewer.resetView();
    this.infoPanel.showSystem(this.system);

    this.viewer.onSelect = (partId, mesh) => {
      const part = this.system.parts.find((p) => p.id === partId);
      if (part) {
        this.infoPanel.showPart(part, {
          realName: mesh?.userData?.brainName,
          systemId: "brain",
        });
      }
    };

    this._usedRealModel = usedRealModel;
    this._renderControls();

    // If the visitor switches language while this explorer is open, swap
    // the control strip (and this.system) into the new language.
    this._langUnsub = onLanguageChange(() => {
      this.system = getSystem("brain", getLang());
      this._renderControls();
    });
  }

  _renderControls() {
    const statusText = this._usedRealModel ? t("statusBrain") : t("modelPlaceholder");
    this.controlsRoot.innerHTML = `<p class="model-status${this._usedRealModel ? "" : " model-status--fallback"}">${statusText}</p>`;
  }

  unmount() {
    if (this._langUnsub) {
      this._langUnsub();
      this._langUnsub = null;
    }
    this.controlsRoot.innerHTML = "";
    this.viewer.onSelect = null;
    this.viewer.clearModel();
  }
}
