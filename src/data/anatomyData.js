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
    label: "HEART",
    icon: "❤",
    summary: "The pump that moves blood through your body",
    name: "Heart",
    function: "Pumps blood throughout the body.",
    structures: [
      "Right atrium",
      "Right ventricle",
      "Left atrium",
      "Left ventricle",
      "Valves",
      "Aorta & major vessels",
      "Coronary arteries",
    ],
    fact: "This model is built from a real human heart, including its own real coronary arteries — the vessels that supply the heart muscle itself with blood.",
    simple:
      "The heart is a muscular pump split into four chambers that push blood to your lungs and the rest of your body. Every structure visible here is real, individually modeled anatomy.",
    // Categories from the real heart.glb (14 meshes) + heart_vessels.glb
    // (50 meshes) -- see src/anatomy/heartClassifier.js.
    parts: [
      { id: "rightAtrium", name: "Right Atrium", function: "Receives oxygen-poor blood returning from the body." },
      { id: "rightVentricle", name: "Right Ventricle", function: "Pumps oxygen-poor blood to the lungs." },
      { id: "leftAtrium", name: "Left Atrium", function: "Receives oxygen-rich blood returning from the lungs." },
      { id: "leftVentricle", name: "Left Ventricle", function: "The heart's strongest chamber — pumps oxygen-rich blood to the whole body." },
      { id: "septum", name: "Interventricular Septum", function: "The muscular wall separating the heart's two lower chambers." },
      { id: "papillaryMuscle", name: "Papillary Muscles", function: "Small muscles that anchor the heart valves and stop them flipping open backward." },
      { id: "mitralValve", name: "Mitral Valve", function: "Controls blood flow from the left atrium into the left ventricle." },
      { id: "tricuspidValve", name: "Tricuspid Valve", function: "Controls blood flow from the right atrium into the right ventricle." },
      { id: "aorticValve", name: "Aortic Valve", function: "Controls blood leaving the left ventricle into the aorta." },
      { id: "pulmonaryValve", name: "Pulmonary Valve", function: "Controls blood leaving the right ventricle toward the lungs." },
      { id: "aorta", name: "Aorta", function: "The body's largest artery, carrying oxygen-rich blood away from the heart." },
      { id: "pulmonaryVessels", name: "Pulmonary Vessels", function: "Carry blood between the heart and lungs to pick up oxygen." },
      { id: "venaCava", name: "Vena Cava", function: "The body's largest veins, returning oxygen-poor blood to the heart." },
      { id: "coronaryArteries", name: "Coronary Arteries", function: "Supply the heart muscle itself with oxygen-rich blood." },
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
    label: "LUNGS",
    icon: "🫁",
    summary: "The respiratory system exchanges oxygen and carbon dioxide",
    name: "Lungs & Respiratory System",
    function: "Exchanges oxygen and carbon dioxide between air and blood.",
    structures: ["Trachea", "Bronchi", "Right lung", "Left lung", "Diaphragm"],
    fact: "This model is built from a real human respiratory system, with the bronchial tree modeled all the way down to the tertiary (segmental) bronchi inside each lung.",
    simple:
      "Air travels down the windpipe into two spongy lungs, where oxygen passes into the blood and carbon dioxide passes out. Every structure visible here (aside from the diaphragm) is real, individually modeled anatomy.",
    // Categories from the real lungs.glb (87 meshes) -- see
    // src/anatomy/lungClassifier.js. The diaphragm is a small procedural
    // addition (see README/ATTRIBUTION) since it isn't part of this
    // respiratory-system dataset.
    parts: [
      { id: "trachea", name: "Trachea", function: "The windpipe — carries air from the throat toward the lungs." },
      { id: "bronchi", name: "Bronchi", function: "The branching airway tree, down to small tubes inside each lobe of the lungs." },
      { id: "rightLung", name: "Right Lung", function: "Slightly larger lung, divided into three lobes." },
      { id: "leftLung", name: "Left Lung", function: "Slightly smaller lung, divided into two lobes to make room for the heart." },
      { id: "diaphragm", name: "Diaphragm", function: "The dome-shaped muscle beneath the lungs that drives breathing." },
    ],
  },

  skeleton: {
    id: "skeleton",
    label: "SKELETON",
    icon: "🦴",
    summary: "The framework that supports and protects the body",
    name: "Skeletal System",
    function: "Supports the body, protects organs, and enables movement.",
    structures: [
      "Skull",
      "Spine",
      "Ribs",
      "Pelvis",
      "Clavicle & Scapula",
      "Arm bones",
      "Leg bones",
      "Hands & Feet",
    ],
    fact: "This model shows 202 real, individually modeled bones — the same number of major named bones used in medical reference anatomy.",
    simple:
      "The skeleton is a living framework of bones, joints and connective tissue that gives your body shape and lets you move. Every bone visible here is a real, individually named anatomical structure — point at any one of them to learn what it does.",
    // 17 categories that the real skeleton.glb's 202 individually-named
    // bones are grouped into for public-friendly selection (see
    // src/anatomy/boneClassifier.js). Multiple real bones share each id
    // (e.g. all 24 ribs -> "ribs"), but every one is a distinct, real mesh.
    parts: [
      { id: "skull", name: "Skull", function: "Protects the brain and shapes the face. Made of more than 20 individual fused bones." },
      { id: "hyoid", name: "Hyoid Bone", function: "A small, free-floating bone in the neck that anchors muscles used for swallowing and speech." },
      { id: "sternum", name: "Sternum (Breastbone)", function: "The flat central bone that the ribs attach to, protecting the heart." },
      { id: "ribs", name: "Ribs", function: "Twelve pairs that form a protective cage around the heart and lungs." },
      { id: "spine", name: "Spine (Vertebrae)", function: "A stack of 24 individual vertebrae that protect the spinal cord and support posture." },
      { id: "pelvis", name: "Pelvis (Hip Bone)", function: "Supports body weight and protects abdominal and reproductive organs." },
      { id: "clavicle", name: "Clavicle", function: "The collarbone — connects the arm to the torso." },
      { id: "scapula", name: "Scapula", function: "The shoulder blade — anchors arm muscles." },
      { id: "humerus", name: "Humerus", function: "The upper-arm bone, from shoulder to elbow." },
      { id: "radius", name: "Radius", function: "One of two forearm bones, on the thumb side." },
      { id: "ulna", name: "Ulna", function: "The other forearm bone, forming the point of the elbow." },
      { id: "femur", name: "Femur", function: "The thigh bone — the longest, strongest bone in the body." },
      { id: "patella", name: "Patella (Kneecap)", function: "A small bone embedded in the tendon at the front of the knee, protecting the joint." },
      { id: "tibia", name: "Tibia", function: "The shin bone — bears most of the leg's weight." },
      { id: "fibula", name: "Fibula", function: "The thinner lower-leg bone, aids ankle stability." },
      { id: "hands", name: "Hand Bones", function: "27 small bones per hand — carpals, metacarpals and finger phalanges — giving the hand fine dexterity." },
      { id: "feet", name: "Foot Bones", function: "26 small bones per foot — tarsals, metatarsals and toe phalanges — supporting weight and balance." },
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
