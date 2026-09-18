/**
 * heartModel.js
 * -----------------------------------------------------------------------
 * Placeholder 3D heart, with named/selectable sub-parts (userData.partId
 * matches anatomyData.js heart.parts ids) and a defined blood-flow path
 * used by the particle animation.
 *
 * Model status: PROCEDURAL PLACEHOLDER -- see README + MODEL_MANIFEST.
 * Chambers are built from deformed/tapered spheres (an organic apex
 * taper toward the bottom, matching a heart's real silhouette) rather
 * than literal geometric primitives, but this is still a stylised
 * placeholder, not a real anatomical scan -- swap in a real GLB the
 * moment one is available (see ModelLoader.js + SkeletonExplorer.js for
 * the pattern to follow).
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { baseMaterial, PALETTE } from "./materials.js";

/**
 * Builds an organic, tapered chamber shape by deforming a sphere: pulled
 * to a rounded point at -Y (the apex, as on a real ventricle) and
 * slightly egg-shaped rather than perfectly round. Far closer to a real
 * chamber's silhouette than a cone-on-a-sphere.
 */
function heartChamber(radius, height, { apexPull = 0.9, bulge = 1.15, segments = 28 } = {}) {
  const geo = new THREE.SphereGeometry(radius, segments, segments);
  const pos = geo.attributes.position;
  const halfHeight = height / 2;

  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    const t = (v.y / radius + 1) / 2; // 0 at bottom, 1 at top

    // Stretch vertically toward `height`, then pull the lower half
    // toward a point (apex) using an eased power curve. Clamp the pow()
    // base to >=0 -- floating-point noise from SphereGeometry can put a
    // pole vertex a hair past -radius, and Math.pow(negative, non-integer)
    // is NaN in JS, which would otherwise corrupt the whole mesh.
    const stretched = (v.y / radius) * halfHeight;
    const apexBase = Math.max(0, t * 2);
    const apexFactor = t < 0.5 ? Math.pow(apexBase, apexPull) : 1;
    v.y = stretched;
    v.x *= apexFactor * bulge;
    v.z *= apexFactor * bulge;

    // Slight organic asymmetry so it doesn't read as a lathed solid.
    const wobble = 1 + 0.035 * Math.sin(v.y * 7 + v.x * 5);
    v.x *= wobble;
    v.z *= wobble;

    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildHeartModel() {
  const group = new THREE.Group();
  group.name = "PLACEHOLDER_HEART_MODEL";

  const chamberMat = (color) => baseMaterial(color, { roughness: 0.4, clearcoat: 0.45 });

  const rightAtrium = new THREE.Mesh(
    heartChamber(0.32, 0.5, { apexPull: 0.6, bulge: 1.05 }),
    chamberMat(PALETTE.vein)
  );
  rightAtrium.position.set(0.32, 0.42, -0.05);
  rightAtrium.userData.partId = "rightAtrium";
  group.add(rightAtrium);

  const rightVentricle = new THREE.Mesh(
    heartChamber(0.38, 0.95, { apexPull: 1.1, bulge: 1.1 }),
    chamberMat(0x3f5fcf)
  );
  rightVentricle.position.set(0.26, -0.28, 0);
  rightVentricle.userData.partId = "rightVentricle";
  group.add(rightVentricle);

  const leftAtrium = new THREE.Mesh(
    heartChamber(0.34, 0.52, { apexPull: 0.6, bulge: 1.05 }),
    chamberMat(PALETTE.artery)
  );
  leftAtrium.position.set(-0.3, 0.44, 0.05);
  leftAtrium.userData.partId = "leftAtrium";
  group.add(leftAtrium);

  const leftVentricle = new THREE.Mesh(
    heartChamber(0.44, 1.12, { apexPull: 1.25, bulge: 1.1 }),
    chamberMat(0xcf3f3f)
  );
  leftVentricle.position.set(-0.2, -0.34, 0.05);
  leftVentricle.userData.partId = "leftVentricle";
  group.add(leftVentricle);

  const aorta = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.075, 12, 32, Math.PI), chamberMat(PALETTE.artery));
  aorta.position.set(-0.05, 0.78, 0);
  aorta.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  aorta.userData.partId = "aorta";
  group.add(aorta);

  // Valves -- small torus rings at chamber junctions
  const valvePositions = [
    [0.28, 0.02, 0],
    [-0.24, 0.0, 0.05],
  ];
  valvePositions.forEach((pos, i) => {
    const valve = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 24), chamberMat(PALETTE.amber));
    valve.position.set(...pos);
    valve.rotation.x = Math.PI / 2;
    valve.userData.partId = "valves";
    valve.name = `valve_${i}`;
    group.add(valve);
  });

  // Overall outer "heart body" shell (subtle, mostly for silhouette),
  // itself using the same organic taper as the chambers.
  const shell = new THREE.Mesh(
    heartChamber(0.78, 1.7, { apexPull: 1.15, bulge: 1.05, segments: 24 }),
    baseMaterial(PALETTE.tissueDeepPink, { opacity: 0.07, roughness: 0.85 })
  );
  shell.position.y = -0.05;
  shell.userData.partId = null; // not directly selectable
  shell.userData.isShell = true;
  group.add(shell);

  group.userData.selectableParts = [
    rightAtrium,
    rightVentricle,
    leftAtrium,
    leftVentricle,
    aorta,
    ...group.children.filter((c) => c.userData.partId === "valves"),
  ];

  // Waypoints (world-local positions) for the blood-flow particle system,
  // matching SYSTEMS.heart.bloodFlowPath order in anatomyData.js
  group.userData.bloodFlowWaypoints = {
    veins: new THREE.Vector3(0.75, 0.6, -0.2),
    rightAtrium: rightAtrium.position.clone(),
    rightVentricle: rightVentricle.position.clone(),
    lungs: new THREE.Vector3(0.55, 1.1, -0.3),
    leftAtrium: leftAtrium.position.clone(),
    leftVentricle: leftVentricle.position.clone(),
    aorta: aorta.position.clone().add(new THREE.Vector3(0, 0.3, 0)),
  };

  return group;
}
