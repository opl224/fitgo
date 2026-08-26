import { useState, useEffect, useCallback } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { checkForUpdate } from "../utils/updateService";
import { storage } from "../utils/secureStorage";

/**
 * Custom hook to manage app updates and version checking.
 * @param isStorageReady - Whether the secure storage is ready to be used.
 */
export const useUpdateManager = (isStorageReady: boolean) => {
  const [APP_VERSION, setAppVersion] = useState("1.0.5");
  const [isVersionLoaded, setIsVersionLoaded] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    hasUpdate: boolean;
    latestVersion: string;
    downloadUrl: string;
    releaseDate?: string;
    fileSize?: string;
    changelog?: {
      newFeatures: string[];
      bugFixes: string[];
      improvements: string[];
    };
    priority?: "critical" | "optional";
  }>({
    hasUpdate: false,
    latestVersion: "1.0.5",
    downloadUrl: "",
  });
  const [updateError, setUpdateError] = useState<string>("");
  const [dashboardUpdateSeen, setDashboardUpdateSeen] = useState<boolean>(false);
  const [settingsUpdateSeen, setSettingsUpdateSeen] = useState(false);
  const [lastUpdateVersionSeen, setLastUpdateVersionSeen] = useState<string>("");

  // Get native app version
  useEffect(() => {
    const getVersion = async () => {
      try {
        const info = await CapacitorApp.getInfo();
        if (info && info.version) {
          setAppVersion(info.version);
        }
      } catch (err) {
        console.error("[VersionCheck] Gagal mengambil info app:", err);
      } finally {
        setIsVersionLoaded(true);
      }
    };
    getVersion();
  }, []);

  // Load update settings from storage
  useEffect(() => {
    const loadUpdateSettings = async () => {
      try {
        const lastSeen = await storage.get("lastUpdateVersionSeen");
        if (lastSeen) setLastUpdateVersionSeen(lastSeen);
        
        const dismissed = await storage.get("dismissUpdateDashboard");
        if (dismissed === "true" || dismissed === true) setDashboardUpdateSeen(true);
      } catch (e) {
        console.error("[VersionCheck] Failed to load update settings:", e);
      }
    };
    if (isStorageReady) loadUpdateSettings();
  }, [isStorageReady]);

  const checkUpdate = useCallback(async () => {
    if (!isVersionLoaded) return;

    try {
      const info = await checkForUpdate(APP_VERSION);
      
      setUpdateError(info.isFetchSuccess === false ? (info.error || "Gagal fetch data") : "");
      
      setUpdateInfo({
        hasUpdate: info.hasUpdate,
        latestVersion: info.latestVersion || APP_VERSION,
        downloadUrl: info.downloadUrl || "",
        releaseDate: info.releaseDate,
        fileSize: info.fileSize,
        changelog: info.changelog,
        priority: info.priority,
      });

      if (info.hasUpdate && info.latestVersion && info.latestVersion !== lastUpdateVersionSeen) {
        setDashboardUpdateSeen(false);
        try {
          storage.remove("dismissUpdateDashboard");
          storage.set("lastUpdateVersionSeen", info.latestVersion);
        } catch {}
        setLastUpdateVersionSeen(info.latestVersion);
      }
      
      if (info.isFetchSuccess && !info.hasUpdate) {
        if (lastUpdateVersionSeen) {
          try {
            storage.remove("lastUpdateVersionSeen");
            storage.remove("dismissUpdateDashboard");
          } catch {}
          setLastUpdateVersionSeen("");
          setDashboardUpdateSeen(false);
        }
      }
    } catch (e) {
      console.error("[VersionCheck] Update check failed:", e);
      setUpdateError("Gagal memeriksa pembaruan");
    }
  }, [APP_VERSION, lastUpdateVersionSeen, isVersionLoaded]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.count("useUpdateManager: checkUpdate useEffect");
    }
    checkUpdate();
  }, [checkUpdate]);

  return {
    APP_VERSION,
    updateInfo,
    updateError,
    dashboardUpdateSeen,
    setDashboardUpdateSeen,
    settingsUpdateSeen,
    setSettingsUpdateSeen,
    checkUpdate
  };
};
