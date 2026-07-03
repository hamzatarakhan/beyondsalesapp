import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import i18n from "@/i18n";

type Lang = "en" | "ar";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  isRtl: false,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(
    (localStorage.getItem("lang") as Lang) ?? "en"
  );

  const setLang = (l: Lang) => {
    localStorage.setItem("lang", l);
    setLangState(l);
    i18n.changeLanguage(l);
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRtl: lang === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
