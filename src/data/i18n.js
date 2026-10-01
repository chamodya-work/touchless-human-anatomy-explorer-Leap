/**
 * i18n.js
 * -----------------------------------------------------------------------
 * Language state for the Touchless Human Anatomy Explorer.
 *
 * English is the default; Sinhala (සිංහල) is the alternate. The visitor's
 * choice is held in exactly one place and broadcast to every component
 * through onLanguageChange(), so a single tap on the main-page language
 * button re-renders the menu, the information panel and every HUD label.
 *
 * Where the two languages live:
 *   - UI chrome strings  -> uiStrings.js   (menus, headings, HUD, toggles)
 *   - anatomy content    -> anatomyData.js (English base)
 *                           anatomyData.si.js (Sinhala overlay, merged by
 *                           getSystem(id, getLang()))
 * -----------------------------------------------------------------------
 */
import { SHARED_STRINGS, UI_STRINGS } from "./uiStrings.js";

export const LANGUAGES = {
  en: { id: "en", nativeLabel: "English", htmlLang: "en" },
  si: { id: "si", nativeLabel: "සිංහල", htmlLang: "si" },
};

export const LANGUAGE_ORDER = ["en", "si"];
export const DEFAULT_LANGUAGE = "en";

const STORAGE_KEY = "anatomyExplorer.language";

let currentLanguage = DEFAULT_LANGUAGE;
const listeners = new Set();

/** @returns {"en"|"si"} the language currently being displayed. */
export function getLang() {
  return currentLanguage;
}

/** Convenience helper for the many `lang === "si"` checks. */
export function isSinhala() {
  return currentLanguage === "si";
}

/**
 * Switches the displayed language and notifies every subscribed component.
 * No-op when the language is unchanged, so repeated taps are cheap and
 * never cause a needless re-render.
 */
export function setLang(id) {
  if (!LANGUAGES[id] || id === currentLanguage) return;
  currentLanguage = id;
  persist(id);
  applyDocumentLanguage();
  listeners.forEach((cb) => {
    try {
      cb(id);
    } catch (err) {
      console.error("[i18n] language-change listener failed:", err);
    }
  });
}

/**
 * Subscribes to language changes.
 * @param {(lang: string) => void} cb
 * @returns {() => void} unsubscribe
 */
export function onLanguageChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Looks up a UI string for the active language.
 * Resolution order: active language -> SHARED_STRINGS (language-
 * independent text such as the gesture HUD) -> English -> the key itself,
 * so a missed translation can never render as "undefined".
 *
 * @param {string} key - key from uiStrings.js
 * @param {Record<string, string|number>} [vars] - {name} placeholders to fill
 */
export function t(key, vars) {
  const active = UI_STRINGS[currentLanguage] || UI_STRINGS[DEFAULT_LANGUAGE];
  let text =
    active[key] ?? SHARED_STRINGS[key] ?? UI_STRINGS[DEFAULT_LANGUAGE][key] ?? key;
  if (vars) {
    Object.keys(vars).forEach((name) => {
      text = text.split(`{${name}}`).join(String(vars[name]));
    });
  }
  return text;
}

/**
 * Resolves the language to start in: a previously saved choice wins,
 * otherwise the browser/OS locale is used (a Sinhala-locale exhibition
 * machine opens in Sinhala), otherwise English.
 */
export function initLanguage() {
  const saved = readStored();
  currentLanguage = saved && LANGUAGES[saved] ? saved : detectFromNavigator();
  applyDocumentLanguage();
  return currentLanguage;
}

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // private browsing / storage disabled
  }
}

function persist(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* choice simply won't survive a reload -- not worth failing over */
  }
}

function detectFromNavigator() {
  const nav = (navigator.languages?.[0] || navigator.language || "").toLowerCase();
  return nav.startsWith("si") ? "si" : DEFAULT_LANGUAGE;
}

function applyDocumentLanguage() {
  const meta = LANGUAGES[currentLanguage];
  document.documentElement.lang = meta.htmlLang;
  document.documentElement.setAttribute("data-lang", currentLanguage);
}
