/**
 * brainClassifier.js
 * -----------------------------------------------------------------------
 * Classifies the 286 real, individually-named neuroanatomical structures
 * found in assets/models/brain.glb -- the Allen Human Reference Atlas
 * brain (from a real donor, mapped in collaboration with the Allen
 * Institute; part of the HuBMAP Human Reference Atlas, CC BY 4.0 -- see
 * ATTRIBUTION.md) -- into the 7 public-facing categories used by
 * SYSTEMS.brain.parts in anatomyData.js.
 *
 * The source data is genuinely clinical/research-grade (individual
 * thalamic nuclei, hippocampal subfields, ventricles, white matter
 * tracts, etc.) -- far more detail than a public exhibition needs
 * one-by-one. Rather than flatten that away, everything not obviously
 * part of a cortical lobe or the cerebellum/brainstem is grouped into
 * "deepBrain" (thalamus, basal ganglia, limbic system, ventricles),
 * which is itself a real, nameable, pedagogically useful category for
 * a general audience ("the deep structures involved in emotion, memory
 * and movement control") rather than a false "misc" bucket.
 *
 * Coverage verified against all 286 real node names: 0 unmatched
 * (excluding the 3 whole-brain/hemisphere wrapper nodes, which are
 * intentionally not individually selectable).
 * -----------------------------------------------------------------------
 */

const WRAPPER_NAMES = new Set(["allen_brain", "allen_brain_hemisphere_l", "allen_brain_hemisphere_r"]);

function classify(n) {
  if (WRAPPER_NAMES.has(n)) return null;

  if (/cerebell|vermis/.test(n)) return "cerebellum";

  if (
    /midbrain|pons|medulla|pontine|olive|colliculus|red_nucleus|substantia_nigra|tegmentum|pyramidal_part|cerebral_peduncle|crus_cerebri|pretectal/.test(
      n
    )
  )
    return "brainstem";

  if (
    /frontal_pole|frontal_gyrus|frontal_operculum|orbital_gyrus|orbital_sulcus|precentral_gyrus|paracentral_lobule|frontomarginal|gyrus_rectus|subcallosal|paracingulate|rostral_gyrus|frontal_agranular/.test(
      n
    )
  )
    return "frontal";

  if (/postcentral_gyrus|parietal_operculum|angular_gyrus|supramarginal_gyrus|precuneus|supraparietal/.test(n))
    return "parietal";

  if (
    /temporal_gyrus|temporal_pole|planum_|heschl|fusiform|parahippocampal|perirhinal|hippocamp|amygdal|temporal_agranular|ingulo_parahippocampal|gyrus_ambiens/.test(
      n
    )
  )
    return "temporal";

  if (/occipital_gyrus|occipital_pole|cuneus|lingual_gyrus|occipitotemporal/.test(n)) return "occipital";

  // Deep/subcortical structures: thalamus, basal ganglia, limbic system,
  // ventricles, white matter tracts, brainstem-adjacent relay nuclei.
  if (
    /geniculate|tuberal_region|commissure|olfactory|piriform|insula|insular|cingulate|thalamus|thalamic|hypothalamus|caudate|putamen|globus_pallidus|nucleus_accumbens|claustrum|basal_forebrain|septal|habenular|ventricle|corpus_callosum|fornix|mammill|optic_|zona_incerta|white_matter|subthalamic|pineal|central_nuclear|lateral_nucleus|medial_nucleus|midline_nuclear|reuniens|bed_nucleus|basolateral|basomedial|anterior_amygdaloid|posterior_cortical_nucleus|anterior_cortical_nucleus|aqueduct|central_canal/.test(
      n
    )
  )
    return "deepBrain";

  return null;
}

export function classifyBrainRegion(rawName) {
  const n = (rawName || "").toLowerCase().trim();
  return classify(n);
}
