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
 * Optional per-source flag (glb-combined): `optional: true` means the
 * file is a supplementary part; if it is missing or fails to load it is
 * skipped and the explorer substitutes a small procedural stand-in, so a
 * broken/missing asset never takes the whole system down.
 *
 * `supplementary` lists extra real parts from a DIFFERENT dataset than the
 * entry's main `source` (e.g. a BodyParts3D stomach beside HuBMAP organs);
 * the information panel prints their attribution too.
 *
 * The "body" entry is not a selectable system: it is the full-body skin
 * shown on the Welcome / Menu / Idle screens (src/anatomy/bodyModel.js).
 *
 * All real assets in this build come from the HuBMAP Human Reference
 * Atlas 3D Reference Object Library (CC BY 4.0) or BodyParts3D /
 * Z-Anatomy (CC BY-SA) -- see ATTRIBUTION.md for full citations.
 * No procedural pieces are shown when every GLB loads; procedural
 * stand-ins exist only as a fallback.
 * -----------------------------------------------------------------------
 */

export const MODEL_MANIFEST = {
  body: {
    type: "glb",
    path: "assets/models/skin.glb",
    orient: "bp3d",
    targetSize: 3.4,
    meshCount: 1,
    source: "BodyParts3D (skin, FMA7163; decimated to 70k faces)",
    license: "CC BY-SA 2.1 Japan",
    attribution: "BodyParts3D, © The Database Center for Life Science",
    attributionUrl: "https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en",
    notes: "Full-body silhouette for Welcome/Menu/Idle. Falls back to the procedural PLACEHOLDER_BODY_MODEL if the GLB fails to load.",
  },
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
    type: "glb-combined",
    sources: [
      { path: "assets/models/lungs.glb", tag: "lungs" },
      // Real diaphragm (BodyParts3D FMA13295), pre-registered into the
      // HuBMAP lungs' coordinate frame. Optional: procedural fallback.
      { path: "assets/models/diaphragm.glb", tag: "diaphragm", optional: true },
    ],
    // Scale/center from the lungs only, so adding the diaphragm doesn't
    // change the framing of the lungs.
    scaleReferenceTag: "lungs",
    orient: "none",
    meshCount: 88,
    source: "HuBMAP Human Reference Atlas (Visible Human Male)",
    license: "CC BY 4.0",
    attribution: "HuBMAP Consortium, Human Reference Atlas 3D Reference Object Library",
    attributionUrl: "https://creativecommons.org/licenses/by/4.0/",
    supplementary: [
      {
        part: "diaphragm",
        source: "BodyParts3D (FMA13295), decimated and registered to the HuBMAP lungs",
        license: "CC BY-SA 2.1 Japan",
        attribution: "Diaphragm: BodyParts3D, © The Database Center for Life Science",
        attributionUrl: "https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en",
      },
    ],
    notes: "Diaphragm is real (BodyParts3D), placed by landmark/contact registration against the HuBMAP lungs and liver -- approximate, since the two datasets come from different bodies. Procedural disc used only if diaphragm.glb is missing.",
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
  eye: {
    type: "glb-combined",
    sources: [
      { path: "assets/models/eye_globe.glb", tag: "globe" },
      // Muscles, optic nerve and tear apparatus. Optional: without it the
      // eyeball still works (gaze/light/focus), just without muscles.
      { path: "assets/models/eye_orbit.glb", tag: "orbit", optional: true },
    ],
    // Scale and centre on the eyeball so it rotates about its own centre.
    scaleReferenceTag: "globe",
    orient: "none",
    targetSize: 1.4,
    meshCount: 21,
    showAttribution: true,
    source: "Z-Anatomy (eye structures; derived from BodyParts3D)",
    license: "CC BY-SA 4.0",
    attribution: "Z-Anatomy, the libre 3D atlas of anatomy (G. Kervyn et al.), derived from BodyParts3D",
    attributionUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    notes: "Real-scale eye from Z-Anatomy: sclera, cornea, iris, lens, retina, vitreous, anterior chamber, zonular fibres, six eye muscles, levator, optic nerve and tear apparatus. Ciliary body/choroid/eyelids are not modeled. Falls back to a procedural placeholder eye if eye_globe.glb fails to load.",
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
      // Real stomach (BodyParts3D FMA7148), pre-registered into the
      // HuBMAP frame (touches the liver's gastric impression, abuts the
      // duodenum, clear of the pancreas). Optional: procedural fallback.
      { path: "assets/models/stomach.glb", tag: "stomach", optional: true },
    ],
    orient: "none",
    meshCount: 76,
    source: "HuBMAP Human Reference Atlas (Visible Human Male) + Stony Brook University",
    license: "CC BY 4.0",
    attribution: "HuBMAP Consortium, Human Reference Atlas 3D Reference Object Library",
    attributionUrl: "https://creativecommons.org/licenses/by/4.0/",
    supplementary: [
      {
        part: "stomach",
        source: "BodyParts3D (FMA7148), registered to the HuBMAP organs",
        license: "CC BY-SA 2.1 Japan",
        attribution: "Stomach: BodyParts3D, © The Database Center for Life Science",
        attributionUrl: "https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en",
      },
    ],
    notes: "Stomach is real (BodyParts3D), placed by landmark/contact registration against the HuBMAP liver, duodenum and pancreas -- approximate, since the datasets come from different bodies. No esophagus. Procedural stomach used only if stomach.glb is missing.",
  },
};

export function getModelInfo(systemId) {
  return MODEL_MANIFEST[systemId] || null;
}
