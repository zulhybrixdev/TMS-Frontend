import { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ms } from "./ms";

// Global English / Bahasa Malaysia translation.
//
// Every user-visible string is written in English at the call site and passed
// through t("English text"); the Malay version is looked up by that exact
// English text in ./ms.ts, and English is the fallback - so a string that has
// no translation yet is still shown (in English), never blank or a raw key.
// {name} placeholders are filled from the second argument:
//     t("Showing {from}-{to} of {total}", { from, to, total })
//
// `t` is a plain function reading the current language, so it works anywhere
// (components, event handlers, toasts, formatters) with no hook. To make the
// screen update when the language changes, LanguageProvider re-mounts the app
// beneath it (keyed on the language) - login state, the router and the query
// cache live above it and are untouched, only in-progress local state such as
// a half-typed form is reset.

export type Lang = "en" | "ms";

const STORAGE_KEY = "tms.lang";
const LEGACY_KEY = "tms.helpLang"; // the Help page's earlier, page-only switch

function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
    return v === "ms" ? "ms" : "en"; // English unless the user chose otherwise
  } catch {
    return "en"; // storage blocked (private mode etc.) - just don't remember
  }
}

let current: Lang = readStoredLang();

export function getLang(): Lang {
  return current;
}

export function t(key: string, vars?: Record<string, string | number | undefined>): string {
  const text = current === "ms" ? ms[key] ?? key : key;
  return vars ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? "")) : text;
}

/**
 * Marks a string in a module-level constant (nav labels, table/tab titles...)
 * as translatable without translating it there: constants are evaluated once
 * at import, before the user has picked a language. It returns the English text
 * unchanged; render it with t(value). It exists so the completeness check
 * (scripts/check-i18n.mjs) can see these strings too.
 */
export function tk(text: string): string {
  return text;
}

/** Translation of an enum-style value (e.g. PENDING_APPROVAL); unchanged when there is no entry. */
export function tEnum(value: string): string {
  return current === "ms" ? ms[value] ?? value : value;
}

/** BCP-47 locale for Intl formatting (dates, relative times) in the current language. */
export function getLocale(): string {
  return current === "ms" ? "ms-MY" : "en-MY";
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({ lang: current, setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);

  const setLang = useCallback((next: Lang) => {
    current = next; // before the state update, so the re-render already reads the new language
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* preference just isn't remembered */
    }
    setLangState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "ms" ? "ms" : "en";
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return (
    <LanguageContext.Provider value={value}>
      <Fragment key={lang}>{children}</Fragment>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
