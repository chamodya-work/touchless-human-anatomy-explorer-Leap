/**
 * HeartExplorer.js
 * -----------------------------------------------------------------------
 * Interactive heart mode: rotate/zoom/select chambers+valves+vessels via
 * the shared AnatomyViewer, plus an optional animated "Blood Flow" mode
 * that moves particles along Veins -> RA -> RV -> Lungs -> LA -> LV -> Aorta.
 *
 * Loads the REAL combined heart + heart-vessels model (HuBMAP Human
 * Reference Atlas, CC BY 4.0 -- see ATTRIBUTION.md), tagging every mesh
 * via heartClassifier.js. Falls back to the procedural placeholder heart
 * if the real GLBs are missing or fail to load.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { loadCombinedAnatomyModel } from "../anatomy/ModelLoader.js";
import { classifyHeartPart } from "../anatomy/heartClassifier.js";
import { buildHeartModel } from "../anatomy/heartModel.js";
import { getModelInfo } from "../data/modelManifest.js";
import { SYSTEMS } from "../data/anatomyData.js";
import { PALETTE } from "../anatomy/materials.js";
import { OpacityFader } from "../anatomy/fade.js";

const TISSUE_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xb5423c, roughness: 0.45, metalness: 0.05 });
const VESSEL_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xc03a3a, roughness: 0.4, metalness: 0.05 });
const VEIN_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x3a4fb0, roughness: 0.4, metalness: 0.05 });

function materialFor(partId) {
  if (partId === "aorta" || partId === "coronaryArteries") return VESSEL_MATERIAL.clone();
  if (partId === "venaCava" || partId === "pulmonaryVessels") return VEIN_MATERIAL.clone();
  return TISSUE_MATERIAL.clone();
}

export class HeartExplorer {
  constructor({ viewer, infoPanel, controlsRoot }) {
    this.viewer = viewer;
    this.infoPanel = infoPanel;
    this.controlsRoot = controlsRoot;
    this.system = SYSTEMS.heart;
    this.bloodFlowActive = false;
  }

  async mount() {
    this.controlsRoot.innerHTML = '<p class="model-status" id="heart-status">Loading real anatomical model...</p>';
    let model;
    let usedRealModel = false;
    let waypoints = null;

    try {
      const info = getModelInfo("heart");
      const sources = info.sources.map((s) => ({
        ...s,
        exclude: s.excludeNamePattern ? (name) => new RegExp(s.excludeNamePattern).test(name) : undefined,
      }));
      model = await loadCombinedAnatomyModel(sources, {
        orient: info.orient,
        scaleReferenceTag: "heart",
        targetSize: 1.4,
      });

      const selectable = [];
      const centersByPart = {};
      model.traverse((obj) => {
        if (obj.isMesh) {
          const partId = classifyHeartPart(obj.name);
          obj.userData.heartName = obj.name;
          obj.userData.partId = partId;
          obj.material = materialFor(partId);
          if (partId) {
            selectable.push(obj);
            // NOTE: obj.getWorldPosition() would return this node's own
            // transform origin, which is (0,0,0) for these GLTF exports
            // -- all real spatial data is baked directly into the
            // vertex buffer instead. The mesh's actual world-space
            // center has to come from its geometry's bounding box.
            const box = new THREE.Box3().setFromObject(obj);
            const c = new THREE.Vector3();
            box.getCenter(c);
            if (!centersByPart[partId]) centersByPart[partId] = [];
            centersByPart[partId].push(c);
          }
        }
      });
      model.userData.selectableParts = selectable;
      waypoints = buildWaypointsFromCenters(centersByPart, model);
      usedRealModel = true;
    } catch (err) {
      console.error("[HeartExplorer] Real GLB failed to load, falling back to procedural placeholder:", err);
      model = buildHeartModel();
    }

    this.viewer.setModelAnimated(model, { selectable: model.userData.selectableParts });
    this.viewer.resetView();
    this.infoPanel.showSystem(this.system);

    this.viewer.onSelect = (partId, mesh) => {
      const part = this.system.parts.find((p) => p.id === partId);
      if (part) {
        this.infoPanel.showPart(part, {
          realName: mesh && mesh.userData ? mesh.userData.heartName : null,
          systemId: "heart",
        });
      }
    };

    this._buildBloodFlowParticles(model, waypoints || model.userData.bloodFlowWaypoints);
    this._renderControls(
      usedRealModel
        ? "Real human heart & vessels \u00b7 HuBMAP Human Reference Atlas (CC BY 4.0)"
        : "Placeholder model -- see README",
      !usedRealModel
    );
  }

  _buildBloodFlowParticles(model, waypoints) {
    const order = this.system.bloodFlowPath;
    const points = order.map((key) => waypoints[key]).filter(Boolean);
    if (points.length < order.length) {
      // Missing a waypoint (e.g. a part didn't classify on a fallback
      // model shape) -- skip the animation rather than crash on a
      // malformed curve.
      this._flowCurve = null;
    } else {
      this._flowCurve = new THREE.CatmullRomCurve3(points, true);
    }

    const count = 60;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: PALETTE.artery, size: 0.045, transparent: true, opacity: 0 });
    const particles = new THREE.Points(geo, mat);
    model.add(particles);

    const fader = new OpacityFader(particles, 0.95, 0.4);
    this._flowParticles = particles;
    this._flowFader = fader;
    this._flowCount = count;
    this._flowProgress = 0;

    model.userData.onFrame = (dt) => {
      fader.update(dt);
      if (!this.bloodFlowActive || !this._flowCurve) return;
      this._flowProgress = (this._flowProgress + dt * 0.12) % 1;
      const pos = particles.geometry.attributes.position;
      for (let i = 0; i < this._flowCount; i++) {
        const t = (this._flowProgress + i / this._flowCount) % 1;
        const p = this._flowCurve.getPointAt(t);
        pos.setXYZ(i, p.x, p.y, p.z);
      }
      pos.needsUpdate = true;
    };
  }

  _renderControls(statusText, isFallback) {
    this.controlsRoot.innerHTML = `
      <p class="model-status${isFallback ? " model-status--fallback" : ""}">${statusText}</p>
      <button class="mode-toggle" data-selectable id="blood-flow-toggle">
        <span class="mode-toggle__icon">\u{1FA78}</span> Blood Flow Animation
      </button>
    `;
    const btn = this.controlsRoot.querySelector("#blood-flow-toggle");
    btn.addEventListener("click", () => {
      if (!this._flowCurve) return;
      this.bloodFlowActive = !this.bloodFlowActive;
      this._flowFader.setOn(this.bloodFlowActive);
      btn.classList.toggle("mode-toggle--active", this.bloodFlowActive);
    });
  }

  unmount() {
    this.controlsRoot.innerHTML = "";
    this.viewer.onSelect = null;
    this.viewer.clearModel();
  }
}

/**
 * Derives blood-flow waypoints from the real, classified mesh centers
 * rather than hardcoded coordinates -- so the animation still makes
 * anatomical sense against the real model's actual geometry/scale.
 * "veins" and "lungs" aren't distinct parts in this dataset, so they're
 * approximated from the vena cava / pulmonary vessel positions.
 */
function buildWaypointsFromCenters(centersByPart, model) {
  const avg = (arr) => {
    if (!arr || !arr.length) return null;
    const v = new THREE.Vector3();
    arr.forEach((p) => v.add(p));
    v.divideScalar(arr.length);
    model.worldToLocal(v);
    return v;
  };

  const rightAtrium = avg(centersByPart.rightAtrium);
  const rightVentricle = avg(centersByPart.rightVentricle);
  const leftAtrium = avg(centersByPart.leftAtrium);
  const leftVentricle = avg(centersByPart.leftVentricle);
  const aorta = avg(centersByPart.aorta);
  const venaCava = avg(centersByPart.venaCava);
  const pulmonary = avg(centersByPart.pulmonaryVessels);

  if (!rightAtrium || !rightVentricle || !leftAtrium || !leftVentricle || !aorta) {
    return {}; // incomplete -- caller will skip the animation
  }

  return {
    veins: venaCava || rightAtrium.clone().add(new THREE.Vector3(0, 0.15, 0)),
    rightAtrium,
    rightVentricle,
    lungs: pulmonary || rightVentricle.clone().add(new THREE.Vector3(0, 0.2, 0)),
    leftAtrium,
    leftVentricle,
    aorta,
  };
}
