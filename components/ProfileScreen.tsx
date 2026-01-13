import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Camera as CameraIcon,
  User,
  Check,
  Moon,
  Globe,
  Ruler,
  Map as MapIcon,
  Share2,
  ExternalLink,
  Volume2,
  Clock,
  Plus,
  Trash2,
  Tally4,
  ShieldCheck,
  ChevronRight,
  Activity,
  Milestone,
  Timer,
  Info,
} from "lucide-react";
import { Language, UnitSystem, AudioCuesSettings, PaceZone } from "../types";

interface ProfileScreenProps {
  onBack: () => void;
  userName: string;
  setUserName: (name: string) => void;
  profilePhoto: string | null;
  setProfilePhoto: (photo: string | null) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  unitSystem: UnitSystem;
  setUnitSystem: (system: UnitSystem) => void;
  customDistanceUnit: string;
  setCustomDistanceUnit: (u: string) => void;
  customAltitudeUnit: string;
  setCustomAltitudeUnit: (u: string) => void;
  audioCues: AudioCuesSettings;
  setAudioCues: (settings: AudioCuesSettings) => void;
  paceZones: PaceZone[];
  setPaceZones: (zones: PaceZone[]) => void;
  onClearCache: () => void;
  t: any; // Translation object
  onOpenAbout: () => void;
  // Update Props
  appVersion?: string;
  updateInfo?: {
    hasUpdate: boolean;
    latestVersion: string;
    downloadUrl: string;
    isSeen: boolean;
  };
  onAckUpdate?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  userName,
  setUserName,
  profilePhoto,
  setProfilePhoto,
  isDarkMode,
  setIsDarkMode,
  language,
  setLanguage,
  unitSystem,
  setUnitSystem,
  customDistanceUnit,
  setCustomDistanceUnit,
  customAltitudeUnit,
  setCustomAltitudeUnit,
  audioCues,
  setAudioCues,
  paceZones,
  setPaceZones,
  onClearCache,
  t,
  onOpenAbout,
  appVersion = "1.0.0",
  updateInfo = { hasUpdate: false, latestVersion: "1.0.0", downloadUrl: "", isSeen: false },
  onAckUpdate,
}) => {
  const [editNameValue, setEditNameValue] = useState(userName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = () => {
    const finalName = editNameValue.trim().slice(0, 9);
    if (finalName) {
      setUserName(finalName);
      localStorage.setItem("userName", finalName);
      setEditNameValue(finalName);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePhoto(base64);
        localStorage.setItem("profilePhoto", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleAudioCue = (key: keyof AudioCuesSettings) => {
    setAudioCues({ ...audioCues, [key]: !audioCues[key] });
  };

  const setFrequency = (freq: number) => {
    setAudioCues({ ...audioCues, alertFrequency: freq });
  };

  return (
    <div className="h-screen w-screen bg-white dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden">
      <div className="p-6 pt-12 flex items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-20 rounded-b-[64px] shadow-xl pb-12 transition-all">
        <button
          onClick={onBack}
          className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="mx-auto font-black text-xl text-gray-800 dark:text-white uppercase tracking-[0.2em]">
          {t.settings}
        </span>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24 -mt-4 transition-all z-10">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-xl">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User
                    size={56}
                    className="text-gray-300 dark:text-gray-600"
                  />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white dark:border-gray-900"
            >
              <CameraIcon size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {t.name}
            </label>
            <div className="flex gap-3">
              <input
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                maxLength={9}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-5 py-4 dark:text-white focus:ring-2 ring-blue-500 shadow-sm"
                placeholder={t.namePlaceholder}
              />
              <button
                onClick={saveProfile}
                className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                <Check size={20} />
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                  <Moon size={20} />
                </div>
                <span className="font-bold dark:text-white">{t.darkMode}</span>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-14 h-8 rounded-full p-1 transition-colors ${isDarkMode ? "bg-blue-600" : "bg-gray-300"
                  }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isDarkMode ? "translate-x-6" : ""
                    }`}
                ></div>
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400">
                    <Volume2 size={20} />
                  </div>
                  <span className="font-bold dark:text-white">
                    {t.audioCues}
                  </span>
                </div>
                <button
                  onClick={() => toggleAudioCue("enabled")}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${audioCues.enabled ? "bg-blue-600" : "bg-gray-300"
                    }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${audioCues.enabled ? "translate-x-6" : ""
                      }`}
                  ></div>
                </button>
              </div>

              <div
                className={`px-5 pb-5 space-y-4 transition-all duration-300 origin-top ${audioCues.enabled
                  ? "max-h-[500px] opacity-100 mt-2"
                  : "max-h-0 opacity-0"
                  }`}
              >
                <div className="h-px bg-gray-200 dark:bg-gray-700 w-full mb-4"></div>

                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Activity size={16} className="text-gray-400" />
                    <span className="text-sm font-bold dark:text-white uppercase tracking-wider text-xs">
                      {t.paceAlerts}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleAudioCue("paceAlerts")}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors ${audioCues.paceAlerts ? "bg-blue-500" : "bg-gray-300"
                      }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${audioCues.paceAlerts ? "translate-x-4" : ""
                        }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Activity size={16} className="text-gray-400 rotate-90" />
                    <span className="text-sm font-bold dark:text-white uppercase tracking-wider text-xs">
                      {t.milestoneAlerts}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleAudioCue("distanceMilestones")}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors ${audioCues.distanceMilestones
                      ? "bg-blue-500"
                      : "bg-gray-300"
                      }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${audioCues.distanceMilestones ? "translate-x-4" : ""
                        }`}
                    ></div>
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Timer size={16} className="text-gray-400" />
                    <span className="text-sm font-bold dark:text-white uppercase tracking-wider text-xs">
                      {t.alertFrequency}
                    </span>
                  </div>
                  <div className="flex gap-2 bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-xl">
                    {[60, 120, 300].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFrequency(f)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${audioCues.alertFrequency === f
                          ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm"
                          : "text-gray-500"
                          }`}
                      >
                        {f === 60
                          ? t.everyMinute
                          : f === 120
                            ? t.everyTwoMinutes
                            : t.everyFiveMinutes}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
                  <Globe size={20} />
                </div>
                <span className="font-bold dark:text-white">{t.language}</span>
              </div>
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-xl p-1.5">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${language === "en"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-white"
                    : "text-gray-500"
                    }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("id")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${language === "id"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-white"
                    : "text-gray-500"
                    }`}
                >
                  ID
                </button>
                <button
                  onClick={() => setLanguage("jp")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${language === "jp"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-white"
                    : "text-gray-500"
                    }`}
                >
                  JP
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <MapIcon size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold dark:text-white">
                    {t.offlineMaps}
                  </span>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    {t.cacheInfo}
                  </span>
                </div>
              </div>
              <button
                onClick={onClearCache}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl active:scale-95 transition-all"
              >
                <span className="text-xs font-black">{t.clearCache}</span>
              </button>
            </div>

            {/* App Version / Update Row */}
            <button
              onClick={() => {
                if (updateInfo.hasUpdate) {
                  if (onAckUpdate) onAckUpdate();
                  window.open(updateInfo.downloadUrl, "_blank");
                }
              }}
              className={`flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98] group ${updateInfo.hasUpdate
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800"
                }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${updateInfo.hasUpdate
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}>
                  <ShieldCheck size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold dark:text-white">
                    App Version
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      v{appVersion}
                    </span>
                    {updateInfo.hasUpdate && (
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-wider animate-pulse">
                        • UPDATE v{updateInfo.latestVersion}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {updateInfo.hasUpdate ? (
                <div className="relative">
                  <ExternalLink size={20} className="text-blue-600 dark:text-blue-400" />
                  {!updateInfo.isSeen && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-gray-900 animate-bounce"></div>
                  )}
                </div>
              ) : (
                <span className="text-xs font-bold text-gray-400">
                  Latest
                </span>
              )}
            </button>

            <button
              onClick={onOpenAbout}
              className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Info size={20} />
                </div>
                <span className="font-bold dark:text-white">{t.about}</span>
              </div>
              <ChevronRight
                size={20}
                className="text-gray-400 group-hover:translate-x-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
