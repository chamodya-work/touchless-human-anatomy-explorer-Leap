/**
 * eyeClassifier.js
 * -----------------------------------------------------------------------
 * Maps the mesh names inside eye_globe.glb / eye_orbit.glb (Z-Anatomy,
 * CC BY-SA 4.0 -- see ATTRIBUTION.md) to the public-facing part ids listed
 * in anatomyData.js -> SYSTEMS.eye.parts.
 *
 * Real mesh names (GLTFLoader turns spaces into underscores, which is
 * normalised below):
 *   globe : sclera, cornea, iris, lens, retina, vitreous body,
 *           anterior chamber, zonular fibres
 *   orbit : superior/inferior/medial/lateral rectus,
 *           superior/inferior oblique, levator palpebrae superioris,
 *           common tendinous ring, optic nerve, lacrimal gland,
 *           lacrimal canaliculus, lacrimal sac, nasolacrimal duct
 * -----------------------------------------------------------------------
 */
const EXACT = {
  "sclera": "sclera",
  "cornea": "cornea",
  "iris": "iris",
  "lens": "lens",
  "retina": "retina",
  "vitreous body": "vitreous",
  "anterior chamber": "aqueous",
  "zonular fibres": "zonules",
  "optic nerve": "opticNerve",
  "superior rectus": "superiorRectus",
  "inferior rectus": "inferiorRectus",
  "medial rectus": "medialRectus",
  "lateral rectus": "lateralRectus",
  "superior oblique": "superiorOblique",
  "inferior oblique": "inferiorOblique",
  "levator palpebrae superioris": "levator",
  "common tendinous ring": "tendinousRing",
  "lacrimal gland": "lacrimalGland",
  "lacrimal canaliculus": "tearDrainage",
  "lacrimal sac": "tearDrainage",
  "nasolacrimal duct": "tearDrainage",
};

/** The six muscles that rotate the eyeball, by part id. */
export const EYE_MUSCLE_IDS = [
  "superiorRectus",
  "inferiorRectus",
  "medialRectus",
  "lateralRectus",
  "superiorOblique",
  "inferiorOblique",
];

export function normalizeEyeName(rawName) {
  return (rawName || "").toLowerCase().replace(/[_.]+/g, " ").replace(/\s+/g, " ").trim();
}

/** @returns {string|null} part id, or null for anything not selectable */
export function classifyEyePart(rawName) {
  return EXACT[normalizeEyeName(rawName)] || null;
}

/** "vitreous_body" -> "Vitreous body" (shown as "Real structure: ..."). */
export function prettyEyeName(rawName) {
  const n = normalizeEyeName(rawName);
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : "";
}
