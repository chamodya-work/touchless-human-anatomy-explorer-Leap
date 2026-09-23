/**
 * main.js
 * -----------------------------------------------------------------------
 * Application entry point & state machine. Wires together:
 *   input layer (Leap Motion / mouse / keyboard) -> HandTrackingController
 *   -> UI components (WelcomeScreen, MainMenu, explorers, IdleMode)
 *
 * States: WELCOME -> MENU -> EXPLORER(system) -> MENU -> ...
 * IDLE overlays any state after IDLE_TIMEOUT_MS of genuine inactivity.
 *
 * TRACKING-LOSS HANDLING (exhibition-quality fix): losing the hand
 * briefly (a very common, normal event with real hardware) SUSPENDS
 * interaction and shows a subtle indicator -- it never resets the
 * explorer, camera, selection, or navigates anywhere. See
 * _bindGlobalGestures() below and AnatomyViewer.setInteractionSuspended().
 * -----------------------------------------------------------------------
 */
import { handTracking, GESTURES } from "./interaction/HandTrackingController.js";
import { MouseInputAdapter } from "./interaction/MouseInputAdapter.js";
import { KeyboardInputAdapter } from "./interaction/KeyboardInputAdapter.js";
import { LeapMotionAdapter } from "./leapmotion/LeapMotionAdapter.js";
import { calibrationManager } from "./leapmotion/CalibrationManager.js";
import { CalibrationScreen } from "./leapmotion/CalibrationScreen.js";

import { AnatomyViewer } from "./components/AnatomyViewer.js";
import { VirtualCursor } from "./components/VirtualCursor.js";
import { GestureIndicator } from "./components/GestureIndicator.js";
import { WelcomeScreen } from "./components/WelcomeScreen.js";
import { MainMenu } from "./components/MainMenu.js";
import { InformationPanel } from "./components/InformationPanel.js";
import { IdleMode, IDLE_TIMEOUT_MS } from "./components/IdleMode.js";
import { DebugOverlay } from "./components/DebugOverlay.js";

import { HeartExplorer } from "./components/HeartExplorer.js";
import { BrainExplorer } from "./components/BrainExplorer.js";
import { LungExplorer } from "./components/LungExplorer.js";
import { SkeletonExplorer } from "./components/SkeletonExplorer.js";
import { MusclesExplorer } from "./components/MusclesExplorer.js";
import { DigestiveExplorer } from "./components/DigestiveExplorer.js";
import { NervousExplorer } from "./components/NervousExplorer.js";
import { GenericExplorer } from "./components/GenericExplorer.js";

import { buildBodyModel } from "./anatomy/bodyModel.js";
import { getSystem } from "./data/anatomyData.js";
import { initLanguage, onLanguageChange, t, getLang } from "./data/i18n.js";

const STATE = { WELCOME: "welcome", MENU: "menu", EXPLORER: "explorer" };

class App {
  constructor() {
    // Resolve the saved/detected language BEFORE any component is built, so
    // the very first paint is already in the right language.
    initLanguage();

    this.state = STATE.WELCOME;
    this.currentSystemId = null;
    this.currentExplorer = null;
    this.idleTimer = null;
    this.isIdle = false;
    this._mountToken = 0; // guards against a stale async mount() finishing late

    this._cacheDom();
    this.viewer = new AnatomyViewer(this.dom.canvas);
    this.cursor = new VirtualCursor(this.dom.cursorLayer);
    // Dwell-to-select for 3D parts: the viewer owns the countdown and the
    // cursor owns the ring, so connect one to the other (see
    // AnatomyViewer.onDwellProgress / VirtualCursor.setExternalDwell).
    this.viewer.onDwellProgress = (progress) => this.cursor.setExternalDwell(progress);
    this.gestureIndicator = new GestureIndicator(this.dom.gestureIndicator);
    this.infoPanel = new InformationPanel(this.dom.infoPanel);
    this.idleMode = new IdleMode(this.dom.idleLayer);

    this.welcome = new WelcomeScreen(this.dom.welcome, () => this._enterMenu());
    this.menu = new MainMenu(this.dom.menu, (systemId) => this._enterExplorer(systemId));

    // Static chrome lives in index.html, so refresh it (now and on every
    // language switch) separately from the components that render themselves.
    this._applyChrome();
    onLanguageChange(() => this._applyChrome());

    this._bindBackButton();
    this._bindGlobalGestures();
    this._bindStaffShortcuts();
    this._initInputBackends();
    this._startIdleWatcher();

    this._setState(STATE.WELCOME);
  }

