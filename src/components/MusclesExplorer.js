/**
 * MusclesExplorer.js
 * -----------------------------------------------------------------------
 * Interactive muscular system mode. Loads the REAL 467-mesh
 * BodyParts3D + Z-Anatomy muscle/tendon "ecorche" model
 * (assets/models/muscles.glb -- see ATTRIBUTION.md) and groups every
 * mesh into one of 13 public-friendly categories via muscleClassifier.js.
 * Falls back to the procedural generic-system placeholder if the GLB is
 * missing or fails to load.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { loadAnatomyModel } from "../anatomy/ModelLoader.js";
import { classifyMuscleGroup } from "../anatomy/muscleClassifier.js";
import { buildGenericSystemModel } from "../anatomy/genericSystemModel.js";
import { getModelInfo } from "../data/modelManifest.js";
import { SYSTEMS } from "../data/anatomyData.js";

// Muted, anatomically-plausible tissue tones per group -- kept
// professional/medical rather than a neon per-group rainbow.
const GROUP_COLORS = {
  headNeck: 0xb0483f,
  shoulders: 0xa8433d,
  chest: 0xb54b40,
  back: 0x9c3f38,
  upperArm: 0xaf463d,
  forearm: 0xa54038,
  hand: 0xc9a37e, // tendon-heavy, lighter
  abdomen: 0xb3483e,
  trunk: 0x9e4139,
  hip: 0xa4423b,
  upperLeg: 0xaa4740,
  lowerLeg: 0x9d3f37,
  foot: 0xc6a17c,
  other: 0xc9a37e, // connective tissue / tendon
};

function materialFor(groupId) {
  return new THREE.MeshStandardMaterial({
    color: GROUP_COLORS[groupId] || 0xa8433d,
    roughness: 0.55,
    metalness: 0.0,
  });
}

export class MusclesExplorer {
  constructor({ viewer, infoPanel, controlsRoot }) {
    this.viewer = viewer;
    this.infoPanel = infoPanel;
    this.controlsRoot = controlsRoot;
    this.system = SYSTEMS.muscles;
  }

  async mount() {
    this.controlsRoot.innerHTML = '<p class="model-status" id="muscles-status">Loading real anatomical model...</p>';
    let model;
    let usedRealModel = false;

    try {
      const info = getModelInfo("muscles");
      const raw = await loadAnatomyModel(info.path);
      model = raw;
      const selectable = [];
      model.traverse((obj) => {
        if (obj.isMesh) {
          const groupId = classifyMuscleGroup(obj.name);
          obj.material = materialFor(groupId);
          obj.userData.muscleName = obj.name;
          obj.userData.partId = groupId === "other" ? null : groupId;
          if (obj.userData.partId) selectable.push(obj);
        }
      });
      model.userData.selectableParts = selectable;
      usedRealModel = true;
    } catch (err) {
      console.error("[MusclesExplorer] Real GLB failed to load, falling back to procedural placeholder:", err);
      model = buildGenericSystemModel("muscles", this.system.parts);
    }

    this.viewer.setModelAnimated(model, { selectable: model.userData.selectableParts });
    this.viewer.resetView();
    this.infoPanel.showSystem(this.system);

    this.viewer.onSelect = (partId, mesh) => {
      const part = this.system.parts.find((p) => p.id === partId);
      if (part) {
        this.infoPanel.showPart(part, {
          realName: mesh && mesh.userData ? mesh.userData.muscleName : null,
          systemId: "muscles",
        });
      }
    };

    const statusEl = this.controlsRoot.querySelector("#muscles-status");
    if (statusEl) {
      statusEl.textContent = usedRealModel
        ? "467 real muscles & tendons \u00b7 BodyParts3D + Z-Anatomy (CC BY-SA)"
        : "Placeholder model -- see README";
      statusEl.classList.toggle("model-status--fallback", !usedRealModel);
    }
  }

  unmount() {
    this.controlsRoot.innerHTML = "";
    this.viewer.onSelect = null;
    this.viewer.clearModel();
  }
}
