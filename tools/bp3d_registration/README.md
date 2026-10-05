# BodyParts3D -> HuBMAP registration (provenance)

Scripts that produced `assets/models/stomach.glb`, `diaphragm.glb`, `skin.glb`
(see ATTRIBUTION.md). Not needed at runtime.

Pipeline: `fit_stomach.py` / `fit_diaph.py` fit a rotation + scale +
translation of the BodyParts3D STL (FMA7148 / FMA13295) into the HuBMAP
frame, using landmark/neighbour-distance and contact terms against the
HuBMAP liver (`gastric_impression_of_liver`, `diaphragmatic_surface`),
duodenum, pancreas, colon and lungs; `build_assets.py` decimates, applies the
transform and writes the GLBs. `test_models.mjs` is the headless Node check of
loader / classifier / fallback behaviour.

Needs: Python (numpy, scipy, trimesh, fast-simplification), the BodyParts3D STL
mirror (Kevin-Mattheus-Moerman/BodyParts3D @ f0eeb6e) checked out at
/tmp/bp, and the repo's HuBMAP GLBs. Paths are hard-coded to the original
working directories -- edit before re-running.
