import React from "react";
import ReactFlagsSelect from "react-flags-select";
import { Language } from "../utils/languageService";

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
  isDarkMode
}) => {
  // Mapping language codes (id, en, jp) to country codes (ID, GB, JP)
  const langToCountry: Record<Language, string> = {
    id: "ID",
    en: "GB",
    jp: "JP"
  };

  // Mapping country codes back to language codes
  const countryToLang: Record<string, Language> = {
    ID: "id",
    GB: "en",
    JP: "jp"
  };

  const handleSelect = (code: string) => {
    const langCode = countryToLang[code];
    if (langCode) {
      onLanguageChange(langCode);
    }
  };

  return (
    <div className="language-switcher-wrapper">
      <ReactFlagsSelect
        selected={langToCountry[currentLanguage]}
        onSelect={handleSelect}
        countries={["ID", "GB", "JP"]}
        customLabels={{
          ID: "Indonesia",
          GB: "English",
          JP: "日本語"
        }}
        className={`menu-flags ${isDarkMode ? "dark-mode" : ""}`}
        selectButtonClassName={`
          !px-4 !py-2 !rounded-2xl !border !transition-all !h-auto
          ${isDarkMode 
            ? "!bg-gray-800 !text-white !border-gray-700 hover:!border-blue-500" 
            : "!bg-gray-100 !text-gray-900 !border-transparent hover:!border-blue-500"
          }
          !font-sans !font-bold !text-xs !uppercase !tracking-widest
        `}
      />
      <style>{`
        .language-switcher-wrapper button {
           justify-content: space-between;
           width: 100%;
        }
        .language-switcher-wrapper ul {
           border-radius: 16px !important;
           overflow: hidden !important;
           margin-top: 8px !important;
           border: 1px solid ${isDarkMode ? '#374151' : '#E5E7EB'} !important;
           background-color: ${isDarkMode ? '#111827' : '#FFFFFF'} !important;
        }
        .language-switcher-wrapper li {
           padding: 10px 16px !important;
           font-size: 12px !important;
           font-weight: 600 !important;
           color: ${isDarkMode ? '#D1D5DB' : '#374151'} !important;
        }
        .language-switcher-wrapper li:hover {
           background-color: ${isDarkMode ? '#1F2937' : '#F3F4F6'} !important;
           color: ${isDarkMode ? '#FFFFFF' : '#111827'} !important;
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;
