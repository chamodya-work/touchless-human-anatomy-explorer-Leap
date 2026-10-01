/**
 * AnatomyViewer.js
 * -----------------------------------------------------------------------
 * The core Three.js scene manager. Owns the renderer, camera, lighting,
 * background particles, and the currently displayed anatomy model. Every
 * explorer (HeartExplorer, SkeletonExplorer, ...) swaps models in/out of
 * this shared viewer rather than creating its own renderer.
 *
 * Interaction is entirely driven by generic gesture events from
 * `handTracking` (see /interaction/HandTrackingController.js) -- this
 * file has no knowledge of Leap Motion or the mouse.
 *
 * ANIMATION NOTE (exhibition-quality fix): every model swap, selection,
 * and camera move here is a short eased tween, not an instant DOM/scene
 * jump -- see setModelAnimated(), the selection pulse in _animate(), and
 * the camera-focus lerp toward the selected part's world position.
 *
 * SELECTING A STRUCTURE has two independent paths, so a visitor is never
 * stuck if one of them doesn't work on a given sensor/setup (the same
 * pinch-or-dwell design the DOM controls use in VirtualCursor):
 *   1. PINCH -- point at a part, pinch, release (PINCH_END handler).
 *   2. DWELL -- point at a part and hold still for DWELL_MS (_updateDwell).
 * Both are gated to the Leap Motion backend; mouse clicks already select
 * natively, so a resting mouse pointer must not select anything by itself.
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { handTracking, GESTURES } from "../interaction/HandTrackingController.js";
import { PALETTE } from "../anatomy/materials.js";
import { DWELL_MS } from "../interaction/dwell.js";

const DEFAULT_ZOOM = 4.2;

/** Dwell-to-select: how long the pointer must stay on one part. Shared with
 *  the DOM dwell in VirtualCursor so both paths feel identical. */
const DWELL_SECONDS = DWELL_MS / 1000;

/** Emissive level of a merely-hovered part (0.9 = selected, 0 = plain). */
const HOVER_EMISSIVE = 0.45;

