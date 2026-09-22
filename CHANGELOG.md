# Changelog — Exhibition Quality Upgrade Pass

## Bilingual pass (English / සිංහල) — step 1: language switcher + main page

Visitors can now choose the exhibit's language on the main page, and the
whole interface follows that choice.

- **New `src/data/i18n.js`** — single source of language state:
  `getLang()`, `setLang()`, `onLanguageChange()` and `t(key)`. The choice is
  kept in `localStorage` (`anatomyExplorer.language`), so the kiosk reopens
  in the last language used; on a first visit it falls back to the browser /
  OS locale, then English.
- **New `src/data/uiStrings.js`** — all interface chrome (menus, panel
  headings, HUD text, toggles, model-status lines) in both languages. A key
  missing from a translation falls back to English rather than rendering an
  empty label.
- **New `src/data/anatomyData.si.js`** — the Sinhala anatomical content as a
  separate overlay keyed by the same system + part ids. `anatomyData.js`
  keeps English as the source language; `getSystem(id, lang)` merges the two,
  so the stable `id` values the classifiers depend on never change with the
  language (verified: 7 systems, 69 parts, identical ids and ordering).
- **New `src/components/LanguageSwitcher.js`** — the 🌐 English / සිංහල
  buttons, shown on both main pages (Welcome screen and Main menu). They
  carry `[data-selectable]`, so they work by point + pinch like every other
  control.
- Components now re-render themselves on `onLanguageChange()`:
  `MainMenu` (labels + summaries), `WelcomeScreen`, `InformationPanel`
  (including a part already on screen, and the disclaimer), `GestureIndicator`
  (hints + tracking status), `IdleMode`, and the title bar / Back button /
  pause toast / tracking banner in `main.js`.
- The 7 explorers resolve their content with `getSystem(id, getLang())` and
  localize their control strips (Blood Flow, Breathing Mode, Brain Activity,
  model-status lines). Toggle state is preserved across a language switch.
- Sinhala fonts (`Iskoola Pota`, `Nirmala UI`, `Noto Sans Sinhala`) appended
  to the font stacks so the script renders correctly on Windows, macOS and
  Linux; `lang-switcher` styles added to `styles.css`.

Verified: syntax-checked all 46 modules, asserted EN/SI structural parity and
that no user-facing string is left untranslated, and drove the real modules in
a headless browser (menu → explorer panel → part selection, switching back and
forth) with zero runtime errors.

## Layout and gesture-HUD fixes (bilingual pass, step 1 follow-up)

Two problems reported after the first bilingual build:

- **On laptop-sized screens the language row landed on top of the exhibit
  title, and the Welcome screen could be clipped.** Measured at 1366x768
  before the fix: the switcher occupied y=1..105, straight over the fixed
  title bar (y=28) and the tracking banner (y=90..141) — and the Sinhala
  Welcome screen ran off **both** the top (inner top = -103) and the bottom
  of the screen, because the Sinhala gesture labels wrapped to two lines and
  made the legend twice as tall as the English one. Fixed in `styles.css`
  and `LanguageSwitcher.js`:
  - the picker is now a single ~41px row (label + both buttons) instead of a
    stacked block, and the "you can change this at any time" line (and its
    `languageNote` string) is gone;
  - `.main-menu` / `.welcome-screen` reserve room for the title bar *and* the
    tracking banner, and centre their content with auto margins on the
    first/last child instead of `justify-content: center` — a centred flex
    child that outgrows a scroll container has its top half clipped and
    unreachable, which is exactly what pushed the language row over the
    title;
  - the gesture legend is a fixed 5-column grid, so English and Sinhala get
    identical column widths and the row can no longer reflow into a
    different shape per language;
  - added `max-height: 820px`, `max-height: 640px` and `max-width: 820px`
    breakpoints that tighten spacing on short/narrow panels.
  Verified at 1920x1080, 1600x900, 1366x768, 1280x720 and 1024x768: no
  clipping, no title-bar collision, no tracking-banner collision, in both
  languages.

