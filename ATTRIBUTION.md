# Attribution

This project includes real anatomical 3D model data for **all seven**
body systems in the exhibit. This file documents exactly where that
data comes from and what license terms apply. If you redistribute this
application, this attribution must travel with it.

---

## Skeleton (`assets/models/skeleton.glb`) and Muscles (`assets/models/muscles.glb`)

- **Source data:** BodyParts3D, © The Database Center for Life Science (DBCLS)
- **License:** Creative Commons Attribution-ShareAlike 2.1 Japan
  (https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en)
- **Muscles additionally include:** Z-Anatomy by Gauthier Kervyn and
  contributors (https://www.z-anatomy.com), CC BY-SA 4.0
- **Mesh counts:** 202 bones, 467 muscles/tendons
- **Repackaged for real-time use by:** the open-source project
  **BodyExplorer** by Johan Bellander
  (https://github.com/JohanBellander/BodyExplorer), used here under the
  same CC BY-SA terms as the underlying data. BodyExplorer's own source
  code is MIT-licensed; only the mesh **data** carries the CC BY-SA
  obligation. `src/anatomy/muscleClassifier.js` adapts (with attribution,
  per its MIT license) keyword-classification logic from BodyExplorer's
  `src/muscleData.js`.

## Heart, Lungs, Brain, Nervous System, and Digestive System

- **Source:** HuBMAP (Human BioMolecular Atlas Program) Consortium,
  **Human Reference Atlas 3D Reference Object Library**
  (https://github.com/hubmapconsortium/ccf-3d-reference-object-library)
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
  (https://creativecommons.org/licenses/by/4.0/)
- **Underlying data:** derived from the Visible Human Project (U.S.
  National Library of Medicine) and mapped/validated by the HuBMAP
  Consortium (an NIH-funded research program) in collaboration with
  organ experts. The brain model specifically is the **Allen Human
  Reference Atlas** brain, mapped in collaboration with the Allen
  Institute for Brain Science, from a real donated human brain.
- **Files used in this build** (all from the "VH_Male" v1.2 dataset
  unless noted):
  - `heart.glb` = `VH_M_Heart.glb` (14 meshes: chambers, septum,
    papillary muscles, valves)
  - `heart_vessels.glb` = `VH_M_Blood_Vasculature_Heart.glb` (coronary
    arteries, aorta, pulmonary vessels, vena cava — neck/arm vessels
    cropped out for framing, see `modelManifest.js`)
  - `lungs.glb` = `VH_M_Lung.glb` (87 meshes: lobes, bronchopulmonary
    segments, full bronchial tree down to tertiary bronchi, trachea,
    laryngeal cartilage)
  - `brain.glb` = `Allen_M_Brain.glb` (286 individually-named
    neuroanatomical structures)
  - `spinal_cord.glb` = `VH_M_Spinal_Cord.glb` (30 real segments, all
    31 vertebral levels)
  - `liver.glb`, `pancreas.glb`, `gallbladder.glb`,
    `small_intestine.glb` = `VH_M_Liver/Pancreas/Gallbladder/Small_Intestine.glb`
  - `large_intestine.glb` = `SBU_M_Intestine_Large.glb` (Stony Brook
    University contribution to the same CC BY 4.0 library)
  - `biliary_tree.glb` = `VH_M_Biliary_Tree.glb`
- **Classification code:** `src/anatomy/heartClassifier.js`,
  `lungClassifier.js`, `brainClassifier.js`, `spinalCordClassifier.js`,
  and `digestiveClassifier.js` are original code written for this
  project, matching real mesh/node names from the files above to this
  exhibit's public-facing categories.
- **Not included in this dataset** (see README §8 for how to add them):
  a stomach and esophagus model. A small, clearly-non-real procedural
  stomach is added in `DigestiveExplorer.js` alongside the six real
  organs so visitors still see a complete digestive tract; peripheral
  nerves are similarly not modeled for the Nervous System.

### A note on how these files were combined

Several explorers (Heart, Digestive System, Nervous System) load
**multiple** GLB files together into one scene. This works cleanly
because all of these HuBMAP files are extracted from the same "united
body" reference model and share one coordinate space — loading them
together without individually re-centering each file preserves their
real relative anatomical positions (the heart sits correctly between the
lungs, the trachea connects into the bronchi, the brain sits right on
top of the spinal cord) with no manual alignment needed. See
`ModelLoader.loadCombinedAnatomyModel()` for the implementation.

---

## What CC BY 4.0 and CC BY-SA require in practice

- **CC BY 4.0** (Heart/Lungs/Brain/Nervous/Digestive data): attribution
  only — credit the source, link the license, note if changes were
  made. No obligation to share your own code under the same license.
- **CC BY-SA** (Skeleton/Muscles data): attribution **and** share-alike —
  if you redistribute modified versions of the *mesh data itself*, those
  modifications should also be shared under CC BY-SA. This does **not**
  extend to your own original application code.
- The in-app info panel shows a small attribution line whenever a
  system using real data is open, satisfying attribution in the running
  application itself, not just in this file.

## Everything else in this project

A handful of small supplementary elements remain procedurally generated
because they aren't part of the source datasets above: the stomach
(Digestive System), the diaphragm (Lungs), and the full-body silhouette
shown on the Welcome/Menu/Idle screens (`src/anatomy/bodyModel.js`). None
of these require attribution since they contain no third-party data, but
they are also not real anatomical scans and should not be presented to
visitors as such — see the in-code comments marking each one clearly.