export class AnatomyViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, DEFAULT_ZOOM);

    this._setupLights();
    this._setupParticles();

    this.modelRoot = new THREE.Group();
    this.scene.add(this.modelRoot);

    // Interaction state
    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2(0, 0);
    this.hovered = null;
    this.selected = null;
    this.selectable = [];
    this.autoRotate = true;
    this.targetZoom = DEFAULT_ZOOM;
    this.onSelect = null; // callback(partId, mesh)
    this.onHover = null; // callback(partId | null)
    this.onDwellProgress = null; // callback(progress 0..1 | null) -> fills the cursor ring

    // Dwell-to-select state. The pinch path is event-driven; this one is
    // accumulated per frame in _animate (see _updateDwell). The countdown is
    // keyed on the hovered PART id rather than the individual mesh, because
    // several meshes can share one partId (all 24 ribs are "ribs") and
    // pointer jitter across a mesh boundary within the same category must not
    // restart it.
    this._dwellElapsed = 0;
    this._dwellPartId = null; // part the running countdown belongs to
    this._dwellFiredFor = null; // partId already activated -- must look away before it can refire

    // Camera "gentle focus" toward selected structure
    this.lookTarget = new THREE.Vector3(0, 0, 0);
    this._lookGoal = new THREE.Vector3(0, 0, 0);

    // Interaction is suspended (not reset) while tracking is lost / paused
    this.interactionSuspended = false;

    this._dragOrigin = null;
    this._dragStartRotation = { x: 0, y: 0 };

    // Model transition state (see setModelAnimated)
    this._pendingModel = null;
    this._transition = null;

    this._bindGestures();
    this._resize = this._resize.bind(this);
    window.addEventListener("resize", this._resize);
    this._resize();

    this._clock = new THREE.Clock();
    this._frameCount = 0;
    this._fpsAccum = 0;
    this.fps = 60;

    this._animate = this._animate.bind(this);
    this._raf = requestAnimationFrame(this._animate);
  }

  _setupLights() {
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(3, 4, 5);
    this.scene.add(key);
    this.keyLight = key;

    const rim = new THREE.DirectionalLight(PALETTE.cyanBright, 0.55);
    rim.position.set(-4, -2, -3);
    this.scene.add(rim);

    const ambient = new THREE.AmbientLight(0x445566, 1.05);
    this.scene.add(ambient);

    const fill = new THREE.PointLight(PALETTE.cyan, 0.35, 10);
    fill.position.set(0, 2, 3);
    this.scene.add(fill);
  }

  _setupParticles() {
    const count = 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: PALETTE.cyan,
      size: 0.018,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
    });
    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  // ---- model management ---------------------------------------------
  /** Instant model swap (no transition). Prefer setModelAnimated(). */
  setModel(group, { selectable = [] } = {}) {
    this.clearModel();
    this.modelRoot.add(group);
    this.currentModel = group;
    this.selectable = selectable.length ? selectable : group.userData.selectableParts || [];
    this.selected = null;
    this.hovered = null;
    this._resetDwell();
  }

  /**
   * Smoothly transitions from whatever is currently shown to `group`:
   * the old model eases out (scale down + fade), then the new model
   * eases in (scale up from ~0). This is what makes "select HEART"
   * feel like a deliberate, professional transition instead of a
   * jarring instant swap. Any in-progress transition is finished
   * immediately before starting a new one (prevents overlapping tweens
   * if a visitor selects two systems in quick succession).
   */
  setModelAnimated(group, { selectable = [] } = {}) {
    // If a transition is already running, snap it to completion first.
    if (this._transition) {
      this._completeTransition();
    }

    const outgoing = this.currentModel;
    this.currentModel = null;
    this.selectable = [];
    this.selected = null;
    this.hovered = null;
    this._resetDwell();

    // IMPORTANT: capture the model's OWN intended final scale before we
    // touch it. Real GLB assets (via ModelLoader) arrive pre-scaled to
    // fit the default camera framing (often a tiny fraction, since
    // source data is in millimetres); procedural placeholders are
    // typically already scale 1. Animating toward a hardcoded "1" here
    // would blow real-GLB models up to their raw millimetre size --
    // we animate toward THIS model's actual target scale instead.
    const targetScale = group.scale.x || 1;
    group.scale.setScalar(targetScale * 0.01);
    this.modelRoot.add(group);

    this._transition = {
      phase: "in", // outgoing fades out concurrently with incoming scaling in
      t: 0,
      duration: 0.45,
      outgoing,
      incoming: group,
      incomingTargetScale: targetScale,
      incomingSelectable: selectable.length ? selectable : group.userData.selectableParts || [],
    };
  }

  _updateTransition(dt) {
    const tr = this._transition;
    if (!tr) return;
    tr.t = Math.min(1, tr.t + dt / tr.duration);
    const easeOut = 1 - Math.pow(1 - tr.t, 3);

    if (tr.outgoing) {
      const outgoingBase = tr.outgoingBaseScale ?? (tr.outgoingBaseScale = tr.outgoing.scale.x || 1);
      const s = Math.max(outgoingBase * 0.01, outgoingBase * (1 - easeOut));
      tr.outgoing.scale.setScalar(s);
    }
    tr.incoming.scale.setScalar(tr.incomingTargetScale * (0.01 + easeOut * 0.99));

    if (tr.t >= 1) {
      this._completeTransition();
    }
  }

  _completeTransition() {
    const tr = this._transition;
    if (!tr) return;
    if (tr.outgoing) {
      this.modelRoot.remove(tr.outgoing);
      disposeObject(tr.outgoing);
    }
    tr.incoming.scale.setScalar(tr.incomingTargetScale);
    this.currentModel = tr.incoming;
    this.selectable = tr.incomingSelectable;
    this._transition = null;
  }

  clearModel() {
    if (this._transition) {
      // Abort transition and clean up both halves immediately.
      if (this._transition.outgoing) {
        this.modelRoot.remove(this._transition.outgoing);
        disposeObject(this._transition.outgoing);
      }
      this.modelRoot.remove(this._transition.incoming);
      disposeObject(this._transition.incoming);
      this._transition = null;
    }
    if (this.currentModel) {
      this.modelRoot.remove(this.currentModel);
      disposeObject(this.currentModel);
    }
    this.currentModel = null;
    this.selectable = [];
    this._resetDwell();
  }

  setZoom(target) {
    this.targetZoom = Math.max(1.6, Math.min(7, target));
  }

  resetView() {
    this.modelRoot.rotation.set(0, 0, 0);
    this.setZoom(DEFAULT_ZOOM);
    this.autoRotate = true;
    this._lookGoal.set(0, 0, 0);
    this.clearSelection();
  }

  clearSelection() {
    if (this.selected) {
      this._setEmissive(this.selected, 0);
      this.selected.scale.setScalar(1);
    }
    this.selected = null;
    this._lookGoal.set(0, 0, 0);
  }

  /** Suspends pointer/pinch interaction WITHOUT touching model/camera state. */
  setInteractionSuspended(suspended) {
    this.interactionSuspended = suspended;
    if (suspended) {
      this._dragOrigin = null;
      // Stop any dwell countdown and clear the cursor's ring while
      // interaction is paused (tracking lost, or the pause toast).
      this._resetDwell();
    }
  }

  // ---- gesture wiring ---------------------------------------------
  _bindGestures() {
    handTracking.on(GESTURES.POINT, (pos) => {
      if (this.interactionSuspended) return;
      this.autoRotate = false;
      this.pointerNDC.set(pos.x, pos.y);
      this._updateHover();
    });

    handTracking.on(GESTURES.PINCH_START, (pos) => {
      if (this.interactionSuspended) return;
      this.autoRotate = false;
      this._dragOrigin = { x: pos.x, y: pos.y };
      this._dragStartRotation = { x: this.modelRoot.rotation.y, y: this.modelRoot.rotation.x };
    });

    handTracking.on(GESTURES.PINCH_MOVE, (pos) => {
      if (this.interactionSuspended) return;
      if (this._dragOrigin) {
        const dx = pos.x - this._dragOrigin.x;
        const dy = pos.y - this._dragOrigin.y;
        this.modelRoot.rotation.y = this._dragStartRotation.x + dx * 3.2;
        this.modelRoot.rotation.x = THREE.MathUtils.clamp(
          this._dragStartRotation.y - dy * 2.2,
          -0.9,
          0.9
        );
      }
      if (typeof pos.z === "number") {
        this.setZoom(DEFAULT_ZOOM - pos.z * 2.4);
      }
      this.pointerNDC.set(pos.x, pos.y);
    });

    handTracking.on(GESTURES.PINCH_END, () => {
      if (this.interactionSuspended) return;
      if (this._dragOrigin) {
        this._dragOrigin = null;
        this._trySelectAtPointer();
      }
    });

    // NOTE: Open palm intentionally does NOT reset the view, the camera,
    // or the current selection here. Earlier builds reset the explorer
    // on every open-palm frame, which visitors triggered by accident
    // just by relaxing their hand. Open palm is now purely a "pause
    // interaction" signal handled at the app level (main.js) -- it
    // never touches model/camera/selection state in this class.
  }

  _updateHover() {
    if (!this.selectable.length) return;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const hits = this.raycaster.intersectObjects(this.selectable, false);
    const hit = hits[0]?.object || null;

    if (hit !== this.hovered) {
      if (this.hovered && this.hovered !== this.selected) this._setEmissive(this.hovered, 0);
      this.hovered = hit;
      if (this.hovered && this.hovered !== this.selected) this._setEmissive(this.hovered, HOVER_EMISSIVE);
      this.onHover?.(hit?.userData?.partId || null);

      // The dwell countdown restarts when the visitor moves onto a DIFFERENT
      // PART -- not merely a different mesh. Leaving a part also clears the
      // "already fired" guard, so coming back to it re-arms dwell (the same
      // rule the DOM dwell uses).
      const partId = hit?.userData?.partId || null;
      if (partId !== this._dwellPartId) {
        this._dwellPartId = partId;
        this._resetDwell();
      }
    }
  }

  _trySelectAtPointer() {
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const hits = this.raycaster.intersectObjects(this.selectable, false);
    const hit = hits[0]?.object;
    if (hit && hit.userData.partId) {
      this.selectPart(hit);
    }
  }

  /**
   * DWELL-TO-SELECT for the 3D structures -- the second, pinch-independent
   * way to select a part (PINCH_END in _bindGestures is the first). Hold the
   * pointer on the same part for DWELL_MS with no pinch at all and it is
   * selected. Deliberately mirrors VirtualCursor's DOM dwell: same duration
   * (interaction/dwell.js), same visible ring (via onDwellProgress), same
   * "look away before it can fire again" rule.
   *
   * Called every frame from _animate().
   *
   * @param {number} dt seconds since the previous frame
   */
  _updateDwell(dt) {
    const hovering = this.hovered;
    const partId = hovering?.userData?.partId || null;
    const armed =
      Boolean(partId) &&
      partId !== this._dwellFiredFor &&
      !this.interactionSuspended &&
      !this._dragOrigin && // mid pinch-drag is a rotation gesture, not a dwell
      this._isDwellBackend();

    if (!armed) {
      this._dwellElapsed = 0;
      this.onDwellProgress?.(null);
      // Nothing is counting down, so the hovered part drops back to its
      // plain hover glow (the selected part keeps its own pulse).
      if (hovering && hovering !== this.selected) this._setEmissive(hovering, HOVER_EMISSIVE);
      return;
    }

    this._dwellElapsed += dt;
    const progress = Math.min(1, this._dwellElapsed / DWELL_SECONDS);

    // Two feedback channels for the same countdown: the part itself brightens
    // as it fills, and the cursor's ring fills with it.
    if (hovering !== this.selected) {
      this._setEmissive(hovering, HOVER_EMISSIVE + (0.9 - HOVER_EMISSIVE) * progress);
    }
    this.onDwellProgress?.(progress);

    if (progress >= 1) {
      const mesh = hovering;
      this._resetDwell();
      this._dwellFiredFor = partId;
      this.selectPart(mesh);
    }
  }

  /**
   * Forgets any in-progress dwell (pointer moved to a new part, model
   * swapped, interaction suspended, or something was just selected). The
   * visitor must look away and come back before the same part can
   * dwell-select again -- otherwise a pointer left resting on a part would
   * re-trigger it forever.
   */
  _resetDwell() {
    this._dwellElapsed = 0;
    this._dwellFiredFor = null;
    this.onDwellProgress?.(null);
  }

  /**
   * Dwell is offered only while the Leap Motion backend is driving, matching
   * VirtualCursor exactly: with the mouse a native click already selects a
   * part, and a second selection triggered by a merely-resting pointer would
   * fight the visitor while they read the information panel.
   */
  _isDwellBackend() {
    return handTracking.state.backend === "leapmotion";
  }

  selectPart(mesh) {
    if (this.selected && this.selected !== mesh) {
      this._setEmissive(this.selected, 0);
      this.selected.scale.setScalar(1);
    }
    this.selected = mesh;
    this._setEmissive(mesh, 0.9);

    // Gently bias the camera's look-target toward the selected part's
    // local position (blended in _animate, not snapped instantly).
    this._lookGoal.copy(mesh.position);

    // Selecting re-arms the dwell guard, so a pointer left resting on the
    // part that was just picked cannot dwell-select it again a moment later
    // (it must look away and come back first).
    this._resetDwell();
    this._dwellFiredFor = mesh.userData.partId || null;

    this.onSelect?.(mesh.userData.partId, mesh);
  }

  selectPartById(partId) {
    const mesh = this.selectable.find((m) => m.userData.partId === partId);
    if (mesh) this.selectPart(mesh);
  }

  _setEmissive(mesh, intensity) {
    if (!mesh.material || !("emissiveIntensity" in mesh.material)) return;
    mesh.material.emissive?.set?.(PALETTE.highlight);
    mesh.material.emissiveIntensity = intensity;
  }

  // ---- render loop ---------------------------------------------------
  _animate() {
    this._raf = requestAnimationFrame(this._animate);
    const dt = Math.min(0.1, this._clock.getDelta());

    // FPS (rolling ~0.5s window) -- exposed for the debug overlay.
    this._frameCount++;
    this._fpsAccum += dt;
    if (this._fpsAccum >= 0.5) {
      this.fps = Math.round(this._frameCount / this._fpsAccum);
      this._frameCount = 0;
      this._fpsAccum = 0;
    }

    if (this._transition) this._updateTransition(dt);

    // Dwell-to-select for the 3D parts. Frame-driven (rather than a DOM
    // timer) so it stays smooth and frame-rate independent, mirroring the
    // DOM dwell that VirtualCursor runs on its own animation frame.
    this._updateDwell(dt);

    if (this.autoRotate && this.currentModel) {
      this.modelRoot.rotation.y += dt * 0.25;
    }

    this.camera.position.z += (this.targetZoom - this.camera.position.z) * Math.min(1, dt * 4);

    // Gentle camera focus toward the selected structure (subtle -- this
    // is a medical visualizer, not a swooping camera drone shot).
    this.lookTarget.lerp(this._lookGoal, Math.min(1, dt * 2.5));
    this.camera.lookAt(this.lookTarget);

    // Soft pulse on the selected mesh so "what's selected" is always
    // obvious even on a large screen viewed from a few meters away.
    if (this.selected) {
      const pulse = 1 + Math.sin(performance.now() * 0.005) * 0.035;
      this.selected.scale.setScalar(pulse);
    }

    if (this.particles) {
      this.particles.rotation.y += dt * 0.01;
    }

    if (this.currentModel?.userData.onFrame) {
      this.currentModel.userData.onFrame(dt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  _resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener("resize", this._resize);
    this.clearModel();
    this.renderer.dispose();
  }
}

function disposeObject(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => m.dispose());
    }
  });
}
