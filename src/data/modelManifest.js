/**
 * modelManifest.js
 * -----------------------------------------------------------------------
 * Single source of truth for where each system's 3D model comes from.
 * This is the file to edit when you add or replace a GLB/GLTF asset --
 * nothing else in the app needs to change.
 *
 * type: "glb"          -> a single real anatomical asset (GLTFLoader)
 * type: "glb-combined" -> multiple real GLB files loaded together into
 *                         one scene (ModelLoader.loadCombinedAnatomyModel)
 * type: "procedural"   -> built from primitives in src/anatomy/*Model.js
 *                         (clearly labeled PLACEHOLDER_..._MODEL in code)
 *
 * All real assets in this build come from the HuBMAP Human Reference
 * Atlas 3D Reference Object Library (CC BY 4.0) or BodyParts3D /
 * Z-Anatomy (CC BY-SA) -- see ATTRIBUTION.md for full citations.
 * -----------------------------------------------------------------------
 */

export const MODEL_MANIFEST = {
  skeleton: {
    type: "glb",
    path: "assets/models/skeleton.glb",
    orient: "bp3d",
    meshCount: 202,
    source: "BodyParts3D",
    license: "CC BY-SA 2.1 Japan",
    attribution: "BodyParts3D, © The Database Center for Life Science",
    attributionUrl: "https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en",
  },
  muscles: {
    type: "glb",
    path: "assets/models/muscles.glb",
    orient: "bp3d",
    meshCount: 467,
    source: "BodyParts3D + Z-Anatomy",
    license: "CC BY-SA 2.1 Japan / CC BY-SA 4.0",
    attribution: "BodyParts3D, © The Database Center for Life Science; Z-Anatomy by Gauthier Kervyn",
    attributionUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  heart: {
    type: "glb-combined",
    sources: [
      { path: "assets/models/heart.glb", tag: "heart" },
      {
        path: "assets/models/heart_vessels.glb",
        tag: "vessels",
        // Exclude vessels that extend far beyond the heart itself (to
        // the neck/arms) -- anatomically real, but they blow out the
        // camera framing for what's meant to be a heart-focused view.
        excludeNamePattern: "carotid|subclavian|brachiocephalic",
      },
    ],
    orient: "none",
    meshCount: 64,
    source: "HuBMAP Human Reference Atlas (Visible Human Male)",
    license: "CC BY 4.0",
    attribution: "HuBMAP Consortium, Human Reference Atlas 3D Reference Object Library",
    attributionUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  lungs: {
    type: "glb",
    path: "assets/models/lungs.glb",
    orient: "none",
    meshCount: 87,
    source: "HuBMAP Human Reference Atlas (Visible Human Male)",
    license: "CC BY 4.0",
    attribution: "HuBMAP Consortium, Human Reference Atlas 3D Reference Object Library",
    attributionUrl: "https://creativecommons.org/licenses/by/4.0/",
    notes: "Diaphragm is a small procedural addition -- not part of this dataset.",
  },
  brain: {
    type: "glb",
    path: "assets/models/brain.glb",
    orient: "none",
    meshCount: 286,
    source: "Allen Human Reference Atlas (HuBMAP), mapped with the Allen Institute for Brain Science",
    license: "CC BY 4.0",
    attribution: "HuBMAP Consortium / Allen Institute for Brain Science, Human Reference Atlas 3D Reference Object Library",
    attributionUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
  nervous: {
    type: "glb-combined",
    sources: [
      { path: "assets/models/brain.glb", tag: "brain" },
      { path: "assets/models/spinal_cord.glb", tag: "spinalCord" },
    ],
    orient: "none",
    meshCount: 316,
    source: "HuBMAP Human Reference Atlas (Visible Human Male + Allen brain)",
    license: "CC BY 4.0",
    attribution: "HuBMAP Consortium, Human Reference Atlas 3D Reference Object Library",
    attributionUrl: "https://creativecommons.org/licenses/by/4.0/",
    notes: "Peripheral nerves are not part of this dataset.",
  },
  digestive: {
    type: "glb-combined",
    sources: [
      { path: "assets/models/liver.glb", tag: "liver" },
      { path: "assets/models/pancreas.glb", tag: "pancreas" },
      { path: "assets/models/gallbladder.glb", tag: "gallbladder" },
      { path: "assets/models/small_intestine.glb", tag: "smallIntestine" },
      { path: "assets/models/large_intestine.glb", tag: "largeIntestine" },
      { path: "assets/models/biliary_tree.glb", tag: "biliaryTree" },
    ],
    orient: "none",
    meshCount: 75,
    source: "HuBMAP Human Reference Atlas (Visible Human Male) + Stony Brook University",
    license: "CC BY 4.0",
    attribution: "HuBMAP Consortium, Human Reference Atlas 3D Reference Object Library",
    attributionUrl: "https://creativecommons.org/licenses/by/4.0/",
    notes: "Stomach is a small procedural addition -- this dataset doesn't include a stomach or esophagus model.",
  },
};

export function getModelInfo(systemId) {
  return MODEL_MANIFEST[systemId] || null;
}
