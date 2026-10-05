/**
 * eyeModel.js
 * -----------------------------------------------------------------------
 * FALLBACK ONLY. A small procedural eye (group name "PLACEHOLDER_EYE_MODEL")
 * built from primitives. EyeExplorer.js uses it only when the real
 * assets/models/eye_globe.glb (Z-Anatomy) is missing or fails to load, so
 * the Eye system never shows a blank screen. It is NOT real anatomy and the
 * explorer labels it as a placeholder.
 *
 * Same frame as the real model: the globe centre is the origin, the cornea
 * faces +Z. Returns a group whose userData holds:
 *   selectableParts  meshes with userData.partId (ids from anatomyData.js)
 *   eyeRig           { globe, pupil, lens, muscles } used for the animations
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";

const R = 0.75; // globe radius in scene units

function mat(color, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, metalness: 0, ...extra });
}

export function buildEyeModel() {
  const group = new THREE.Group();
  group.name = "PLACEHOLDER_EYE_MODEL";
  const globe = new THREE.Group();
  group.add(globe);
  const selectable = [];
  const add = (parent, mesh, partId, name) => {
    mesh.name = name;
    mesh.userData.partId = partId;
    mesh.userData.isProcedural = true;
    parent.add(mesh);
    if (partId) selectable.push(mesh);
    return mesh;
  };

  add(globe, new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), mat(0xf0eae2, { clearcoat: 0.3 })), "sclera", "sclera");

  // Cornea: a clear spherical cap bulging out of the front of the globe.
  const rc = R * 0.55;
  const capGeo = new THREE.SphereGeometry(rc, 36, 16, 0, Math.PI * 2, 0, 0.96);
  capGeo.rotateX(Math.PI / 2);
  capGeo.translate(0, 0, R * 0.55);
  add(globe, new THREE.Mesh(capGeo, mat(0xffffff, { transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false })), "cornea", "cornea");

  const iris = add(globe, new THREE.Mesh(new THREE.CircleGeometry(R * 0.46, 48), mat(0x6b3d1c, { side: THREE.DoubleSide })), "iris", "iris");
  iris.position.z = R * 0.86;
  const pupil = new THREE.Mesh(new THREE.CircleGeometry(R * 0.2, 32), new THREE.MeshBasicMaterial({ color: 0x050506, side: THREE.DoubleSide }));
  pupil.position.z = R * 0.865;
  pupil.name = "pupil";
  globe.add(pupil);

  // Lens: hidden behind the iris, but animated for the focus demo.
  const lens = new THREE.Mesh(new THREE.SphereGeometry(R * 0.4, 24, 16), mat(0xcfe8ff, { transparent: true, opacity: 0.0 }));
  lens.scale.set(1, 1, 0.6);
  lens.position.z = R * 0.55;
  lens.name = "lens";
  globe.add(lens);

  const nerve = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.12, R * 0.12, R * 2.2, 16), mat(0xe9d9a6));
  nerve.rotation.x = Math.PI / 2;
  nerve.position.set(R * 0.25, 0, -R * 1.9);
  add(group, nerve, "opticNerve", "optic nerve");

  const muscles = {};
  const spec = [
    ["superiorRectus", 0, 1],
    ["inferiorRectus", 0, -1],
    ["medialRectus", 1, 0],
    ["lateralRectus", -1, 0],
  ];
  spec.forEach(([id, sx, sy]) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(R * 0.13, R * 1.7, 6, 12), mat(0xb0524e));
    m.rotation.x = Math.PI / 2;
    m.position.set(sx * R * 0.82, sy * R * 0.82, -R * 0.95);
    add(group, m, id, id.replace(/([A-Z])/g, " $1").toLowerCase());
    muscles[id] = m;
  });

  group.userData.selectableParts = selectable;
  group.userData.eyeRig = { globe, pupil, lens, muscles };
  return group;
}
