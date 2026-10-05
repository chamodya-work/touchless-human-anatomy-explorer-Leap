/**
 * EyeExplorer.js
 * -----------------------------------------------------------------------
 * Interactive eye mode. Select any of 19 structures (cornea, iris, lens,
 * retina, optic nerve, the six eye muscles, tear apparatus ...), and run
 * five demonstrations:
 *
 *   Light Reflex   the pupil narrows in bright light / widens in dim light
 *                  (the real iris mesh is morphed radially; its outer ring
 *                  stays fixed)
 *   Focus Near/Far the real lens thickens for near objects while the
 *                  zonular fibres relax
 *   Eye Movement   the globe rotates about its centre; the muscles and optic
 *                  nerve are skinned to follow and the working muscles glow
 *   Tear Flow      particles follow the real path gland -> eye surface ->
 *                  canaliculus -> lacrimal sac -> nasolacrimal duct
 *   See Inside     sclera and cornea turn ghostly so the lens, retina,
 *                  vitreous and aqueous can be seen and selected
 *
 * Assets: assets/models/eye_globe.glb + eye_orbit.glb (Z-Anatomy, CC BY-SA
 * 4.0, derived from BodyParts3D -- see ATTRIBUTION.md), already centred on
 * the globe's rotation centre, in metres, Y-up, cornea facing +Z. The orbit
 * file is optional (no muscles/nerve/tears without it). If eye_globe.glb
 * fails, a clearly-labelled procedural eye (anatomy/eyeModel.js) is used.
 *
 * Animation note: AnatomyViewer pulses the SELECTED mesh with
 * mesh.scale, so nothing here animates mesh scale; the iris, lens, zonules
 * and muscles are morphed by editing (cloned) vertex positions, and the
 * globe is rotated through its parent group.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { loadCombinedAnatomyModel, findSourceTag } from "../anatomy/ModelLoader.js";
import { classifyEyePart, prettyEyeName, EYE_MUSCLE_IDS } from "../anatomy/eyeClassifier.js";
import { buildEyeModel } from "../anatomy/eyeModel.js";
import { getModelInfo } from "../data/modelManifest.js";
import { getSystem } from "../data/anatomyData.js";
import { OpacityFader } from "../anatomy/fade.js";
import { t, getLang, onLanguageChange } from "../data/i18n.js";

const MM = 0.001;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (e0, e1, x) => {
  const k = clamp((x - e0) / (e1 - e0), 0, 1);
  return k * k * (3 - 2 * k);
};

/** Parts only reachable once the outer shell is made see-through. */
const INNER_ONLY = new Set(["retina", "vitreous", "aqueous", "zonules"]);
/** Large/clear shells and volumes: lose hover/select ties to anything inside. */
const DEPRIORITISED = new Set(["sclera", "cornea", "aqueous", "vitreous"]);
const RENDER_ORDER = { retina: 1, vitreous: 2, zonules: 3, lens: 4, iris: 5, aqueous: 6, sclera: 7, cornea: 8 };

// ---- gaze demo script ------------------------------------------------
// yaw: + = toward the nose; pitch: + = up (applied as -rotation.x)
const GAZE_STEPS = [
  { key: "eyeGazeOut", yaw: -26, pitch: 0, muscles: ["lateralRectus"] },
  { key: "eyeGazeCenter", yaw: 0, pitch: 0, muscles: [] },
  { key: "eyeGazeIn", yaw: 22, pitch: 0, muscles: ["medialRectus"] },
  { key: "eyeGazeCenter", yaw: 0, pitch: 0, muscles: [] },
  { key: "eyeGazeUp", yaw: 0, pitch: 20, muscles: ["superiorRectus", "inferiorOblique"] },
  { key: "eyeGazeCenter", yaw: 0, pitch: 0, muscles: [] },
  { key: "eyeGazeDown", yaw: 0, pitch: -20, muscles: ["inferiorRectus", "superiorOblique"] },
  { key: "eyeGazeCenter", yaw: 0, pitch: 0, muscles: [] },
];
const GAZE_STEP_SECONDS = 1.7;

// Camera presets (modelRoot rotation, radians). The viewer auto-rotates the
// model forever; any demo switches that off and glides here, because the
// effect has to face the visitor to be visible: the pupil and gaze are seen
// from the front, the lens thickening only from the side (see-through eye).
const VIEW_PRESETS = {
  light: { y: 0, x: 0, zoom: 3.5 },
  gaze: { y: 0, x: -0.12, zoom: 3.9 },
  tears: { y: -0.25, x: 0, zoom: 3.9 },
  focus: { y: -Math.PI / 2, x: 0, zoom: 3.0 },
};
const DEFAULT_ZOOM = 4.2; // AnatomyViewer's own default
const GLOBE_PARTS = new Set(["sclera", "cornea", "iris", "lens", "retina", "vitreous", "aqueous", "zonules"]);
const VIEW_SETTLE_SECONDS = 2.2; // after this the visitor may drag freely
const wrapAngle = (a) => ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
const PHASE_SECONDS = 3.5; // light / focus alternate every 3.5 s

// ---- materials ----------------------------------------------------------
// Realism without textures (the Z-Anatomy meshes have no UVs): small GLSL
// patches add vessels / fibres / striations from object-space position, and a
// procedural studio environment map gives the wet, glossy reflections that
// flat colours lack.
const NOISE_GLSL = `
float h31(vec3 p){p=fract(p*0.3183099+vec3(.1,.2,.3));p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vnoise(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vnoise(p);p*=2.03;a*=.5;}return s;}
`;

