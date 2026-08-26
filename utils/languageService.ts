/**
 * Versatylo Translation System
 * Implements language switching with auto-detection, caching, and dynamic loading.
 */

import { translations, Language, TranslationKeys } from '../locale/translations';

const LANG_KEY = 'versatylo_current_lang';

class LanguageService {
  private currentLang: Language = 'id';
  private translations: Record<string, string> = {};
  private listeners: Array<(lang: Language) => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    // 1. Detect language
    // Priority: 1. LocalStorage (User choice), 2. Browser Language, 3. Default (id)
    const savedLang = localStorage.getItem(LANG_KEY) as Language;
    
    if (savedLang && ['en', 'id', 'jp'].includes(savedLang)) {
      this.currentLang = savedLang;
    } else {
      this.currentLang = this.detectBrowserLanguage();
    }

    console.log(`[LanguageService] Initialized with: ${this.currentLang}`);

    // 2. Load translations
    this.loadTranslations(this.currentLang);
  }

  private detectBrowserLanguage(): Language {
    try {
      const navLang = navigator.language.split('-')[0];
      if (navLang === 'id') return 'id';
      if (navLang === 'ja' || navLang === 'jp') return 'jp';
      if (navLang === 'en') return 'en';
    } catch (e) {
      console.warn("[LanguageService] Browser detection failed, falling back to 'id'");
    }
    return 'id'; // Default fallback changed to 'id' for this project context
  }

  public setLanguage(lang: Language) {
    if (!['en', 'id', 'jp'].includes(lang)) {
      console.error(`[LanguageService] Attempted to set invalid language: ${lang}`);
      return;
    }

    const hasTranslations = this.translations && Object.keys(this.translations).length > 0;
    
    // Always update if lang is different, OR if translations are missing
    if (lang === this.currentLang && hasTranslations) return;

    console.log(`[LanguageService] Switching to: ${lang}`);
    this.currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    this.loadTranslations(lang);
    
    this.notifyListeners();
  }

  private loadTranslations(lang: Language) {
    console.log(`[LanguageService] Loading translations for: ${lang}`);
    const data = translations[lang];
    if (!data) {
      console.error(`[LanguageService] No translation data found for: ${lang}`);
      return;
    }
    this.translations = data as unknown as Record<string, string>;
    console.log(`[LanguageService] Loaded ${Object.keys(this.translations).length} keys for ${lang}`);
  }

  public t(key: TranslationKeys): string {
    // console.log(`[LanguageService] Translating ${key} to ${this.currentLang}`);
    const translation = this.translations[key];
    if (!translation) {
      console.warn(`[LanguageService] Missing translation for key: ${key} in ${this.currentLang}`);
      return key;
    }
    return translation;
  }

  public getCurrentLanguage(): Language {
    return this.currentLang;
  }

  public getTranslations() {
    return this.translations as unknown as typeof translations['en'];
  }

  public subscribe(callback: (lang: Language) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.currentLang));
  }
}

export const languageService = new LanguageService();
export type { Language, TranslationKeys };