  _cacheDom() {
    this.dom = {
      canvas: document.getElementById("scene-canvas"),
      cursorLayer: document.getElementById("cursor-layer"),
      gestureIndicator: document.getElementById("gesture-indicator"),
      infoPanel: document.getElementById("info-panel"),
      idleLayer: document.getElementById("idle-layer"),
      welcome: document.getElementById("welcome-screen"),
      menu: document.getElementById("main-menu"),
      controls: document.getElementById("explorer-controls"),
      backBtn: document.getElementById("back-btn"),
      trackingBanner: document.getElementById("tracking-banner"),
      appTitle: document.getElementById("app-title-bar"),
      pauseToast: document.getElementById("pause-toast"),
      debugLayer: document.getElementById("debug-layer"),
      calibrationLayer: document.getElementById("calibration-layer"),
    };
  }

  // ---- language / static chrome ----------------------------------------
  /**
   * index.html ships the title bar, Back button and pause toast with English
   * text so the page is readable even before the modules load. This keeps
   * them in whichever language is currently active.
   */
  _applyChrome() {
    document.title = t("appTitle");
    // innerHTML (not textContent) so the little status dot span survives.
    this.dom.appTitle.innerHTML = `<span class="app-title-bar__dot"></span>${t("appTitle")}`;
    this.dom.backBtn.textContent = t("backToMenu");
    this.dom.pauseToast.textContent = t("pauseToast");
  }

  // ---- input backends --------------------------------------------------
  async _initInputBackends() {
    this.mouseAdapter = new MouseInputAdapter(handTracking);
    this.keyboardAdapter = new KeyboardInputAdapter(handTracking);
    this.leapAdapter = new LeapMotionAdapter(handTracking);

    // Staff diagnostics wired to the SAME gesture-state-machine instance
    // that's actually driving the app (not a separate copy).
    this.debugOverlay = new DebugOverlay(this.dom.debugLayer, {
      gestureStateMachine: this.leapAdapter.gestureStateMachine,
      viewer: this.viewer,
      leapAdapter: this.leapAdapter,
      calibrationManager,
    });
    this.calibrationScreen = new CalibrationScreen(this.dom.calibrationLayer, {
      leapAdapter: this.leapAdapter,
      gestureStateMachine: this.leapAdapter.gestureStateMachine,
    });

    // Always enable keyboard as an accessibility fallback alongside
    // whichever pointing backend wins below.
    this.keyboardAdapter.start();

    const connected = await this.leapAdapter.connect();
    if (!connected) {
      this._showTrackingBanner(t("bannerNoTracking"));
      this.mouseAdapter.start();
    } else {
      this._showTrackingBanner(t("bannerLeapConnected"), 3000);
    }
  }

  _showTrackingBanner(text, autoHideMs) {
    const el = this.dom.trackingBanner;
    el.textContent = text;
    el.classList.remove("hidden");
    if (autoHideMs) {
      setTimeout(() => el.classList.add("hidden"), autoHideMs);
    }
  }

