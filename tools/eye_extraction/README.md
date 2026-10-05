# Eye extraction (provenance)

Reproduces `assets/models/eye_globe.glb` / `eye_orbit.glb` from the Z-Anatomy
Blender template (CC BY-SA 4.0, https://github.com/Z-Anatomy/Models-of-human-anatomy,
`Z-Anatomy.zip` -> `Z-Anatomy/Startup.blend`, Blender 3.5 format).

1. `export_eye.py` (needs the `bpy` pip module, Python 3.11): loads only the
   eye objects with `bpy.data.libraries.load`, links them into the scene so
   modifiers evaluate, recentres on the Sclera's origin and converts Z-up ->
   Y-up. Writes `eye_raw.npz`.
2. `build_eye_assets.py` (numpy + trimesh): writes the two GLBs.
3. `probe3.py` is the inspection script used to find objects/modifiers.
4. `test_eye.mjs`, `test_noorbit.mjs`, `test_data.mjs`: headless Node tests
   (need `jsdom`; paths are hard-coded -- edit before running).
Paths are hard-coded to the original working directories.

## Real-browser harness (`browser_harness/`)
`shot.js` is an Electron main script (software WebGL via SwiftShader under
Xvfb); `run_scn.sh <scenario.js>` serves the project with `python -m http.server`
and runs a scenario (`sc_*.js`) that drives `window.__anatomyApp`, steps
`EyeExplorer._tick()` deterministically and saves screenshots. Needs
`npm i electron jsdom`, `xvfb`, and hard-coded paths edited. Note: software
rendering runs at ~3-10 fps and the viewer clamps dt to 0.1 s, so wall-clock
animation timing is slower than on a GPU.
