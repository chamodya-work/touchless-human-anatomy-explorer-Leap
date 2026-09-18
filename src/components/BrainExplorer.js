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
import { SYSTEMS } from "../data/anatomyData.js";
import { PALETTE } from "../anatomy/materials.js";
import { OpacityFader } from "../anatomy/fade.js";

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
    this.system = SYSTEMS.brain;
    this.activityActive = false;
  }

  async mount() {
    this.controlsRoot.innerHTML = '<p class="model-status" id="brain-status">Loading real anatomical model...</p>';
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

    this._buildActivityOverlay(model);
    this._renderControls(
      usedRealModel
        ? "Real human brain \u00b7 286 structures \u00b7 HuBMAP / Allen Institute (CC BY 4.0)"
        : "Placeholder model -- see README",
      !usedRealModel
    );
  }

  _buildActivityOverlay(model) {
    // Random points on/near the brain's surface, connected by flickering
    // lines -- a stylised "neural activity" visualization, not real
    // EEG/MRI data.
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.worldToLocal(center);
    const radius = Math.max(size.x, size.y, size.z) * 0.42;

    const nodeCount = 40;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.75 + Math.random() * 0.2);
      nodes.push(
        new THREE.Vector3(
          center.x + r * Math.sin(phi) * Math.cos(theta),
          center.y + r * Math.sin(phi) * Math.sin(theta) * 0.8,
          center.z + r * Math.cos(phi) * 0.85
        )
      );
    }

    const lineGeo = new THREE.BufferGeometry();
    const maxLines = 30;
    const linePositions = new Float32Array(maxLines * 2 * 3);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: PALETTE.highlight, transparent: true, opacity: 0 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    model.add(lines);

    const fader = new OpacityFader(lines, 0.55, 0.4);

    let timer = 0;
    model.userData.onFrame = (dt) => {
      fader.update(dt);
      if (!this.activityActive) return;
      timer += dt;
      if (timer > 0.15) {
        timer = 0;
        const pos = lines.geometry.attributes.position;
        for (let i = 0; i < maxLines; i++) {
          const a = nodes[Math.floor(Math.random() * nodeCount)];
          const b = nodes[Math.floor(Math.random() * nodeCount)];
          pos.setXYZ(i * 2, a.x, a.y, a.z);
          pos.setXYZ(i * 2 + 1, b.x, b.y, b.z);
        }
        pos.needsUpdate = true;
      }
    };

    this._activityFader = fader;
  }

  _renderControls(statusText, isFallback) {
    this.controlsRoot.innerHTML = `
      <p class="model-status${isFallback ? " model-status--fallback" : ""}">${statusText}</p>
      <button class="mode-toggle" data-selectable id="brain-activity-toggle">
        <span class="mode-toggle__icon">\u26a1</span> Brain Activity Visualization
      </button>
    `;
    const btn = this.controlsRoot.querySelector("#brain-activity-toggle");
    btn.addEventListener("click", () => {
      this.activityActive = !this.activityActive;
      this._activityFader.setOn(this.activityActive);
      btn.classList.toggle("mode-toggle--active", this.activityActive);
    });
  }

  unmount() {
    this.controlsRoot.innerHTML = "";
    this.viewer.onSelect = null;
    this.viewer.clearModel();
  }
}
