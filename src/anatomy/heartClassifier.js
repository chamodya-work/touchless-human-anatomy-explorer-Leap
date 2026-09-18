/**
 * heartClassifier.js
 * -----------------------------------------------------------------------
 * Classifies the real, individually-named mesh nodes found in
 * assets/models/heart.glb (14 meshes) and heart_vessels.glb (50 meshes)
 * -- sourced from the HuBMAP Human Reference Atlas, Visible Human Male
 * dataset (CC BY 4.0, see ATTRIBUTION.md) -- into the selectable
 * categories used by SYSTEMS.heart.parts in anatomyData.js.
 * -----------------------------------------------------------------------
 */

const RULES = [
  { id: "leftAtrium", test: (n) => n.includes("left_cardiac_atrium") },
  { id: "rightAtrium", test: (n) => n.includes("right_cardiac_atrium") },
  { id: "leftVentricle", test: (n) => n.includes("heart_left_ventricle") },
  { id: "rightVentricle", test: (n) => n.includes("heart_right_ventricle") },
  { id: "septum", test: (n) => n.includes("interventricular_septum") },
  { id: "papillaryMuscle", test: (n) => n.includes("papillary_muscle") },
  { id: "mitralValve", test: (n) => n.includes("mitral_valve") },
  { id: "tricuspidValve", test: (n) => n.includes("tricuspid_valve") },
  { id: "aorticValve", test: (n) => n.includes("aortic_valve") },
  { id: "pulmonaryValve", test: (n) => n.includes("pulmonary_valve") },
  // Vasculature (heart_vessels.glb)
  { id: "coronaryArteries", test: (n) => /coronary_artery|marginal_artery|marginal_branch|descending_artery|descending_branch|cardiac_artery/.test(n) },
  { id: "aorta", test: (n) => n.includes("aorta") || n.includes("brachiocephalic_artery") || n.includes("carotid_artery") || n.includes("subclavian_artery") },
  { id: "pulmonaryVessels", test: (n) => n.includes("pulmonary_artery") || n.includes("pulmonary_trunk") || n.includes("pulmonary_vein") },
  { id: "venaCava", test: (n) => n.includes("vena_cava") || n.includes("brachiocephalic_vein") },
  { id: "cardiacVeins", test: (n) => /cardiac_vein|coronary_sinus/.test(n) },
];

export function classifyHeartPart(rawName) {
  const n = (rawName || "").toLowerCase().trim();
  for (const rule of RULES) {
    if (rule.test(n)) return rule.id;
  }
  return null; // whole-heart wrapper meshes (VH_M_heart, VH_M_cardiac_chamber, VH_M_heart_valve, blood_vasculature root, etc.) -- not individually selectable
}