- **The gesture HUD must read the same in both languages.** The hint and
  tracking-status lines moved out of the per-language tables into a single
  `SHARED_STRINGS` table in `uiStrings.js` (`t()` in `i18n.js` now resolves
  active language -> shared -> English -> key). One copy of each string, so
  the two languages cannot drift apart: "Mouse control (hand tracking
  unavailable)", "↔ Pinch & drag to rotate · ☝ Point & hold to inspect ·
  ✋ Open palm to pause", "☝ Point & pinch (or hold still) to select ·
  ✋ Open palm to pause", "👋 Wave to begin", "👋 Wave your hand to explore",
  plus the remaining tracking statuses.

## LM-010 connection and pointing accuracy fixes

- The mouse fallback no longer overwrites the active `leapmotion` backend
  after a successful WebSocket connection.
- The WebSocket adapter now treats a successful connection handshake as
  connected instead of timing out while waiting for the first tracking frame.
- v6 frame-level `pointables` are now used for the real index fingertip and
  extended-finger count, removing the inaccurate palm-direction fallback for
  real LM-010 pointing.

## Real anatomy pass — Heart, Lungs, Brain, Nervous System, Digestive System

Extends the earlier Skeleton/Muscles real-data work to the remaining
five systems, sourced from the NIH-funded **HuBMAP Human Reference
Atlas 3D Reference Object Library** (CC BY 4.0) — see `ATTRIBUTION.md`
for full citations.

**New real assets** (`assets/models/`): `heart.glb`, `heart_vessels.glb`,
`lungs.glb`, `brain.glb`, `spinal_cord.glb`, `liver.glb`, `pancreas.glb`,
`gallbladder.glb`, `small_intestine.glb`, `large_intestine.glb`,
`biliary_tree.glb` — real, individually-named, expert-validated
anatomical meshes (14 to 286 sub-parts each depending on organ).

**New classifiers:** `heartClassifier.js`, `lungClassifier.js`,
`brainClassifier.js`, `spinalCordClassifier.js`, `digestiveClassifier.js`
— map each dataset's real mesh names to this exhibit's public-facing
categories, each verified for near-100% coverage against every real name
before shipping (same rigor as the earlier bone/muscle classifiers).

**New/rewritten explorers:** `HeartExplorer.js` and `LungExplorer.js`
rewritten to load real GLBs with a procedural fallback (same pattern as
`SkeletonExplorer.js`); `BrainExplorer.js` rewritten similarly;
`DigestiveExplorer.js` and `NervousExplorer.js` are new, replacing
`GenericExplorer` for those two systems.

**`ModelLoader.js` gained two capabilities**, both needed for these
multi-organ systems:
- `loadCombinedAnatomyModel()` — loads several GLBs that share one
  source coordinate space (e.g. organs extracted from the same "united
  body" reference) into one scene *without* individually re-centering
  each one, so their real relative positions are preserved (the heart
  sits correctly between the lungs, the trachea connects into the
  bronchi, the brain sits on the spinal cord) with no manual alignment.
- `exclude` (per-source) and `scaleReferenceTag` options — some combined
  sources include structures that reach far beyond the organ of interest
  (e.g. the heart's own vessel file includes arteries running up into
  the neck); these let a specific source's own bounding box drive the
  camera framing instead of the combined-everything bounding box.

**Real bugs found and fixed while wiring these up** (see README §13 for
the full list): a matrix-update timing bug in the new combined loader
that produced stale pre-scale bounding boxes; `getWorldPosition()`
returning (0,0,0) for these particular GLTF exports instead of each
mesh's real visual center (they bake spatial data into vertex buffers
with identity node transforms), which broke the heart's blood-flow
waypoint calculation until fixed to use bounding-box centers instead;
and a shared-material bug in `HeartExplorer`/`LungExplorer` where
selecting one part visually highlighted the *entire* organ because a
single material instance was reused across every mesh instead of cloned
per-mesh (the same class of bug `SkeletonExplorer`/`MusclesExplorer`
had already avoided).

