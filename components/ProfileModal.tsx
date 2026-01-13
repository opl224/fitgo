import React, { useState, useRef } from "react";
import {
  X,
  Camera,
  User,
  Check,
  Moon,
  Globe,
  Ruler,
  Map as MapIcon,
} from "lucide-react";
import { Language, UnitSystem } from "../types";

interface ProfileModalProps {
  onClose: () => void;
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
  t: any; // Translation object
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  onClose,
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
  t,
}) => {
  const [editNameValue, setEditNameValue] = useState(userName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProfile = () => {
    const finalName = editNameValue.trim().slice(0, 9);
    if (finalName) {
      setUserName(finalName);
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

  const clearMapCache = async () => {
    if ("caches" in window) {
      try {
        const keys = await caches.keys();
        for (const key of keys) {
          if (key.includes("gemini-run-map-cache")) {
            await caches.delete(key);
          }
        }
        alert(t.cacheCleared);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-900 w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-[slideUp_0.3s_ease-out] overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold dark:text-white">{t.settings}</h3>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"
          >
            <X size={20} className="dark:text-white" />
          </button>
        </div>

        <div className="space-y-6 pb-6">
          {/* Profile Photo Upload */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 border-4 border-white dark:border-gray-700 shadow-md">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User
                      size={40}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
              >
                <Camera size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{t.changePhoto}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-500 uppercase">
              {t.name}
            </label>
            <div className="flex gap-2">
              <input
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 dark:text-white focus:ring-2 ring-blue-500"
                placeholder={t.namePlaceholder}
              />
              <button
                onClick={saveProfile}
                className="bg-blue-600 text-white p-3 rounded-xl"
              >
                <Check size={20} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Moon size={20} />
              </div>
              <span className="font-semibold dark:text-white">
                {t.darkMode}
              </span>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                isDarkMode ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  isDarkMode ? "translate-x-5" : ""
                }`}
              ></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <Globe size={20} />
              </div>
              <span className="font-semibold dark:text-white">
                {t.language}
              </span>
            </div>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${
                  language === "en"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm"
                    : "text-gray-500"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("id")}
                className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${
                  language === "id"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm"
                    : "text-gray-500"
                }`}
              >
                ID
              </button>
            </div>
          </div>

          {/* Unit System Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                <Ruler size={20} />
              </div>
              <span className="font-semibold dark:text-white">{t.units}</span>
            </div>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setUnitSystem("metric")}
                className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${
                  unitSystem === "metric"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm"
                    : "text-gray-500"
                }`}
              >
                {t.unitKm}
              </button>
              <button
                onClick={() => setUnitSystem("imperial")}
                className={`px-3 py-1 rounded-md text-sm font-bold transition-all ${
                  unitSystem === "imperial"
                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm"
                    : "text-gray-500"
                }`}
              >
                {t.unitMi}
              </button>
            </div>
          </div>

          {/* Offline Maps Section */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <MapIcon size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold dark:text-white">
                  {t.offlineMaps}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                  {t.cacheInfo}
                </span>
              </div>
            </div>
            <button
              onClick={clearMapCache}
              className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg active:scale-95 transition-transform"
            >
              <span className="text-xs font-bold px-2">{t.clearCache}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
