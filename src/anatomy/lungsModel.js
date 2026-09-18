/**
 * lungsModel.js
 * -----------------------------------------------------------------------
 * Placeholder 3D respiratory system with selectable trachea, bronchi,
 * lungs, and diaphragm. Exposes group.userData.breathingParts so
 * LungExplorer can drive an inhale/exhale scale animation.
 *
 * >>> TO REPLACE WITH A REAL MODEL: see README "Replacing placeholder
 * anatomy models".
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { baseMaterial, PALETTE } from "./materials.js";

export function buildLungsModel() {
  const group = new THREE.Group();
  group.name = "PLACEHOLDER_LUNGS_MODEL";

  const lungMat = (color) => baseMaterial(color, { roughness: 0.55, opacity: 0.92 });

  const trachea = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.55, 14), lungMat(0xe8d8d0));
  trachea.position.set(0, 0.55, 0);
  trachea.userData.partId = "trachea";
  group.add(trachea);

  const bronchiGroup = new THREE.Group();
  [-1, 1].forEach((side) => {
    const bronchus = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.35, 10), lungMat(0xe0cac2));
    bronchus.position.set(side * 0.15, 0.2, 0);
    bronchus.rotation.z = side * 0.5;
    bronchus.userData.partId = "bronchi";
    bronchiGroup.add(bronchus);
  });
  group.add(bronchiGroup);

  const rightLung = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 20), lungMat(PALETTE.lungPink));
  rightLung.scale.set(0.75, 1.3, 0.65);
  rightLung.position.set(0.42, -0.15, 0);
  rightLung.userData.partId = "rightLung";
  group.add(rightLung);

  const leftLung = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 20), lungMat(0xff8a9c));
  leftLung.scale.set(0.68, 1.2, 0.6);
  leftLung.position.set(-0.42, -0.18, 0);
  leftLung.userData.partId = "leftLung";
  group.add(leftLung);

  const diaphragm = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.06, 24), lungMat(0xd0a0a0));
  diaphragm.position.set(0, -0.95, 0);
  diaphragm.userData.partId = "diaphragm";
  group.add(diaphragm);

  group.userData.selectableParts = [trachea, ...bronchiGroup.children, rightLung, leftLung, diaphragm];
  group.userData.breathingParts = { rightLung, leftLung, diaphragm };
  return group;
}
