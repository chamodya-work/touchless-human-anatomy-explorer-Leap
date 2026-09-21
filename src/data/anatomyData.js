/**
 * anatomyData.js
 * -----------------------------------------------------------------------
 * Central content model for the Touchless Human Anatomy Explorer.
 * All anatomical text, facts and structure lists live here, completely
 * separated from rendering / UI code, as required by the brief.
 *
 * Every system exposes:
 *   - id, label, icon (emoji fallback, replace with SVG icon if desired)
 *   - summary: short line shown on the main menu
 *   - name / function / structures / fact / simple explanation
 *   - parts: the selectable sub-structures inside that explorer, each with
 *     its own name + function description shown when picked
 *
 * DISCLAIMER: This content is for general public education only and does
 * not constitute medical advice, diagnosis or treatment guidance.
 * -----------------------------------------------------------------------
 */

export const DISCLAIMER =
  "For educational purposes only. This exhibit does not provide medical diagnosis or treatment advice.";

export const SYSTEMS = {
  brain: {
    id: "brain",
    label: "මොළය",
    icon: "🧠",
    summary: "ස්නායු පද්ධතියේ අණදෙන මධ්‍යස්ථානය",
    name: "මොළය",
    function: "සිතීම, චලනය, මතකය සහ සිරුරේ සෑම ක්‍රියාවක්ම පාලනය කරයි.",
    structures: [
      "පෙර මොළ පෙත්ත",
      "පැරියටල් පෙත්ත",
      "ටෙම්පොරල් පෙත්ත",
      "ඔක්සිපිටල් පෙත්ත",
      "කුඩා මොළය",
      "මොළ කඳ",
      "ගැඹුරු මොළ ව්‍යුහ",
    ],
    fact: "මෙම ආකෘතිය සැබෑ මිනිස් මොළයකින් නිර්මාණය කර ඇත — Allen Institute for Brain Science සමඟ සහයෝගයෙන් සිතියම්ගත කර ඇත — තනි තනිව හඳුනාගත් ව්‍යුහ 286ක් සහිතව, තනි තැලමික් න්‍යෂ්ටි දක්වා.",
    simple:
      "මොළය මෙහෙයුම් මධ්‍යස්ථානයක් ලෙස සිතන්න — එය ඔබේ ඉන්ද්‍රියයන්ගෙන් සංඥා ලබාගෙන ඔබේ සිරුරේ අනෙක් කොටස්වලට උපදෙස් යවයි. මෙහි දැකිය හැකි සෑම ව්‍යුහයක්ම සැබෑ පරිත්‍යාගශීලී මිනිස් මොළයකින් ලබාගත් සැබෑ එකකි.",
    // 7 categories that the real brain.glb's 286 individually-named
    // structures are grouped into for public-friendly selection (see
    // src/anatomy/brainClassifier.js).
    parts: [
      { id: "frontal", name: "පෙර මොළ පෙත්ත", function: "තීරණ ගැනීම, පෞරුෂය, සැලසුම් කිරීම සහ ස්වේච්ඡා චලනය පාලනය කරයි." },
      { id: "parietal", name: "පැරියටල් පෙත්ත", function: "ස්පර්ශය, උෂ්ණත්වය, වේදනාව සහ අවකාශ දැනුවත්භාවය සකසයි." },
      { id: "temporal", name: "ටෙම්පොරල් පෙත්ත", function: "ශ්‍රවණය, භාෂාව සහ මතකය ගොඩනැගීම සකසයි." },
      { id: "occipital", name: "ඔක්සිපිටල් පෙත්ත", function: "ඇස්වලින් ලැබෙන දෘශ්‍ය තොරතුරු සකසයි." },
      { id: "cerebellum", name: "කුඩා මොළය", function: "සමතුලිතතාව, ඉරියව්ව සහ සියුම් චලන පාලනය සම්බන්ධීකරණය කරයි." },
      { id: "brainstem", name: "මොළ කඳ", function: "හුස්ම ගැනීම සහ හෘද ස්පන්දන වේගය නියාමනය කරන අතර මොළය සුෂුම්නාවට සම්බන්ධ කරයි." },
      {
        id: "deepBrain",
        name: "ගැඹුරු මොළ ව්‍යුහ",
        function:
          "මොළයේ ගැඹුරින් පිහිටි ව්‍යුහ සමූහයක් — තැලමස්, හයිපොතැලමස් සහ බේසල් ගැංග්ලියා ඇතුළුව — හැඟීම්, මතකය, හෝමෝන සහ චලන පාලනයට සම්බන්ධයි.",
      },
    ],
  },

  heart: {
    id: "heart",
    label: "හෘදය",
    icon: "❤",
    summary: "ඔබේ සිරුර පුරා රුධිරය ගෙන යන පොම්පය",
    name: "හෘදය",
    function: "සිරුර පුරා රුධිරය පොම්ප කරයි.",
    structures: [
      "දකුණු කර්ණිකාව",
      "දකුණු කෝෂිකාව",
      "වම් කර්ණිකාව",
      "වම් කෝෂිකාව",
      "කපාට",
      "මහා ධමනිය සහ ප්‍රධාන රුධිර නාල",
      "කොරොනරි ධමනි",
    ],
    fact: "මෙම ආකෘතිය සැබෑ මිනිස් හෘදයකින් නිර්මාණය කර ඇත, එහි සැබෑ කොරොනරි ධමනි ද ඇතුළත්ව — එනම් හෘද පේශිවලටම රුධිරය සපයන රුධිර නාලයන්ය.",
    simple:
      "හෘදය යනු කුටීර හතරකට බෙදුණු පේශිමය පොම්පයක් වන අතර එය ඔබේ පෙනහළුවලට සහ සිරුරේ අනෙක් කොටස්වලට රුධිරය තල්ලු කරයි. මෙහි දැකිය හැකි සෑම ව්‍යුහයක්ම සැබෑ, තනි තනිව ආකෘතිගත කළ ව්‍යුහ විද්‍යාවකි.",
    // Categories from the real heart.glb (14 meshes) + heart_vessels.glb
    // (50 meshes) -- see src/anatomy/heartClassifier.js.
    parts: [
      { id: "rightAtrium", name: "දකුණු කර්ණිකාව", function: "සිරුරෙන් ආපසු පැමිණෙන ඔක්සිජන් අඩු රුධිරය ලබා ගනී." },
      { id: "rightVentricle", name: "දකුණු කෝෂිකාව", function: "ඔක්සිජන් අඩු රුධිරය පෙනහළුවලට පොම්ප කරයි." },
      { id: "leftAtrium", name: "වම් කර්ණිකාව", function: "පෙනහළුවලින් ආපසු පැමිණෙන ඔක්සිජන් බහුල රුධිරය ලබා ගනී." },
      { id: "leftVentricle", name: "වම් කෝෂිකාව", function: "හෘදයේ වඩාත්ම බලවත් කුටීරය — ඔක්සිජන් බහුල රුධිරය මුළු සිරුරටම පොම්ප කරයි." },
      { id: "septum", name: "කෝෂිකා අතර තිරය", function: "හෘදයේ පහළ කුටීර දෙක වෙන් කරන පේශිමය බිත්තිය." },
      { id: "papillaryMuscle", name: "පැපිලරි පේශි", function: "හෘද කපාට ස්ථානගත කර ඒවා පසුපසට හැරවීම වළක්වන කුඩා පේශි." },
      { id: "mitralValve", name: "මිට්‍රල් කපාටය", function: "වම් කර්ණිකාවේ සිට වම් කෝෂිකාවට රුධිර ප්‍රවාහය පාලනය කරයි." },
      { id: "tricuspidValve", name: "ට්‍රයිකස්පිඩ් කපාටය", function: "දකුණු කර්ණිකාවේ සිට දකුණු කෝෂිකාවට රුධිර ප්‍රවාහය පාලනය කරයි." },
      { id: "aorticValve", name: "මහා ධමනි කපාටය", function: "වම් කෝෂිකාවෙන් මහා ධමනියට යන රුධිරය පාලනය කරයි." },
      { id: "pulmonaryValve", name: "පුප්ඵුසීය කපාටය", function: "දකුණු කෝෂිකාවෙන් පෙනහළු දෙසට යන රුධිරය පාලනය කරයි." },
      { id: "aorta", name: "මහා ධමනිය", function: "සිරුරේ විශාලතම ධමනිය වන අතර ඔක්සිජන් බහුල රුධිරය හෘදයෙන් ඉවතට ගෙන යයි." },
      { id: "pulmonaryVessels", name: "පුප්ඵුසීය රුධිර නාල", function: "ඔක්සිජන් ලබා ගැනීම සඳහා හෘදය සහ පෙනහළු අතර රුධිරය ගෙන යයි." },
      { id: "venaCava", name: "මහා ශිරාව", function: "සිරුරේ විශාලතම ශිරා වන අතර ඔක්සිජන් අඩු රුධිරය හෘදයට ආපසු ගෙන එයි." },
      { id: "coronaryArteries", name: "කොරොනරි ධමනි", function: "හෘද පේශිවලටම ඔක්සිජන් බහුල රුධිරය සපයයි." },
    ],
    // Order used to animate the blood flow particle path
    bloodFlowPath: [
      "veins",
      "rightAtrium",
      "rightVentricle",
      "lungs",
      "leftAtrium",
      "leftVentricle",
      "aorta",
    ],
  },

  lungs: {
    id: "lungs",
    label: "පෙනහළු",
    icon: "🫁",
    summary: "ශ්වසන පද්ධතිය ඔක්සිජන් සහ කාබන් ඩයොක්සයිඩ් හුවමාරු කරයි",
    name: "පෙනහළු සහ ශ්වසන පද්ධතිය",
    function: "වාතය සහ රුධිරය අතර ඔක්සිජන් සහ කාබන් ඩයොක්සයිඩ් හුවමාරු කරයි.",
    structures: ["ශ්වාසනාලය", "ශ්වාස නාලිකා", "දකුණු පෙනහැල්ල", "වම් පෙනහැල්ල", "වක්‍ර පටලය"],
    fact: "මෙම ආකෘතිය සැබෑ මිනිස් ශ්වසන පද්ධතියකින් නිර්මාණය කර ඇත, එහි ශ්වාස නාලිකා ගස එක් එක් පෙනහැල්ල තුළ තෘතීයික (කොටස්) ශ්වාස නාලිකා දක්වාම ආකෘතිගත කර ඇත.",
    simple:
      "වාතය ශ්වාසනාලය හරහා පහළට ගොස් ස්පොන්ජියක් වැනි පෙනහළු දෙකකට ඇතුළු වේ; එහිදී ඔක්සිජන් රුධිරයට ඇතුළු වන අතර කාබන් ඩයොක්සයිඩ් ඉවත් වේ. මෙහි දැකිය හැකි සෑම ව්‍යුහයක්ම (වක්‍ර පටලය හැර) සැබෑ, තනි තනිව ආකෘතිගත කළ ව්‍යුහ විද්‍යාවකි.",
    // Categories from the real lungs.glb (87 meshes) -- see
    // src/anatomy/lungClassifier.js. The diaphragm is a small procedural
    // addition (see README/ATTRIBUTION) since it isn't part of this
    // respiratory-system dataset.
    parts: [
      { id: "trachea", name: "ශ්වාසනාලය", function: "ගෙලෙහි සිට පෙනහළු දෙසට වාතය ගෙන යන ශ්වාස නාලයයි." },
      { id: "bronchi", name: "ශ්වාස නාලිකා", function: "අතු බෙදෙන වාතය ගමන් කරන ගස වන අතර, පෙනහැල්ලේ එක් එක් පෙත්ත තුළ ඇති කුඩා නාල දක්වා විහිදේ." },
      { id: "rightLung", name: "දකුණු පෙනහැල්ල", function: "තරමක් විශාල පෙනහැල්ල වන අතර පෙත්ත තුනකට බෙදා ඇත." },
      { id: "leftLung", name: "වම් පෙනහැල්ල", function: "හෘදයට ඉඩ සැලසීම සඳහා පෙත්ත දෙකකට බෙදා ඇති තරමක් කුඩා පෙනහැල්ල." },
      { id: "diaphragm", name: "වක්‍ර පටලය", function: "පෙනහළු යටින් පිහිටි, හුස්ම ගැනීම මෙහෙයවන ගෝලාකාර පේශිය." },
    ],
  },

  skeleton: {
    id: "skeleton",
    label: "අස්ථි පද්ධතිය",
    icon: "🦴",
    summary: "සිරුරට ආධාරක වන සහ ආරක්ෂා කරන රාමුව",
    name: "අස්ථි පද්ධතිය",
    function: "සිරුරට ආධාරක වන අතර, අවයව ආරක්ෂා කර, චලනයට හැකියාව ලබා දෙයි.",
    structures: [
      "හිස් කබල",
      "කශේරුකා",
      "පර්ශුකා",
      "ශ්‍රෝණිය",
      "අක්ෂකය සහ අංස පත්‍රය",
      "අත් අස්ථි",
      "පාද අස්ථි",
      "අත් සහ පාද",
    ],
    fact: "මෙම ආකෘතියේ සැබෑ, තනි තනිව ආකෘතිගත කළ අස්ථි 202ක් දැක්වේ — වෛද්‍ය සමුද්දේශ ව්‍යුහ විද්‍යාවේ භාවිතා වන ප්‍රධාන නම් කළ අස්ථි ගණනට සමානය.",
    simple:
      "අස්ථි පද්ධතිය යනු අස්ථි, සන්ධි සහ සම්බන්ධක පටකවලින් සැදුම්ලත් ජීවමාන රාමුවක් වන අතර එය ඔබේ සිරුරට හැඩය ලබා දී චලනය කිරීමට ඉඩ සලසයි. මෙහි දැකිය හැකි සෑම අස්ථියක්ම සැබෑ, තනි තනිව නම් කළ ව්‍යුහ විද්‍යාත්මක ව්‍යුහයකි — ඒවායින් ඕනෑම එකකට යොමු කර එය කරන කාර්යය දැනගන්න.",
    // 17 categories that the real skeleton.glb's 202 individually-named
    // bones are grouped into for public-friendly selection (see
    // src/anatomy/boneClassifier.js). Multiple real bones share each id
    // (e.g. all 24 ribs -> "ribs"), but every one is a distinct, real mesh.
    parts: [
      { id: "skull", name: "හිස් කබල", function: "මොළය ආරක්ෂා කර මුහුණට හැඩය ලබා දෙයි. ඒකාබද්ධ වූ තනි අස්ථි 20කට වැඩි ගණනකින් සමන්විතය." },
      { id: "hyoid", name: "හයිඑයිඩ් අස්ථිය", function: "ගෙලෙහි පිහිටි කුඩා, නිදහසේ පාවෙන අස්ථියක් වන අතර ගිලීමට සහ කථනයට භාවිතා වන පේශි ස්ථානගත කරයි." },
      { id: "sternum", name: "උරස් අස්ථිය", function: "පර්ශුකා සම්බන්ධ වන පැතලි මධ්‍යම අස්ථිය වන අතර හෘදය ආරක්ෂා කරයි." },
      { id: "ribs", name: "පර්ශුකා", function: "හෘදය සහ පෙනහළු වටා ආරක්ෂිත කූඩුවක් සාදන යුගල දොළහකි." },
      { id: "spine", name: "කශේරුකා", function: "සුෂුම්නාව ආරක්ෂා කර ඉරියව්වට ආධාරක වන තනි කශේරුකා 24ක ගොඩගැස්මකි." },
      { id: "pelvis", name: "ශ්‍රෝණිය", function: "සිරුරේ බර දරන අතර උදර සහ ප්‍රජනන අවයව ආරක්ෂා කරයි." },
      { id: "clavicle", name: "අක්ෂකය", function: "අක්ෂක අස්ථිය — අත ශරීරයේ මධ්‍ය කඳට සම්බන්ධ කරයි." },
      { id: "scapula", name: "අංස පත්‍රය", function: "උරහිස් අස්ථිය — අතේ පේශි ස්ථානගත කරයි." },
      { id: "humerus", name: "බාහු අස්ථිය", function: "උරහිසේ සිට වැලමිට දක්වා වන ඉහළ බාහුවේ අස්ථිය." },
      { id: "radius", name: "රේඩියස් අස්ථිය", function: "මැණික්කටුව පැත්තේ පිහිටි යටි බාහුවේ අස්ථි දෙකෙන් එකකි." },
      { id: "ulna", name: "අල්නා අස්ථිය", function: "වැලමිටේ තුඩ සාදන අනෙක් යටි බාහු අස්ථිය." },
      { id: "femur", name: "තොලැටිය", function: "කලවයේ අස්ථිය — සිරුරේ දිගම සහ ශක්තිමත්ම අස්ථිය." },
      { id: "patella", name: "දණහිස් තැටිය", function: "දණහිසේ ඉදිරිපස ටෙන්ඩනය තුළ ඇතුළත් වූ කුඩා අස්ථියක් වන අතර සන්ධිය ආරක්ෂා කරයි." },
      { id: "tibia", name: "ටිබියා අස්ථිය", function: "කෙණ්ඩයේ අස්ථිය — පාදයේ බරෙන් වැඩි කොටසක් දරයි." },
      { id: "fibula", name: "ෆිබියුලා අස්ථිය", function: "සිහින් පහළ කෙණ්ඩා අස්ථිය වන අතර වළලුකර ස්ථාවරත්වයට උපකාරී වේ." },
      { id: "hands", name: "අත් අස්ථි", function: "එක් අතකට කුඩා අස්ථි 27ක් — කාපල්, මෙටාකාපල් සහ ඇඟිලි ෆැලැන්ජ් — අතට සියුම් නිපුණත්වය ලබා දෙයි." },
      { id: "feet", name: "පාද අස්ථි", function: "එක් පාදයකට කුඩා අස්ථි 26ක් — ටාර්සල්, මෙටාටාර්සල් සහ පාදැඟිලි ෆැලැන්ජ් — බර දරා සමතුලිතතාව රැක දෙයි." },
    ],
  },

  muscles: {
    id: "muscles",
    label: "MUSCLES",
    icon: "💪",
    summary: "The tissue that powers every movement",
    name: "Muscular System",
    function: "Produces movement, maintains posture and generates body heat.",
    structures: [
      "Head & Neck",
      "Shoulders",
      "Chest & Back",
      "Arms",
      "Abdomen & Trunk",
      "Hips & Legs",
    ],
    fact: "This model shows 467 real, individually modeled muscles and tendons — more than 600 exist in the full body, making up roughly 40% of body weight.",
    simple:
      "Muscles work in pairs — one contracts while the other relaxes — to move your bones and joints. Every muscle visible here is a real, individually named anatomical structure.",
    // 13 broad groups that the real muscles.glb's 467 individually-named
    // muscles/tendons are classified into (see
    // src/anatomy/muscleClassifier.js), matching the public "keep it
    // simple" tone rather than clinical origin/insertion detail.
    parts: [
      { id: "headNeck", name: "Head & Neck Muscles", function: "Control facial expression, chewing, swallowing and turning the head." },
      { id: "shoulders", name: "Shoulder Muscles", function: "Rotate and stabilize the shoulder joint, one of the body's most mobile joints." },
      { id: "chest", name: "Chest Muscles", function: "Move the arm across the body and assist breathing." },
      { id: "back", name: "Back Muscles", function: "Support the spine and control posture and pulling movements." },
      { id: "upperArm", name: "Upper Arm Muscles", function: "Bend and straighten the elbow (biceps and triceps)." },
      { id: "forearm", name: "Forearm Muscles", function: "Control wrist movement and grip strength." },
      { id: "hand", name: "Hand Muscles", function: "Small intrinsic muscles giving the fingers fine, precise control." },
      { id: "abdomen", name: "Abdominal Muscles", function: "Support the core, protect internal organs and assist twisting." },
      { id: "trunk", name: "Trunk Muscles", function: "Includes the diaphragm and intercostals — the main muscles that drive breathing." },
      { id: "hip", name: "Hip & Glute Muscles", function: "Power hip movement and stabilize the pelvis while walking and running." },
      { id: "upperLeg", name: "Upper Leg Muscles", function: "Straighten and bend the knee (quadriceps and hamstrings)." },
      { id: "lowerLeg", name: "Lower Leg Muscles", function: "Point and flex the foot; power walking, running and jumping (calf muscles)." },
      { id: "foot", name: "Foot Muscles", function: "Small intrinsic muscles supporting balance and the arch of the foot." },
    ],
  },

  digestive: {
    id: "digestive",
    label: "DIGESTIVE SYSTEM",
    icon: "🍽",
    summary: "Breaks down food into energy and nutrients",
    name: "Digestive System",
    function: "Breaks down food and absorbs nutrients for the body to use.",
    structures: ["Stomach", "Duodenum", "Small intestine", "Large intestine", "Liver", "Gallbladder", "Pancreas", "Bile ducts"],
    fact: "This model combines six separately-modeled real organs — liver, pancreas, gallbladder, small intestine, large intestine and the bile duct network — all correctly positioned relative to each other, right down to real anatomical landmarks like the liver's impressions from neighboring organs.",
    simple:
      "Food travels through a long tube that breaks it into nutrients your blood can carry to every cell, with the liver, gallbladder and pancreas adding digestive juices along the way.",
    // Categories from SIX real, separately-sourced GLB files loaded
    // together -- see src/anatomy/digestiveClassifier.js. The stomach is
    // a small procedural addition (this dataset doesn't include a
    // stomach or esophagus model) -- see README/ATTRIBUTION.
    parts: [
      { id: "stomach", name: "Stomach", function: "Uses acid and muscle to break food down further." },
      { id: "duodenum", name: "Duodenum", function: "The first, short section of the small intestine, where bile and pancreatic juice join the food." },
      { id: "smallIntestine", name: "Small Intestine", function: "The jejunum and ileum — absorb most nutrients into the bloodstream." },
      { id: "largeIntestine", name: "Large Intestine", function: "Absorbs water and forms solid waste, including the appendix and rectum." },
      { id: "liver", name: "Liver", function: "Filters blood and produces bile to digest fat." },
      { id: "gallbladder", name: "Gallbladder", function: "Stores and concentrates bile produced by the liver." },
      { id: "pancreas", name: "Pancreas", function: "Produces enzymes and insulin to regulate digestion and blood sugar." },
      { id: "bileDucts", name: "Bile Duct Network", function: "Carries bile from the liver and gallbladder, and digestive enzymes from the pancreas, into the duodenum." },
    ],
  },

  nervous: {
    id: "nervous",
    label: "NERVOUS SYSTEM",
    icon: "⚡",
    summary: "The body's electrical communication network",
    name: "Nervous System",
    function: "Carries electrical signals between the brain, spinal cord and body.",
    structures: ["Brain", "Cervical spinal cord", "Thoracic spinal cord", "Lumbar spinal cord", "Sacral spinal cord"],
    fact: "This model combines the same real Allen Institute–mapped brain used in the Brain explorer with a real, individually-segmented human spinal cord — all 31 segments, from the neck down to the tailbone.",
    simple:
      "Neurons pass tiny electrical signals to each other, letting your brain sense the world and control your muscles almost instantly. The brain and spinal cord together form the body's central command line.",
    // Brain (reused from brain.glb) + real spinal_cord.glb (30 segments,
    // grouped into 4 spinal regions) -- see
    // src/anatomy/spinalCordClassifier.js. Peripheral nerves are not
    // part of this dataset -- see README/ATTRIBUTION.
    parts: [
      { id: "brainCore", name: "Brain", function: "Processes and originates most nerve signals." },
      { id: "cervicalSpine", name: "Cervical Spinal Cord", function: "The topmost section, in the neck — carries signals to and from the arms and head." },
      { id: "thoracicSpine", name: "Thoracic Spinal Cord", function: "The mid-back section — carries signals to and from the chest and abdomen." },
      { id: "lumbarSpine", name: "Lumbar Spinal Cord", function: "The lower-back section — carries signals to and from the legs." },
      { id: "sacralSpine", name: "Sacral Spinal Cord", function: "The lowest section — controls the bladder, bowel and parts of the legs." },
    ],
  },
};

export const SYSTEM_ORDER = [
  "brain",
  "heart",
  "lungs",
  "skeleton",
  "muscles",
  "digestive",
  "nervous",
];

export function getSystem(id) {
  return SYSTEMS[id] || null;
}
