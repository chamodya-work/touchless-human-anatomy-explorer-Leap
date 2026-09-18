/**
 * genericSystemModel.js
 * -----------------------------------------------------------------------
 * Lightweight placeholder builder used for systems that don't have a
 * dedicated bespoke explorer in the brief (Muscles, Digestive System,
 * Nervous System). Arranges one labeled placeholder mesh per entry in
 * SYSTEMS[id].parts around a torso silhouette, fully selectable and
 * highlightable just like the bespoke explorers.
 *
 * >>> TO REPLACE WITH REAL MODELS: see README "Replacing placeholder
 * anatomy models" — this is also the easiest place to swap in a bespoke
 * builder later (follow the pattern in heartModel.js / brainModel.js).
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { baseMaterial, PALETTE } from "./materials.js";

const COLOR_BY_SYSTEM = {
  muscles: 0xd9584f,
  digestive: 0xd4a24c,
  nervous: 0x7ce0ff,
};

export function buildGenericSystemModel(systemId, parts) {
  const group = new THREE.Group();
  group.name = `PLACEHOLDER_${systemId.toUpperCase()}_MODEL`;
  const color = COLOR_BY_SYSTEM[systemId] || PALETTE.cyan;

  // Faint torso silhouette for context
  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1.1, 8, 16),
    baseMaterial(0x888888, { opacity: 0.08, roughness: 0.9 })
  );
  torso.userData.isShell = true;
  group.add(torso);

  const n = parts.length;
  const meshes = parts.map((part, i) => {
    const angle = (i / n) * Math.PI * 2;
    const radius = 0.55;
    const y = 0.9 - (i / Math.max(1, n - 1)) * 1.7;
    const geo = new THREE.IcosahedronGeometry(0.18, 1);
    const mesh = new THREE.Mesh(geo, baseMaterial(color, { roughness: 0.5, clearcoat: 0.3 }));
    mesh.position.set(Math.cos(angle) * radius * 0.6, y, Math.sin(angle) * radius * 0.6);
    mesh.userData.partId = part.id;
    group.add(mesh);
    return mesh;
  });

  group.userData.selectableParts = meshes;
  return group;
}