  // ---- staff-only maintenance shortcuts --------------------------------
  _bindStaffShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "F9") {
        e.preventDefault();
        this.debugOverlay.toggle();
      } else if (e.key === "F10") {
        e.preventDefault();
        if (this.calibrationScreen.isOpen()) this.calibrationScreen.close();
        else this.calibrationScreen.open();
      } else if (e.key === "Backspace" && this.state === STATE.EXPLORER) {
        // Direct keyboard "back to menu" shortcut. Deliberately separate
        // from the open-palm gesture (which now only pauses interaction,
        // not navigate) -- Escape emulates open-palm via
        // KeyboardInputAdapter, Backspace is plain navigation.
        e.preventDefault();
        this._enterMenu();
      }
    });
  }

  // ---- idle watcher ------------------------------------------------
  _startIdleWatcher() {
    // Idle/attract-mode timing is about genuine visitor inactivity, so it
    // resets on real interaction gestures only -- NOT on HAND_DETECTED/
    // HAND_LOST (a brief tracking dropout mid-interaction shouldn't race
    // the attract-mode clock in either direction) and not while the
    // calibration screen is open.
    const meaningfulGestures = [
      GESTURES.POINT,
      GESTURES.PINCH_START,
      GESTURES.PINCH_MOVE,
      GESTURES.SWIPE_LEFT,
      GESTURES.SWIPE_RIGHT,
      GESTURES.WAVE,
      GESTURES.OPEN_PALM,
    ];
    const reset = () => {
      if (this.calibrationScreen?.isOpen()) return;
      this._resetIdleTimer();
    };
    meaningfulGestures.forEach((g) => handTracking.on(g, reset));
    window.addEventListener("keydown", reset);
    window.addEventListener("mousemove", reset);
    this._resetIdleTimer();
  }

  _resetIdleTimer() {
    if (this.isIdle) this._exitIdle();
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this._enterIdle(), IDLE_TIMEOUT_MS);
  }

  _enterIdle() {
    if (this.state === STATE.WELCOME) return; // welcome screen IS the attract mode
    if (this.calibrationScreen?.isOpen()) return; // never interrupt staff calibration
    this.isIdle = true;
    if (this.currentExplorer) {
      this.currentExplorer.unmount();
      this.currentExplorer = null;
    }
    this.idleMode.show();
    this.viewer.setModelAnimated(buildBodyModel());
    this.viewer.resetView();
    this.viewer.autoRotate = true;
    this.infoPanel.clear();
    this.dom.controls.innerHTML = "";
    this.dom.backBtn.classList.add("hidden");
  }

  _exitIdle() {
    this.isIdle = false;
    this.idleMode.hide();
    this._setState(STATE.MENU);
  }

  // ---- global gestures -----------------------------------------------
  _bindGlobalGestures() {
    // Open palm is a deliberate, low-consequence "pause interaction"
    // signal ONLY. It never navigates, never resets the model/camera/
    // selection, and never restarts an animation -- fixing the earlier
    // build's biggest exhibition complaint (accidental resets from
    // simply relaxing your hand).
    handTracking.on(GESTURES.OPEN_PALM, () => {
      if (this.state !== STATE.EXPLORER) return;
      this._showPauseToast();
    });

    handTracking.on(GESTURES.WAVE, () => {
      if (this.state === STATE.WELCOME) this._enterMenu();
    });

    // Tracking loss: suspend interaction and show a subtle indicator.
    // Deliberately does NOT touch explorer/model/camera/selection state.
    handTracking.on(GESTURES.HAND_LOST, () => {
      this.viewer.setInteractionSuspended(true);
    });
    handTracking.on(GESTURES.HAND_DETECTED, () => {
      this.viewer.setInteractionSuspended(false);
    });
  }

  _showPauseToast() {
    const el = this.dom.pauseToast;
    el.classList.add("pause-toast--visible");
    this.viewer.setInteractionSuspended(true);
    clearTimeout(this._pauseTimer);
    this._pauseTimer = setTimeout(() => {
      el.classList.remove("pause-toast--visible");
      this.viewer.setInteractionSuspended(false);
    }, 1500);
  }

  _bindBackButton() {
    this.dom.backBtn.addEventListener("click", () => this._enterMenu());
  }

  // ---- state transitions ----------------------------------------------
  _setState(next) {
    this.state = next;
    this.welcome.hide();
    this.menu.hide();
    this.dom.backBtn.classList.add("hidden");
    this.dom.appTitle.classList.remove("hidden");

    if (next === STATE.WELCOME) {
      this.welcome.show();
      this.dom.appTitle.classList.add("hidden");
      this.cursor.setEnabled(true);
      this.gestureIndicator.setContext("welcome");
      this.viewer.setModelAnimated(buildBodyModel());
      this.viewer.resetView();
    } else if (next === STATE.MENU) {
      this.menu.show();
      this.infoPanel.clear();
      this.dom.controls.innerHTML = "";
      this.cursor.setEnabled(true);
      this.gestureIndicator.setContext("menu");
      this.viewer.setModelAnimated(buildBodyModel());
      this.viewer.resetView();
    } else if (next === STATE.EXPLORER) {
      this.dom.backBtn.classList.remove("hidden");
      this.cursor.setEnabled(true);
      this.gestureIndicator.setContext("explorer");
    }
  }

  _enterMenu() {
    if (this.currentExplorer) {
      this.currentExplorer.unmount();
      this.currentExplorer = null;
    }
    this._setState(STATE.MENU);
  }

  async _enterExplorer(systemId) {
    if (this.currentExplorer) this.currentExplorer.unmount();

    const token = ++this._mountToken;
    const deps = { viewer: this.viewer, infoPanel: this.infoPanel, controlsRoot: this.dom.controls };
    let explorer;
    switch (systemId) {
      case "heart":
        explorer = new HeartExplorer(deps);
        break;
      case "brain":
        explorer = new BrainExplorer(deps);
        break;
      case "lungs":
        explorer = new LungExplorer(deps);
        break;
      case "skeleton":
        explorer = new SkeletonExplorer(deps);
        break;
      case "muscles":
        explorer = new MusclesExplorer(deps);
        break;
      case "digestive":
        explorer = new DigestiveExplorer(deps);
        break;
      case "nervous":
        explorer = new NervousExplorer(deps);
        break;
      default:
        explorer = new GenericExplorer(deps, getSystem(systemId, getLang()));
    }
    this.currentExplorer = explorer;
    this.currentSystemId = systemId;
    this._setState(STATE.EXPLORER);

    // mount() may be async (real-GLB explorers). Guard against a visitor
    // rapidly tapping two menu buttons in a row leaving a stale load to
    // finish after a different explorer is already showing.
    await explorer.mount();
    if (token !== this._mountToken) {
      explorer.unmount();
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.__anatomyApp = new App();
});
