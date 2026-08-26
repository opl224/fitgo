
import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { App } from '@capacitor/app';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { BatteryOptimization } from '@capawesome-team/capacitor-android-battery-optimization';
import { registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { Capacitor } from '@capacitor/core';
import { RunMap } from "./RunMap";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");
import { 
  GeoPoint, 
  UnitSystem 
} from "../types";
import { 
  formatTime, 
  getDistanceDisplay, 
  getPaceDisplay, 
  getAltitudeDisplay 
} from "../utils";
import { CustomDialog } from "./CustomDialog";
import GriddyIcon from "./GriddyIcon";

export interface RunScreenProps {
  t: any;
  unitSystem: UnitSystem;
  currentLocation: GeoPoint | null;
  path: [number, number][] | GeoPoint[];
  isRunning: boolean;
  isFollowingUser: boolean;
  isZenMode: boolean;
  isGPSSearching: boolean;
  elapsedTime: number;
  distance: number;
  currentPace: number;
  totalGain: number;
  isSheetExpanded: boolean;
  gpsError: string | null;
  onBack: () => void;
  onToggleFollow: () => void;
  onToggleZenMode: () => void;
  onToggleSheet: () => void;
  onToggleRun: () => void;
  onFinishRun: () => void;
  isConfirmingBack: boolean;
  onCloseConfirmBack: () => void;
  onConfirmCancelRun: () => void;
  onStartRun: () => void;
  selectedRunType: string;
  selectedPresetName: string | null;
  targetPace: number | null;
  getTranslatedRunType: (type: string) => string;
  isDarkMode: boolean; // Add this
}

const RunScreen: React.FC<RunScreenProps> = ({
  t,
  unitSystem,
  currentLocation,
  path,
  isRunning,
  isFollowingUser,
  isZenMode,
  isGPSSearching,
  elapsedTime,
  distance,
  currentPace,
  totalGain,
  isSheetExpanded,
  gpsError,
  onBack,
  onToggleFollow,
  onToggleZenMode,
  onToggleSheet,
  onToggleRun,
  onFinishRun,
  isConfirmingBack,
  onCloseConfirmBack,
  onConfirmCancelRun,
  onStartRun,
  selectedRunType,
  getTranslatedRunType,
  isDarkMode, // Add this
}) => {
  const [satelliteCount, setSatelliteCount] = useState(0);

  // Permission & Battery Optimization State
  const [showPermissionAlert, setShowPermissionAlert] = useState(false);
  const [permissionAlertType, setPermissionAlertType] = useState<'location' | 'battery'>('location');
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);
  const [isWaitingForSettings, setIsWaitingForSettings] = useState(false);

  // Check Permissions & Battery on App Resume
  useEffect(() => {
    const handleAppStateChange = async (state: { isActive: boolean }) => {
      if (state.isActive && isWaitingForSettings) {
        setIsWaitingForSettings(false);
        // Re-check when coming back from settings
        // We add a small delay to ensure settings are applied
        setTimeout(() => {
          checkAndRequestAlwaysLocation();
        }, 1000);
      }
    };

    const listener = App.addListener('appStateChange', handleAppStateChange);
    return () => {
      listener.then(l => l.remove());
    };
  }, [isWaitingForSettings]);

  const checkAndRequestAlwaysLocation = async () => {
    setIsCheckingPermissions(true);
    try {
      // 1. Check Location Permission
      // We use BackgroundGeolocation plugin to check permissions first
      // Note: BackgroundGeolocation doesn't have a direct 'checkPermissions' method in the same way as Geolocation
      // Instead, we can try to start a watcher or rely on the OS to prompt when we start tracking.
      // However, for UX, we can check if we *can* get a location.
      // Or we can assume permissions are handled by the useTracking hook which calls addWatcher.
      // But here we want to proactively check before starting the run UI.
      
      // Let's try to get a single position to trigger permission check/prompt if needed
      // BackgroundGeolocation doesn't expose checkPermissions directly in the types we have seen, 
      // but it handles permissions internally when adding a watcher.
      // For this screen, we'll simulate the check by attempting to add a watcher briefly or just proceeding.
      // A better approach with this plugin is to rely on the error callback from addWatcher.
      
      // Since we replaced Geolocation.checkPermissions(), we'll skip the explicit check here 
      // and let the startRun logic (which calls useTracking -> addWatcher) handle it.
      // If addWatcher fails with NOT_AUTHORIZED, useTracking sets gpsError which we display.
      
      // However, to maintain the existing flow of "checking battery optimization", we keep that part.
      
      // 2. Check Battery Optimization (Android only)
      if (Capacitor.getPlatform() === 'android') {
        const { enabled } = await BatteryOptimization.isBatteryOptimizationEnabled();
        if (enabled) {
          setPermissionAlertType('battery');
          setShowPermissionAlert(true);
          setIsCheckingPermissions(false);
          return;
        }
      }

      // All good
      setShowPermissionAlert(false);
      onStartRun();

    } catch (error) {
      console.error("Error checking permissions:", error);
      // Fallback: just try to start run or show generic error
      alert(`${t.checkPermissionError}: ${(error as any).message || 'Unknown error'}`);
    } finally {
      setIsCheckingPermissions(false);
    }
  };

  const handleStartRun = () => {
    checkAndRequestAlwaysLocation();
  };

  const openSettings = async () => {
    setIsWaitingForSettings(true);
    try {
      if (permissionAlertType === 'location') {
        await NativeSettings.open({
          optionAndroid: AndroidSettings.Location, 
          optionIOS: IOSSettings.App 
        });
      } else {
        // Try to open battery optimization settings
        // If NativeSettings doesn't support it directly, we use the specific plugin
        // But user asked to use NativeSettings if possible. 
        // AndroidSettings.BatteryOptimization might be available.
        // If not, we fall back to BatteryOptimization plugin.
        try {
           await NativeSettings.openAndroid({
             option: AndroidSettings.BatteryOptimization
           });
        } catch {
           await BatteryOptimization.openBatteryOptimizationSettings();
        }
      }
    } catch (error) {
      console.error("Error opening settings:", error);
      setIsWaitingForSettings(false);
      alert("Tidak dapat membuka pengaturan. Silakan buka pengaturan secara manual.");
    }
  };

  useEffect(() => {
    if (isGPSSearching) {
      const interval = setInterval(() => {
        setSatelliteCount(prev => {
          const next = prev + (Math.random() > 0.5 ? 1 : -1);
          return Math.max(3, Math.min(12, next));
        });
      }, 2000);
      setSatelliteCount(Math.floor(Math.random() * 5) + 3);
      return () => clearInterval(interval);
    } else {
      setSatelliteCount(0);
    }
  }, [isGPSSearching]);

  const distDisplay = useMemo(() => getDistanceDisplay(distance, unitSystem), [distance, unitSystem]);
  const paceDisplay = useMemo(() => getPaceDisplay(currentPace, unitSystem), [currentPace, unitSystem]);
  const gainDisplay = useMemo(() => getAltitudeDisplay(totalGain, unitSystem), [totalGain, unitSystem]);

  const speedKmh = useMemo(() => {
    if (elapsedTime <= 0) return "0.0";
    const speed = (distance / (elapsedTime / 3600));
    return speed.toFixed(1);
  }, [distance, elapsedTime]);

  const calories = useMemo(() => {
    // Approx 60 kcal per km for a 70kg runner
    return Math.floor(distance * 60);
  }, [distance]);

  const statsBg = isDarkMode ? "bg-gray-900/90" : "bg-white/95";
  const statsBorder = isDarkMode ? "border-gray-800" : "border-gray-100";
  const statsTextPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const statsTextSecondary = isDarkMode ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`fixed inset-0 overflow-hidden flex flex-col ${isDarkMode ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Map Layer */}
      <div className="absolute inset-0 z-0">
        <RunMap
          currentLocation={currentLocation}
          path={path}
          isFollowingUser={isFollowingUser}
          isSheetExpanded={isSheetExpanded}
          isDarkMode={isDarkMode}
          isZenMode={isZenMode}
          onToggleFollow={onToggleFollow}
          onToggleZenMode={onToggleZenMode}
          isGPSSearching={isGPSSearching}
          t={t}
        />
      </div>

      {/* Header Overlay */}
      <div className={`absolute top-0 inset-x-0 z-20 p-6`}>
        <div className="flex items-center justify-between gap-4">
          <div className={`transition-all duration-500 ${isZenMode ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100'}`}>
            <button
              onClick={onBack}
              className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg transition-all duration-300 active:scale-95 ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-300 active:bg-gray-700' 
                  : 'bg-white text-gray-700 active:bg-gray-50'
              }`}
            >
              <GriddyIcon name="ArrowLeft" size={24} />
            </button>
          </div>

          {/* Interactive GPS Status Button */}
          <div className="flex-1 flex justify-center items-center">
            <button
              onClick={onToggleFollow}
              className={`h-11 px-6 rounded-full flex items-center gap-3 shadow-lg transition-all duration-300 active:scale-95 ${
                isDarkMode 
                  ? 'bg-gray-800/90 text-white backdrop-blur-md active:bg-gray-700' 
                  : 'bg-white/90 text-gray-900 backdrop-blur-md active:bg-gray-50'
              } ${isFollowingUser ? 'opacity-100' : 'opacity-70 grayscale-[0.5]'}`}
            >
              <div className="flex items-center gap-2">
                <GriddyIcon 
                  name="Signal"
                  size={16} 
                  className={gpsError 
                    ? "text-red-500" 
                    : isGPSSearching 
                      ? (isDarkMode ? "text-yellow-400 animate-pulse" : "text-yellow-600 animate-pulse") 
                      : (isDarkMode ? "text-green-400" : "text-green-600")
                  } 
                />
                <span className={`text-[13px] font-black tracking-[0.15em] whitespace-nowrap ${gpsError ? 'text-red-500' : ''}`}>
                  GPS{satelliteCount > 0 && !gpsError ? satelliteCount : ''} {gpsError ? 'ERR' : isGPSSearching ? (t.searching?.replace('...', '') || 'SEARCHING') : 'OK'}
                </span>
              </div>
            </button>
          </div>

          <button 
            onClick={onToggleZenMode}
            className={`w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg transition-all duration-300 active:scale-95 ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-300 active:bg-gray-700' 
                : 'bg-white text-gray-700 active:bg-gray-50'
            }`}
          >
            {isZenMode ? <GriddyIcon name="Minimize" size={24} /> : <GriddyIcon name="Maximize" size={24} />}
          </button>
        </div>
      </div>

      {/* Zen Mode Overlay */}
      <AnimatePresence>
        {isZenMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-end pb-12 px-6"
          >
            {/* Zen Stats Card (Only Duration & Distance) */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`w-full max-w-md ${statsBg} backdrop-blur-xl rounded-[40px] ${statsBorder} border shadow-2xl p-8 mb-6 pointer-events-auto`}
            >
              <div className="flex items-center justify-between gap-6">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${statsTextSecondary} mb-1 truncate w-full text-center`}>{t.duration || "DURATION"}</span>
                  <span className={`text-5xl font-black tabular-nums tracking-tighter ${statsTextPrimary} leading-none`}>
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                
                <div className={`w-px h-10 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} shrink-0`} />

                <div className="flex flex-col items-center flex-1 min-w-0">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${statsTextSecondary} mb-1 truncate w-full text-center`}>{t.distance || "DISTANCE"}</span>
                  <div className="flex items-baseline gap-1 justify-center w-full">
                    <span className="text-5xl font-black text-blue-600 tabular-nums tracking-tighter leading-none">
                      {distDisplay.value}
                    </span>
                    <span className="text-xs font-black text-blue-600/50 uppercase">
                      {distDisplay.unit}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Zen Controls (Outside the Card) */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full max-w-md pointer-events-auto"
            >
              {!isRunning && elapsedTime > 0 ? (
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={onToggleRun}
                    className="flex-1 h-20 bg-blue-600 text-white rounded-[32px] flex items-center justify-center gap-4 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <GriddyIcon name="Play" size={28} filled />
                    <span className="text-2xl font-black uppercase tracking-widest">{t.resume}</span>
                  </button>
                  
                  <button
                    onClick={onFinishRun}
                    className="w-20 h-20 bg-red-600 text-white rounded-[32px] flex items-center justify-center shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                    aria-label="Stop"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg shadow-sm" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={isRunning ? onToggleRun : handleStartRun}
                  className={`w-full h-20 rounded-[32px] flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all ${
                    isRunning 
                      ? 'bg-[#FFA500] text-white shadow-[#FFA500]/20'
                      : 'bg-blue-600 text-white shadow-blue-600/20'
                  }`}
                >
                  {isRunning ? (
                    <div className="flex items-center justify-center gap-4">
                      <GriddyIcon name="Pause" size={28} filled />
                      <span className="text-2xl font-black uppercase tracking-widest">{t.pause || "PAUSE"}</span>
                    </div>
                  ) : (
                    <>
                      <GriddyIcon name="Play" size={28} filled className="ml-1" />
                      <span className="text-2xl font-black uppercase tracking-widest">{t.startRun || "START RUN"}</span>
                    </>
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Card */}
      {!isZenMode && (
        <motion.div
          initial={false}
          animate={{ 
            height: isSheetExpanded ? "auto" : "280px",
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="absolute bottom-0 inset-x-0 z-30 bg-white dark:bg-gray-900 rounded-t-[48px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] border-t border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden"
        >
          {/* Handle */}
          <div 
            onClick={onToggleSheet}
            className="w-full h-8 flex items-center justify-center cursor-pointer pt-2 pb-1"
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full opacity-50" />
          </div>

          <div className="px-8 pb-10 pt-2 flex flex-col flex-1">
            {/* Primary Stats (Always visible) */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex flex-col">
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] mb-1">
                  {t.duration || "DURATION"}
                </p>
                <div className="text-6xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter leading-none">
                  {formatTime(elapsedTime)}
                </div>
              </div>

              <div className="flex flex-col items-end min-w-0">
                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] mb-1">
                  {t.distance || "DISTANCE"}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black text-blue-600 tabular-nums tracking-tighter leading-none">
                    {distDisplay.value}
                  </span>
                  <span className="text-sm font-black text-blue-600/40 uppercase">
                    {distDisplay.unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Stats Grid (Expanded Only) */}
            <AnimatePresence>
              {isSheetExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="grid grid-cols-2 gap-4 mb-10"
                >
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800/50 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-2 text-blue-500">
                      <GriddyIcon name="Steps" size={16} />
                      <p className="text-[11px] font-black uppercase tracking-widest truncate">{t.speed || "SPEED"}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{speedKmh}</span>
                      <span className="text-xs font-black text-gray-400 uppercase">KM/H</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800/50 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-2 text-orange-500">
                      <GriddyIcon name="Flame" size={16} />
                      <p className="text-[11px] font-black uppercase tracking-widest truncate">{t.calories || "CALORIES"}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{calories}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800/50 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-2 text-amber-500">
                      <GriddyIcon name="Mountain" size={16} />
                      <p className="text-[11px] font-black uppercase tracking-widest truncate">{t.gain || "GAIN"}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{gainDisplay.value}</span>
                      <span className="text-xs font-black text-gray-400 uppercase">{gainDisplay.unit}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800/50 flex flex-col min-w-0">
                    <div className="flex items-center gap-2 mb-2 text-purple-500">
                      <GriddyIcon name="Gauge" size={16} />
                      <p className="text-[11px] font-black uppercase tracking-widest truncate">{t.pace || "PACE"}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">{paceDisplay.value}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="mt-auto">
              {!isRunning && elapsedTime > 0 ? (
                // Horizontal Controls for Pause State (Standard Mode)
                <div className="flex items-center gap-4 w-full">
                  <button
                    onClick={onToggleRun}
                    className="flex-1 h-20 bg-blue-600 text-white rounded-[32px] flex items-center justify-center gap-4 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <GriddyIcon name="Play" size={28} filled />
                    <span className="text-2xl font-black uppercase tracking-widest">{t.resume}</span>
                  </button>
                  
                  <button
                    onClick={onFinishRun}
                    className="w-20 h-20 bg-red-600 text-white rounded-[32px] flex items-center justify-center shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                    aria-label="Stop"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg shadow-sm" />
                  </button>
                </div>
              ) : (
                // Single Button for Start/Pause (Standard Mode)
                <button
                  onClick={isRunning ? onToggleRun : handleStartRun}
                  disabled={isCheckingPermissions || isWaitingForSettings}
                  className={`w-full h-20 rounded-[32px] flex items-center justify-center gap-4 shadow-lg transition-all active:scale-95 ${
                    isCheckingPermissions || isWaitingForSettings
                      ? 'bg-gray-400 cursor-wait'
                      : isRunning 
                        ? 'bg-[#FFA500] text-white shadow-[#FFA500]/20' 
                        : 'bg-blue-600 text-white shadow-blue-600/20'
                  }`}
                >
                  {isCheckingPermissions || isWaitingForSettings ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-xl font-black uppercase tracking-widest">
                        {isWaitingForSettings ? (t.waiting || "Menunggu...") : (t.checking || "Memeriksa...")}
                      </span>
                    </div>
                  ) : isRunning ? (
                    <div className="flex items-center justify-center gap-4">
                      <GriddyIcon name="Pause" size={28} filled className="fill-white" />
                      <span className="text-2xl font-black uppercase tracking-widest">{t.pause}</span>
                    </div>
                  ) : (
                    <>
                      <GriddyIcon name="Play" size={28} filled className="ml-1 fill-white" />
                      <span className="text-2xl font-black uppercase tracking-widest">{t.startRun}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Back Confirmation Dialog */}
      <CustomDialog
        isOpen={isConfirmingBack}
        onClose={onCloseConfirmBack}
        onConfirm={onConfirmCancelRun}
        title={t.cancelRun || "Cancel Run?"}
        message={t.cancelRunDesc || "Your progress will not be saved."}
        confirmText={t.confirm || "Yes, Cancel"}
        cancelText={t.keepRunning || "Keep Running"}
        type="danger"
      />

      {/* Permission & Battery Dialog */}
      <CustomDialog
        isOpen={showPermissionAlert}
        onClose={() => setShowPermissionAlert(false)}
        onConfirm={openSettings}
        title={permissionAlertType === 'location' ? t.locationPermissionTitle : t.batteryOptimizationTitle}
        message={
          permissionAlertType === 'location' 
            ? t.locationPermissionDesc
            : t.batteryOptimizationLongDesc
        }
        confirmText={permissionAlertType === 'location' ? t.openSettings : t.openBatterySettings}
        cancelText={t.cancel}
        type="info"
      />
    </div>
  );
};

export default RunScreen;
