/**
 * lungClassifier.js
 * -----------------------------------------------------------------------
 * Classifies the 87 real, individually-named mesh nodes found in
 * assets/models/lungs.glb (lungs, lobes, bronchopulmonary segments,
 * bronchial tree down to tertiary bronchi, laryngeal/tracheal cartilage)
 * -- sourced from the HuBMAP Human Reference Atlas (CC BY 4.0, see
 * ATTRIBUTION.md) -- into the selectable categories used by
 * SYSTEMS.lungs.parts in anatomyData.js.
 *
 * Order matters: lung-tissue checks run BEFORE airway checks, since a
 * name like "lungs_L_upper_lobe" must win over any looser "bronch"-ish
 * match, and airway names like "left_main_bronchus" must not be
 * mistaken for lung tissue.
 * -----------------------------------------------------------------------
 */

/**
 * Order matters: trachea/cartilage checks run first, then lung tissue
 * (lobes/hilum), then general bronchial-tree matches -- since a name
 * like "lungs_L_upper_lobe" must win over any looser "bronch"-ish match,
 * and airway names like "left_main_bronchus" must not be mistaken for
 * lung tissue.
 */
function classify(n) {
  if (/trachea|cricoid|thyroid_cartilage|epiglottic|arytenoid|corniculate|carina/.test(n)) return "trachea";
  if (/^vh_m_lungs$|^vh_m_respiratory_system$/.test(n)) return null; // whole-system wrapper
  if (n.includes("lungs_l") || (n.includes("hilum") && n.endsWith("_l"))) return "leftLung";
  if (n.includes("lungs_r") || (n.includes("hilum") && n.endsWith("_r"))) return "rightLung";
  if (n.includes("bronch") || n === "vh_m_right_posterior_basal") return "bronchi";
  return null;
}

export function classifyLungPart(rawName) {
  const n = (rawName || "").toLowerCase().trim();
  return classify(n);
}
