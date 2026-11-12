/**
 * uiStrings.js
 * -----------------------------------------------------------------------
 * Every piece of interface chrome the visitor can read (menus, panel
 * headings, HUD text, control buttons, model-status lines) in every
 * language (English, Sinhala, Tamil). Keeping it here means anatomyData.js stays pure anatomical
 * content, and adding a third language later is a data change only.
 *
 * Rules:
 *   - `hint*`, `backToMenu` and `pauseToast` values may contain HTML
 *     entities/markup -- they are injected with innerHTML. Everything else
 *     is plain text and is injected with textContent / escaped templates.
 *   - English is the fallback for any key missing from another language
 *     (see t() in i18n.js), so a gap can never render as "undefined".
 *   - A handful of strings are intentionally NOT translated and live in
 *     SHARED_STRINGS at the bottom of this file instead: the gesture-HUD
 *     hints and tracking statuses, which read identically in both
 *     languages.
 * -----------------------------------------------------------------------
 */
export const UI_STRINGS = {
  en: {
    appTitle: "TOUCHLESS HUMAN ANATOMY EXPLORER",
    chooseLanguage: "Choose language",

    welcomeKicker: "UNIVERSITY MEDICAL EXHIBITION",
    welcomeTitleHtml: "TOUCHLESS HUMAN<br/>ANATOMY EXPLORER",
    welcomeSubtitle: "Explore the human body using your hands",
    legendWave: "Wave to start",
    legendPoint: "Point to select",
    legendPinch: "Pinch to grab",
    legendRotate: "Move hand to rotate",
    legendPalm: "Open palm to return",
    beginBtn: "Wave your hand to begin",

    menuTitle: "Select a body system",

    backToMenu: "✋ Return to Menu",
    pauseToast: "⏸ Interaction Paused",
    idleText: "Wave your hand to explore",

    systemOverview: "SYSTEM OVERVIEW",
    selectedStructure: "SELECTED STRUCTURE",
    keyStructures: "Key Structures",
    didYouKnow: "Did you know?",
    realStructure: "Real structure:",

    bannerNoTracking: "Hand tracking unavailable. Use mouse interaction for demonstration.",
    bannerLeapConnected: "Leap Motion LM-010 connected.",

    modelLoading: "Loading real anatomical model...",
    modelPlaceholder: "Placeholder model -- see README",
    statusHeart: "Real human heart & vessels · HuBMAP Human Reference Atlas (CC BY 4.0)",
    statusBrain: "Real human brain · 286 structures · HuBMAP / Allen Institute (CC BY 4.0)",
    statusLungs: "Real human respiratory system · HuBMAP Human Reference Atlas (CC BY 4.0) + BodyParts3D diaphragm (CC BY-SA)",
    statusLungsNoDiaphragm: "Real human respiratory system · HuBMAP Human Reference Atlas (CC BY 4.0)",
    statusSkeleton: "203 real bones · BodyParts3D (CC BY-SA)",
    statusMuscles: "467 real muscles & tendons · BodyParts3D + Z-Anatomy (CC BY-SA)",
    statusDigestive: "Real liver, pancreas, gallbladder & intestines · HuBMAP (CC BY 4.0) + BodyParts3D stomach (CC BY-SA)",
    statusDigestiveNoStomach: "Real liver, pancreas, gallbladder & intestines · HuBMAP Human Reference Atlas (CC BY 4.0)",
    statusEye: "Real human eye · Z-Anatomy / BodyParts3D (CC BY-SA)",
    statusEyeNoOrbit: "Real human eyeball · Z-Anatomy / BodyParts3D (CC BY-SA) · eye muscles unavailable",

    toggleBloodFlow: "Blood Flow Animation",
    toggleBreathing: "Breathing Mode",
    breathingHintOn: "Inhale: the diaphragm pulls down and lungs expand. Exhale: they relax and air flows out.",

    toggleEyeLight: "Light Reflex",
    toggleEyeFocus: "Focus Near / Far",
    toggleEyeGaze: "Eye Movement",
    toggleEyeTears: "Tear Flow",
    toggleEyeInside: "See Inside",
    eyeTipInside: "Tip: switch on \u201cSee Inside\u201d to explore the retina, lens and vitreous jelly.",
    eyeLightBright: "\u2600 Bright light: the iris muscle tightens, shrinking the pupil to protect the retina.",
    eyeLightDim: "\u263E Dim light: the iris opens the pupil wide to let in as much light as possible.",
    eyeFocusNear: "Looking at something near: the lens gets thicker and rounder, and the fibres holding it relax.",
    eyeFocusFar: "Looking far away: the lens is pulled flatter so distant objects stay sharp.",
    eyeGazeCenter: "Looking straight ahead: the six eye muscles are in balance.",
    eyeGazeIn: "Looking toward the nose: the medial rectus pulls the eye inward.",
    eyeGazeOut: "Looking outward: the lateral rectus pulls the eye toward the ear.",
    eyeGazeUp: "Looking up: the superior rectus and inferior oblique lift the eye.",
    eyeGazeDown: "Looking down: the inferior rectus and superior oblique lower the eye.",
    eyeTearsHint: "Tears are made by the lacrimal gland, wash across the eye, then drain through the tear duct into the nose.",
    eyeInsideHint: "The outer layers are now see-through. Select the lens, iris, retina or the jelly-like vitreous.",
  },
  si: {
    appTitle: "ස්පර්ශ රහිත මානව ව්‍යුහ විද්‍යා ගවේෂකය",
    chooseLanguage: "භාෂාව තෝරන්න",

    welcomeKicker: "විශ්වවිද්‍යාල වෛද්‍ය ප්‍රදර්ශනය",
    welcomeTitleHtml: "ස්පර්ශ රහිත මානව<br/>ව්‍යුහ විද්‍යා ගවේෂකය",
    welcomeSubtitle: "ඔබේ අත් භාවිතයෙන් මිනිස් සිරුර ගවේෂණය කරන්න",
    legendWave: "ආරම්භ කිරීමට අත වනන්න",
    legendPoint: "තේරීමට ඇඟිල්ල දිගු කරන්න",
    legendPinch: "අල්ලා ගැනීමට ඇඟිලි තද කරන්න",
    legendRotate: "කරකැවීමට අත චලනය කරන්න",
    legendPalm: "ආපසු යාමට අත්ල දිගු කරන්න",
    beginBtn: "ආරම්භ කිරීමට ඔබේ අත වනන්න",

    menuTitle: "ශරීර පද්ධතියක් තෝරන්න",

    backToMenu: "✋ මෙනුවට ආපසු",
    pauseToast: "⏸ අන්තර්ක්‍රියාව නවතා ඇත",
    idleText: "ගවේෂණය කිරීමට ඔබේ අත වනන්න",

    systemOverview: "පද්ධති දළ විස්තරය",
    selectedStructure: "තෝරාගත් ව්‍යුහය",
    keyStructures: "ප්‍රධාන ව්‍යුහ",
    didYouKnow: "ඔබ දැනගෙන සිටියාද?",
    realStructure: "සැබෑ ව්‍යුහය:",

    bannerNoTracking: "අත් නිරීක්ෂණය නොමැත. නිරූපණය සඳහා මූසික අන්තර්ක්‍රියාව භාවිතා කරන්න.",
    bannerLeapConnected: "Leap Motion LM-010 සම්බන්ධයි.",

    modelLoading: "සැබෑ ව්‍යුහ විද්‍යා ආකෘතිය පූරණය වෙමින්...",
    modelPlaceholder: "නියෝජිත ආකෘතිය -- README බලන්න",
    statusHeart: "සැබෑ මිනිස් හෘදය සහ රුධිර නාල · HuBMAP මානව සමුද්දේශ ඇට්ලස් (CC BY 4.0)",
    statusBrain: "සැබෑ මිනිස් මොළය · ව්‍යුහ 286 · HuBMAP / Allen Institute (CC BY 4.0)",
    statusLungs: "සැබෑ මිනිස් ශ්වසන පද්ධතිය · HuBMAP (CC BY 4.0) + BodyParts3D ප්‍රාචීරය (CC BY-SA)",
    statusLungsNoDiaphragm: "සැබෑ මිනිස් ශ්වසන පද්ධතිය · HuBMAP මානව සමුද්දේශ ඇට්ලස් (CC BY 4.0)",
    statusSkeleton: "සැබෑ අස්ථි 203 · BodyParts3D (CC BY-SA)",
    statusMuscles: "සැබෑ පේශි සහ ටෙන්ඩන 467 · BodyParts3D + Z-Anatomy (CC BY-SA)",
    statusDigestive:
      "සැබෑ ආමාශය, අක්මාව, අග්න්‍යාශය, පිත්තාශය සහ බඩවැල් · HuBMAP (CC BY 4.0) + BodyParts3D ආමාශය (CC BY-SA)",
    statusDigestiveNoStomach:
      "සැබෑ අක්මාව, අග්න්‍යාශය, පිත්තාශය සහ බඩවැල් · HuBMAP මානව සමුද්දේශ ඇට්ලස් (CC BY 4.0)",
    statusEye: "සැබෑ මිනිස් ඇස · Z-Anatomy / BodyParts3D (CC BY-SA)",
    statusEyeNoOrbit: "සැබෑ මිනිස් ඇසේ ගෝලය · Z-Anatomy / BodyParts3D (CC BY-SA) · ඇස් පේශි නොමැත",

    toggleBloodFlow: "රුධිර ප්‍රවාහ සජීවිකරණය",
    toggleEyeLight: "ආලෝක ප්‍රතික්‍රියාව",
    toggleEyeFocus: "ළඟ / දුර නාභිගත කිරීම",
    toggleEyeGaze: "ඇස චලනය",
    toggleEyeTears: "කඳුළු ගලා යාම",
    toggleEyeInside: "ඇතුළත බලන්න",
    eyeTipInside: "ඉඟිය: දෘෂ්ටි විතානය, කාචය සහ කාච රසය ගවේෂණයට “ඇතුළත බලන්න” සක්‍රිය කරන්න.",
    eyeLightBright: "\u2600 දීප්තිමත් ආලෝකය: තාරා මණ්ඩලය තද වී කණීනිකාව කුඩා කර දෘෂ්ටි විතානය ආරක්ෂා කරයි.",
    eyeLightDim: "\u263E අඳුරු ආලෝකය: හැකි තරම් ආලෝකය ඇතුළු කිරීමට තාරා මණ්ඩලය කණීනිකාව විශාල කරයි.",
    eyeFocusNear: "ළඟ ඇති දෙයක් බලන විට: ප්‍රතියෝජක පේශි හැකිලීමෙන් කාචය ඝන සහ වටකුරු වන අතර එය අල්ලාගත් තන්තු ලිහිල් වේ.",
    eyeFocusFar: "දුර බලන විට: දුර දේවල් පැහැදිලිව පෙනීමට කාචය පැතලි වේ.",
    eyeGazeCenter: "කෙලින් බලන විට: ඇස් පේශි හය සමතුලිතව පවතී.",
    eyeGazeIn: "නාසය දෙස බලන විට: අභ්‍යන්තර සරල පේශිය ඇස ඇතුළට අදියි.",
    eyeGazeOut: "පිටතට බලන විට: බාහිර සරල පේශිය ඇස කන දෙසට අදියි.",
    eyeGazeUp: "ඉහළට බලන විට: ඉහළ සරල සහ පහළ ඇල පේශි ඇස ඉහළට ඔසවයි.",
    eyeGazeDown: "පහළට බලන විට: පහළ සරල සහ ඉහළ ඇල පේශි ඇස පහළට හරවයි.",
    eyeTearsHint: "කඳුළු කඳුළු ග්‍රන්ථියෙන් නිපදවී ඇස හරහා පැතිර, කඳුළු නාලය හරහා නාසයට බසී.",
    eyeInsideHint: "පිටත ස්තර දැන් විනිවිද පෙනේ. කාචය, තාරා මණ්ඩලය, දෘෂ්ටි විතානය හෝ කාච රසය තෝරන්න.",
    toggleBreathing: "හුස්ම ගැනීමේ ප්‍රකාරය",
    breathingHintOn:
      "හුස්ම ඇතුළට ගැනීමේදී: මහා ප්‍රාචීරය පහළට ඇදී පෙනහළු ප්‍රසාරණය වේ. හුස්ම එළියට දැමීමේදී: ඒවා ලිහිල් වී වායුව ඉවත් වේ.",
  },
  ta: {
    appTitle: "தொடுகையற்ற மனித உடற்கூற்று ஆய்வகம்",
    chooseLanguage: "மொழியைத் தேர்ந்தெடுக்கவும்",

    welcomeKicker: "பல்கலைக்கழக மருத்துவக் கண்காட்சி",
    welcomeTitleHtml: "தொடுகையற்ற மனித<br/>உடற்கூற்று ஆய்வகம்",
    welcomeSubtitle: "உங்கள் கைகளைப் பயன்படுத்தி மனித உடலை ஆராயுங்கள்",
    legendWave: "தொடங்க கையை அசையுங்கள்",
    legendPoint: "தேர்ந்தெடுக்க சுட்டிக்காட்டுங்கள்",
    legendPinch: "பிடிக்க விரல்களை இறுக்குங்கள்",
    legendRotate: "சுழற்ற கையை அசையுங்கள்",
    legendPalm: "திரும்ப உள்ளங்கையை விரியுங்கள்",
    beginBtn: "தொடங்க உங்கள் கையை அசையுங்கள்",

    menuTitle: "ஓர் உடல் தொகுதியைத் தேர்ந்தெடுக்கவும்",

    backToMenu: "✋ பட்டியலுக்குத் திரும்பு",
    pauseToast: "⏸ தொடர்பாடல் இடைநிறுத்தப்பட்டது",
    idleText: "ஆராய உங்கள் கையை அசையுங்கள்",

    systemOverview: "தொகுதி கண்ணோட்டம்",
    selectedStructure: "தேர்ந்தெடுக்கப்பட்ட அமைப்பு",
    keyStructures: "முக்கிய அமைப்புகள்",
    didYouKnow: "உங்களுக்குத் தெரியுமா?",
    realStructure: "உண்மையான அமைப்பு:",

    bannerNoTracking: "கை கண்காணிப்பு கிடைக்கவில்லை. செய்முறை விளக்கத்துக்கு சுட்டியைப் பயன்படுத்துங்கள்.",
    bannerLeapConnected: "Leap Motion LM-010 இணைக்கப்பட்டுள்ளது.",

    modelLoading: "உண்மையான உடற்கூற்று மாதிரி ஏற்றப்படுகிறது...",
    modelPlaceholder: "இடைக்கால மாதிரி -- README ஐப் பார்க்கவும்",
    statusHeart: "உண்மையான மனித இதயமும் குருதிக் குழாய்களும் · HuBMAP மனித உசாத்துணை அட்லஸ் (CC BY 4.0)",
    statusBrain: "உண்மையான மனித மூளை · 286 அமைப்புகள் · HuBMAP / Allen Institute (CC BY 4.0)",
    statusLungs: "உண்மையான மனித சுவாசத் தொகுதி · HuBMAP மனித உசாத்துணை அட்லஸ் (CC BY 4.0) + BodyParts3D பிரிமென்றகடு (CC BY-SA)",
    statusLungsNoDiaphragm: "உண்மையான மனித சுவாசத் தொகுதி · HuBMAP மனித உசாத்துணை அட்லஸ் (CC BY 4.0)",
    statusSkeleton: "203 உண்மையான என்புகள் · BodyParts3D (CC BY-SA)",
    statusMuscles: "467 உண்மையான தசைகளும் தசைநாண்களும் · BodyParts3D + Z-Anatomy (CC BY-SA)",
    statusDigestive:
      "உண்மையான ஈரல், சதையி, பித்தப்பை, குடல்கள் · HuBMAP (CC BY 4.0) + BodyParts3D இரைப்பை (CC BY-SA)",
    statusDigestiveNoStomach:
      "உண்மையான ஈரல், சதையி, பித்தப்பை, குடல்கள் · HuBMAP மனித உசாத்துணை அட்லஸ் (CC BY 4.0)",
    statusEye: "உண்மையான மனிதக் கண் · Z-Anatomy / BodyParts3D (CC BY-SA)",
    statusEyeNoOrbit: "உண்மையான மனிதக் கண்ணுருண்டை · Z-Anatomy / BodyParts3D (CC BY-SA) · கண் தசைகள் கிடைக்கவில்லை",

    toggleBloodFlow: "குருதி ஓட்ட அசைவூட்டம்",
    toggleEyeLight: "ஒளி எதிர்ச்செயல்",
    toggleEyeFocus: "அண்மை / தொலைவுக் குவிப்பு",
    toggleEyeGaze: "கண் அசைவு",
    toggleEyeTears: "கண்ணீர் ஓட்டம்",
    toggleEyeInside: "உள்ளே பார்",
    eyeTipInside: "குறிப்பு: விழித்திரை, வில்லை, கண்ணாடியுடனீர் ஆகியவற்றை ஆராய “உள்ளே பார்” ஐ இயக்குங்கள்.",
    eyeLightBright: "\u2600 பிரகாசமான ஒளி: கதிராளித் தசை இறுகி, கண்மணியைச் சுருக்கி விழித்திரையைப் பாதுகாக்கிறது.",
    eyeLightDim: "\u263E மங்கிய ஒளி: முடிந்தவரை அதிக ஒளியை உள்ளே விட, கதிராளி கண்மணியை அகலமாகத் திறக்கிறது.",
    eyeFocusNear: "அண்மையில் உள்ளதைப் பார்க்கும்போது: வில்லை தடித்தும் உருண்டும் மாறுகிறது; அதைப் பிடித்திருக்கும் நார்கள் தளர்கின்றன.",
    eyeFocusFar: "தொலைவில் பார்க்கும்போது: தொலைவிலுள்ள பொருட்கள் தெளிவாகத் தெரிய வில்லை தட்டையாக இழுக்கப்படுகிறது.",
    eyeGazeCenter: "நேராகப் பார்க்கும்போது: ஆறு கண் தசைகளும் சமநிலையில் உள்ளன.",
    eyeGazeIn: "மூக்கை நோக்கிப் பார்க்கும்போது: உள் நேர்த்தசை கண்ணை உள்நோக்கி இழுக்கிறது.",
    eyeGazeOut: "வெளிநோக்கிப் பார்க்கும்போது: வெளி நேர்த்தசை கண்ணைக் காது பக்கமாக இழுக்கிறது.",
    eyeGazeUp: "மேலே பார்க்கும்போது: மேல் நேர்த்தசையும் கீழ் சாய்வுத்தசையும் கண்ணை மேலே தூக்குகின்றன.",
    eyeGazeDown: "கீழே பார்க்கும்போது: கீழ் நேர்த்தசையும் மேல் சாய்வுத்தசையும் கண்ணைக் கீழே திருப்புகின்றன.",
    eyeTearsHint: "கண்ணீர் கண்ணீர் சுரப்பியில் உற்பத்தியாகி, கண் முழுவதும் பரவி, கண்ணீர் நாளம் வழியாக மூக்கிற்குள் வடிகிறது.",
    eyeInsideHint: "வெளி அடுக்குகள் இப்போது ஊடுருவிப் பார்க்கக்கூடியவை. வில்லை, கதிராளி, விழித்திரை அல்லது கண்ணாடியுடனீரைத் தேர்ந்தெடுங்கள்.",
    toggleBreathing: "சுவாசப் பயன்முறை",
    breathingHintOn:
      "உள்ளிழுக்கும்போது: பிரிமென்றகடு கீழே இழுக்கப்பட்டு சுவாசப்பைகள் விரிகின்றன. வெளிவிடும்போது: அவை தளர்ந்து காற்று வெளியேறுகிறது.",
  },
};

