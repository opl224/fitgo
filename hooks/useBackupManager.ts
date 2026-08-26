import { useState } from "react";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share as CapacitorShare } from "@capacitor/share";
import { triggerHaptic } from "../utils";
import { Language, UnitSystem, RunSession, AudioCuesSettings } from "../types";

/**
 * Custom hook to handle exporting and importing user data.
 */
export const useBackupManager = (
  userName: string,
  runHistory: RunSession[],
  language: Language,
  unitSystem: UnitSystem,
  profilePhoto: string | null,
  audioCues: AudioCuesSettings,
  appVersion: string,
  t: any,
  setUserName: (val: string) => void,
  setRunHistory: (val: RunSession[]) => void,
  setUnitSystem: (val: UnitSystem) => void,
  setProfilePhoto: (val: string | null) => void,
  setAudioCues: (val: AudioCuesSettings) => void
) => {
  const [isExportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDialogMsg, setExportDialogMsg] = useState("");
  const [exportDialogType, setExportDialogType] = useState<"success" | "danger" | "info">("success");

  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [importDialogMsg, setImportDialogMsg] = useState("");
  const [importDialogType, setImportDialogType] = useState<"success" | "danger" | "info">("success");

  const handleExportData = async () => {
    try {
      const backupData = {
        userName,
        runHistory,
        language,
        unitSystem,
        profilePhoto,
        audioCues,
        userPhysicalProfile: JSON.parse(localStorage.getItem("userPhysicalProfile") || "null"),
        exportDate: new Date().toISOString(),
        appVersion: appVersion,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const filename = `fitgo-backup-${new Date().toISOString().split("T")[0]}.json`;
      const platform = (window as any).Capacitor?.getPlatform() || "web";

      if (platform !== "web") {
        const result = await Filesystem.writeFile({
          path: filename,
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        await CapacitorShare.share({
          title: "Fit Go Backup",
          text: "My FitGo activity backup",
          url: result.uri,
          dialogTitle: "Share Backup File",
        });

        triggerHaptic(100);
        setExportDialogMsg(t.exportSuccess || "Cadangan berhasil dibuat");
        setExportDialogType("success");
        setExportDialogOpen(true);
        return;
      }

      // Web fallback
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerHaptic(100);
      setExportDialogMsg(t.exportSuccess || "Cadangan disimpan ke folder Unduhan");
      setExportDialogType("success");
      setExportDialogOpen(true);
    } catch (error: any) {
      // User cancelled share sheet - common on Android/iOS
      if (error.message?.includes("User cancelled") || error.message?.includes("Share canceled")) {
        console.log("Export share cancelled by user");
        return;
      }
      
      console.error("Export failed:", error);
      setExportDialogMsg(t.exportError || "Gagal mengekspor data.");
      setExportDialogType("danger");
      setExportDialogOpen(true);
    }
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        if (!importedData.runHistory) throw new Error("Format file tidak valid");

        if (importedData.userName) setUserName(importedData.userName);
        if (importedData.runHistory) setRunHistory(importedData.runHistory);
        if (importedData.unitSystem) setUnitSystem(importedData.unitSystem);
        if (importedData.profilePhoto) setProfilePhoto(importedData.profilePhoto);
        if (importedData.audioCues) setAudioCues(importedData.audioCues);

        setImportDialogMsg(t.importSuccess);
        setImportDialogType("success");
        setImportDialogOpen(true);
        triggerHaptic([50, 50, 50]);
      } catch (error) {
        console.error("Import failed:", error);
        setImportDialogMsg(t.importError);
        setImportDialogType("danger");
        setImportDialogOpen(true);
      }
    };
    reader.readAsText(file);
  };

  return {
    isExportDialogOpen,
    setExportDialogOpen,
    exportDialogMsg,
    exportDialogType,
    isImportDialogOpen,
    setImportDialogOpen,
    importDialogMsg,
    importDialogType,
    handleExportData,
    handleImportData
  };
};
