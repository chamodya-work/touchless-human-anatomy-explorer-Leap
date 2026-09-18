/**
 * SkeletonExplorer.js
 * -----------------------------------------------------------------------
 * Interactive skeleton mode. Loads the REAL 202-bone BodyParts3D skeleton
 * (assets/models/skeleton.glb -- see ATTRIBUTION.md) and tags every bone
 * mesh with a selectable category via boneClassifier.js. Falls back to
 * the procedural placeholder skeleton (buildSkeletonModel) if the GLB is
 * missing or fails to load, and says so honestly via the on-screen status
 * line rather than pretending the placeholder is the real thing.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { loadAnatomyModel } from "../anatomy/ModelLoader.js";
import { classifyBone } from "../anatomy/boneClassifier.js";
import { buildSkeletonModel } from "../anatomy/skeletonModel.js";
import { getModelInfo } from "../data/modelManifest.js";
import { SYSTEMS } from "../data/anatomyData.js";

const BONE_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xe9e3d3,
  roughness: 0.55,
  metalness: 0.02,
});

export class SkeletonExplorer {
  constructor({ viewer, infoPanel, controlsRoot }) {
    this.viewer = viewer;
    this.infoPanel = infoPanel;
    this.controlsRoot = controlsRoot;
    this.system = SYSTEMS.skeleton;
  }

  async mount() {
    this.controlsRoot.innerHTML = '<p class="model-status" id="skeleton-status">Loading real anatomical model...</p>';
    let model;
    let usedRealModel = false;

    try {
      const info = getModelInfo("skeleton");
      const raw = await loadAnatomyModel(info.path);
      model = raw;
      const selectable = [];
      model.traverse((obj) => {
        if (obj.isMesh) {
          obj.material = BONE_MATERIAL.clone();
          obj.userData.boneName = obj.name;
          obj.userData.partId = classifyBone(obj.name);
          selectable.push(obj);
        }
      });
      model.userData.selectableParts = selectable;
      usedRealModel = true;
    } catch (err) {
      console.error("[SkeletonExplorer] Real GLB failed to load, falling back to procedural placeholder:", err);
      model = buildSkeletonModel();
    }

    this.viewer.setModelAnimated(model, { selectable: model.userData.selectableParts });
    this.viewer.resetView();
    this.infoPanel.showSystem(this.system);

    this.viewer.onSelect = (partId, mesh) => {
      const part = this.system.parts.find((p) => p.id === partId);
      if (part) {
        this.infoPanel.showPart(part, {
          realName: mesh && mesh.userData ? mesh.userData.boneName : null,
          systemId: "skeleton",
        });
      }
    };

    const statusEl = this.controlsRoot.querySelector("#skeleton-status");
    if (statusEl) {
      statusEl.textContent = usedRealModel
        ? "202 real bones \u00b7 BodyParts3D (CC BY-SA)"
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
