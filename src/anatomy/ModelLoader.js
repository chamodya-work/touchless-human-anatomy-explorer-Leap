/**
 * ModelLoader.js
 * -----------------------------------------------------------------------
 * Thin, shared wrapper around three.js GLTFLoader for every real
 * anatomical asset in MODEL_MANIFEST. Responsibilities:
 *
 *   - Load a GLB once and cache the parsed result (exhibition PCs may
 *     re-enter the same explorer many times in a day; we don't want to
 *     re-parse a 24MB file every time).
 *   - Apply the BodyParts3D -> three.js coordinate convention (see
 *     ORIENT_BP3D below) and a consistent scale/centering so every real
 *     model drops into AnatomyViewer's default camera framing exactly
 *     like the procedural placeholders did.
 *   - Fail LOUDLY to the console (never silently) if a GLB is missing or
 *     corrupt, so a broken asset is never mistaken for "it's working."
 *     Callers (the explorers) decide whether to fall back to a
 *     procedural placeholder.
 *   - Dispose geometries/materials/textures correctly when a model is
 *     no longer needed, so repeated exhibition use doesn't leak memory.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { GLTFLoader } from "../../lib/three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const cache = new Map(); // path -> Promise<GLTF>

/**
 * BodyParts3D source convention: X=left-right, Y=front-back, Z=bottom-top
 * (millimetres). A -90° rotation about X converts this directly to
 * three.js's Y-up convention: (x, y, z) -> (x, z, -y). If you bring in a
 * GLB from a different source/pipeline that's already Y-up, set
 * `orient: "none"` in the call to loadAnatomyModel() below.
 */
export const ORIENT_BP3D = "bp3d";

async function loadRawGLTF(path) {
  if (!cache.has(path)) {
    cache.set(
      path,
      new Promise((resolve, reject) => {
        loader.load(
          path,
          (gltf) => resolve(gltf),
          undefined,
          (err) => reject(err)
        );
      })
    );
  }
  return cache.get(path);
}

/**
 * Loads a GLB and returns a ready-to-use, centered, normalized THREE.Group.
 * Each call returns a FRESH clone of the cached scene (so multiple
 * explorers / repeated visits never share transform state or get
 * corrupted by one explorer's disposal).
 *
 * @param {string} path - e.g. "assets/models/skeleton.glb"
 * @param {object} opts
 * @param {string} [opts.orient] - ORIENT_BP3D (default) or "none"
 * @param {number} [opts.targetSize] - tallest-dimension target in scene units (default 2.6)
 * @returns {Promise<THREE.Group>}
 */
export async function loadAnatomyModel(path, opts = {}) {
  const { orient = ORIENT_BP3D, targetSize = 2.6 } = opts;
  const gltf = await loadRawGLTF(path);
  const root = gltf.scene.clone(true);

  if (orient === ORIENT_BP3D) {
    root.rotation.x = -Math.PI / 2;
  }

  // Normalize scale so every model — real or procedural — fills the
  // same default camera framing in AnatomyViewer.
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDim;
  root.scale.setScalar(scale);

  root.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  box2.getCenter(center);
  root.position.sub(center);

  return root;
}

/**
 * Loads MULTIPLE GLBs that share a common source coordinate space (e.g.
 * organs extracted from the same "united body" reference model) and
 * combines them into one group WITHOUT individually recentering each
 * one first -- preserving their real relative anatomical positions
 * (e.g. the heart sitting correctly between the lungs, trachea
 * connecting into the bronchi). Only the combined group is scaled and
 * centered as a whole at the end.
 *
 * @param {Array<{path: string, tag?: string, exclude?: (name:string)=>boolean}>} sources
 *   `exclude`, if given, is tested against each mesh's lowercased name;
 *   matching meshes are removed BEFORE the combined bounding box/scale
 *   is computed -- use this to drop parts of a source file that would
 *   otherwise blow out the framing (e.g. neck/arm vessels included in a
 *   heart-vessels file when all you want is "the heart's own vessels").
 * @param {object} opts - same as loadAnatomyModel, plus:
 * @param {string} [opts.scaleReferenceTag] - if given, the scale/center
 *   is computed from ONLY the source whose `tag` matches this, instead
 *   of the combined bounding box of everything. Use this when a
 *   secondary source (e.g. connecting vessels) reaches much further
 *   than the primary organ and would otherwise force the camera to
 *   zoom out so far the primary organ looks tiny.
 * @returns {Promise<THREE.Group>} group whose children are one sub-group
 *   per source file, each tagged with userData.sourceTag if provided
 */
export async function loadCombinedAnatomyModel(sources, opts = {}) {
  const { orient = ORIENT_BP3D, targetSize = 2.6, scaleReferenceTag = null } = opts;

  const parts = await Promise.all(
    sources.map(async ({ path, tag, exclude }) => {
      const gltf = await loadRawGLTF(path);
      const root = gltf.scene.clone(true);
      root.userData.sourceTag = tag || null;

      if (exclude) {
        const toRemove = [];
        root.traverse((obj) => {
          if (obj.isMesh && exclude(obj.name.toLowerCase())) toRemove.push(obj);
        });
        toRemove.forEach((obj) => obj.parent?.remove(obj));
      }

      return root;
    })
  );

  const combined = new THREE.Group();
  parts.forEach((p) => combined.add(p));

  if (orient === ORIENT_BP3D) {
    combined.rotation.x = -Math.PI / 2;
  }

  // Decide which sub-tree's bounding box drives the scale/center: either
  // everything (default) or just the designated "reference" part.
  const referencePart = scaleReferenceTag
    ? parts.find((p) => p.userData.sourceTag === scaleReferenceTag)
    : null;
  const measureTarget = referencePart || combined;

  combined.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(measureTarget);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDim;
  combined.scale.setScalar(scale);

  combined.updateMatrixWorld(true);
  const box2 = new THREE.Box3().setFromObject(measureTarget);
  const center = new THREE.Vector3();
  box2.getCenter(center);
  combined.position.sub(center);

  return combined;
}

/** Recursively disposes geometries/materials/textures under a root object. */
export function disposeModel(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        Object.values(m).forEach((v) => {
          if (v && v.isTexture) v.dispose();
        });
        m.dispose();
      });
    }
  });
}

/** Clears the raw-GLTF cache — mainly useful for debug/dev tooling. */
export function clearModelCache() {
  cache.clear();
}
