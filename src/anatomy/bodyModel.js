/**
 * bodyModel.js
 * -----------------------------------------------------------------------
 * Full-body placeholder model shown on the Welcome screen, Idle mode, and
 * as a backdrop on the Main Menu. Built from primitives so the app runs
 * with zero external assets out of the box.
 *
 * >>> TO REPLACE WITH A REAL MODEL: see README section "Replacing
 * placeholder anatomy models with GLB/GLTF models" — load your GLB with
 * GLTFLoader and return the loaded scene from buildBodyModel() instead.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { baseMaterial, PALETTE, wireGhostMaterial } from "./materials.js";

export function buildBodyModel() {
  const group = new THREE.Group();
  group.name = "PLACEHOLDER_BODY_MODEL"; // clearly labeled placeholder per brief

  const skinMat = baseMaterial(PALETTE.cyan, {
    opacity: 0.28,
    emissive: PALETTE.cyan,
    emissiveIntensity: 0.15,
    roughness: 0.6,
  });
  const coreMat = wireGhostMaterial(PALETTE.cyanBright);

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.15, 8, 16), skinMat);
  torso.position.y = 0.35;
  group.add(torso);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), skinMat);
  head.position.y = 1.55;
  group.add(head);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.18, 12), skinMat);
  neck.position.y = 1.28;
  group.add(neck);

  // Arms
  [-1, 1].forEach((side) => {
    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.55, 6, 12), skinMat);
    upperArm.position.set(side * 0.72, 0.55, 0);
    upperArm.rotation.z = side * 0.25;
    group.add(upperArm);

    const lowerArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 6, 12), skinMat);
    lowerArm.position.set(side * 0.95, -0.05, 0.05);
    lowerArm.rotation.z = side * 0.15;
    group.add(lowerArm);
  });

  // Legs
  [-1, 1].forEach((side) => {
    const upperLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.65, 6, 12), skinMat);
    upperLeg.position.set(side * 0.24, -0.75, 0);
    group.add(upperLeg);

    const lowerLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.6, 6, 12), skinMat);
    lowerLeg.position.set(side * 0.24, -1.55, 0);
    group.add(lowerLeg);
  });

  // Ghost skeleton core (wireframe spine hint) — purely decorative, sells
  // the "futuristic medical scan" look without needing real assets.
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), coreMat);
  spine.position.y = 0.4;
  group.add(spine);

  group.userData.rotationSpeed = 0.15;
  return group;
}
