/**
 * muscleClassifier.js
 * -----------------------------------------------------------------------
 * Classifies the 467 real, individually-named muscle/tendon meshes found
 * in assets/models/muscles.glb (BodyParts3D + Z-Anatomy — see
 * ATTRIBUTION.md) into the 13 broad muscle groups used by the exhibit's
 * InformationPanel (src/data/anatomyData.js "muscles.parts").
 *
 * Classification keyword logic adapted, with permission of its MIT
 * license, from Johan Bellander's "BodyExplorer" project
 * (https://github.com/JohanBellander/BodyExplorer, src/muscleData.js).
 * The exhibit's own educational descriptions in anatomyData.js are
 * written separately for a general public audience (BodyExplorer's
 * original clinical origin/insertion/innervation detail is not used
 * here, by design — this is a public exhibition, not a clinical
 * reference).
 * -----------------------------------------------------------------------
 */

export function classifyMuscleGroup(rawName) {
  const n = (rawName || "").toLowerCase();

  // Head & Neck (incl. facial expression + mastication muscles from Z-Anatomy)
  if (
    /sternocleidomastoid|platysma|digastric|mylohyoid|sternohyoid|omohyoid|thyrohyoid|stylohyoid|splenius|longus colli|rectus capitis|levator palpebrae|arytenoid|vocal|cricothyroid|levator veli|tensor veli|scalenus|geniohyoid|sternothyroid|longus capitis|frontalis|orbicularis|zygomaticus|levator labii|depressor labii|depressor anguli|risorius|mentalis|procerus|nasalis|corrugator|temporalis|masseter|pterygoid|lateral rectus|medial rectus|superior rectus|inferior rectus|superior oblique|inferior oblique/.test(n)
  )
    return "headNeck";

  // Shoulders
  if (/deltoid|supraspinatus|infraspinatus|subscapularis|teres|levator scapulae|subclavius/.test(n))
    return "shoulders";

  // Chest
  if (/pectoralis|serratus anterior/.test(n)) return "chest";

  // Back
  if (
    /trapezius|latissimus|rhomboid|serratus posterior|erector|levatores costarum|iliocostalis|longissimus|spinalis|semispinalis|interspinal|intertransversar|multifidus|rotatores|thoracolumbar fascia|quadratus lumborum/.test(
      n
    )
  )
    return "back";

  // Upper arm
  if (
    /biceps brachii|triceps brachii|coracobrachialis|anconeus/.test(n) ||
    (n.includes("brachialis") && !n.includes("brachioradialis"))
  )
    return "upperArm";

  // Forearm
  if (
    /brachioradialis|pronator|supinator|flexor carpi|extensor carpi|extensor indicis|extensor pollicis|abductor pollicis longus|extensor digiti minimi|flexor pollicis longus|palmaris/.test(n) ||
    (n.includes("flexor digitorum") && !n.includes("foot")) ||
    (n.includes("extensor digitorum") && !n.includes("longus"))
  )
    return "forearm";

  // Hand (intrinsic hand muscles)
  if (
    (n.includes("of") && n.includes("hand")) ||
    (n.includes("interossei") && n.includes("hand")) ||
    (n.includes("lumbricals") && n.includes("hand")) ||
    /opponens pollicis|abductor pollicis brevis|flexor pollicis brevis|adductor pollicis/.test(n)
  )
    return "hand";

  // Abdomen
  if (/external oblique|internal oblique|rectus abdominis|transversus abdominis/.test(n)) return "abdomen";

  // Trunk (intercostals, diaphragm)
  if (/intercostal|diaphragm|transversus thoracis/.test(n)) return "trunk";

  // Hips & Glutes
  if (
    /gluteus|piriformis|obturator|iliacus|psoas|quadratus femoris|tensor fasciae|gemellus|pectineus|coccygeus|iliococcygeus|pubococcygeus|puborectalis|levator ani|anal sphincter/.test(
      n
    )
  )
    return "hip";

  // Upper leg
  if (
    /rectus femoris|vastus|biceps femoris|semitendinosus|semimembranosus|sartorius|gracilis|iliotibial/.test(n) ||
    (n.includes("adductor") && !n.includes("hallucis") && !n.includes("pollicis"))
  )
    return "upperLeg";

  // Lower leg
  if (
    /gastrocnemius|soleus|tibialis|fibularis|peroneus|plantaris|popliteus|flexor digitorum longus|flexor hallucis longus|extensor digitorum longus|extensor hallucis|calcaneal tendon/.test(
      n
    )
  )
    return "lowerLeg";

  // Foot (intrinsic foot muscles)
  if (
    (n.includes("of") && n.includes("foot")) ||
    /abductor hallucis|adductor hallucis|flexor hallucis brevis|flexor digitorum brevis|flexor accessorius|plantar ligament/.test(n)
  )
    return "foot";

  // Connective-tissue edge cases (retinacula, interosseous membranes, misc tendons)
  if (n.includes("retinaculum") && n.includes("wrist")) return "forearm";
  if (n.includes("interosseous membrane") && n.includes("forearm")) return "forearm";
  if (n.includes("interosseous membrane") && n.includes("leg")) return "lowerLeg";
  if (n.includes("intermediate tendon")) return "headNeck"; // digastric intermediate tendon

  return "other";
}
