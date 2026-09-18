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
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";
import { handTracking, GESTURES } from "../interaction/HandTrackingController.js";
import { PALETTE } from "../anatomy/materials.js";

const DEFAULT_ZOOM = 4.2;

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
      if (this.hovered && this.hovered !== this.selected) this._setEmissive(this.hovered, 0.45);
      this.onHover?.(hit?.userData?.partId || null);
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
