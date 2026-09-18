/**
 * LungExplorer.js
 * -----------------------------------------------------------------------
 * Interactive respiratory system mode: select trachea/bronchi/lungs, plus
 * an optional "Breathing Mode" that expands/contracts the lungs and
 * animates airflow particles.
 *
 * Loads the REAL lungs.glb (HuBMAP Human Reference Atlas, CC BY 4.0 --
 * see ATTRIBUTION.md), tagging every mesh via lungClassifier.js. A small
 * procedural diaphragm is added underneath (not part of this dataset --
 * see README/ATTRIBUTION). Falls back entirely to the procedural
 * placeholder if the real GLB is missing or fails to load.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { loadAnatomyModel } from "../anatomy/ModelLoader.js";
import { classifyLungPart } from "../anatomy/lungClassifier.js";
import { buildLungsModel } from "../anatomy/lungsModel.js";
import { getModelInfo } from "../data/modelManifest.js";
import { SYSTEMS } from "../data/anatomyData.js";
import { PALETTE } from "../anatomy/materials.js";
import { OpacityFader } from "../anatomy/fade.js";

const LUNG_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xd98a92, roughness: 0.55, metalness: 0.02 });
const AIRWAY_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xcbb8ae, roughness: 0.5, metalness: 0.02 });

function materialFor(partId) {
  if (partId === "trachea" || partId === "bronchi") return AIRWAY_MATERIAL.clone();
  return LUNG_MATERIAL.clone();
}

/** Small procedural diaphragm disc -- not part of the HuBMAP respiratory dataset. */
function buildProceduralDiaphragm(radius) {
  const geo = new THREE.CylinderGeometry(radius, radius, radius * 0.08, 28);
  const mat = new THREE.MeshStandardMaterial({ color: 0xc9a0a0, roughness: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.partId = "diaphragm";
  mesh.userData.isProcedural = true;
  return mesh;
}

export class LungExplorer {
  constructor({ viewer, infoPanel, controlsRoot }) {
    this.viewer = viewer;
    this.infoPanel = infoPanel;
    this.controlsRoot = controlsRoot;
    this.system = SYSTEMS.lungs;
    this.breathingActive = false;
  }

  async mount() {
    this.controlsRoot.innerHTML = '<p class="model-status" id="lung-status">Loading real anatomical model...</p>';
    let model;
    let usedRealModel = false;
    let breathingParts = null;

    try {
      const info = getModelInfo("lungs");
      model = await loadAnatomyModel(info.path, { orient: info.orient, targetSize: 2.0 });

      const selectable = [];
      const lungMeshesByPart = { leftLung: [], rightLung: [] };
      model.traverse((obj) => {
        if (obj.isMesh) {
          const partId = classifyLungPart(obj.name);
          obj.userData.lungName = obj.name;
          obj.userData.partId = partId;
          obj.material = materialFor(partId);
          if (partId) {
            selectable.push(obj);
            if (lungMeshesByPart[partId]) lungMeshesByPart[partId].push(obj);
          }
        }
      });

      // Procedural diaphragm, sized/positioned from the real lungs' own
      // bounding box so it sits reasonably underneath them.
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const diaphragm = buildProceduralDiaphragm(Math.max(size.x, size.z) * 0.55);
      diaphragm.position.set(0, box.min.y + size.y * 0.02, 0);
      model.add(diaphragm);
      selectable.push(diaphragm);

      model.userData.selectableParts = selectable;
      breathingParts = { lungMeshesByPart, diaphragm, box };
      usedRealModel = true;
    } catch (err) {
      console.error("[LungExplorer] Real GLB failed to load, falling back to procedural placeholder:", err);
      model = buildLungsModel();
    }

    this.viewer.setModelAnimated(model, { selectable: model.userData.selectableParts });
    this.viewer.resetView();
    this.infoPanel.showSystem(this.system);

    this.viewer.onSelect = (partId, mesh) => {
      const part = this.system.parts.find((p) => p.id === partId);
      if (part) {
        this.infoPanel.showPart(part, {
          realName: mesh?.userData?.lungName,
          systemId: "lungs",
        });
      }
    };

    if (usedRealModel) {
      this._buildBreathingAnimationReal(model, breathingParts);
    } else {
      this._buildBreathingAnimationProcedural(model);
    }

    this._renderControls(
      usedRealModel
        ? "Real human respiratory system \u00b7 HuBMAP Human Reference Atlas (CC BY 4.0)"
        : "Placeholder model -- see README",
      !usedRealModel
    );
  }

  _buildBreathingAnimationReal(model, { lungMeshesByPart, diaphragm }) {
    const baseScales = new Map();
    [...lungMeshesByPart.leftLung, ...lungMeshesByPart.rightLung].forEach((m) => baseScales.set(m, m.scale.clone()));
    const baseDiaphragmY = diaphragm.position.y;

    const count = 20;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: PALETTE.cyanBright, size: 0.02, transparent: true, opacity: 0 });
    const airflow = new THREE.Points(geo, mat);
    model.add(airflow);
    const fader = new OpacityFader(airflow, 0.85, 0.4);

    let t = 0;
    model.userData.onFrame = (dt) => {
      fader.update(dt);
      const allLungMeshes = [...lungMeshesByPart.leftLung, ...lungMeshesByPart.rightLung];
      if (!this.breathingActive) {
        allLungMeshes.forEach((m) => m.scale.lerp(baseScales.get(m), 0.1));
        diaphragm.position.y += (baseDiaphragmY - diaphragm.position.y) * 0.1;
        return;
      }
      t += dt;
      const breathe = (Math.sin(t * 1.3) + 1) / 2;
      const expand = 1 + breathe * 0.06; // real lobed geometry -- keep subtle to avoid self-intersection
      allLungMeshes.forEach((m) => {
        const base = baseScales.get(m);
        m.scale.set(base.x * expand, base.y * expand, base.z * expand);
      });
      diaphragm.position.y = baseDiaphragmY - breathe * 0.08;

      const pos = airflow.geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        const phase = (t * 0.5 + i / count) % 1;
        pos.setXYZ(i, (Math.random() - 0.5) * 0.05, 1.0 - phase * 1.2, (Math.random() - 0.5) * 0.05);
      }
      pos.needsUpdate = true;
    };

    this._airflowFader = fader;
  }

  _buildBreathingAnimationProcedural(model) {
    const { rightLung, leftLung, diaphragm } = model.userData.breathingParts;
    const baseScaleR = rightLung.scale.clone();
    const baseScaleL = leftLung.scale.clone();
    const baseDiaphragmY = diaphragm.position.y;

    const count = 24;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: PALETTE.cyanBright, size: 0.03, transparent: true, opacity: 0 });
    const airflow = new THREE.Points(geo, mat);
    model.add(airflow);
    const fader = new OpacityFader(airflow, 0.85, 0.4);

    let t = 0;
    model.userData.onFrame = (dt) => {
      fader.update(dt);
      if (!this.breathingActive) {
        rightLung.scale.lerp(baseScaleR, 0.1);
        leftLung.scale.lerp(baseScaleL, 0.1);
        diaphragm.position.y += (baseDiaphragmY - diaphragm.position.y) * 0.1;
        return;
      }
      t += dt;
      const breathe = (Math.sin(t * 1.3) + 1) / 2;
      const expand = 1 + breathe * 0.18;
      rightLung.scale.set(baseScaleR.x * expand, baseScaleR.y * expand, baseScaleR.z * expand);
      leftLung.scale.set(baseScaleL.x * expand, baseScaleL.y * expand, baseScaleL.z * expand);
      diaphragm.position.y = baseDiaphragmY - breathe * 0.12;

      const pos = airflow.geometry.attributes.position;
      for (let i = 0; i < count; i++) {
        const phase = (t * 0.6 + i / count) % 1;
        pos.setXYZ(i, (Math.random() - 0.5) * 0.05, 0.75 - phase * 1.3, (Math.random() - 0.5) * 0.05);
      }
      pos.needsUpdate = true;
    };

    this._airflowFader = fader;
  }

  _renderControls(statusText, isFallback) {
    this.controlsRoot.innerHTML = `
      <p class="model-status${isFallback ? " model-status--fallback" : ""}">${statusText}</p>
      <button class="mode-toggle" data-selectable id="breathing-toggle">
        <span class="mode-toggle__icon">\ud83c\udf2c</span> Breathing Mode
      </button>
      <p class="mode-explainer" id="breathing-explainer"></p>
    `;
    const btn = this.controlsRoot.querySelector("#breathing-toggle");
    const explainer = this.controlsRoot.querySelector("#breathing-explainer");
    btn.addEventListener("click", () => {
      this.breathingActive = !this.breathingActive;
      this._airflowFader.setOn(this.breathingActive);
      btn.classList.toggle("mode-toggle--active", this.breathingActive);
      explainer.textContent = this.breathingActive
        ? "Inhale: the diaphragm pulls down and lungs expand. Exhale: they relax and air flows out."
        : "";
    });
  }

  unmount() {
    this.controlsRoot.innerHTML = "";
    this.viewer.onSelect = null;
    this.viewer.clearModel();
  }
}
