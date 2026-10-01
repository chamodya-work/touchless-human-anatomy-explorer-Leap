/**
 * uiStrings.js
 * -----------------------------------------------------------------------
 * Every piece of interface chrome the visitor can read (menus, panel
 * headings, HUD text, control buttons, model-status lines) in both
 * languages. Keeping it here means anatomyData.js stays pure anatomical
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
    statusLungs: "Real human respiratory system · HuBMAP Human Reference Atlas (CC BY 4.0)",
    statusSkeleton: "202 real bones · BodyParts3D (CC BY-SA)",
    statusMuscles: "467 real muscles & tendons · BodyParts3D + Z-Anatomy (CC BY-SA)",
    statusDigestive: "Real liver, pancreas, gallbladder & intestines · HuBMAP Human Reference Atlas (CC BY 4.0)",
    statusNervous: "Real brain & spinal cord · HuBMAP / Allen Institute (CC BY 4.0)",

    toggleBloodFlow: "Blood Flow Animation",
    toggleBreathing: "Breathing Mode",
    toggleBrainActivity: "Brain Activity Visualization",
    breathingHintOn: "Inhale: the diaphragm pulls down and lungs expand. Exhale: they relax and air flows out.",
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
    statusLungs: "සැබෑ මිනිස් ශ්වසන පද්ධතිය · HuBMAP මානව සමුද්දේශ ඇට්ලස් (CC BY 4.0)",
    statusSkeleton: "සැබෑ අස්ථි 202 · BodyParts3D (CC BY-SA)",
    statusMuscles: "සැබෑ පේශි සහ ටෙන්ඩන 467 · BodyParts3D + Z-Anatomy (CC BY-SA)",
    statusDigestive:
      "සැබෑ අක්මාව, අග්නාශය, පිතාශය සහ බඩවැල් · HuBMAP මානව සමුද්දේශ ඇට්ලස් (CC BY 4.0)",
    statusNervous: "සැබෑ මොළය සහ සුෂුම්නාව · HuBMAP / Allen Institute (CC BY 4.0)",

    toggleBloodFlow: "රුධිර ප්‍රවාහ සජීවිකරණය",
    toggleBreathing: "හුස්ම ගැනීමේ ප්‍රකාරය",
    toggleBrainActivity: "මොළ ක්‍රියාකාරීත්ව දර්ශනය",
    breathingHintOn:
      "හුස්ම ඇතුළට ගැනීමේදී: වක්‍ර පටලය පහළට ඇදී පෙනහළු ප්‍රසාරණය වේ. හුස්ම එළියට දැමීමේදී: ඒවා ලිහිල් වී වායුව ඉවත් වේ.",
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
