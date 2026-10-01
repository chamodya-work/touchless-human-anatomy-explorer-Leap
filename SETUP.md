# Setup Guide — Touchless Human Anatomy Explorer

This is a **static website** (HTML + vanilla JavaScript + Three.js). There is
**no build step, no bundler, and no Python or Node package dependencies** to
install. To run it you only need three things:

1. **the files** (this repository),
2. **something that serves them over HTTP** — browsers block ES-module imports
   over `file://`, so double-clicking `index.html` will **not** work, and
3. **a modern browser** (Chrome or Edge).

> Gesture control additionally needs the **Ultraleap Hand Tracking (Gemini)**
> software installed (see §5). That is the *only* genuine install, it is OS
> software, and it is **not** part of this repository. Full mouse/keyboard
> control works without any of it.

**You do NOT need a `venv` or a `requirements.txt`.** Nothing here is a Python
package. `python -m http.server` is used only as a one-line static file server.

---

## 1. Recommended: zero-install on Windows (kiosk / exhibition PCs)

The repository ships a portable static server in `tools/server/`, so the target
PC needs **nothing installed**.

1. Get the files onto the target PC — either
   - `git clone https://github.com/chamodya-work/touchless-human-anatomy-explorer-Leap.git`, **or**
   - GitHub → **Code ▸ Download ZIP**, then extract.
2. Double-click **`Start-Kiosk.bat`**.
3. The explorer opens full-screen (kiosk) at `http://localhost:8080`.
4. To stop: close the black **AnatomyServer** window, or run **`Stop-Kiosk.bat`**.

`Start-Kiosk.bat` chooses a server in this order:

1. the bundled `tools/server/miniserve.exe` (zero-install), else
2. `python -m http.server`, else
3. `py -m http.server`, else
4. `npx --yes serve`,

then opens **Chrome** (preferred) or **Edge** in `--kiosk` mode.

- Change the port near the top of `Start-Kiosk.bat`: `set "PORT=8080"`.
- Test hook: set the environment variable `ANATOMY_NO_BROWSER` (to anything) to
  start the server **without** opening a browser — handy for scripts/CI.

### Optional: auto-start on boot
Press `Win+R`, type `shell:startup`, press Enter, and put a shortcut to
`Start-Kiosk.bat` in that folder.

---

## 2. Manual start (any OS — Windows / macOS / Linux)

From the repository folder (the one containing `index.html`):

| Tool | Command |
|---|---|
| Python 3 (no packages needed) | `python -m http.server 8080` |
| Node.js | `npx --yes serve -l 8080 .` |
| VS Code | right-click `index.html` → *Open with Live Server* |
| Bundled server | `tools\server\miniserve.exe --index index.html -p 8080` |

Then open `http://localhost:8080`.

---

## 3. What IS in the repository

- `index.html`, `src/` (all JavaScript), `src/ui/styles.css`
- `lib/three/three.module.min.js` — Three.js, vendored (no CDN needed)
- `assets/models/*.glb` — 13 real anatomical model files, **~61 MB total**
  (largest: `muscles.glb` ≈ 24 MB, `brain.glb` ≈ 11 MB)
- `tools/server/miniserve.exe` + `tools/server/LICENSE-miniserve.txt`
- `Start-Kiosk.bat`, `Stop-Kiosk.bat`, `SETUP.md` (this file)

## 4. What is NOT in the repository

- **Ultraleap Hand Tracking (Gemini)** software — install separately (§5).
- Any Leap device driver — installed by the Ultraleap software.
- Python / Node themselves — **not needed** thanks to the bundled server.

---

## 5. Leap Motion / Ultraleap (gesture control only)

1. Install **Ultraleap Hand Tracking Software (Gemini)** on the Windows PC.
2. Confirm the sensor tracks in Ultraleap's own *Visualizer* tool first.
3. Expose tracking to the browser at `ws://localhost:6437/v6.json`
   (this is the URL hard-coded in `src/leapmotion/LeapMotionAdapter.js`).
   If your bridge uses a different endpoint, edit `WS_URL` in that file
   (`v7.json` is the other common one — it is already there as a comment).
4. Open the app — it auto-connects on startup and falls back to mouse control
   within ~2.5 s if no sensor is found.

---

## 6. Verifying it works

1. Open the page; the welcome screen should appear.
2. Press **F9** for the debug overlay (hand detected / gesture state / FPS).
3. In the browser DevTools → **Network**, confirm `assets/models/*.glb` return
   **200**. A long pause the first time you open **Muscles** is the ~24 MB file
   parsing, not a hang — it is cached after the first load.
4. With no sensor attached, a "mouse control" banner is expected, not an error.

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| "port already in use" | Another server is on :8080. Change `PORT` in `Start-Kiosk.bat`, or stop the other server. |
| Windows SmartScreen warns about `miniserve.exe` | It is an unsigned open-source binary. Choose *More info ▸ Run anyway* (one-time), or rebuild the repo without it and use Python/Node instead. |
| Blank / white page | You opened the file directly (`file://`). Use one of the servers in §1/§2. |
| App loads but models are missing | Make sure you are serving the **repository root** (the folder with `index.html`), and that `assets/models/` came through the clone/ZIP intact. |
| Slow first load | Expected — ~61 MB of models are fetched and parsed on first use, then cached in memory. |

## 8. The bundled binary

`tools/server/miniserve.exe` is **miniserve v0.35.0** (MIT licensed),
a single-file static web server by Sven-Hendrik Haase.

- Source: <https://github.com/svenstaro/miniserve>
- License text: `tools/server/LICENSE-miniserve.txt`
- It is portable: no installer, no registry entries, nothing left behind if
  you delete the repository folder.

## 9. Updating the app on a machine

- Cloned copy: `git pull` in the repository folder.
- ZIP copy: download a fresh ZIP and extract over the top.

## 10. Uninstall / cleanup

Delete the repository folder. Because `miniserve.exe` is portable and the app
stores nothing except an optional calibration value in the browser's
`localStorage`, there is nothing else to remove.
