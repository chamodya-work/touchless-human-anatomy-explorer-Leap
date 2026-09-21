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
    label: "පේශි පද්ධතිය",
    icon: "💪",
    summary: "සෑම චලනයකටම බලය සපයන පටකය",
    name: "පේශි පද්ධතිය",
    function: "චලනය ඇති කරයි, ඉරියව්ව පවත්වා ගනී සහ සිරුරේ තාපය ජනනය කරයි.",
    structures: [
      "හිස සහ බෙල්ල",
      "උරහිස්",
      "පපුව සහ පිට",
      "අත්",
      "උදරය සහ මධ්‍ය කඳ",
      "උකුල් සහ කකුල්",
    ],
    fact: "මෙම ආකෘතියේ සැබෑ, තනි තනිව ආකෘතිගත කළ පේශි සහ ටෙන්ඩන 467ක් දැක්වේ — සම්පූර්ණ සිරුරේ 600කට වැඩි ප්‍රමාණයක් පවතින අතර, එය සිරුරේ බරෙන් ආසන්න වශයෙන් 40%ක් වේ.",
    simple:
      "පේශි යුගල වශයෙන් ක්‍රියා කරයි — එකක් හැකිලෙන අතර අනෙකක් ලිහිල් වේ — එමගින් ඔබේ අස්ථි සහ සන්ධි චලනය කරයි. මෙහි දැකිය හැකි සෑම පේශියක්ම සැබෑ, තනි තනිව නම් කළ ව්‍යුහ විද්‍යාත්මක ව්‍යුහයකි.",
    // 13 broad groups that the real muscles.glb's 467 individually-named
    // muscles/tendons are classified into (see
    // src/anatomy/muscleClassifier.js), matching the public "keep it
    // simple" tone rather than clinical origin/insertion detail.
    parts: [
      { id: "headNeck", name: "හිස සහ බෙල්ලේ පේශි", function: "මුහුණේ ඉරියව්, හපන, ගිලීම සහ හිස හැරවීම පාලනය කරයි." },
      { id: "shoulders", name: "උරහිස් පේශි", function: "ශරීරයේ වඩාත්ම චලනය වන සන්ධිවලින් එකක් වන උරහිස් සන්ධිය කරකවා ස්ථාවර කරයි." },
      { id: "chest", name: "පපු පේශි", function: "අත සිරුර හරහා ගෙන ගොස් හුස්ම ගැනීමට උපකාරී වේ." },
      { id: "back", name: "පිටු පේශි", function: "කශේරුකාවට ආධාරක වන අතර ඉරියව්ව සහ ඇදලන චලන පාලනය කරයි." },
      { id: "upperArm", name: "ඉහළ බාහු පේශි", function: "වැලමිට නමන සහ දිගු කරයි (බයිසෙප්ස් සහ ට්‍රයිසෙප්ස්)." },
      { id: "forearm", name: "යටි බාහු පේශි", function: "මණිකයේ චලනය සහ ග්‍රහණ ශක්තිය පාලනය කරයි." },
      { id: "hand", name: "අත් පේශි", function: "ඇඟිලිවලට සියුම්, නිවැරදි පාලනයක් ලබා දෙන කුඩා අභ්‍යන්තර පේශි." },
      { id: "abdomen", name: "උදර පේශි", function: "මධ්‍ය කඳට ආධාරක වන අතර අභ්‍යන්තර අවයව ආරක්ෂා කර කරකැවීමට උපකාරී වේ." },
      { id: "trunk", name: "මධ්‍ය කඳ පේශි", function: "වක්‍ර පටලය සහ පර්ශුකා අතර පේශි ඇතුළත් වන අතර — හුස්ම ගැනීම මෙහෙයවන ප්‍රධාන පේශි මේවාය." },
      { id: "hip", name: "උකුල් සහ ග්ලූටියල් පේශි", function: "උකුල් චලනයට බලය සපයන අතර ඇවිදින සහ දුවන විට ශ්‍රෝණිය ස්ථාවර කරයි." },
      { id: "upperLeg", name: "ඉහළ කකුල් පේශි", function: "දණහිස දිගු කර නමයි (ක්වාඩ්‍රිසෙප්ස් සහ හැම්ස්ට්‍රිංග්ස්)." },
      { id: "lowerLeg", name: "පහළ කකුල් පේශි", function: "පාදය යොමු කර නමයි; ඇවිදීම, දිවීම සහ පැනීමට බලය සපයයි (වැසිකිලි පේශි)." },
      { id: "foot", name: "පාද පේශි", function: "සමතුලිතතාව සහ පාදයේ වක්‍රයට ආධාරක වන කුඩා අභ්‍යන්තර පේශි." },
    ],
  },

  digestive: {
    id: "digestive",
    label: "ජීර්ණ පද්ධතිය",
    icon: "🍽",
    summary: "ආහාර ශක්තිය සහ පෝෂක බවට බිඳ දමයි",
    name: "ජීර්ණ පද්ධතිය",
    function: "ආහාර බිඳ දමා සිරුරට භාවිතා කළ හැකි පෝෂක අවශෝෂණය කරයි.",
    structures: ["ආමාශය", "ග්‍රහණිය", "කුඩා බඩවැල", "මහා බඩවැල", "අක්මාව", "පිතාශය", "අග්නාශය", "පිත නාල"],
    fact: "මෙම ආකෘතිය වෙන වෙනම ආකෘතිගත කළ සැබෑ අවයව හයක් ඒකාබද්ධ කරයි — අක්මාව, අග්නාශය, පිතාශය, කුඩා බඩවැල, මහා බඩවැල සහ පිත නාල ජාලය — සියල්ල එකිනෙකට සාපේක්ෂව නිවැරදිව ස්ථානගත කර ඇති අතර, අසල්වැසි අවයවවලින් අක්මාවේ ඇති වන සලකුණු වැනි සැබෑ ව්‍යුහ විද්‍යාත්මක සලකුණු දක්වාම.",
    simple:
      "ආහාර ඔබේ රුධිරයට සෑම සෛලයකටම ගෙන යා හැකි පෝෂක බවට බිඳ දමන දිගු නාලයක් හරහා ගමන් කරයි; එම අතරතුර අක්මාව, පිතාශය සහ අග්නාශය ජීර්ණ යුෂ එකතු කරයි.",
    // Categories from SIX real, separately-sourced GLB files loaded
    // together -- see src/anatomy/digestiveClassifier.js. The stomach is
    // a small procedural addition (this dataset doesn't include a
    // stomach or esophagus model) -- see README/ATTRIBUTION.
    parts: [
      { id: "stomach", name: "ආමාශය", function: "ආහාර තවදුරටත් බිඳ දැමීමට අම්ලය සහ පේශි භාවිතා කරයි." },
      { id: "duodenum", name: "ග්‍රහණිය", function: "කුඩා බඩවැලේ පළමු, කෙටි කොටස වන අතර, පිත සහ අග්නාශ යුෂ ආහාර සමඟ එකතු වන ස්ථානයයි." },
      { id: "smallIntestine", name: "කුඩා බඩවැල", function: "ජෙජුනම් සහ ඉලියම් — බොහෝ පෝෂක රුධිර ප්‍රවාහයට අවශෝෂණය කරයි." },
      { id: "largeIntestine", name: "මහා බඩවැල", function: "ජලය අවශෝෂණය කර ඝන අපද්‍රව්‍ය සාදයි, උපාංගය සහ ගුද මාර්ගය ඇතුළුව." },
      { id: "liver", name: "අක්මාව", function: "රුධිරය පෙරා මේදය ජීර්ණය කිරීමට පිත නිපදවයි." },
      { id: "gallbladder", name: "පිතාශය", function: "අක්මාවෙන් නිපදවන පිත ගබඩා කර සාන්ද්‍රණය කරයි." },
      { id: "pancreas", name: "අග්නාශය", function: "ජීර්ණය සහ රුධිර සීනි නියාමනය කිරීමට එන්සයිම සහ ඉන්සුලින් නිපදවයි." },
      { id: "bileDucts", name: "පිත නාල ජාලය", function: "අක්මාවෙන් සහ පිතාශයෙන් පිත ද, අග්නාශයෙන් ජීර්ණ එන්සයිම ද ග්‍රහණියට ගෙන යයි." },
    ],
  },

  nervous: {
    id: "nervous",
    label: "ස්නායු පද්ධතිය",
    icon: "⚡",
    summary: "සිරුරේ විද්‍යුත් සන්නිවේදන ජාලය",
    name: "ස්නායු පද්ධතිය",
    function: "මොළය, සුෂුම්නාව සහ සිරුර අතර විද්‍යුත් සංඥා ගෙන යයි.",
    structures: ["මොළය", "ග්‍රීවා සුෂුම්නාව", "වක්ෂස්ථ සුෂුම්නාව", "කටි සුෂුම්නාව", "ත්‍රික සුෂුම්නාව"],
    fact: "මෙම ආකෘතිය මොළ ගවේෂකයේ භාවිතා වන එම සැබෑ Allen Institute සිතියම්ගත මොළයම, සැබෑ, තනි තනිව කොටස් කළ මිනිස් සුෂුම්නාවක් සමඟ ඒකාබද්ධ කරයි — බෙල්ලේ සිට අලාභුව දක්වා කොටස් 31ම.",
    simple:
      "න්‍යුරෝන එකිනෙකට කුඩා විද්‍යුත් සංඥා යවන අතර, එමගින් ඔබේ මොළයට ලෝකය දැනගෙන ඔබේ පේශි ක්ෂණිකව පාලනය කිරීමට හැකියාව ලැබේ. මොළය සහ සුෂුම්නාව එක්ව සිරුරේ මධ්‍යම අණදෙන මාර්ගය සාදයි.",
    // Brain (reused from brain.glb) + real spinal_cord.glb (30 segments,
    // grouped into 4 spinal regions) -- see
    // src/anatomy/spinalCordClassifier.js. Peripheral nerves are not
    // part of this dataset -- see README/ATTRIBUTION.
    parts: [
      { id: "brainCore", name: "මොළය", function: "බොහෝ ස්නායු සංඥා සකස් කර ආරම්භ කරයි." },
      { id: "cervicalSpine", name: "ග්‍රීවා සුෂුම්නාව", function: "ඉහළම කොටස වන අතර බෙල්ලේ පිහිටයි — අත් සහ හිස වෙතට සහ එතැනින් සංඥා ගෙන යයි." },
      { id: "thoracicSpine", name: "වක්ෂස්ථ සුෂුම්නාව", function: "මධ්‍ය පිටු කොටස — පපුව සහ උදරය වෙතට සහ එතැනින් සංඥා ගෙන යයි." },
      { id: "lumbarSpine", name: "කටි සුෂුම්නාව", function: "පහළ පිටු කොටස — කකුල් වෙතට සහ එතැනින් සංඥා ගෙන යයි." },
      { id: "sacralSpine", name: "ත්‍රික සුෂුම්නාව", function: "පහළම කොටස — මුත්‍රාශය, බඩවැල සහ කකුල්වල කොටස් පාලනය කරයි." },
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
