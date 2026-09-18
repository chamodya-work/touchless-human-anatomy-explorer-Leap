/**
 * NervousExplorer.js
 * -----------------------------------------------------------------------
 * Interactive nervous system mode: the same real Allen Institute brain
 * used in BrainExplorer, combined with a real, individually-segmented
 * human spinal cord (HuBMAP Human Reference Atlas, CC BY 4.0 -- see
 * ATTRIBUTION.md), grouped into cervical/thoracic/lumbar/sacral regions
 * via spinalCordClassifier.js. Falls back to the procedural placeholder
 * if the real GLBs are missing or fail to load.
 *
 * Peripheral nerves are not part of this dataset -- see README.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { loadCombinedAnatomyModel } from "../anatomy/ModelLoader.js";
import { classifySpinalSegment } from "../anatomy/spinalCordClassifier.js";
import { buildGenericSystemModel } from "../anatomy/genericSystemModel.js";
import { getModelInfo } from "../data/modelManifest.js";
import { SYSTEMS } from "../data/anatomyData.js";
import { PALETTE } from "../anatomy/materials.js";

const SPINE_COLORS = {
  cervicalSpine: 0xe0c94c,
  thoracicSpine: 0xd4a24c,
  lumbarSpine: 0xc47a3c,
  sacralSpine: 0xb0602c,
};

export class NervousExplorer {
  constructor({ viewer, infoPanel, controlsRoot }) {
    this.viewer = viewer;
    this.infoPanel = infoPanel;
    this.controlsRoot = controlsRoot;
    this.system = SYSTEMS.nervous;
  }

  async mount() {
    this.controlsRoot.innerHTML = '<p class="model-status" id="nervous-status">Loading real anatomical model...</p>';
    let model;
    let usedRealModel = false;

    try {
      const info = getModelInfo("nervous");
      model = await loadCombinedAnatomyModel(info.sources, {
        orient: info.orient,
        scaleReferenceTag: "brain",
        targetSize: 0.9, // frame on the brain; spinal cord extends well below into view
      });

      const selectable = [];
      model.traverse((obj) => {
        if (obj.isMesh) {
          const sourceTag = findSourceTag(obj);
          let partId = null;
          if (sourceTag === "brain") {
            // The whole brain reads as one part here -- the Brain
            // explorer is where visitors dig into individual lobes.
            partId = "brainCore";
            obj.material = new THREE.MeshStandardMaterial({ color: 0xc4738a, roughness: 0.55 });
          } else if (sourceTag === "spinalCord") {
            partId = classifySpinalSegment(obj.name);
            obj.material = new THREE.MeshStandardMaterial({
              color: SPINE_COLORS[partId] || 0xd4a24c,
              roughness: 0.5,
            });
          }
          obj.userData.nerveName = obj.name;
          obj.userData.partId = partId;
          if (partId) selectable.push(obj);
        }
      });
      model.userData.selectableParts = selectable;
      usedRealModel = true;
    } catch (err) {
      console.error("[NervousExplorer] Real GLBs failed to load, falling back to procedural placeholder:", err);
      model = buildGenericSystemModel("nervous", this.system.parts);
    }

    this.viewer.setModelAnimated(model, { selectable: model.userData.selectableParts });
    this.viewer.resetView();
    this.infoPanel.showSystem(this.system);

    this.viewer.onSelect = (partId, mesh) => {
      const part = this.system.parts.find((p) => p.id === partId);
      if (part) {
        this.infoPanel.showPart(part, {
          realName: mesh?.userData?.nerveName,
          systemId: "nervous",
        });
      }
    };

    if (usedRealModel) this._buildSignalPulse(model);

    this.controlsRoot.innerHTML = `<p class="model-status${usedRealModel ? "" : " model-status--fallback"}">${
      usedRealModel
        ? "Real brain & spinal cord \u00b7 HuBMAP / Allen Institute (CC BY 4.0)"
        : "Placeholder model -- see README"
    }</p>`;
  }

  /** Small stylised "nerve signal" pulse traveling down the spinal cord --
   *  illustrative, not a real neural-conduction simulation. Always on
   *  (no toggle) since it's subtle and reinforces the "electrical
   *  signals" framing without needing an extra control. */
  _buildSignalPulse(model) {
    const box = new THREE.Box3().setFromObject(model);
    const top = box.max.y;
    const bottom = box.min.y;

    const geo = new THREE.SphereGeometry(0.03, 12, 12);
    const mat = new THREE.MeshBasicMaterial({ color: PALETTE.cyanBright, transparent: true, opacity: 0.9 });
    const pulse = new THREE.Mesh(geo, mat);
    model.add(pulse);
    model.worldToLocal(pulse.position.set(0, top, 0));

    let t = 0;
    const localTop = pulse.position.y;
    const localBottom = (() => {
      const p = new THREE.Vector3(0, bottom, 0);
      model.worldToLocal(p);
      return p.y;
    })();

    model.userData.onFrame = (dt) => {
      t = (t + dt * 0.25) % 1;
      pulse.position.y = localTop + (localBottom - localTop) * t;
      pulse.material.opacity = 0.4 + 0.5 * Math.sin(t * Math.PI);
    };
  }

  unmount() {
    this.controlsRoot.innerHTML = "";
    this.viewer.onSelect = null;
    this.viewer.clearModel();
  }
}

function findSourceTag(obj) {
  let cur = obj;
  while (cur) {
    if (cur.userData?.sourceTag) return cur.userData.sourceTag;
    cur = cur.parent;
  }
  return null;
}
