# Attribution

This project includes real anatomical 3D model data for **all eight**
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
- **Not included in this dataset:** a stomach, a diaphragm, an esophagus,
  and peripheral nerves. The stomach and diaphragm are supplied from
  BodyParts3D (next section). There is still no esophagus, and peripheral
  nerves are not modeled for the Nervous System.

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

## Stomach, Diaphragm and full-body silhouette (BodyParts3D)

- **Source data:** BodyParts3D, © The Database Center for Life Science
  (DBCLS), release 3.0, via the STL mirror
  https://github.com/Kevin-Mattheus-Moerman/BodyParts3D (commit
  `f0eeb6e`).
- **License:** Creative Commons Attribution-ShareAlike 2.1 Japan
  (https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en)
- **Files and FMA ids:**
  - `assets/models/stomach.glb` = FMA7148 (stomach)
  - `assets/models/diaphragm.glb` = FMA13295 (diaphragm)
  - `assets/models/skin.glb` = FMA7163 (skin)
- **Changes made (required notice under CC BY-SA):** converted STL → GLB;
  decimated (skin to 70k faces, diaphragm to 26k, then the crural tail
  below y = 0.318 m trimmed to 23k); skin's small disconnected components
  discarded; smooth vertex normals recomputed. The stomach and diaphragm
  were additionally **transformed (rotation, scale, translation)** into
  the HuBMAP "united body" coordinate frame by landmark/contact fitting
  against the HuBMAP liver, duodenum, pancreas and lungs, so they sit
  beside those organs. The skin stays in its original BodyParts3D space.
  Placement is approximate: the two datasets come from different bodies.
- **Share-alike:** these three `.glb` files are adaptations of CC BY-SA
  data and must stay under CC BY-SA 2.1 Japan (or a compatible license)
  if redistributed. This does not extend to the application code, and
  does not change the CC BY 4.0 terms on the HuBMAP files.
- **Where credited in the app:** the info panel prints the BodyParts3D
  line for the Digestive and Lungs systems (`supplementary` in
  `modelManifest.js`).

---

## Eye (`assets/models/eye_globe.glb`, `assets/models/eye_orbit.glb`)

- **Source data:** Z-Anatomy, "The libre 3D atlas of anatomy" by Gauthier
  Kervyn (design, 3D, anatomy) and Marcin Zielinski (Python), Blender
  template, https://github.com/Z-Anatomy/Models-of-human-anatomy. Z-Anatomy
  includes models derived from BodyParts3D, © The Database Center for Life
  Science, CC BY-SA 2.1 Japan, and asks for both to be credited:
  *"BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan"*
  and *"Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0"*.
- **License:** Creative Commons Attribution-ShareAlike 4.0 International
  (https://creativecommons.org/licenses/by-sa/4.0/)
- **Objects used (the `.r` / patient's-right set):** Sclera, Cornea, Iris,
  Lens, Retina, Vitreous body, Anterior chamber of eyeball, Zonular fibres;
  Superior/Inferior/Medial/Lateral rectus muscle, Superior/Inferior oblique
  muscle, Levator palpebrae superioris, Common tendinous ring, Optic nerve
  (II), Lacrimal gland, Lacrimal canaliculus, Lacrimal sac, Nasolacrimal
  duct.
- **Changes made (required notice under CC BY-SA):** objects extracted from
  the Blender template; subdivision, array and curve modifiers applied
  (e.g. the zonular fibres and optic nerve are modifier/curve-driven);
  recentred on the globe's rotation centre; converted from Blender Z-up to
  glTF Y-up (cornea facing +Z); triangulated and exported as GLB with
  recomputed smooth normals. At run time the iris, lens, zonules, muscles
  and optic nerve are additionally deformed for the animations, and the iris
  is given a procedural vertex-colour pattern. No other Z-Anatomy content is
  used.
- **Third-party content inside Z-Anatomy:** Z-Anatomy's own attribution file
  states that its template also adapts "Brainder" / "White matter"
  (University of Washington), "Cranial Nerves and Foramina" (University of
  Dundee, CC BY 4.0), "Anatomy of the Inner Ear" (University of Dundee, CC
  BY-NC-SA 4.0) and "Kidney" (Lissie Cowley, CC BY-NC 4.0). **None of the
  non-commercial inner-ear or kidney models, nor any brain model, is used
  here.** The optic nerve is a curve object parented under Z-Anatomy's
  "Cranial nerves" group; we could not independently verify whether it was
  derived from the Dundee CC BY 4.0 cranial-nerve model, so that source is
  credited here as a precaution (CC BY 4.0 is compatible with this
  attribution).
- **Share-alike:** the two eye `.glb` files are adaptations of CC BY-SA data
  and must stay under CC BY-SA 4.0 if redistributed. This does not extend to
  the application code.
- **Not modeled:** ciliary body (only a path curve exists in the source),
  choroid, eyelids, trochlea. The iris colour is procedural, not scanned.
- **Where credited in the app:** the info panel prints the Z-Anatomy credit
  while the Eye system is open (`showAttribution` in `modelManifest.js`).

---

## What CC BY 4.0 and CC BY-SA require in practice

- **CC BY 4.0** (Heart/Lungs/Brain/Nervous/Digestive data): attribution
  only — credit the source, link the license, note if changes were
  made. No obligation to share your own code under the same license.
- **CC BY-SA** (Skeleton/Muscles data, the BodyParts3D stomach,
  diaphragm and skin, and the Z-Anatomy eye): attribution **and** share-alike —
  if you redistribute modified versions of the *mesh data itself*, those
  modifications should also be shared under CC BY-SA. This does **not**
  extend to your own original application code.
- The in-app info panel shows a small attribution line whenever a
  system using real data is open, satisfying attribution in the running
  application itself, not just in this file.

## Everything else in this project

A procedural stand-in for the eye (`buildEyeModel()` in
`src/anatomy/eyeModel.js`) is used only if `eye_globe.glb` fails to load.
Procedural stand-ins for the stomach (`buildProceduralStomach()` in
`DigestiveExplorer.js`), the diaphragm (`buildProceduralDiaphragm()` in
`LungExplorer.js`) and the body silhouette (`buildBodyModel()` in
`bodyModel.js`) still exist, but are used **only** if the corresponding
BodyParts3D GLB above is missing or fails to load. They contain no
third-party data and are not real anatomical scans; the UI then shows the
non-real status text.
