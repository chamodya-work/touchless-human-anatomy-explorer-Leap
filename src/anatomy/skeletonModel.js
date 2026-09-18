/**
 * skeletonModel.js
 * -----------------------------------------------------------------------
 * Placeholder full-body 3D skeleton with the 12 selectable bones listed
 * in the brief, tagged with userData.partId matching anatomyData.js.
 *
 * >>> TO REPLACE WITH A REAL MODEL: see README "Replacing placeholder
 * anatomy models".
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { baseMaterial, PALETTE } from "./materials.js";

export function buildSkeletonModel() {
  const group = new THREE.Group();
  group.name = "PLACEHOLDER_SKELETON_MODEL";
  const boneMat = baseMaterial(PALETTE.bone, { roughness: 0.6, clearcoat: 0.2 });
  const parts = [];

  const add = (mesh, partId, pos, rot) => {
    mesh.userData.partId = partId;
    if (pos) mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    group.add(mesh);
    parts.push(mesh);
    return mesh;
  };

  add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), boneMat), "skull", [0, 1.55, 0]);

  add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 10), boneMat), "spine", [0, 0.6, 0]);

  add(new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.35, 6, 12), boneMat), "ribs", [0, 0.75, 0]);

  add(new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.3, 6, 12), boneMat), "pelvis", [0, -0.2, 0]);

  [-1, 1].forEach((side) => {
    add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.4, 8), boneMat),
      "clavicle",
      [side * 0.25, 1.15, 0.05],
      [0, 0, side * 0.15]
    );
    add(
      new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 0.04), boneMat),
      "scapula",
      [side * 0.32, 1.05, -0.1]
    );
    add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.55, 10), boneMat),
      "humerus",
      [side * 0.68, 0.65, 0],
      [0, 0, side * 0.12]
    );
    add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.5, 10), boneMat),
      "radius",
      [side * 0.82, 0.1, 0.03],
      [0, 0, side * 0.08]
    );
    add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.043, 0.5, 10), boneMat),
      "ulna",
      [side * 0.88, 0.1, -0.03],
      [0, 0, side * 0.08]
    );
    add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.65, 10), boneMat),
      "femur",
      [side * 0.22, -0.75, 0]
    );
    add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.6, 10), boneMat),
      "tibia",
      [side * 0.22, -1.5, 0.03]
    );
    add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.58, 10), boneMat),
      "fibula",
      [side * 0.28, -1.5, -0.03]
    );
  });

  group.userData.selectableParts = parts;

  // The skeleton is taller than the other placeholder models (heart,
  // brain, lungs) — scale + recenter it so it fits the same default
  // camera framing used by AnatomyViewer.resetView().
  group.scale.setScalar(0.62);
  group.position.y = 0.15;
  return group;
}
