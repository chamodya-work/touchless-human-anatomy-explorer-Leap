# Touchless Human Anatomy Explorer

A touchless, gesture-driven 3D anatomy exhibit for a university medical
exhibition, controlled with Leap Motion / Ultraleap **LM-010** hand
tracking (with full mouse and keyboard fallback for development, testing
and accessibility).

Built with **Three.js + vanilla JavaScript (ES modules)** — no build step,
no bundler. **All seven body systems use real, individually-named
anatomical 3D data**, from two legitimate, clearly-licensed sources —
BodyParts3D/Z-Anatomy (Skeleton, Muscles) and the NIH-funded HuBMAP Human
Reference Atlas (Heart, Lungs, Brain, Nervous System, Digestive System) —
see `ATTRIBUTION.md` for full citations. A handful of small supplementary
parts (the stomach, the diaphragm, the full-body silhouette on the
welcome screen) remain procedural because they aren't part of either
dataset; each is clearly labeled in code and disclosed in §7.

> **This is an upgrade pass, not a rewrite.** See `CHANGELOG.md` for the
> exact file-by-file diff from the previous build, and the "Honest
> status" section at the end of this document for what's real vs. still
> a placeholder, tested vs. untested.

---

## Contents

1. [Installation](#1-installation)
2. [Running on Windows](#2-running-on-windows)
3. [Connecting the Leap Motion LM-010](#3-connecting-the-leap-motion-lm-010-connection-unchanged)
4. [How the gesture accuracy was improved](#4-how-the-gesture-accuracy-was-improved)
5. [Calibrating the LM-010 on-site](#5-calibrating-the-lm-010-on-site)
6. [Debug mode (F9)](#6-debug-mode-f9)
7. [Where the real anatomical models are](#7-where-the-real-anatomical-models-are)
8. [Replacing placeholder models with GLB/GLTF](#8-replacing-placeholder-models-with-glbgltf)
9. [Configuring gesture sensitivity](#9-configuring-gesture-sensitivity)
10. [Running without Leap Motion (mouse-only mode)](#10-running-without-leap-motion-mouse-only-mode)
11. [Testing the LM-010](#11-testing-the-lm-010)
12. [Troubleshooting](#12-troubleshooting)
13. [Honest status / remaining limitations](#13-honest-status--remaining-limitations)

---

## 1. Installation

No build tools required — plain HTML/JS/CSS, three.js already vendored
in `lib/three/`. You need a static file server (browsers block ES module
imports over `file://`).

```bash
git clone https://github.com/chamodya-work/touchless-human-anatomy-explorer-Leap.git
cd touchless-human-anatomy-explorer-Leap
python -m http.server 8080
```
or `npx serve -l 8080 .`, or any static server / VS Code Live Server.
Then open `http://localhost:8080`.

**Note on file size:** this build includes real GLB assets for all seven
systems — the two largest are `muscles.glb` (~24MB, 467 meshes) and
`skeleton.glb` (~9.4MB). First load of each explorer will take a moment
longer than a typical web page; `muscles.glb` specifically took up to
~10 seconds to parse in this build's constrained, software-rendered test
environment (a real exhibition PC with a proper GPU should be markedly
faster). The "Loading real anatomical model..." status line stays
visible the whole time — a long pause on Muscles specifically is that
file parsing, not a hang. All assets are cached in memory after first
load, so re-entering the same explorer later in the day is instant.

## 2. Running on Windows

1. Install [Python 3](https://www.python.org/downloads/windows/) (check "Add to PATH") or [Node.js](https://nodejs.org/).
2. Clone or copy this repository onto the exhibition PC.
3. In the repository root: `python -m http.server 8080`
4. Open Chrome or Edge at `http://localhost:8080`, press **F11** for fullscreen kiosk mode.
5. Optional unattended-startup kiosk launch: `start chrome --kiosk http://localhost:8080`

Runs entirely client-side once loaded — no internet needed at runtime.

## 3. Connecting the Leap Motion LM-010

The application connects to the Leap-compatible Ultraleap WebSocket endpoint
`ws://localhost:6437/v6.json`. The adapter accepts the v6 hand-level fields
and the frame-level `pointables` array used by the real LM-010 bridge.
This upgrade pass did not touch `connect()`/`disconnect()`/the WebSocket
handshake — only what happens to a frame *after* it arrives (see §4).

If you're setting this up fresh:

1. Install Ultraleap Hand Tracking Software (Gemini) on the Windows PC; confirm the LM-010 tracks in Ultraleap's own Visualizer tool first.
2. Expose tracking data to the browser via the Ultraleap WebSocket service at
   `ws://localhost:6437/v6.json`, or use a small native bridge app with the
   same Leap-compatible frame shape.
3. If your bridge uses another endpoint, update `WS_URL` in
   `src/leapmotion/LeapMotionAdapter.js`.
4. Reload — the app auto-connects on startup; on failure it falls back to mouse control within ~2.5s and shows a banner.

## 4. How the gesture accuracy was improved

The reported symptoms — unreliable pointing/pinch, gestures not
triggering, tracking "resetting," open palm causing unwanted resets,
needing to repeat gestures — all trace back to one root cause: **raw
per-frame sensor data was being turned directly into UI events**, so any
single noisy frame could flip a gesture on or off.

The fix is `src/interaction/GestureStateMachine.js`, sitting between
`LeapMotionAdapter` (which still only parses raw Ultraleap frames) and
the app's shared `handTracking` event bus:

| Symptom | Fix |
|---|---|
| Pinch flickers on/off rapidly | **Hysteresis**: `PINCH_START_THRESHOLD` (0.75) is higher than `PINCH_RELEASE_THRESHOLD` (0.45) — a hand held right at the boundary can't oscillate. |
| A single noisy frame triggers/cancels a gesture | **Confirm/release frame counts**: the raw condition must hold for `GESTURE_CONFIRM_FRAMES` (4) consecutive frames to start a pinch, `GESTURE_RELEASE_FRAMES` (3) to end one, `OPEN_PALM_CONFIRM_FRAMES` (10) for the slower, lower-stakes open-palm gesture. |
| Pointer jumps/shakes | **EMA smoothing + dead zone + velocity limiting** on the index-fingertip position before it ever becomes a screen coordinate. |
| Open palm resets things | Open palm is no longer wired to any navigation/reset code path at all — see `CHANGELOG.md` "Behavioral changes." It now only shows a transient "Interaction Paused" toast. |
| Selecting UI is hard | The pointer now follows the **index fingertip** specifically (falling back to a palm+direction projection only if the SDK/bridge doesn't provide per-finger data), not the palm center. |
| Tracking "resets" the app | Tracking loss now has a 250ms grace period (`TRACKING_LOST_GRACE_MS`) before being declared lost at all, and even then only *suspends* pointer/pinch input — see §12 and `AnatomyViewer.setInteractionSuspended()`. Explorer/camera/selection state is never touched. |
| Two gestures fire at once | Explicit state machine (`IDLE → HAND_DETECTED → POINTING → PINCH_PENDING → PINCHING → ...`) with priority: pinching suppresses open-palm/swipe evaluation; a pending pinch still moves the cursor but won't also register as pointing-hover. |
| Discrete gestures fire every frame | `GESTURE_COOLDOWN_MS` (700ms) gates open palm / swipe / wave — one deliberate gesture, one event. |

All of these constants live in `GESTURE_CONFIG` at the top of
`GestureStateMachine.js` and are safe to tune live from the browser
console (`app.leapAdapter.gestureStateMachine.setConfig({...})`) while
testing on-site, or by editing the file directly for a permanent change.

**Verification:** since no LM-010 hardware was available in the build
environment, this was verified by feeding synthetic frame sequences
directly into `GestureStateMachine.update()` (bypassing the WebSocket)
and asserting the resulting state transitions — confirmed: a single
above-threshold frame does NOT confirm a pinch; a noisy dip that stays
above the release threshold does NOT cancel an active pinch; a single
dropped frame does NOT declare tracking lost. **This is not the same as
testing against real hardware** — see §13.

## 5. Calibrating the LM-010 on-site

Press **F10** to open the calibration screen (staff-only; not part of the
visitor flow). If Leap Motion is connected:

1. Click/select **Start Calibration**.
2. Four targets appear in sequence: TOP LEFT, TOP RIGHT, BOTTOM LEFT, BOTTOM RIGHT.
3. Point at each one and **pinch** to confirm it.
4. Values are saved to `localStorage` and applied immediately — no reload needed.

**Reset to Default** clears the saved calibration and reverts to the
built-in default interaction range. Calibration is per-browser-profile
(localStorage), so it survives a page reload/restart but not a browser
data wipe.

Under the hood: `CalibrationManager` (`src/leapmotion/CalibrationManager.js`)
records the raw index-fingertip position at each of the four corners and
derives independent X/Y min/max bounds, which `GestureStateMachine` uses
to map raw hand coordinates to the -1..1 range the rest of the app
expects — see the code comments there for why a simple per-axis mapping
was chosen over a full perspective/homography correction.

## 6. Debug mode (F9)

Press **F9** to toggle a live diagnostic HUD, meant for calibrating and
troubleshooting the LM-010 on-site:

```
Hand detected:        YES/NO
Tracking confidence:  (if the SDK/bridge reports it)
Gesture state:        IDLE / POINTING / PINCHING / TRACKING_LOST / ...
Raw palm / index fingertip / smoothed index / mapped pointer positions
Pinch strength / grab strength
Frame latency, render FPS
Current calibration range
```

It also draws the raw index-fingertip marker (orange) against the mapped
pointer (cyan) and the screen's edge, so you can see at a glance whether
raw tracking data or the calibration mapping is the problem when
something feels off. Press F9 again to hide it — it adds no overhead
when hidden.

## 7. Where the real anatomical models are

```
assets/models/
  skeleton.glb          <- 202 real bones (BodyParts3D, CC BY-SA)
  muscles.glb           <- 467 real muscles/tendons (BodyParts3D + Z-Anatomy, CC BY-SA)
  heart.glb             <- 14-mesh real heart (chambers, septum, valves) (HuBMAP, CC BY 4.0)
  heart_vessels.glb     <- real coronary arteries, aorta, pulmonary vessels, vena cava (HuBMAP, CC BY 4.0)
  lungs.glb             <- 87-mesh real respiratory system incl. full bronchial tree (HuBMAP, CC BY 4.0)
  brain.glb             <- 286-structure real brain, mapped with the Allen Institute (HuBMAP, CC BY 4.0)
  spinal_cord.glb       <- 30-segment real spinal cord, all 31 vertebral levels (HuBMAP, CC BY 4.0)
  liver.glb             <- real liver, 33 landmark surfaces (HuBMAP, CC BY 4.0)
  pancreas.glb          <- real pancreas (HuBMAP, CC BY 4.0)
  gallbladder.glb       <- real gallbladder (HuBMAP, CC BY 4.0)
  small_intestine.glb   <- real duodenum/jejunum/ileum (HuBMAP, CC BY 4.0)
  large_intestine.glb   <- real colon/cecum/rectum (HuBMAP + Stony Brook University, CC BY 4.0)
  biliary_tree.glb      <- real bile duct network (HuBMAP, CC BY 4.0)
```

Full licensing detail is in `ATTRIBUTION.md` (required reading before
redistributing this build — CC BY-SA requires attribution and
share-alike on the skeleton/muscle *data specifically*, not your code;
CC BY 4.0, covering everything else, requires attribution only).
`src/data/modelManifest.js` is the single source of truth for which
systems use which files.

**Not covered by either dataset:** a stomach and esophagus model, or
peripheral nerves. A small, clearly-labeled procedural stomach is added
alongside the six real digestive organs in `DigestiveExplorer.js`, and a
procedural diaphragm is added alongside the real lungs in
`LungExplorer.js`, so both explorers still show a complete system — see
§8 for how to replace these last few procedural pieces, and §13 for the
honest reasoning.

## 8. Replacing placeholder models with GLB/GLTF

The only remaining procedural (non-real) pieces are the stomach
(Digestive System), the diaphragm (Lungs), and the full-body silhouette
on the Welcome/Menu/Idle screens. `src/components/SkeletonExplorer.js`
is the reference pattern to follow for swapping any of them for a real
GLB (e.g. if you later source a stomach model):

1. Place your GLB at the path already reserved in
   `src/data/modelManifest.js` (e.g. `assets/models/heart.glb`) and flip
   that system's `type` from `"procedural"` to `"glb"`.
2. In the matching explorer's `mount()`, replace the direct
   `buildXModel()` call with:
   ```js
   import { loadAnatomyModel } from "../anatomy/ModelLoader.js";
   import { getModelInfo } from "../data/modelManifest.js";
   // ...
   async mount() {
     let model, usedRealModel = false;
     try {
       const info = getModelInfo("heart");
       model = await loadAnatomyModel(info.path);
       const selectable = [];
       model.traverse((obj) => {
         if (obj.isMesh) {
           obj.userData.partId = classifyYourMeshName(obj.name); // write this
           selectable.push(obj);
         }
       });
       model.userData.selectableParts = selectable;
       usedRealModel = true;
     } catch (err) {
       console.error("Falling back to procedural heart:", err);
       model = buildHeartModel(); // keep the old builder as a fallback
     }
     this.viewer.setModelAnimated(model, { selectable: model.userData.selectableParts });
     // ...
   }
   ```
3. Write a small classifier function mapping your GLB's real mesh/node
   names to the `partId` values already defined in that system's
   `anatomyData.js` entry — see `boneClassifier.js` (17 categories from
   202 names) and `muscleClassifier.js` (13 categories from 467 names)
   for the exact pattern (simple keyword/regex rules, verified against
   every real name with a small Node script — see those files' comments).
4. If your GLB's real names suggest better/more granular categories than
   the current placeholder list, update that system's `parts` array in
   `anatomyData.js` to match — don't force new anatomy into old category
   names (this is exactly what happened when Skeleton went from 12
   placeholder categories to 17 real ones).
5. `ModelLoader.loadAnatomyModel()` handles orientation (assumes the
   BodyParts3D X-right/Y-front/Z-up mm convention — pass `{ orient: "none" }`
   if your source is already Y-up) and auto-scale/center to fit the
   existing camera framing — you shouldn't need to touch `AnatomyViewer.js`.

**Where to find more real models**, roughly in order of effort:

- **BodyParts3D full archive** (https://lifesciencedb.jp/bp3d/, CC BY-SA
  2.1 Japan) — the same source as the Skeleton/Muscles data here, also
  contains organ-level segmentation (heart, lungs, digestive organs,
  brain regions, nerves). Extracting a specific organ requires their
  data browser/API and OBJ→GLB conversion; this is the most "in the
  spirit of what's already here" option.
- **Z-Anatomy** (https://www.z-anatomy.com, CC BY-SA 4.0) — a complete,
  free Blender file covering every system including organs. Requires
  Blender to isolate and export individual organs to GLB; no build
  tools for this were available in the environment this pass ran in.
- **Purchased/licensed assets** (Sketchfab CC-licensed medical models,
  TurboSquid, CGTrader, Zygote Media, BioDigital) — fastest path to a
  specific, polished organ model; check the license explicitly allows
  your intended use (exhibition display, potential redistribution) before
  buying, and add the attribution to `ATTRIBUTION.md`.

Do **not** substitute a "looks plausible" model of unclear/unverified
license provenance for a public exhibition — see §13 for why one
promising-looking free option was deliberately not used here.

## 9. Configuring gesture sensitivity

All tunable thresholds: `GESTURE_CONFIG` in
`src/interaction/GestureStateMachine.js` (pinch hysteresis, confirm/release
frame counts, smoothing, dead zone, cooldowns — see §4's table for what
each one does). Mouse fallback tuning: `src/interaction/MouseInputAdapter.js`.
Keyboard fallback step size: `src/interaction/KeyboardInputAdapter.js`.
Camera/rotation responsiveness: `src/components/AnatomyViewer.js` (the
`PINCH_MOVE` handler).

## 10. Running without Leap Motion (mouse-only mode)

Automatic fallback, no configuration needed. Move mouse = point/hover;
click+drag = pinch & rotate; scroll = zoom; double-click = open palm;
rapid back-and-forth movement = wave. Keyboard (arrows/WASD rotate, +/-
zoom, Enter/Space select, Escape emulates open-palm/pause, **Backspace
returns to the menu**) works simultaneously as a second accessibility
layer. This is the mode used throughout development — real Leap Motion
hardware was not available in the build environment (see §13).

## 11. Testing the LM-010

With real hardware connected on-site:

1. **Connection check:** reload the page — the "Leap Motion LM-010
   connected" banner should appear within ~2.5s, and `GestureIndicator`
   (bottom-right) should show a green dot once a hand is presented.
2. **F9 debug overlay** — confirm raw palm/fingertip numbers change
   smoothly (not jumping) as you move your hand, and that `Pinch
   strength` rises smoothly toward 1.0 as you pinch rather than jumping
   straight there.
3. **F10 calibration** — run the 4-point calibration once per exhibition
   setup (sensor height/angle changes invalidate the previous calibration).
4. **Manual gesture pass** — work through the 12-point test list in
   `CHANGELOG.md`-adjacent testing notes below: point at a menu button,
   pinch to select, rotate an organ, pinch-release cleanly without the
   selection "sticking," show an open palm and confirm nothing resets,
   step out of frame and back in and confirm the explorer is exactly as
   you left it.
5. If pinch feels too easy/hard to trigger, adjust
   `PINCH_START_THRESHOLD`/`PINCH_RELEASE_THRESHOLD` in `GESTURE_CONFIG`
   in small steps (0.05) and re-test — don't change more than one
   constant at a time.

## 12. Troubleshooting

**Hand tracks and moves smoothly, but pinch never selects anything:**
This is a known failure mode — press **F9** and watch the "Pinch
strength" and "Pinch source" lines while you pinch:
- If **Pinch source: none** — your Ultraleap service/bridge's frame
  doesn't include any field `extractPinchStrength()` in
  `LeapMotionAdapter.js` recognizes. Log one raw frame
  (`console.log(JSON.stringify(frame))` inside `_handleFrame`) and add a
  matching case to that function — it's written as an isolated,
  short fallback chain specifically so this is a quick edit.
- If **Pinch source: computed** or **distance** but strength doesn't
  rise much past ~0.3–0.4 even when you pinch hard — your sensor's
  measured thumb/index gap when "fully pinched" may be wider than the
  15mm this build assumes (hand size, sensor angle, and mounting height
  all affect this). Loosen `PINCH_START_THRESHOLD` in `GESTURE_CONFIG`
  (`src/interaction/GestureStateMachine.js`) down from 0.55 toward
  0.35–0.4 and re-test.
- Either way, **dwell-to-select works independently of all of this** —
  point at a button and hold still for ~0.9s; a ring fills in around the
  cursor and it activates. If dwell works but pinch doesn't, that
  confirms the issue is isolated to pinch detection, not tracking in
  general, and visitors are not blocked in the meantime.

**Tracking loss mid-interaction:** by design, this now shows "Hand not
detected — interaction paused" and freezes the pointer in place — it
does **not** reset your explorer, camera angle, or selection. If it
*looks* like a reset, check whether the explorer's own animation (Blood
Flow, Breathing Mode) is still toggled on underneath — those keep
running during a pause, only pointer/pinch input is suspended.

**"Hand tracking unavailable" banner always shows:** confirm the
Ultraleap Tracking Service is running and tracks in its own Visualizer
tool first; confirm your bridge/WebSocket is listening on the URL in
`LeapMotionAdapter.js`; check the browser console (F12) for the specific
WebSocket error; check Windows Firewall isn't blocking the local port.

**Gestures feel unresponsive or overly sensitive:** see §9. Use F9's
debug overlay to see exactly which raw value (pinch strength, grab
strength) isn't behaving as expected before touching thresholds blindly.

**Pointer drifts to one side / visitor has to reach to the edges:**
re-run calibration (§5) — the default range is a reasonable starting
guess, not tuned to your specific sensor mounting height/angle.

**A real GLB model doesn't appear (blank explorer):** open the browser
console — `ModelLoader`/explorers log a clear error and fall back to the
procedural placeholder rather than failing silently. If you see a model
that's "there" but astronomically large or invisible, check that you
didn't accidentally hardcode a scale of `1` somewhere downstream of
`ModelLoader` (see `AnatomyViewer.setModelAnimated`'s comment about this
exact bug, found and fixed during this build's own testing).

**Blank screen / "Failed to load module script":** you opened
`index.html` via `file://` instead of a local server — see §1.

## 13. Honest status / remaining limitations

**Tested in this build environment:**
- Full welcome → menu → all 7 explorers → back navigation, via mouse and keyboard, with zero console errors (automated browser testing).
- Real GLB loading, orientation, scaling, and part-selection for all 7 systems: Skeleton (202 bones, 201/202 auto-classified), Muscles (467 meshes, 467/467 auto-classified), Heart (64 meshes across 2 combined files), Lungs (87 meshes), Brain (286 structures), Nervous System (brain + 30 spinal segments combined), Digestive System (6 files combined, ~75 meshes) — visually confirmed correctly oriented, proportioned, and (for the combined-file systems) correctly positioned relative to each other.
- `GestureStateMachine` state transitions via synthetic frame injection: pinch hysteresis, confirm/release frame gating, tracking-loss grace period, and open-palm confirm+cooldown all behave as designed and correctly drive the same `handTracking` event bus the rest of the app listens to.
- Model-swap animation, selection pulse, and toggle fade-in/out (Blood Flow, Breathing Mode, Brain Activity).

**Real bugs found and fixed during this pass** (documented here rather
than hidden, since they're the kind of thing worth knowing about if you
extend this further): a scale bug where `setModelAnimated`'s transition
animation clobbered `ModelLoader`'s carefully-computed scale, briefly
making real GLB models astronomically large and invisible; a matrix-
update timing bug in `loadCombinedAnatomyModel` where measuring a child
part's bounding box for scale/center gave stale pre-scale values; a bug
where `getWorldPosition()` returned (0,0,0) for these particular GLTF
exports (which bake all spatial data into vertex buffers with identity
node transforms) instead of each mesh's actual visual center, breaking
the heart's blood-flow waypoint calculation; and a shared-material bug
where selecting one part of the heart or lungs visually highlighted the
*entire* organ, because the same material instance was assigned to every
mesh instead of a clone. All four are fixed and covered by the
screenshots/tests referenced in this repo's development history.

**NOT tested — because real LM-010 hardware was not available in this
build environment:**
- The actual Ultraleap WebSocket frame shape from a live device/bridge. `_handleFrame()`'s parsing (palm/index-finger extraction, `pinchStrength` vs. `pinchDistance` handling) is written defensively against the documented/likely shapes but has not been exercised against a real frame. **Run §11's manual test pass on-site before the exhibition opens.**
- Real-world gesture "feel" — whether the specific threshold values in `GESTURE_CONFIG` feel right for your sensor's mounting position and lighting. These are starting points, not final tuned values; expect to spend 15-30 minutes on-site adjusting them with F9's debug overlay open.
- The calibration screen's actual UX against a real hand — the logic is unit-testable, but "does pointing at the physical corner of the screen actually feel accurate afterward" can only be judged with real hardware.

**Anatomy realism — all 7 systems now use real, licensed anatomical
data.** Skeleton and Muscles use BodyParts3D/Z-Anatomy (CC BY-SA). Heart,
Lungs, Brain, Nervous System, and Digestive System use the NIH-funded
HuBMAP Human Reference Atlas (CC BY 4.0), including the Allen Institute's
mapped human brain. Three small pieces remain procedural because neither
dataset includes them: the stomach, the diaphragm, and the full-body
silhouette on the welcome/menu screens — each is clearly labeled
`isProcedural`/commented in code. One tempting shortcut was deliberately
*not* taken earlier in this project: a GitHub repo offering pre-packaged
organ GLBs under a claimed MIT license was found and inspected, but its
README didn't document where the meshes themselves originally came from
— an MIT claim over data of unverified origin isn't a safe basis for a
public exhibition. The HuBMAP library used instead is NIH-funded,
fully-documented, and expert-validated.

**Performance:** not load-tested for a full multi-hour exhibition day.
The heaviest single asset (muscles.glb, ~24MB) and the six-file Digestive
System combo are cached after first load, and
`AnatomyViewer.clearModel()`/`ModelLoader.disposeModel()` dispose
geometries/materials on every explorer exit — but this hasn't been
soak-tested for memory creep over hundreds of repeated visits. Total
asset payload is now ~62MB (up from ~34MB with only Skeleton/Muscles
real) — still reasonable for a kiosk PC loading once at exhibition
open, but worth knowing if you're also serving this over a constrained
network rather than from local disk.
