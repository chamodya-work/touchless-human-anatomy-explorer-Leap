/**
 * DigestiveExplorer.js
 * -----------------------------------------------------------------------
 * Interactive digestive system mode: select liver, pancreas, gallbladder,
 * duodenum, small/large intestine and the bile duct network.
 *
 * Loads SIX real, separately-sourced GLB files (HuBMAP Human Reference
 * Atlas, CC BY 4.0 -- see ATTRIBUTION.md) combined into one scene via
 * ModelLoader.loadCombinedAnatomyModel(), which preserves their real
 * relative anatomical positions. A small procedural stomach is added
 * (this dataset doesn't include one) -- see README/ATTRIBUTION. Falls
 * back entirely to the procedural placeholder if the real GLBs are
 * missing or fail to load.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { loadCombinedAnatomyModel } from "../anatomy/ModelLoader.js";
import { classifyDigestivePart } from "../anatomy/digestiveClassifier.js";
import { buildGenericSystemModel } from "../anatomy/genericSystemModel.js";
import { getModelInfo } from "../data/modelManifest.js";
import { SYSTEMS } from "../data/anatomyData.js";

const PART_COLORS = {
  liver: 0x8a4a3d,
  gallbladder: 0x4a7a4a,
  pancreas: 0xd4a24c,
  duodenum: 0xc98a6e,
  smallIntestine: 0xd39a82,
  largeIntestine: 0xb5745a,
  bileDucts: 0x5a8a6e,
};

function materialFor(partId) {
  return new THREE.MeshStandardMaterial({
    color: PART_COLORS[partId] || 0xb5745a,
    roughness: 0.55,
    metalness: 0.02,
  });
}

/** Small procedural stomach -- not part of this dataset. Positioned near
 *  the liver/duodenum junction using their real combined-space centers. */
function buildProceduralStomach(anchor, scale) {
  const geo = new THREE.SphereGeometry(1, 24, 24);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    v.x *= 0.55;
    v.y *= 0.9;
    v.z *= 0.7;
    const bend = Math.sin((v.y + 1) * 1.4) * 0.18;
    v.x += bend;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xc47a6a, roughness: 0.55 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.setScalar(scale);
  mesh.position.copy(anchor);
  mesh.userData.partId = "stomach";
  mesh.userData.isProcedural = true;
  return mesh;
}

export class DigestiveExplorer {
  constructor({ viewer, infoPanel, controlsRoot }) {
    this.viewer = viewer;
    this.infoPanel = infoPanel;
    this.controlsRoot = controlsRoot;
    this.system = SYSTEMS.digestive;
  }

  async mount() {
    this.controlsRoot.innerHTML = '<p class="model-status" id="digestive-status">Loading real anatomical model...</p>';
    let model;
    let usedRealModel = false;

    try {
      const info = getModelInfo("digestive");
      model = await loadCombinedAnatomyModel(info.sources, { orient: info.orient, targetSize: 2.2 });

      const selectable = [];
      const centersByTag = {};
      model.traverse((obj) => {
        if (obj.isMesh) {
          const sourceTag = findSourceTag(obj);
          const partId = classifyDigestivePart(obj.name, sourceTag);
          obj.userData.organName = obj.name;
          obj.userData.partId = partId;
          obj.material = materialFor(partId);
          if (partId) {
            selectable.push(obj);
            const box = new THREE.Box3().setFromObject(obj);
            const c = new THREE.Vector3();
            box.getCenter(c);
            model.worldToLocal(c);
            if (!centersByTag[sourceTag]) centersByTag[sourceTag] = [];
            centersByTag[sourceTag].push(c);
          }
        }
      });

      // Place the procedural stomach near the liver/duodenum junction --
      // a reasonable anatomical neighbor given real data for both.
      const liverCenter = avg(centersByTag.liver);
      const duodenumCenter = avg(centersByTag.smallIntestine);
      if (liverCenter && duodenumCenter) {
        const anchor = liverCenter.clone().lerp(duodenumCenter, 0.5);
        anchor.y += 0.15;
        const stomach = buildProceduralStomach(anchor, 0.35);
        model.add(stomach);
        selectable.push(stomach);
      }

      model.userData.selectableParts = selectable;
      usedRealModel = true;
    } catch (err) {
      console.error("[DigestiveExplorer] Real GLBs failed to load, falling back to procedural placeholder:", err);
      model = buildGenericSystemModel("digestive", this.system.parts);
    }

    this.viewer.setModelAnimated(model, { selectable: model.userData.selectableParts });
    this.viewer.resetView();
    this.infoPanel.showSystem(this.system);

    this.viewer.onSelect = (partId, mesh) => {
      const part = this.system.parts.find((p) => p.id === partId);
      if (part) {
        this.infoPanel.showPart(part, {
          realName: mesh?.userData?.isProcedural ? null : mesh?.userData?.organName,
          systemId: "digestive",
        });
      }
    };

    this.controlsRoot.innerHTML = `<p class="model-status${usedRealModel ? "" : " model-status--fallback"}">${
      usedRealModel
        ? "Real liver, pancreas, gallbladder & intestines \u00b7 HuBMAP Human Reference Atlas (CC BY 4.0)"
        : "Placeholder model -- see README"
    }</p>`;
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

function avg(arr) {
  if (!arr || !arr.length) return null;
  const v = new THREE.Vector3();
  arr.forEach((p) => v.add(p));
  return v.divideScalar(arr.length);
}
