/**
 * digestiveClassifier.js
 * -----------------------------------------------------------------------
 * Classifies real mesh nodes from SIX separate HuBMAP Human Reference
 * Atlas GLB files (CC BY 4.0 -- see ATTRIBUTION.md), loaded together via
 * ModelLoader.loadCombinedAnatomyModel() and merged into one Digestive
 * System scene:
 *
 *   liver.glb (33 meshes), pancreas.glb (6), gallbladder.glb (1),
 *   small_intestine.glb (12), large_intestine.glb (11), biliary_tree.glb (12)
 *
 * into the 7 selectable categories used by SYSTEMS.digestive.parts in
 * anatomyData.js. Because each source file already represents one organ,
 * classification mostly just needs to know WHICH FILE a mesh came from
 * (sourceTag, set by loadCombinedAnatomyModel) plus a little extra
 * name-based splitting for the intestines (small vs large is obvious
 * from the file, but duodenum is split out from the rest of the small
 * intestine since it's a distinct, commonly-taught structure).
 *
 * NOTE: this dataset does not include a stomach or esophagus model (the
 * HuBMAP HRA had not modeled those organs as of this build) -- a small
 * clearly-labeled procedural stomach is added alongside the real organs
 * in DigestiveExplorer.js so visitors still see a complete digestive
 * tract. See ATTRIBUTION.md and README for full detail.
 * -----------------------------------------------------------------------
 */

export function classifyDigestivePart(rawName, sourceTag) {
  const n = (rawName || "").toLowerCase().trim();

  if (sourceTag === "gallbladder") return "gallbladder";

  if (sourceTag === "pancreas") {
    if (n === "vh_m_pancreas") return null; // whole-organ wrapper
    return "pancreas";
  }

  if (sourceTag === "liver") {
    if (n === "vh_m_liver") return null; // whole-organ wrapper
    return "liver";
  }

  if (sourceTag === "smallIntestine") {
    if (n === "vh_m_small_intestine") return null;
    if (n.includes("duodenum") || n.includes("duodenal")) return "duodenum";
    return "smallIntestine"; // jejunum, ileum
  }

  if (sourceTag === "largeIntestine") {
    if (n === "vh_m_colon") return null;
    return "largeIntestine"; // ascending/transverse/descending/sigmoid colon, cecum, rectum, appendix
  }

  if (sourceTag === "biliaryTree") {
    if (n === "vh_m_biliary_tree") return null;
    return "bileDucts";
  }

  return null;
}
