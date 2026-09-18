/**
 * spinalCordClassifier.js
 * -----------------------------------------------------------------------
 * Classifies the 30 real, individually-named spinal cord segments found
 * in assets/models/spinal_cord.glb (HuBMAP Human Reference Atlas,
 * CC BY 4.0 -- see ATTRIBUTION.md) into the 4 spinal regions used by
 * SYSTEMS.nervous.parts in anatomyData.js.
 * -----------------------------------------------------------------------
 */

function classify(n) {
  if (n === "vh_m_spinal_cord") return null; // whole-cord wrapper
  if (n.includes("cervical")) return "cervicalSpine";
  if (n.includes("thoracic")) return "thoracicSpine";
  if (n.includes("lumbar")) return "lumbarSpine";
  if (n.includes("sacral")) return "sacralSpine";
  return null;
}

export function classifySpinalSegment(rawName) {
  const n = (rawName || "").toLowerCase().trim();
  return classify(n);
}
