/**
 * language-context.tsx
 *
 * Provides a React context so any component can:
 *   const { lang, setLang, t } = useLanguage();
 *
 * `t(key)` returns the string for the current language.
 * `t(key, vars)` performs simple {placeholder} substitution.
 *
 * Language preference is persisted to localStorage so it survives refresh.
 */

import { createContext, useContext, useState, useCallback } from "react";
import { translations, type Lang, type TranslationKey } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => translations[key]?.en ?? key,
});

function readPersistedLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("hamrorent_lang");
  return stored === "ne" ? "ne" : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readPersistedLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("hamrorent_lang", l);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>): string => {
      const entry = translations[key];
      let str: string = entry ? entry[lang] ?? entry.en : key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
