/**
 * brainModel.js
 * -----------------------------------------------------------------------
 * Placeholder 3D brain: a set of deformed lobe meshes tagged with
 * userData.partId matching anatomyData.js brain.parts ids.
 *
 * >>> TO REPLACE WITH A REAL MODEL: see README "Replacing placeholder
 * anatomy models".
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { baseMaterial, PALETTE } from "./materials.js";

function lobe(radiusScale, color, position, partId) {
  const geo = new THREE.SphereGeometry(0.42, 20, 20);
  // Slight irregular deformation so lobes don't look like plain spheres
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    const n = 1 + 0.06 * Math.sin(v.x * 6) * Math.cos(v.y * 5);
    v.multiplyScalar(n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, baseMaterial(color, { roughness: 0.5, clearcoat: 0.3 }));
  mesh.scale.set(...radiusScale);
  mesh.position.set(...position);
  mesh.userData.partId = partId;
  return mesh;
}

export function buildBrainModel() {
  const group = new THREE.Group();
  group.name = "PLACEHOLDER_BRAIN_MODEL";

  const parts = [
    lobe([1, 0.85, 0.9], PALETTE.brainTissue, [0.28, 0.25, 0.32], "frontal"),
    lobe([1, 0.85, 0.9], PALETTE.brainTissue, [-0.28, 0.25, 0.32], "frontal"), // mirrored, same label
    lobe([0.95, 0.8, 0.85], 0xc57ea0, [0.3, 0.35, -0.15], "parietal"),
    lobe([0.95, 0.8, 0.85], 0xc57ea0, [-0.3, 0.35, -0.15], "parietal"),
    lobe([0.85, 0.7, 0.8], 0xd88fae, [0.5, -0.15, 0.05], "temporal"),
    lobe([0.85, 0.7, 0.8], 0xd88fae, [-0.5, -0.15, 0.05], "temporal"),
    lobe([0.75, 0.65, 0.7], 0xb56b91, [0, 0.3, -0.55], "occipital"),
    lobe([0.6, 0.5, 0.55], 0xe0a5c0, [0, -0.35, -0.35], "cerebellum"),
    lobe([0.3, 0.55, 0.3], 0xf0c4d8, [0, -0.65, 0.05], "brainstem"),
  ];
  parts.forEach((p) => group.add(p));

  group.userData.selectableParts = parts;
  return group;
}