`anatomyData.js` categories were expanded to match what the real data
actually contains rather than forcing it into the old placeholder
categories: Heart went from 6 to 14 parts (individual valves, septum,
papillary muscles, coronary arteries now selectable), Brain from 6 to 7
(added "Deep Brain Structures" covering the thalamus/basal ganglia/limbic
system), Digestive System from 6 to 8 (gained gallbladder and bile ducts,
lost esophagus — not in the dataset), Nervous System from 4 to 5 (spinal
cord now split into its 4 real regions instead of one generic "spinal
cord" part).

---

## Hotfix pass — pinch not registering on real LM-010 hardware

Reported after the first real-hardware test: hand tracking showed as
active and the cursor moved smoothly, but pinch never registered, so
nothing could be selected.

**Root cause:** `LeapMotionAdapter._handleFrame()` only ever read
`hand.pinchStrength` / `hand.pinchDistance`. Those field names are
Ultraleap-specific and version-dependent; if the actual WebSocket
service/bridge sends a differently-shaped frame (very possible --  this
was never tested against real hardware, see the previous pass's honesty
notes), those fields are simply `undefined` forever, so pinch strength
silently stayed at 0 no matter what the visitor's hand did.

**Fixes:**
- `src/leapmotion/LeapMotionAdapter.js` — `extractPinchStrength()` now
  tries, in order: known field-name variants, a pinch-distance field, and
  (new) **computing pinch strength directly from thumb-tip/index-tip
  Euclidean distance** if the frame includes per-finger tip positions at
  all -- the most universally-available signal across Leap-like frame
  formats. Falls back to 0 (visible in the debug overlay as `Pinch
  source: none`) only if truly nothing usable is present.
- `src/interaction/GestureStateMachine.js` — default
  `PINCH_START_THRESHOLD`/`PINCH_RELEASE_THRESHOLD` lowered (0.75→0.55,
  0.45→0.3) and confirm frames reduced (4→3) as a safety margin while
  the above fix is validated on-site.
- `src/components/DebugOverlay.js` (F9) — added a **"Pinch source"**
  line so you can immediately see whether pinch is coming from a real
  field, a computed fallback, or nothing at all, on your actual hardware.
- **`src/components/VirtualCursor.js` — added dwell-to-select as a second,
  independent selection method.** Point at a button and hold still for
  ~0.9s (a visible ring fills in around the cursor as feedback) to
  activate it -- this works even if pinch detection turns out to be
  unreliable on a given sensor/hand/lighting combination, since it only
  depends on pointing, which was already confirmed working. Both
  methods stay active; whichever is reliable on your setup is the one
  that matters. Gated to the Leap Motion backend only (mouse/touch
  already click natively).
- `src/interaction/KeyboardInputAdapter.js`, `src/main.js` — separated
  Escape (emulates open-palm/pause) from Backspace (direct "back to
  menu" shortcut), since open palm no longer means "go back."

**Still needs on-site verification:** press F9 during testing and watch
the "Pinch source" and "Pinch strength" lines while pinching -- if
source stays "none", your service/bridge's frame shape needs a small
addition to `extractPinchStrength()` (the function is written to make
this a short, isolated edit). If dwell-to-select works but pinch still
doesn't, that confirms the issue is specifically in pinch data, not
tracking/pointing in general.

---

# Changelog — Exhibition Quality Upgrade Pass

This documents exactly what changed from the previous build, file by
file, in response to the three problems raised (realistic anatomy, Leap
Motion accuracy, animation/UI polish). Nothing in this pass removed the
welcome → menu → explorer → back navigation flow, the Leap Motion
WebSocket connection method, or the mouse/keyboard fallbacks — all were
extended in place.

## New files

**Real anatomical assets & sourcing**
- `assets/models/skeleton.glb` — real 202-bone skeleton (BodyParts3D, CC BY-SA)
- `assets/models/muscles.glb` — real 467-muscle écorché (BodyParts3D + Z-Anatomy, CC BY-SA)
- `src/data/muscleMeshMapping.json` — per-mesh metadata for the muscle GLB
- `src/data/modelManifest.js` — single source of truth: which systems use a real GLB vs. a procedural placeholder, and their license info
- `src/anatomy/ModelLoader.js` — shared GLTFLoader wrapper (caching, BP3D→three.js coordinate transform, disposal)
- `src/anatomy/boneClassifier.js` — groups the skeleton's 202 real bone names into 17 selectable categories
- `src/anatomy/muscleClassifier.js` — groups the muscle GLB's 467 real names into 13 selectable categories (classification logic adapted from BodyExplorer, MIT-licensed — see ATTRIBUTION.md)
- `src/anatomy/fade.js` — shared opacity-tween helper (`OpacityFader`) used by every "activate/deactivate" toggle
- `src/components/MusclesExplorer.js` — new bespoke explorer for the real muscle model
- `lib/three/examples/jsm/loaders/GLTFLoader.js`, `lib/three/examples/jsm/utils/BufferGeometryUtils.js` — vendored from the same three.js version already in the project, needed to load GLB files
- `ATTRIBUTION.md` — required CC BY-SA attribution for the real model data

**Leap Motion gesture accuracy**
- `src/interaction/GestureStateMachine.js` — the core fix for Problem 2: EMA position smoothing, dead zone, velocity limiting, pinch hysteresis (separate start/release thresholds), confirm/release frame counting, gesture priority, and cooldown-gated discrete gestures (open palm / swipe / wave)
- `src/leapmotion/CalibrationManager.js` — persists a 4-point calibration mapping to localStorage
- `src/leapmotion/CalibrationScreen.js` — staff-only 4-target calibration UI (F10)
- `src/components/DebugOverlay.js` — staff-only live diagnostic HUD (F9)

## Rewritten files

- `src/leapmotion/LeapMotionAdapter.js` — **the WebSocket connection logic is unchanged.** What changed: raw frames are now parsed into a hardware-agnostic sample (palm, index fingertip, pinch strength, grab strength, confidence, extended-finger count where available) and hand off to `GestureStateMachine` for stabilization, instead of this file doing threshold checks directly.
- `src/components/AnatomyViewer.js` — added `setModelAnimated()` (smooth scale-tween model transitions), a gentle camera-focus lerp toward the selected part, a pulsing selection highlight, FPS tracking, and `setInteractionSuspended()`. **Removed** the line that reset the camera/rotation/selection on every open-palm event — this was the direct cause of "open palm resets the explorer."
- `src/components/InformationPanel.js` — content swaps now fade/rise in via CSS transition instead of an instant DOM swap; added real-mesh-name display and per-system attribution line.
- `src/components/SkeletonExplorer.js` — loads the real GLB via `ModelLoader` + `boneClassifier`, with automatic fallback to the old procedural skeleton if the GLB fails to load.
- `src/components/HeartExplorer.js`, `BrainExplorer.js`, `LungExplorer.js`, `GenericExplorer.js` — switched to `setModelAnimated`; toggle animations (Blood Flow, Brain Activity, Breathing Mode) now fade in/out via `OpacityFader` instead of snapping `visible` on/off.
- `src/anatomy/heartModel.js` — chambers rebuilt as deformed/tapered organic shapes (apex-pulled spheres) instead of literal cone+sphere primitives. Still a procedural placeholder, just a less "geometric-primitive-looking" one.
- `src/data/anatomyData.js` — Skeleton expanded from 12 to 17 real categories, Muscles expanded from 6 to 13 real categories, matching what the real GLB assets actually contain.
- `src/main.js` — open palm no longer navigates anywhere or resets anything (see "Open palm behavior" below); added F9/F10 staff shortcuts; hand-lost/hand-detected now suspend/resume interaction without touching explorer state; idle-mode entry now properly unmounts the current explorer first; `_enterExplorer` is now async-safe (guards against a stale GLB load finishing after the visitor already picked a different system).
- `index.html` — added an import map (`"three"` → vendored module) so the vendored `GLTFLoader.js` can resolve its `import ... from "three"`; added DOM containers for the debug overlay, calibration screen, and pause toast.
- `src/ui/styles.css` — added styles for all of the above; no existing visual language was changed.

## Behavioral changes worth knowing about

- **Open palm behavior changed on purpose.** It used to immediately call the same code path as the Back button (reset to menu, resetting camera/rotation/selection along the way). It now shows a small "Interaction Paused" toast for 1.5s and does nothing else. Returning to the menu is done via the on-screen Back button (point + pinch), which was always available and unaffected by this change.
- **Tracking loss no longer touches app state.** Losing the hand (briefly, or for a while) suspends pointer/pinch input and shows "Hand not detected — interaction paused" in the HUD; the current explorer, camera angle, selection, and any running animation (Blood Flow, etc.) are left exactly as they were.
- **Skeleton and Muscles now show real anatomy.** Every other system menu button (Heart, Brain, Lungs, Digestive System, Nervous System) is unchanged in kind — still procedural placeholders — see ATTRIBUTION.md and the README for why, and what to do about it.
