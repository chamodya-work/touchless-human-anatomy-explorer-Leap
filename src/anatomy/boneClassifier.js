/**
 * boneClassifier.js
 * -----------------------------------------------------------------------
 * Classifies the 202 real, individually-named bone meshes found in
 * assets/models/skeleton.glb (sourced from BodyParts3D — see
 * ATTRIBUTION.md) into the broader selectable categories used by the
 * exhibit's InformationPanel (src/data/anatomyData.js "skeleton.parts").
 *
 * The GLB itself keeps each bone's real anatomical name (e.g. "left
 * femur", "seventh thoracic vertebra", "distal phalanx of right thumb").
 * We do NOT flatten that detail away — visitors still see and rotate the
 * real bone — we simply group many small named bones (e.g. 24 individual
 * ribs, 24 vertebrae) under one educational category so the info panel
 * can show one clear, public-friendly explanation per category rather
 * than 202 near-duplicate entries.
 * -----------------------------------------------------------------------
 */

const RULES = [
  { id: "skull", test: (n) => /frontal bone|parietal bone|temporal bone|occipital bone|sphenoid|ethmoid|zygomatic bone|maxilla|nasal bone|lacrimal bone|palatine bone|^vomer$|mandible/.test(n) },
  { id: "hyoid", test: (n) => n.includes("hyoid") },
  { id: "sternum", test: (n) => n.includes("sternum") || n.includes("manubrium") || n.includes("xiphoid") },
  { id: "ribs", test: (n) => n.includes("rib") },
  { id: "spine", test: (n) => n.includes("vertebra") || n === "atlas" || n === "axis" },
  { id: "pelvis", test: (n) => n.includes("hip bone") },
  { id: "clavicle", test: (n) => n.includes("clavicle") },
  { id: "scapula", test: (n) => n.includes("scapula") },
  { id: "humerus", test: (n) => n.includes("humerus") },
  { id: "radius", test: (n) => n.includes("radius") },
  { id: "ulna", test: (n) => n.includes("ulna") },
  { id: "femur", test: (n) => n.includes("femur") },
  { id: "patella", test: (n) => n.includes("patella") },
  { id: "tibia", test: (n) => n.includes("tibia") },
  { id: "fibula", test: (n) => n.includes("fibula") },
  // Hands: carpals, metacarpals, finger/thumb phalanges
  {
    id: "hands",
    test: (n) =>
      /capitate|hamate|lunate|scaphoid|trapezium|trapezoid|pisiform|metacarpal/.test(n) ||
      (/phalanx/.test(n) && /(finger|thumb)/.test(n)),
  },
  // Feet: tarsals, metatarsals, toe phalanges, sesamoids of foot
  {
    id: "feet",
    test: (n) =>
      /calcaneus|talus|cuboid bone|cuneiform bone|navicular bone|metatarsal|sesamoid bone of (left|right) foot/.test(n) ||
      (/phalanx/.test(n) && /toe/.test(n)),
  },
];

/**
 * @param {string} rawName - the GLB node/mesh name, e.g. "left femur"
 * @returns {string} a partId from anatomyData.js SYSTEMS.skeleton.parts, or "other"
 */
export function classifyBone(rawName) {
  const n = (rawName || "").toLowerCase().trim();
  for (const rule of RULES) {
    if (rule.test(n)) return rule.id;
  }
  return "other";
}

/** Human-friendly title-case fallback label for any unmapped bone name. */
export function titleCaseBoneName(rawName) {
  return (rawName || "")
    .split(" ")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
