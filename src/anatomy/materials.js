/**
 * materials.js
 * -----------------------------------------------------------------------
 * Shared material/color palette for all placeholder anatomy models, so
 * every explorer looks like part of the same futuristic medical system.
 * Swap these for texture-mapped PBR materials once real GLB models are
 * imported (see README "Replacing placeholder models").
 * -----------------------------------------------------------------------
 */
import * as THREE from "../../lib/three/three.module.min.js";

export const PALETTE = {
  cyan: 0x4fd8e8,
  cyanBright: 0x7cf3ff,
  magenta: 0xff5da2,
  amber: 0xffb545,
  bone: 0xe8e2d0,
  tissuePink: 0xff8fa3,
  tissueDeepPink: 0xe8517c,
  lungPink: 0xff97a8,
  brainTissue: 0xd88fae,
  highlight: 0x7cf3ff,
  vein: 0x4f6fe8,
  artery: 0xe84f4f,
};

export function baseMaterial(color, opts = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.1,
    roughness: 0.45,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    transparent: !!opts.opacity,
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    ...opts,
  });
}

export function highlightMaterial(baseColor) {
  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    metalness: 0.2,
    roughness: 0.2,
    clearcoat: 0.6,
    emissive: PALETTE.highlight,
    emissiveIntensity: 0.85,
  });
}

export function wireGhostMaterial(color = PALETTE.cyan) {
  return new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
}