/**
 * SHARED_STRINGS
 * -----------------------------------------------------------------------
 * Interface text that deliberately reads the SAME in every language.
 *
 * The gesture HUD is a fixed-size strip of icon-led instructions ("↔ Pinch
 * & drag to rotate · ☝ Point & hold to inspect · ✋ Open palm to pause") plus
 * the short tracking-status lines. The exhibit keeps these in English for
 * both languages on purpose: the icons carry the meaning, the strings are
 * short enough not to wrap, and the exact same words must appear whether
 * the visitor picked English or Sinhala.
 *
 * Because these live here and not in the per-language tables below, the
 * two languages cannot drift apart -- t() falls back to this table before
 * it falls back to English (see i18n.js).
 *
 * `hint*` values may contain HTML entities: they are injected with
 * innerHTML, like their counterparts in UI_STRINGS.
 * -----------------------------------------------------------------------
 */
export const SHARED_STRINGS = {
  hintMenu: "☝ Point &amp; pinch (or hold still) to select &nbsp;·&nbsp; ✋ Open palm to pause",
  hintExplorer:
    "↔ Pinch &amp; drag to rotate &nbsp;·&nbsp; ☝ Point &amp; hold to inspect &nbsp;·&nbsp; ✋ Open palm to pause",
  hintWelcome: "👋 Wave to begin",
  hintIdle: "👋 Wave your hand to explore",

  statusActive: "Hand tracking active",
  statusNotDetected: "Hand not detected — interaction paused",
  statusMouse: "Mouse control (hand tracking unavailable)",
  statusSearching: "Searching for hand tracking…",
};