/** Inject object-space-position shading into a MeshPhysicalMaterial. */
function patchMaterial(mat, key, { attr = "", vertex = "", varying = "", frag }) {
  mat.customProgramCacheKey = () => key;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vLP;\n${attr}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvLP = position;\n${vertex}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vLP;\n${varying}\n${NOISE_GLSL}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${frag}`);
  };
  return mat;
}

const SCLERA_FRAG = `
 vec3 q = vLP * 76.0;
 float r1 = 1.0 - abs(fbm(q * 2.1) * 2.0 - 1.0);
 float r2 = 1.0 - abs(fbm(q * 5.3 + 7.0) * 2.0 - 1.0);
 float veins = smoothstep(0.935, 0.992, r1) + 0.55 * smoothstep(0.955, 0.996, r2);
 veins *= mix(1.0, 0.15, smoothstep(0.35, 0.95, q.z));          // fewer vessels toward the cornea
 float blotch = fbm(q * 1.4 + 3.0);
 diffuseColor.rgb *= mix(vec3(0.97, 0.93, 0.86), vec3(1.0, 0.98, 0.95), blotch);
 diffuseColor.rgb *= mix(vec3(1.0), vec3(0.78, 0.32, 0.28), clamp(veins, 0.0, 1.0) * 0.6);
`;
const MUSCLE_FRAG = `
 float d = length(vLP);
 float tendon = smoothstep(0.0215, 0.0150, d);                    // pale tendon near the globe
 float grain = fbm(vLP * vec3(1100.0, 1100.0, 1100.0));
 vec3 belly = vec3(0.50, 0.075, 0.07) * (0.8 + 0.5 * grain);
 vec3 tend = vec3(0.80, 0.73, 0.64) * (0.92 + 0.16 * grain);
 diffuseColor.rgb = mix(belly, tend, tendon);
`;
const IRIS_FRAG = `
 float tt = vIris.x;
 float th = vIris.y;
 float fib = fbm(vec3(th * 34.0, tt * 5.0, 1.0));
 float fine = vnoise(vec3(th * 120.0, tt * 16.0, 3.0));
 vec3 pupilEdge = vec3(0.045, 0.02, 0.012);
 vec3 inner = vec3(0.40, 0.20, 0.07);
 vec3 collar = vec3(0.60, 0.37, 0.15);
 vec3 outer = vec3(0.17, 0.085, 0.035);
 vec3 c = mix(pupilEdge, inner, smoothstep(0.0, 0.12, tt));
 c = mix(c, collar, smoothstep(0.26, 0.38, tt) * (1.0 - smoothstep(0.38, 0.52, tt)));
 c = mix(c, outer, smoothstep(0.42, 0.95, tt));
 c = mix(c, vec3(0.02, 0.012, 0.008), smoothstep(0.9, 0.995, tt));   // limbal ring
 float crypts = smoothstep(0.62, 0.8, vnoise(vec3(th * 9.0, tt * 7.0, 5.0)));
 c *= (0.7 + 0.55 * fib) * (0.85 + 0.3 * fine) * (1.0 - 0.35 * crypts * smoothstep(0.12, 0.3, tt));
 diffuseColor.rgb = c;
`;
const RETINA_FRAG = `
 vec3 q = vLP * 76.0;
 float rr = 1.0 - abs(fbm(q * 3.0) * 2.0 - 1.0);
 float vess = smoothstep(0.9, 0.99, rr);
 vec3 c = mix(vec3(0.74, 0.27, 0.17), vec3(0.86, 0.38, 0.22), fbm(q * 1.5));
 diffuseColor.rgb = mix(c, vec3(0.38, 0.03, 0.03), vess * 0.8);
`;

function std(o) {
  return new THREE.MeshPhysicalMaterial({ metalness: 0, roughness: 0.5, ...o });
}
function materialFor(partId) {
  switch (partId) {
    case "sclera":
      return patchMaterial(std({ color: 0xf2ece4, roughness: 0.36, clearcoat: 0.55, clearcoatRoughness: 0.22, transparent: true }), "eye-sclera", { frag: SCLERA_FRAG });
    case "cornea":
      // Clear glass: black + additive, so only its reflections/fresnel show.
      return std({ color: 0x000000, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.01, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, envMapIntensity: 1.2 });
    case "iris":
      return patchMaterial(std({ color: 0xffffff, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.4, side: THREE.DoubleSide }), "eye-iris", {
        attr: "attribute vec2 aIris; varying vec2 vIris;",
        vertex: "vIris = aIris;",
        varying: "varying vec2 vIris;",
        frag: IRIS_FRAG,
      });
    case "lens": return std({ color: 0x010203, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, envMapIntensity: 0.55 });
    case "retina": return patchMaterial(std({ color: 0xffffff, roughness: 0.55, side: THREE.DoubleSide }), "eye-retina", { frag: RETINA_FRAG });
    case "vitreous": return std({ color: 0xbfe6ee, roughness: 0.1, transparent: true, opacity: 0.3, depthWrite: false });
    case "aqueous": return std({ color: 0xcdeaff, roughness: 0.05, transparent: true, opacity: 0.25, depthWrite: false });
    case "zonules": return std({ color: 0xe9e4d6, roughness: 0.5 });
    case "opticNerve": return std({ color: 0xe6d9bd, roughness: 0.45, clearcoat: 0.25 });
    case "levator": return patchMaterial(std({ color: 0xffffff, roughness: 0.5, clearcoat: 0.2 }), "eye-muscle", { frag: MUSCLE_FRAG });
    case "tendinousRing": return std({ color: 0xd8c7ae, roughness: 0.55 });
    case "lacrimalGland": return std({ color: 0xb98672, roughness: 0.5, clearcoat: 0.2 });
    case "tearDrainage": return std({ color: 0xc79c8a, roughness: 0.4, clearcoat: 0.3 });
    default:
      // the six eye muscles
      return patchMaterial(std({ color: 0xffffff, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.35 }), "eye-muscle", { frag: MUSCLE_FRAG });
  }
}

/** Soft studio lighting baked into an environment map (no external HDR needed). */
function buildStudioEnvironment(renderer) {
  if (!renderer) return null;
  try {
    const env = new THREE.Scene();
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(20, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader:
          "varying vec3 vP; void main(){ vec3 top = vec3(0.50,0.58,0.70); vec3 hor = vec3(0.16,0.18,0.22); vec3 bot = vec3(0.05,0.045,0.05); float h = vP.y; vec3 c = h > 0.0 ? mix(hor, top, pow(h, 0.55)) : mix(hor, bot, pow(-h, 0.55)); c *= 1.0 - 0.9 * smoothstep(0.05, 0.7, vP.z); gl_FragColor = vec4(c, 1.0); }",
      })
    );
    env.add(dome);
    const box = (w, h, x, y, z, k, tint = [1, 1, 1]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0], tint[1], tint[2]).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    box(9, 6, 7, 9, 10, 9);                    // key softbox, upper right front
    box(6, 9, -10, 3, 6, 4.5, [0.85, 0.92, 1]); // cool fill, left
    box(14, 3, 0, 14, -4, 5);                  // top strip
    box(5, 5, 2, -8, 8, 1.6, [1, 0.88, 0.75]); // warm bounce from below
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(env, 0.03).texture;
    pm.dispose();
    env.traverse((o) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
    return tex;
  } catch (err) {
    console.warn("[EyeExplorer] Environment map unavailable; continuing without reflections:", err);
    return null;
  }
}

/** Soft round droplet sprite (no-op where canvas is unavailable, e.g. headless tests). */
function makeDropletTexture() {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext && c.getContext("2d");
  if (!g) return null;
  const grad = g.createRadialGradient(26, 24, 2, 32, 32, 30);
  grad.addColorStop(0, "rgba(235,250,255,1)");
  grad.addColorStop(0.35, "rgba(110,200,245,0.95)");
  grad.addColorStop(0.8, "rgba(40,130,210,0.75)");
  grad.addColorStop(1, "rgba(40,130,210,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Make a mesh lose raycast ties by `bias` world units (see class docs). */
function deprioritise(mesh, bias) {
  const original = mesh.raycast.bind(mesh);
  mesh.raycast = (raycaster, intersects) => {
    const n = intersects.length;
    original(raycaster, intersects);
    for (let i = n; i < intersects.length; i++) intersects[i].distance += bias;
  };
}

/** Ignore hits on the part of a mesh that is currently sliced away by userData.clipPlane. */
function clipAwareRaycast(mesh) {
  const original = mesh.raycast.bind(mesh);
  mesh.raycast = (raycaster, intersects) => {
    const n = intersects.length;
    original(raycaster, intersects);
    const plane = mesh.userData.clipPlane;
    if (!plane) return;
    for (let i = intersects.length - 1; i >= n; i--) {
      if (plane.distanceToPoint(intersects[i].point) < 0) intersects.splice(i, 1);
    }
  };
}

// ---- morph helpers (all operate on a CLONED geometry) ---------------------
function prepMorph(mesh) {
  mesh.geometry = mesh.geometry.clone(); // never mutate the loader's cached geometry
  const pos = mesh.geometry.attributes.position;
  return { mesh, pos, base: Float32Array.from(pos.array), count: pos.count };
}
function commit(m, normals) {
  m.pos.needsUpdate = true;
  if (normals) m.mesh.geometry.computeVertexNormals();
  m.mesh.geometry.computeBoundingSphere();
  m.mesh.geometry.computeBoundingBox();
}

/** Iris: radial pupil resize; its look comes from IRIS_FRAG using the aIris attribute. */
function makeIrisRig(mesh) {
  const m = prepMorph(mesh);
  const b = m.base;
  const n = m.count;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, b[i * 3]); maxX = Math.max(maxX, b[i * 3]);
    minY = Math.min(minY, b[i * 3 + 1]); maxY = Math.max(maxY, b[i * 3 + 1]);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const r = new Float32Array(n);
  let r0 = Infinity, R = 0;
  for (let i = 0; i < n; i++) {
    r[i] = Math.hypot(b[i * 3] - cx, b[i * 3 + 1] - cy);
    r0 = Math.min(r0, r[i]);
    R = Math.max(R, r[i]);
  }

  // Polar coordinates of the REST iris (radius 0..1 between pupil edge and
  // outer root, angle) travel with each vertex, so the fibre pattern in the
  // shader stretches with the pupil instead of sliding over it.
  const polar = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    polar[i * 2] = clamp((r[i] - r0) / (R - r0), 0, 1);
    polar[i * 2 + 1] = Math.atan2(b[i * 3 + 1] - cy, b[i * 3] - cx);
  }
  mesh.geometry.setAttribute("aIris", new THREE.BufferAttribute(polar, 2));

  const arr = m.pos.array;
  return {
    restPupilMm: r0 / MM,
    setPupilRadiusMm(mm) {
      const rp = clamp(mm * MM, 0.3 * MM, R * 0.8);
      const k = (R - rp) / (R - r0);
      for (let i = 0; i < n; i++) {
        const dx = b[i * 3] - cx;
        const dy = b[i * 3 + 1] - cy;
        const ri = r[i];
        const s = ri > 1e-9 ? (rp + (ri - r0) * k) / ri : 1; // outer ring fixed, pupil edge moves
        arr[i * 3] = cx + dx * s;
        arr[i * 3 + 1] = cy + dy * s;
        arr[i * 3 + 2] = b[i * 3 + 2];
      }
      commit(m, true);
    },
  };
}

/** Lens: thicker + rounder for near focus (posterior side mostly fixed). */
function makeLensRig(mesh) {
  const m = prepMorph(mesh);
  const b = m.base;
  const n = m.count;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, b[i * 3]); maxX = Math.max(maxX, b[i * 3]);
    minY = Math.min(minY, b[i * 3 + 1]); maxY = Math.max(maxY, b[i * 3 + 1]);
    minZ = Math.min(minZ, b[i * 3 + 2]); maxZ = Math.max(maxZ, b[i * 3 + 2]);
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const z0 = minZ + 0.3 * (maxZ - minZ);
  const arr = m.pos.array;
  return {
    set(k) {
      const kz = 1 + 0.28 * k;
      const kxy = 1 / Math.sqrt(kz); // roughly volume-preserving
      for (let i = 0; i < n; i++) {
        arr[i * 3] = cx + (b[i * 3] - cx) * kxy;
        arr[i * 3 + 1] = cy + (b[i * 3 + 1] - cy) * kxy;
        arr[i * 3 + 2] = z0 + (b[i * 3 + 2] - z0) * kz;
      }
      commit(m, true);
    },
  };
}

/** Zonular fibres: shift inward as the ciliary muscle contracts (near focus). */
function makeZonuleRig(mesh) {
  const m = prepMorph(mesh);
  const b = m.base;
  const n = m.count;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, b[i * 3]); maxX = Math.max(maxX, b[i * 3]);
    minY = Math.min(minY, b[i * 3 + 1]); maxY = Math.max(maxY, b[i * 3 + 1]);
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const arr = m.pos.array;
  return {
    set(k) {
      const shift = 0.4 * MM * k;
      for (let i = 0; i < n; i++) {
        const dx = b[i * 3] - cx, dy = b[i * 3 + 1] - cy;
        const ri = Math.hypot(dx, dy);
        const s = ri > shift ? (ri - shift) / ri : 1;
        arr[i * 3] = cx + dx * s;
        arr[i * 3 + 1] = cy + dy * s;
        arr[i * 3 + 2] = b[i * 3 + 2];
      }
      commit(m, false); // shift is tiny -- skip the normal rebuild (34k vertices)
    },
  };
}

/**
 * Muscles / optic nerve: vertices near the globe follow its rotation fully,
 * the far (orbital apex) end stays put, smooth in between.
 */
function makeFollowRig(mesh, nearDist = 13.5 * MM) {
  const m = prepMorph(mesh);
  const b = m.base;
  const n = m.count;
  const d = new Float32Array(n);
  let dmin = Infinity, dmax = 0;
  for (let i = 0; i < n; i++) {
    d[i] = Math.hypot(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]);
    dmin = Math.min(dmin, d[i]);
    dmax = Math.max(dmax, d[i]);
  }
  const near = Math.max(dmin, nearDist);
  const w = new Float32Array(n);
  for (let i = 0; i < n; i++) w[i] = smoothstep(0, 1, (dmax - d[i]) / Math.max(1e-6, dmax - near));
  const arr = m.pos.array;
  return {
    apply(matrix) {
      const e = matrix.elements;
      for (let i = 0; i < n; i++) {
        const x = b[i * 3], y = b[i * 3 + 1], z = b[i * 3 + 2];
        const rx = e[0] * x + e[4] * y + e[8] * z;
        const ry = e[1] * x + e[5] * y + e[9] * z;
        const rz = e[2] * x + e[6] * y + e[10] * z;
        const k = w[i];
        arr[i * 3] = x + (rx - x) * k;
        arr[i * 3 + 1] = y + (ry - y) * k;
        arr[i * 3 + 2] = z + (rz - z) * k;
      }
      commit(m, true);
    },
  };
}

function bboxOf(mesh) {
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox;
}

export class EyeExplorer {
  constructor({ viewer, infoPanel, controlsRoot }) {
    this.viewer = viewer;
    this.infoPanel = infoPanel;
    this.controlsRoot = controlsRoot;
    this.system = getSystem("eye", getLang());
    this._usedRealModel = false;
    this._langUnsub = null;
    this._rig = null;
    this._selectable = [];
    this._model = null;

    this._active = { light: false, focus: false, gaze: false, tears: false, inside: false };
    this._order = []; // modes in the order they were switched on (explainer shows the latest)
    this._texts = {}; // mode -> ui string key currently describing it
    this._timers = { light: 0, focus: 0, gaze: 0 };
    this._pupilMm = 0;
    this._focusK = 0;
    this._yaw = 0; // degrees (current, smoothed)
    this._pitch = 0;
    this._gazeIdx = -1;
    this._gazeMuscles = new Set();
    this._lastGazeKey = "";
    this._viewSettle = 0; // seconds left of "glide to the demo's view"
    this._lightLevel = 0; // -1 dim .. 0 neutral .. +1 bright (ambient cue)
    this._lightLevelApplied = 99;
    this._autoInside = false; // See Inside was switched on by the focus demo
    this._overlay = null;
    this._rail = null;
    this._envTex = null;
    this._pupilApplied = null;
    this._focusApplied = null;
    this._gazeApplied = { yaw: 1e9, pitch: 1e9 };
  }

  async mount() {
    this.controlsRoot.innerHTML = `<p class="model-status" id="eye-status">${t("modelLoading")}</p>`;
    this.system = getSystem("eye", getLang());
    let model;
    let rig;
    let usedReal = false;

    try {
      const info = getModelInfo("eye");
      model = await loadCombinedAnatomyModel(info.sources, {
        orient: info.orient,
        targetSize: info.targetSize ?? 1.4,
        scaleReferenceTag: info.scaleReferenceTag,
      });
      // Capture BEFORE setModelAnimated(): the viewer shrinks the model to
      // 0.01x for its intro transition.
      const modelScale = model.scale.x || 1;
      rig = this._buildRealRig(model, modelScale);
      usedReal = true;
    } catch (err) {
      console.error("[EyeExplorer] Real GLB failed to load, falling back to procedural placeholder:", err);
      model = buildEyeModel();
      rig = this._buildProceduralRig(model);
    }

    this._rig = rig;
    this._model = model;
    this._usedRealModel = usedReal;
    // The viewer keeps a reference to this array, so it is edited in place
    // (never replaced) when "See Inside" changes what can be selected.
    this._selectable = model.userData.selectableParts || (model.userData.selectableParts = []);
    this._selectable.length = 0;
    this._selectable.push(...rig.selectableFor(false));
    this._pupilMm = rig.restPupilMm;

    this.viewer.setModelAnimated(model, { selectable: this._selectable });
    this.viewer.resetView();
    this.infoPanel.showSystem(this.system);

    this.viewer.onSelect = (partId, mesh) => {
      const part = this.system.parts.find((p) => p.id === partId);
      if (part) {
        this.infoPanel.showPart(part, {
          realName: mesh?.userData?.isProcedural ? null : prettyEyeName(mesh?.name),
          systemId: "eye",
        });
      }
    };

    model.userData.onFrame = (dt) => this._tick(dt);

    // Ambient-light cue for the light reflex: a soft glow / dimming around the eye.
    if (typeof document !== "undefined") {
      this._overlay = document.createElement("div");
      this._overlay.id = "eye-light-overlay";
      this._overlay.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;transition:none;";
      document.body.appendChild(this._overlay);
    }

    this._renderControls();
    this._langUnsub = onLanguageChange(() => {
      this.system = getSystem("eye", getLang());
      this._renderControls();
    });
  }

  // =====================================================================
  //  Rigs: one for the real Z-Anatomy model, one for the procedural fallback.
  //  Both expose the same small interface used by _tick() / the controls.
  // =====================================================================
  _buildRealRig(model, modelScale) {
    const byPart = {};
    const all = [];
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      const partId = classifyEyePart(obj.name);
      obj.userData.partId = partId;
      if (!partId) return;
      obj.material = materialFor(partId);
      if (RENDER_ORDER[partId]) obj.renderOrder = RENDER_ORDER[partId];
      (byPart[partId] ||= []).push(obj);
      all.push(obj);
    });
    if (!byPart.sclera || !byPart.iris || !byPart.lens) {
      throw new Error("eye_globe.glb is missing expected meshes (sclera / iris / lens)");
    }

    const globeRoot = model.children.find((c) => c.userData.sourceTag === "globe") || model;
    const hasOrbit = !(model.userData.skippedSources || []).includes("orbit") && !!byPart.lateralRectus;
    this._hasOrbit = hasOrbit;

    // Ties between shells/volumes and the structures inside them go to the inside.
    // 10 mm in scene units: more than the gap between a shell and whatever
    // is just inside it, far less than the >= 20 mm to anything genuinely
    // hidden behind the globe.
    const bias = 0.01 * modelScale;
    // Reflections: one shared environment map for every lit eye material.
    this._envTex = buildStudioEnvironment(this.viewer.renderer);
    if (this._envTex) {
      all.forEach((m) => {
        if (m.material.envMapIntensity !== undefined) {
          m.material.envMap = this._envTex;
          if (!DEPRIORITISED.has(m.userData.partId) || m.userData.partId === "sclera") {
            m.material.envMapIntensity = m.material.envMapIntensity === 1 ? 0.85 : m.material.envMapIntensity;
          }
        }
      });
    }
    DEPRIORITISED.forEach((id) => (byPart[id] || []).forEach((m) => deprioritise(m, bias)));
    all.forEach((m) => {
      if (GLOBE_PARTS.has(m.userData.partId)) clipAwareRaycast(m);
    });
    // World-space slice through the globe centre: keeps the half FARTHEST from
    // the camera (Z < 0), so a side view looks into the half-eye.
    const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    const viewerRenderer = this.viewer.renderer;

    const iris = makeIrisRig(byPart.iris[0]);
    const lens = makeLensRig(byPart.lens[0]);
    const zonules = byPart.zonules ? makeZonuleRig(byPart.zonules[0]) : null;

    // Things that follow the globe when it rotates.
    const followers = [];
    EYE_MUSCLE_IDS.forEach((id) => (byPart[id] || []).forEach((m) => followers.push(makeFollowRig(m))));
    (byPart.opticNerve || []).forEach((m) => followers.push(makeFollowRig(m)));

    const muscles = {};
    EYE_MUSCLE_IDS.forEach((id) => {
      if (byPart[id]?.[0]) muscles[id] = byPart[id][0];
    });

    // ---- tear path: gland -> eye surface -> canaliculus -> sac -> duct ----
    let tears = null;
    if (byPart.lacrimalGland && byPart.tearDrainage) {
      const centre = (mesh) => bboxOf(mesh).getCenter(new THREE.Vector3());
      const gland = centre(byPart.lacrimalGland[0]);
      const drain = byPart.tearDrainage;
      const named = (n) => drain.find((m) => classifyEyePartRaw(m.name) === n) || drain[0];
      const canal = centre(named("lacrimal canaliculus"));
      const sac = centre(named("lacrimal sac"));
      const ductBox = bboxOf(named("nasolacrimal duct"));
      const duct = new THREE.Vector3((ductBox.min.x + ductBox.max.x) / 2, ductBox.min.y + 1 * MM, (ductBox.min.z + ductBox.max.z) / 2);
      const P = (x, y, z) => new THREE.Vector3(x * MM, y * MM, z * MM);
      const curve = new THREE.CatmullRomCurve3([gland, P(-6, 9, 9), P(-2, 6, 13.2), P(0, 0.5, 14.7), P(5, -4, 11.8), canal, sac, duct], false, "centripetal");
      const count = 42;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
      // Point size is in SCENE units (not scaled by the model matrix), so convert 1.1 mm.
      const droplet = makeDropletTexture();
      const mat = new THREE.PointsMaterial({
        color: droplet ? 0xffffff : 0x4fb4ee,
        map: droplet,
        size: 0.0016 * modelScale,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        alphaTest: droplet ? 0.02 : 0,
      });
      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false;
      model.add(points);
      tears = { curve, points, count, fader: new OpacityFader(points, 0.95, 0.4), phase: 0, tmp: new THREE.Vector3() };
    }

    const sclera = byPart.sclera[0].material;
    const cornea = byPart.cornea?.[0]?.material;
    const lensMat = byPart.lens[0].material;
    lensMat.emissiveIntensity = 0; // three.js defaults to 1: would flash blue once the glow colour is set
    const vitreousMat = byPart.vitreous?.[0]?.material;
    const setVisible = (id, v) => (byPart[id] || []).forEach((m) => (m.visible = v));
    const rotM = new THREE.Matrix4();
    const euler = new THREE.Euler(0, 0, 0, "YXZ");

    const rig = {
      real: true,
      hasInside: true,
      hasOrbit,
      muscles,
      tears,
      restPupilMm: iris.restPupilMm,
      lensMaterial: lensMat,
      setPupilRadiusMm: (mm) => iris.setPupilRadiusMm(mm),
      setFocus(k) {
        lens.set(k);
        zonules?.set(k);
      },
      setGaze(yawDeg, pitchDeg) {
        euler.set((-pitchDeg * Math.PI) / 180, (yawDeg * Math.PI) / 180, 0, "YXZ");
        globeRoot.rotation.copy(euler);
        rotM.makeRotationFromEuler(euler);
        followers.forEach((f) => f.apply(rotM));
      },
      setInside(on) {
        sclera.color.setHex(on ? 0xcfeef5 : 0xf0eae2);
        sclera.opacity = on ? 0.16 : 1;
        sclera.depthWrite = !on;
        if (cornea) cornea.opacity = on ? 0.1 : 0.2;
        lensMat.color.setHex(on ? 0xd6ecff : 0x07080a);
        lensMat.opacity = on ? 0.7 : 1;
        lensMat.roughness = on ? 0.05 : 0.08;
        lensMat.depthWrite = !on;
        // The vitreous also fills the gap around the iris in the normal view,
        // as a dark interior; it only turns into translucent gel in See Inside.
        if (vitreousMat) {
          vitreousMat.color.setHex(on ? 0xbfe6ee : 0x180d0c);
          vitreousMat.opacity = on ? 0.3 : 1;
          vitreousMat.depthWrite = !on;
          vitreousMat.roughness = on ? 0.1 : 0.7;
        }
        INNER_ONLY.forEach((id) => setVisible(id, on));
        setVisible("vitreous", true);
      },
      /** Slice the eyeball in half (for the focus demo) so the lens profile is visible. */
      setCutaway(on) {
        if (viewerRenderer) viewerRenderer.localClippingEnabled = true;
        all.forEach((m) => {
          if (!GLOBE_PARTS.has(m.userData.partId)) return;
          const mat = m.material;
          if (on) {
            mat.userData.origSide = mat.userData.origSide ?? mat.side;
            mat.side = THREE.DoubleSide;
            mat.clippingPlanes = [cutPlane];
            m.userData.clipPlane = cutPlane;
          } else {
            if (mat.userData.origSide !== undefined) mat.side = mat.userData.origSide;
            mat.clippingPlanes = null;
            m.userData.clipPlane = null;
          }
          mat.needsUpdate = true;
        });
      },
      /** Hide/show everything outside the eyeball (muscles, nerve, tear apparatus). */
      setOrbitVisible(v) {
        all.forEach((m) => {
          if (GLOBE_PARTS.has(m.userData.partId)) return;
          m.visible = v;
          m.userData.hiddenByDemo = !v;
        });
        tears && (tears.points.userData.hiddenByDemo = !v);
      },
      selectableFor: (inside) => all.filter((m) => !m.userData.hiddenByDemo && (inside || !INNER_ONLY.has(m.userData.partId))),
    };
    rig.setInside(false);
    return rig;
  }

  _buildProceduralRig(model) {
    const { globe, pupil, lens, muscles } = model.userData.eyeRig;
    this._hasOrbit = true;
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    return {
      real: false,
      hasInside: false,
      hasOrbit: true,
      muscles,
      tears: null,
      restPupilMm: 1.38,
      setPupilRadiusMm: (mm) => pupil.scale.setScalar(clamp(mm / 1.38, 0.4, 1.9)),
      setFocus: (k) => lens.scale.set(1 - 0.06 * k, 1 - 0.06 * k, 0.6 * (1 + 0.18 * k)),
      setGaze(yawDeg, pitchDeg) {
        euler.set((-pitchDeg * Math.PI) / 180, (yawDeg * Math.PI) / 180, 0, "YXZ");
        globe.rotation.copy(euler);
      },
      setInside() {},
      setOrbitVisible() {},
      setCutaway() {},
      selectableFor: () => model.userData.selectableParts.slice(),
    };
  }

  // =====================================================================
  //  Per-frame animation
  // =====================================================================
  _tick(dt) {
    const rig = this._rig;
    if (!rig) return;
    const A = this._active;

    // ---- pupil / light reflex ------------------------------------------
    let pupilTarget = rig.restPupilMm;
    if (A.light) {
      this._timers.light += dt;
      const dim = Math.floor(this._timers.light / PHASE_SECONDS) % 2 === 1;
      const key = dim ? "eyeLightDim" : "eyeLightBright";
      if (this._texts.light !== key) this._setText("light", key);
      pupilTarget = dim ? 3.2 : 1.0;
    }
    this._pupilMm += (pupilTarget - this._pupilMm) * (1 - Math.exp(-dt * 3.5));
    if (this._pupilApplied === null || Math.abs(this._pupilMm - this._pupilApplied) > 0.004) {
      rig.setPupilRadiusMm(this._pupilMm);
      this._pupilApplied = this._pupilMm;
    }

    // ---- focus / accommodation -----------------------------------------
    let focusTarget = 0;
    if (A.focus) {
      this._timers.focus += dt;
      const near = Math.floor(this._timers.focus / PHASE_SECONDS) % 2 === 1;
      const key = near ? "eyeFocusNear" : "eyeFocusFar";
      if (this._texts.focus !== key) this._setText("focus", key);
      focusTarget = near ? 1 : 0;
    }
    this._focusK += (focusTarget - this._focusK) * (1 - Math.exp(-dt * 3));
    const lm = rig.lensMaterial;
    if (lm && lm !== this.viewer.selected?.material && (A.focus || lm.emissiveIntensity > 0.004)) {
      lm.emissive.setHex(0x5ab4ff);
      const glow = A.focus ? 0.22 + 0.1 * Math.sin(performance.now() * 0.004) : 0;
      lm.emissiveIntensity += (glow - lm.emissiveIntensity) * (1 - Math.exp(-dt * 6));
      if (!A.focus && lm.emissiveIntensity <= 0.004) lm.emissiveIntensity = 0;
    }
    if (this._focusApplied === null || Math.abs(this._focusK - this._focusApplied) > 0.002) {
      rig.setFocus(this._focusK);
      this._focusApplied = this._focusK;
    }

    // ---- gaze ----------------------------------------------------------
    let yawT = 0;
    let pitchT = 0;
    if (A.gaze) {
      this._timers.gaze += dt;
      const idx = Math.floor(this._timers.gaze / GAZE_STEP_SECONDS) % GAZE_STEPS.length;
      const step = GAZE_STEPS[idx];
      if (idx !== this._gazeIdx) {
        this._gazeIdx = idx;
        this._gazeMuscles = new Set(step.muscles);
        if (this._texts.gaze !== step.key) this._setText("gaze", step.key);
      }
      yawT = step.yaw;
      pitchT = step.pitch;
    } else {
      this._gazeMuscles = new Set();
    }
    const ease = 1 - Math.exp(-dt * 5);
    this._yaw += (yawT - this._yaw) * ease;
    this._pitch += (pitchT - this._pitch) * ease;
    if (Math.abs(this._yaw - this._gazeApplied.yaw) > 0.02 || Math.abs(this._pitch - this._gazeApplied.pitch) > 0.02) {
      rig.setGaze(this._yaw, this._pitch);
      this._gazeApplied = { yaw: this._yaw, pitch: this._pitch };
    }

    // Glow on the working muscles (never fight the viewer's own hover/select glow).
    const pulse = 0.55 + 0.2 * Math.sin(performance.now() * 0.008);
    Object.entries(rig.muscles).forEach(([id, mesh]) => {
      if (mesh === this.viewer.selected || mesh === this.viewer.hovered) return;
      const m = mesh.material;
      if (!m || !("emissiveIntensity" in m)) return;
      const target = this._gazeMuscles.has(id) ? pulse : 0;
      if (target === 0 && m.emissiveIntensity < 0.01) {
        if (m.emissiveIntensity !== 0) m.emissiveIntensity = 0;
        return;
      }
      m.emissive.setHex(0xff7a45);
      m.emissiveIntensity += (target - m.emissiveIntensity) * (1 - Math.exp(-dt * 8));
    });

    // ---- view: stop the auto-spin and face the demo ------------------------
    this._updateView(dt);

    // ---- ambient light cue ---------------------------------------------
    const lvlTarget = A.light ? (this._texts.light === "eyeLightDim" ? -1 : 1) : 0;
    this._lightLevel += (lvlTarget - this._lightLevel) * (1 - Math.exp(-dt * 3));
    if (this._overlay && Math.abs(this._lightLevel - this._lightLevelApplied) > 0.01) {
      this._lightLevelApplied = this._lightLevel;
      const l = this._lightLevel;
      this._overlay.style.opacity = "1";
      this._overlay.style.background =
        l >= 0
          ? `radial-gradient(circle at 46% 50%, rgba(255,247,215,${(0.34 * l).toFixed(3)}) 0%, rgba(255,247,215,0) 60%)`
          : `radial-gradient(circle at 46% 50%, rgba(0,0,0,${(0.55 * -l).toFixed(3)}) 0%, rgba(0,0,0,${(0.3 * -l).toFixed(3)}) 70%)`;
    }

    // ---- tears ---------------------------------------------------------
    const tears = rig.tears;
    if (tears) {
      tears.fader.update(dt);
      if (A.tears) tears.phase = (tears.phase + dt * 0.11) % 1;
      if (tears.points.visible) {
        const pos = tears.points.geometry.attributes.position;
        for (let i = 0; i < tears.count; i++) {
          tears.curve.getPoint((tears.phase + i / tears.count) % 1, tears.tmp);
          pos.setXYZ(i, tears.tmp.x, tears.tmp.y, tears.tmp.z);
        }
        pos.needsUpdate = true;
      }
    }
  }

  // =====================================================================
  //  Controls
  // =====================================================================
  _setText(mode, key) {
    this._texts[mode] = key;
    this._refreshExplainer();
  }

  _refreshExplainer() {
    const el = this._rail?.querySelector("#eye-explainer");
    if (!el) return;
    const modes = this._order.filter((m) => this._active[m]);
    const primary = modes[modes.length - 1];
    el.textContent = primary ? t(this._texts[primary]) : t("eyeTipInside");
  }

  /** Pick the camera preset of the most recently switched-on demo and glide to it. */
  _updateView(dt) {
    const v = this.viewer;
    const A = this._active;
    const demos = this._order.filter((m) => m !== "inside" && A[m]);
    if (!demos.length) {
      if (this._viewHeld) {
        v.autoRotate = true;
        v.setZoom?.(DEFAULT_ZOOM);
        this._viewHeld = false;
      }
      return;
    }
    v.autoRotate = false;
    this._viewHeld = true;
    if (this._viewSettle <= 0 || v._dragOrigin) return; // let the visitor drag freely
    this._viewSettle -= dt;
    const goal = VIEW_PRESETS[demos[demos.length - 1]];
    const r = v.modelRoot?.rotation;
    if (!r || !goal) return;
    v.setZoom?.(goal.zoom);
    const k = 1 - Math.exp(-dt * 4);
    r.y += wrapAngle(goal.y - r.y) * k;
    r.x += (goal.x - r.x) * k;
  }

  /** Focus alone isolates the eyeball; any demo that needs the orbit brings it back. */
  _refreshOrbit() {
    const A = this._active;
    const hide = A.focus && !A.gaze && !A.tears;
    if (hide === this._orbitHidden) return;
    this._orbitHidden = hide;
    this._rig.setOrbitVisible(!hide);
    this._rig.setCutaway(hide);
    this._applyInside(this._active.inside);
  }

  _toggle(mode, on) {
    this._active[mode] = on;
    this._order = this._order.filter((m) => m !== mode);
    if (on) {
      this._order.push(mode);
      if (mode === "light" || mode === "focus" || mode === "gaze") {
        this._timers[mode] = 0;
        if (mode === "gaze") this._gazeIdx = -1;
      }
      if (mode === "light") this._texts.light = "eyeLightBright";
      if (mode === "focus") this._texts.focus = "eyeFocusFar";
      if (mode === "gaze") this._texts.gaze = "eyeGazeCenter";
      if (mode === "tears") this._texts.tears = "eyeTearsHint";
      if (mode === "inside") this._texts.inside = "eyeInsideHint";
    }
    if (mode === "tears") this._rig.tears?.fader.setOn(on);
    if (mode === "inside") {
      this._autoInside = false; // the visitor took manual control
      this._applyInside(on);
    }
    if (on && mode !== "inside") this._viewSettle = VIEW_SETTLE_SECONDS;
    if (mode === "focus" && this._rig.hasInside) {
      // The lens only changes shape in profile: open the eye up while it runs.
      if (on && !this._active.inside) {
        this._autoInside = true;
        this._active.inside = true;
        this._applyInside(true);
        this._syncButton("inside", true);
      } else if (!on && this._autoInside) {
        this._autoInside = false;
        this._active.inside = false;
        this._applyInside(false);
        this._syncButton("inside", false);
      }
    }
    this._refreshOrbit();
    this._refreshExplainer();
  }

  _syncButton(mode, on) {
    this._rail?.querySelector(`#eye-${mode}`)?.classList.toggle("mode-toggle--active", on);
  }

  _applyInside(on) {
    this._rig.setInside(on);
    this._selectable.length = 0;
    this._selectable.push(...this._rig.selectableFor(on));
    // If the selected part just became unselectable, clear the selection.
    const sel = this.viewer.selected;
    if (sel && !this._selectable.includes(sel)) {
      this.viewer._setEmissive?.(sel, 0);
      sel.scale.setScalar(1);
      this.viewer.selected = null;
      this.infoPanel.showSystem(this.system);
    }
  }

  _renderControls() {
    const rig = this._rig;
    const statusText = !this._usedRealModel
      ? t("modelPlaceholder")
      : this._hasOrbit
      ? t("statusEye")
      : t("statusEyeNoOrbit");
    const buttons = [
      ["light", "\u2600\uFE0F", "toggleEyeLight", true],
      ["focus", "\u{1F50D}", "toggleEyeFocus", true],
      ["gaze", "\u{1F440}", "toggleEyeGaze", true],
      ["tears", "\u{1F4A7}", "toggleEyeTears", !!rig?.tears],
      ["inside", "\u{1F52C}", "toggleEyeInside", !!rig?.hasInside],
    ].filter((b) => b[3]);
    // Everything lives in a rail on the (empty) left of the screen -- demo
    // buttons, the live explanation and the model-source status -- so nothing
    // collides with the info panel or the bottom-right gesture hint box.
    this.controlsRoot.innerHTML = "";
    this._rail?.remove();
    this._rail = document.createElement("div");
    this._rail.className = "eye-toggles eye-rail";
    this._rail.innerHTML = buttons
      .map(
        ([mode, icon, key]) => `
        <button class="mode-toggle" data-selectable id="eye-${mode}">
          <span class="mode-toggle__icon">${icon}</span> ${t(key)}
        </button>`
      )
      .join("");
    this._rail.insertAdjacentHTML(
      "beforeend",
      `<p class="eye-explainer" id="eye-explainer"></p>
       <p class="model-status eye-status${this._usedRealModel ? "" : " model-status--fallback"}">${statusText}</p>`
    );
    document.body.appendChild(this._rail);
    buttons.forEach(([mode]) => {
      const btn = this._rail.querySelector(`#eye-${mode}`);
      btn.addEventListener("click", () => {
        const on = !this._active[mode];
        btn.classList.toggle("mode-toggle--active", on);
        this._toggle(mode, on);
      });
      // A language switch rebuilds the rail: restore the visitor's state.
      btn.classList.toggle("mode-toggle--active", this._active[mode]);
    });
    this._refreshExplainer();
  }

  unmount() {
    if (this._langUnsub) {
      this._langUnsub();
      this._langUnsub = null;
    }
    this._rig?.tears?.fader && this._rig.tears.fader.setOn(false);
    this._overlay?.remove();
    this._overlay = null;
    this._rail?.remove();
    this._rail = null;
    this._envTex?.dispose();
    this._envTex = null;
    this.viewer.autoRotate = true;
    this.controlsRoot.innerHTML = "";
    this.viewer.onSelect = null;
    this.viewer.clearModel();
  }
}

/** Raw-name classifier used only to tell the three tear-drainage meshes apart. */
function classifyEyePartRaw(rawName) {
  return (rawName || "").toLowerCase().replace(/[_.]+/g, " ").replace(/\s+/g, " ").trim();
}
