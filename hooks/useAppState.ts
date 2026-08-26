import { useState, useEffect } from "react";
import { Screen, RunSession, Language, UnitSystem, AudioCuesSettings } from "../types";
import { storage } from "../utils/secureStorage";
import { languageService } from "../utils/languageService";

/**
 * Custom hook to manage global persistent app state and storage synchronization.
 */
export const useAppState = () => {
  const INIT_FLAG = "FITGO_INITIALIZED_V1";

  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");

  const [languageState, setLanguageState] = useState<Language>(languageService.getCurrentLanguage());

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    languageService.setLanguage(newLang);
    // Sync to secure storage immediately
    storage.set("language", newLang).catch(console.error);
  };
  const [userName, setUserName] = useState("Runner");
  const [runHistory, setRunHistory] = useState<RunSession[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initial check from system preference if no stored value
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [audioCues, setAudioCues] = useState<AudioCuesSettings>({
    enabled: true,
    paceAlerts: true,
    distanceMilestones: true,
    alertFrequency: 60,
  });
  const [hasSeenTour, setHasSeenTour] = useState(false);

  const [isStorageReady, setIsStorageReady] = useState(false);

  // Data Migration & Initial Sync
  useEffect(() => {
    let isMounted = true;
    
    const syncStorage = async () => {
      // Set a hard timeout for storage sync to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isMounted && !isStorageReady) {
          console.warn("[Storage] Sync timed out. Forcing ready state.");
          setIsStorageReady(true);
        }
      }, 3000);

      try {
        const keysToMigrate = ["userName", "profilePhoto", "runHistory", "hasOnboarded", "language", "darkMode", "unitSystem", "audioCues", "dismissUpdateDashboard", "lastUpdateVersionSeen"];
        
        // Special case for language: LanguageService uses 'versatylo_current_lang'
        const legacyLang = localStorage.getItem("versatylo_current_lang");
        if (legacyLang && (legacyLang === 'id' || legacyLang === 'en' || legacyLang === 'jp')) {
          const secureLang = await storage.get("language");
          if (!secureLang) {
            await storage.set("language", legacyLang);
          }
        }

        for (const key of keysToMigrate) {
          const localValue = localStorage.getItem(key);
          if (localValue !== null) {
            const secureValue = await storage.get(key);
            if (secureValue === null) {
              await storage.set(key, localValue);
            }
          }
        }

        const isInitialized = localStorage.getItem(INIT_FLAG);
        if (!isInitialized) {
          await storage.clear();
          localStorage.setItem(INIT_FLAG, "true");
        }

        const sUserName = await storage.get("userName");
        if (sUserName) setUserName(sUserName);

        const sProfilePhoto = await storage.get("profilePhoto");
        if (sProfilePhoto) setProfilePhoto(sProfilePhoto);

        const sHistory = await storage.get("runHistory");
        if (sHistory) setRunHistory(sHistory);

        const sLang = await storage.get("language");
        const currentLocalLang = localStorage.getItem("versatylo_current_lang");
        
        // Priority logic for language sync:
        // 1. If we have a local storage value (immediate user choice), use it and update secure storage
        // 2. Otherwise use secure storage if valid
        // 3. Fallback to languageService default
        
        let finalLang: Language;
        
        if (currentLocalLang && (currentLocalLang === 'id' || currentLocalLang === 'en' || currentLocalLang === 'jp')) {
          finalLang = currentLocalLang as Language;
          if (sLang !== finalLang) {
            await storage.set("language", finalLang);
          }
          // Ensure state matches local storage (especially if restored from legacy)
          if (languageState !== finalLang) {
            setLanguageState(finalLang);
            languageService.setLanguage(finalLang);
          }
        } else if (sLang && (sLang === 'id' || sLang === 'en' || sLang === 'jp')) {
          finalLang = sLang as Language;
          localStorage.setItem("versatylo_current_lang", finalLang);
          // Sync state and service to match restored value
          setLanguageState(finalLang);
          languageService.setLanguage(finalLang);
        } else {
          finalLang = languageService.getCurrentLanguage();
          await storage.set("language", finalLang);
          localStorage.setItem("versatylo_current_lang", finalLang);
        }

        setLanguageState(finalLang);
        await languageService.setLanguage(finalLang);

        const sMode = await storage.get("darkMode");
        if (sMode !== null) setIsDarkMode(sMode === "true" || sMode === true);

        const sUnit = await storage.get("unitSystem");
        if (sUnit) setUnitSystem(sUnit as UnitSystem);

        const sAudio = await storage.get("audioCues");
        if (sAudio) setAudioCues(sAudio);

        const sTour = await storage.get("FITGO_TOUR_COMPLETED");
        if (sTour === "true" || sTour === true) setHasSeenTour(true);
        else {
          // Check localStorage as fallback (legacy)
          const localTour = localStorage.getItem("FITGO_TOUR_COMPLETED");
          if (localTour === "true") {
            setHasSeenTour(true);
            await storage.set("FITGO_TOUR_COMPLETED", "true");
          } else {
            setHasSeenTour(false);
          }
        }

      } catch (e) {
        console.error("[Storage] Sync failed:", e);
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setIsStorageReady(true);
      }
    };
    syncStorage();
    return () => { isMounted = false; };
  }, []);

  // Sync state changes back to storage
  useEffect(() => { if (isStorageReady) storage.set("userName", userName); }, [userName, isStorageReady]);
  useEffect(() => { if (isStorageReady) storage.set("profilePhoto", profilePhoto); }, [profilePhoto, isStorageReady]);
  useEffect(() => { 
    if (isStorageReady) {
      // Hanya simpan 20 sesi terakhir untuk menjaga performa loading
      const MAX_STORED_SESSIONS = 20;
      if (runHistory.length > MAX_STORED_SESSIONS) {
        const limitedHistory = runHistory.slice(0, MAX_STORED_SESSIONS);
        setRunHistory(limitedHistory);
        storage.set("runHistory", limitedHistory);
      } else {
        storage.set("runHistory", runHistory); 
      }
    }
  }, [runHistory, isStorageReady]);
  useEffect(() => { 
    if (isStorageReady) {
      storage.set("language", languageState);
      // languageService.setLanguage is now handled synchronously in setLanguage()
    } 
  }, [languageState, isStorageReady]);
  useEffect(() => { if (isStorageReady) storage.set("darkMode", isDarkMode); }, [isDarkMode, isStorageReady]);
  useEffect(() => { if (isStorageReady) storage.set("unitSystem", unitSystem); }, [unitSystem, isStorageReady]);
  useEffect(() => { if (isStorageReady) storage.set("audioCues", audioCues); }, [audioCues, isStorageReady]);
  useEffect(() => { 
    if (isStorageReady) {
      storage.set("FITGO_TOUR_COMPLETED", hasSeenTour); 
      localStorage.setItem("FITGO_TOUR_COMPLETED", hasSeenTour ? "true" : "false");
    }
  }, [hasSeenTour, isStorageReady]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#000000";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#FFFFFF";
    }
    document.body.style.transition = "background-color 0.3s ease";
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    // Explicitly define handler to ensure proper cleanup
    const handleChange = (e: MediaQueryListEvent) => {
      // Use functional update to avoid stale closure issues
      setIsDarkMode(e.matches);
    };

    // Use standard addEventListener for modern browser/Capacitor compatibility
    mediaQuery.addEventListener("change", handleChange);
    
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return {
    currentScreen, setCurrentScreen,
    language: languageState, setLanguage,
    userName, setUserName,
    runHistory, setRunHistory,
    isDarkMode, setIsDarkMode,
    unitSystem, setUnitSystem,
    profilePhoto, setProfilePhoto,
    audioCues, setAudioCues,
    hasSeenTour, setHasSeenTour,
    isStorageReady
  };
};
