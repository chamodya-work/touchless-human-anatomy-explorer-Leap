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

    // Build the overlay before the viewer's entrance transition scales the
    // model down to 1%; otherwise its bounding box makes the visualization
    // permanently tiny.
    this._buildActivityOverlay(model);
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

    this._renderControls(
      usedRealModel
        ? "Real human brain \u00b7 286 structures \u00b7 HuBMAP / Allen Institute (CC BY 4.0)"
        : "Placeholder model -- see README",
      !usedRealModel
    );
  }

  _buildActivityOverlay(model) {
    // A restrained neural-network overlay. It is intentionally illustrative,
    // not real EEG/MRI data: stable connections make the visualization read
    // as a designed interface instead of random geometry flickering around.
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.worldToLocal(center);

    // The overlay is a child of the model, so convert the world-space box
    // back into the model's local coordinates before placing its nodes.
    const modelScale = Math.abs(model.scale.x) || 1;
    const localSize = size.clone().divideScalar(modelScale);
    if (Math.abs(Math.abs(model.rotation.x) - Math.PI / 2) < 0.01) {
      const y = localSize.y;
      localSize.y = localSize.z;
      localSize.z = y;
    }
    const radii = new THREE.Vector3(localSize.x * 0.47, localSize.y * 0.47, localSize.z * 0.47);
    const visualScale = Math.min(localSize.x, localSize.y, localSize.z);

    const nodeCount = 48;
    const nodes = [];
    let seed = 17;
    const seeded = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    for (let i = 0; i < nodeCount; i++) {
      // Evenly distributed nodes with a little controlled variation.
      const theta = i * 2.399963 + (seeded() - 0.5) * 0.16;
      const phi = Math.acos(1 - 2 * ((i + 0.5) / nodeCount));
      const r = 0.94 + seeded() * 0.08;
      nodes.push(
        new THREE.Vector3(
          center.x + radii.x * r * Math.sin(phi) * Math.cos(theta),
          center.y + radii.y * r * Math.sin(phi) * Math.sin(theta),
          center.z + radii.z * r * Math.cos(phi)
        )
      );
    }

    const edges = [];
    for (let i = 0; i < nodeCount; i++) {
      edges.push([i, (i + 1) % nodeCount]);
      if (i % 2 === 0) edges.push([i, (i + 7) % nodeCount]);
    }

    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(edges.length * 2 * 3);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    edges.forEach(([a, b], i) => {
      linePositions.set(nodes[a].toArray(), i * 6);
      linePositions.set(nodes[b].toArray(), i * 6 + 3);
    });
    const lineMat = new THREE.LineBasicMaterial({
      color: PALETTE.highlight,
      transparent: true,
      opacity: 0.42,
      depthTest: false,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    lines.renderOrder = 10;
    lines.frustumCulled = false;
    model.add(lines);

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(nodes.flatMap((node) => node.toArray()), 3)
    );
    const nodeMat = new THREE.PointsMaterial({
      color: PALETTE.cyanBright,
      size: visualScale * 0.18,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const nodePoints = new THREE.Points(nodeGeo, nodeMat);
    nodePoints.renderOrder = 11;
    nodePoints.frustumCulled = false;
    nodePoints.visible = false;
    model.add(nodePoints);

    const pulseCount = 14;
    const pulseGeo = new THREE.BufferGeometry();
    pulseGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(pulseCount * 3), 3));
    const pulseMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: visualScale * 0.3,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const pulses = new THREE.Points(pulseGeo, pulseMat);
    pulses.renderOrder = 12;
    pulses.frustumCulled = false;
    pulses.visible = false;
    model.add(pulses);

    const fader = new OpacityFader(lines, 0.55, 0.4);

    let activityTime = 0;
    model.userData.onFrame = (dt) => {
      fader.update(dt);
      const visibility = fader.current > 0.001;
      nodePoints.visible = visibility;
      pulses.visible = visibility;
      nodeMat.opacity = fader.current * 1.35;
      pulseMat.opacity = fader.current * 1.8;
      if (!this.activityActive) return;
      activityTime += dt;
      const pulsePositions = pulses.geometry.attributes.position;
      for (let i = 0; i < pulseCount; i++) {
        const edge = edges[(i * 3) % edges.length];
        const progress = (activityTime * (0.24 + (i % 4) * 0.035) + i / pulseCount) % 1;
        const eased = progress * progress * (3 - 2 * progress);
        pulsePositions.setXYZ(
          i,
          THREE.MathUtils.lerp(nodes[edge[0]].x, nodes[edge[1]].x, eased),
          THREE.MathUtils.lerp(nodes[edge[0]].y, nodes[edge[1]].y, eased),
          THREE.MathUtils.lerp(nodes[edge[0]].z, nodes[edge[1]].z, eased)
        );
      }
      pulsePositions.needsUpdate = true;
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
