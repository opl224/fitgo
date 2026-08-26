import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { handleBackHandlers } from "./utils/backButtonService";
import { Filesystem } from "@capacitor/filesystem";
import { storage } from "./utils/secureStorage";
import { 
  RunSession, 
  Screen 
} from "./types";
import { languageService } from "./utils/languageService";
import { useOnlineStatus } from "./utils/connectivity";
import { triggerHaptic } from "./utils";

// Custom Hooks
import { useAppState } from "./hooks/useAppState";
import { useTracking } from "./hooks/useTracking";
import { useWeather } from "./hooks/useWeather";
import { useUpdateManager } from "./hooks/useUpdateManager";
import { useBackupManager } from "./hooks/useBackupManager";

// Components
import { ErrorBoundary } from "./components/ErrorBoundary";
import AppRouter from "./components/AppRouter";

const App: React.FC = () => {
  // --- Core App State ---
  const {
    currentScreen, setCurrentScreen,
    language, setLanguage,
    userName, setUserName,
    runHistory, setRunHistory,
    isDarkMode, setIsDarkMode,
    unitSystem, setUnitSystem,
    profilePhoto, setProfilePhoto,
    audioCues, setAudioCues,
    hasSeenTour, setHasSeenTour,
    isStorageReady
  } = useAppState();

  const [isLanguageReady, setIsLanguageReady] = useState(false);

  // Sync language readiness
  useEffect(() => {
    const unsub = languageService.subscribe(() => {
      setIsLanguageReady(true);
    });
    // Check initial readiness
    if (Object.keys((languageService as any).translations || {}).length > 0) {
      setIsLanguageReady(true);
    }
    return unsub;
  }, []);

  const { isOnline, isStable } = useOnlineStatus();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [profileUpdateCounter, setProfileUpdateCounter] = useState(0);

  // Cold Start & App State Management
  useEffect(() => {
    const subscription = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App resumed from background - check if we need to refresh heavy data
        console.log("[App] Resumed. Checking state...");
        if (!isRunning) {
          // If not running, we can safely clear some visual buffers
          // to keep memory low after long background periods
        }
      }
    });

    return () => {
      subscription.then(h => h.remove());
    };
  }, [isRunning]);

  // Translation helper
  const t = new Proxy({} as any, {
    get: (_, prop: string) => languageService.t(prop as any)
  });

  // --- Feature Managers (Hooks) ---
  const { 
    weather, 
    isWeatherLoading, 
    fetchWeather 
  } = useWeather(language, isOnline, isStable, isInitialLoad, isRefreshing);

  const {
    APP_VERSION,
    updateInfo,
    updateError,
    dashboardUpdateSeen,
    setDashboardUpdateSeen,
    settingsUpdateSeen,
    setSettingsUpdateSeen,
    checkUpdate
  } = useUpdateManager(isStorageReady);

  const onSessionFinish = useCallback((session: RunSession) => {
    const updatedHistory = [session, ...runHistory];
    setRunHistory(updatedHistory);
    setSelectedSession(session);
    
    // Determine the source screen for Summary
    const isWorkout = !session.path || session.path.length === 0;
    setPrevScreen(isWorkout ? "workout" : "run");
    
    setCurrentScreen("summary");
  }, [runHistory, setRunHistory, setCurrentScreen]);

  const {
    elapsedTime,
    distance,
    totalGain,
    currentPace,
    path,
    currentLocation,
    currentAccuracy,
    isGPSSearching,
    gpsError,
    handleFinishRun,
    confirmCancelRun
  } = useTracking(
    isRunning,
    setIsRunning,
    unitSystem,
    t,
    runHistory,
    setRunHistory,
    onSessionFinish
  );

  const {
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
  } = useBackupManager(
    userName,
    runHistory,
    language,
    unitSystem,
    profilePhoto,
    audioCues,
    APP_VERSION,
    t,
    setUserName,
    setRunHistory,
    setUnitSystem,
    setProfilePhoto,
    setAudioCues
  );

  // --- UI & Navigation State ---
  const [selectedSession, setSelectedSession] = useState<RunSession | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);
  const [isConfirmingBack, setIsConfirmingBack] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [sheetVelocity, setSheetVelocity] = useState(0);
  const [sheetHeightPx, setSheetHeightPx] = useState(0);
  const [showExitToast, setShowExitToast] = useState(false);
  
  // Dashboard Preparation State
  const [selectedRunType, setSelectedRunType] = useState<string>("outdoorRun");
  const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);
  const [targetPace, setTargetPace] = useState<number | null>(null);

  const sheetRef = useRef<HTMLDivElement>(null);
  const exitPressTimeRef = useRef<number>(0);
  const EXIT_TIMEOUT = 2000;

  // --- Effects ---
  useEffect(() => {
    // Request permissions on startup
    const requestInitialPermissions = async () => {
      try {
        const platform = (window as any).Capacitor?.getPlatform() || "web";
        if (platform !== "web") {
          try {
            await Filesystem.requestPermissions();
          } catch {}
        }
      } catch (e) {
        console.warn("Permission request failed on startup", e);
      }
    };
    requestInitialPermissions();
  }, []);

  useEffect(() => {
    if (isStorageReady && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [isStorageReady, isInitialLoad]);

  // Fail-safe: Force load after timeout to prevent infinite loading
  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        console.warn("[App] Initial load timed out. Forcing UI display.");
        setIsInitialLoad(false);
      }, 5000); // 5 seconds fail-safe
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);

  useEffect(() => {
    if (currentLocation && !weather && isOnline && isStable) {
      fetchWeather(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation, weather, fetchWeather, isOnline, isStable]);

  // --- Handlers ---
  const handleGlobalRefresh = useCallback(async () => {
    if (isRefreshing || !isOnline || !isStable) return;
    setIsRefreshing(true);
    try {
      // Validate local storage integrity during refresh
      const isInitialized = localStorage.getItem("FITGO_INITIALIZED_V1");
      if (!isInitialized) {
        console.warn("Integrity check failed: App not initialized correctly");
      }

      if (currentLocation) {
        await fetchWeather(currentLocation.latitude, currentLocation.longitude);
      }
      await checkUpdate();
      triggerHaptic(100);
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error("[Refresh] Failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, isOnline, isStable, currentLocation, fetchWeather, checkUpdate]);

  const handleBackRequest = useCallback(() => {
    // Check if any specialized back handlers want to handle this
    if (handleBackHandlers()) {
      return;
    }

    if (currentScreen === "run" && (isRunning || elapsedTime > 0)) {
      setIsConfirmingBack(true);
      return;
    }

    if (currentScreen === "summary" && prevScreen) {
      setCurrentScreen(prevScreen);
      setPrevScreen(null);
      return;
    }

    if (["terms"].includes(currentScreen)) {
      setCurrentScreen("about");
      return;
    }
    
    if (currentScreen === "about") {
      setCurrentScreen("profile");
      return;
    }

    if (currentScreen === "calorie" || currentScreen === "chatbot") {
      setCurrentScreen(prevScreen || "dashboard");
      setPrevScreen(null);
      return;
    }

    if (currentScreen === "dashboard") {
      const now = Date.now();
      if (now - exitPressTimeRef.current < EXIT_TIMEOUT) {
        try { CapacitorApp.exitApp(); } catch {}
        return;
      }
      exitPressTimeRef.current = now;
      setShowExitToast(true);
      setTimeout(() => setShowExitToast(false), EXIT_TIMEOUT);
      return;
    }

    setCurrentScreen("dashboard");
  }, [currentScreen, isRunning, elapsedTime, prevScreen, setCurrentScreen]);

  useEffect(() => {
    const listener = CapacitorApp.addListener("backButton", handleBackRequest);
    
    // Deep Link Handling
    const urlListener = CapacitorApp.addListener("appUrlOpen", (data: any) => {
      const url = data.url;
      if (url.includes("calorie/history")) {
        setPrevScreen(currentScreen);
        setCurrentScreen("calorie");
        localStorage.setItem("force_show_calorie_history", "true");
      }
    });

    return () => { 
      listener.then(l => l.remove());
      urlListener.then(l => l.remove());
    };
  }, [handleBackRequest, currentScreen]);

  const getTranslatedRunTypeLocal = useCallback((type: string) => {
    if (!type) return t.outdoorRun;
    if (t[type]) return t[type];
    return type;
  }, [t]);

  const calorieUserProfile = useMemo(() => ({
    gender: (localStorage.getItem("gender") as any) || "male",
    age: Number(localStorage.getItem("age")) || 25,
    weight: Number(localStorage.getItem("weight")) || 70,
    height: Number(localStorage.getItem("height")) || 170,
    activityLevel: (localStorage.getItem("activityLevel") as any) || "moderate",
    goal: (localStorage.getItem("goal") as any) || "health",
    hasInjury: localStorage.getItem("hasInjury") === "true",
    frequency: Number(localStorage.getItem("frequency")) || 3,
  }), [currentScreen, profileUpdateCounter]);

  const handleNavigate = useCallback((screen: Screen) => {
    // When navigating to screens that should return to the current screen
    if (["calorie", "summary", "about", "chatbot"].includes(screen)) {
      setPrevScreen(currentScreen);
    }
    setCurrentScreen(screen);
  }, [currentScreen, setCurrentScreen]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-black transition-colors font-sans antialiased overflow-hidden">
        <AppRouter
          currentScreen={currentScreen}
          t={t}
          userName={userName}
          weather={weather}
          isOnline={isOnline}
          isStable={isStable}
          profilePhoto={profilePhoto}
          runHistory={runHistory}
          unitSystem={unitSystem}
          language={language}
          isWeatherLoading={isWeatherLoading}
          isInitialLoad={isInitialLoad}
          isRefreshing={isRefreshing}
          updateInfo={updateInfo}
          dashboardUpdateSeen={dashboardUpdateSeen}
          settingsUpdateSeen={settingsUpdateSeen}
          currentLocation={currentLocation}
          path={path}
          isRunning={isRunning}
          isFollowingUser={isFollowingUser}
          isZenMode={isZenMode}
          isGPSSearching={isGPSSearching}
          elapsedTime={elapsedTime}
          distance={distance}
          currentPace={currentPace}
          totalGain={totalGain}
          isSheetExpanded={isSheetExpanded}
          gpsError={gpsError}
          selectedSession={selectedSession}
          isConfirmingBack={isConfirmingBack}
          isDarkMode={isDarkMode}
          appVersion={APP_VERSION}
          userProfile={calorieUserProfile}
          audioCues={audioCues}
          selectedRunType={selectedRunType}
          selectedPresetName={selectedPresetName}
          targetPace={targetPace}
          showExitToast={showExitToast}
          isExportDialogOpen={isExportDialogOpen}
          exportDialogMsg={exportDialogMsg}
          exportDialogType={exportDialogType}
          isImportDialogOpen={isImportDialogOpen}
          importDialogMsg={importDialogMsg}
          importDialogType={importDialogType}
          sheetVelocity={sheetVelocity}
          sheetHeightPx={sheetHeightPx}
          hasSeenTour={hasSeenTour}
          setHasSeenTour={setHasSeenTour}

          // Handlers
          onNavigate={handleNavigate}
          onBack={handleBackRequest}
          onRefresh={handleGlobalRefresh}
          setDashboardUpdateSeen={setDashboardUpdateSeen}
          setSettingsUpdateSeen={setSettingsUpdateSeen}
          onHistorySelect={(session: RunSession) => {
            setSelectedSession(session);
            setPrevScreen("history");
            setCurrentScreen("summary");
          }}
          onDeleteSession={(id: string) => setRunHistory(runHistory.filter(s => s.id !== id))}
          onSaveWorkout={(workoutData: any) => {
            const session: RunSession = {
              id: Date.now().toString(),
              type: workoutData.name,
              startTime: Date.now() - workoutData.duration * 1000,
              duration: workoutData.duration,
              distance: workoutData.percent,
              path: [],
              calories: Math.floor(workoutData.duration * 0.15),
              avgPace: `${workoutData.percent}%`,
            };
            onSessionFinish(session);
          }}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onProfileUpdate={(shouldResetHistory?: boolean | 'workouts_only') => {
            setProfileUpdateCounter(prev => prev + 1);
            if (shouldResetHistory === true) {
              setRunHistory([]);
              // Also clear from storage just in case it wasn't fully cleared or to be safe
              storage.remove("runHistory").catch(console.error);
              localStorage.removeItem("runHistory");
            } else if (shouldResetHistory === 'workouts_only') {
              // Filter to keep only runs (with path) - remove workout summaries
              const newHistory = runHistory.filter(s => s.path && s.path.length > 0);
              setRunHistory(newHistory);
              storage.set("runHistory", newHistory).catch(console.error);
              localStorage.setItem("runHistory", JSON.stringify(newHistory));
            }
          }}
          onAckUpdate={() => setSettingsUpdateSeen(true)}
          onToggleFollow={() => setIsFollowingUser(!isFollowingUser)}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
          onStartRun={() => {
            triggerHaptic(200);
            setIsRunning(true);
          }}
          onToggleRun={() => {
            triggerHaptic(50);
            setIsRunning(!isRunning);
          }}
          onFinishRun={handleFinishRun}
          onConfirmCancelRun={() => {
            confirmCancelRun();
            setIsConfirmingBack(false); // Clear the alert state
            setCurrentScreen("dashboard");
          }}
          onCloseConfirmBack={() => setIsConfirmingBack(false)}
          onToggleSheet={() => setIsSheetExpanded(!isSheetExpanded)}
          getTranslatedRunType={getTranslatedRunTypeLocal}
          setUserName={setUserName}
          setProfilePhoto={setProfilePhoto}
          setIsDarkMode={setIsDarkMode}
          setLanguage={setLanguage}
          setUnitSystem={setUnitSystem}
          setAudioCues={setAudioCues}
          setShowExitToast={setShowExitToast}
          setExportDialogOpen={setExportDialogOpen}
          setImportDialogOpen={setImportDialogOpen}
          setIsSheetExpanded={setIsSheetExpanded}
          setSheetVelocity={setSheetVelocity}
          setSheetHeightPx={setSheetHeightPx}

          // Refs & Layout
          sheetRef={sheetRef}
          onTouchStart={(e: React.TouchEvent) => {
            (sheetRef.current as any)._touchStartY = e.touches[0].clientY;
            (sheetRef.current as any)._touchStartTime = performance.now();
          }}
          onTouchMove={(e: React.TouchEvent) => {
            const dy = (sheetRef.current as any)._touchStartY - e.touches[0].clientY;
            const dt = performance.now() - (sheetRef.current as any)._touchStartTime;
            setSheetVelocity(Math.abs(dy) / Math.max(dt, 1));
          }}
          onTouchEnd={(e: React.TouchEvent) => {
            const dy = (sheetRef.current as any)._touchStartY - e.changedTouches[0].clientY;
            if (dy > 20) setIsSheetExpanded(true);
            else if (dy < -20) setIsSheetExpanded(false);
          }}
        />

        {/* Success/Error Dialogs for Backup */}
        <AppBackupDialogs 
          isExportOpen={isExportDialogOpen}
          onExportClose={() => setExportDialogOpen(false)}
          exportMsg={exportDialogMsg}
          exportType={exportDialogType}
          isImportOpen={isImportDialogOpen}
          onImportClose={() => setImportDialogOpen(false)}
          importMsg={importDialogMsg}
          importType={importDialogType}
          t={t}
        />

        {/* Exit Toast */}
        {showExitToast && (
          <div className="fixed bottom-20 inset-x-0 mx-auto z-[9999] w-fit animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-900/90 dark:bg-gray-800/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10">
              <p className="text-sm font-medium uppercase tracking-widest text-center">
                {t.pressAgainToExit}
              </p>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

const CustomDialog = React.lazy(() => import("./components/CustomDialog").then(m => ({ default: m.CustomDialog })));

// Internal Helper for Backup Dialogs
const AppBackupDialogs: React.FC<any> = ({ 
  isExportOpen, onExportClose, exportMsg, exportType,
  isImportOpen, onImportClose, importMsg, importType, t
}) => {
  return (
    <React.Suspense fallback={null}>
      <CustomDialog
        isOpen={isExportOpen}
        onClose={onExportClose}
        onConfirm={onExportClose}
        title={exportType === "success" ? t.success : t.error}
        message={exportMsg}
        confirmText="OK"
        cancelText=""
        type={exportType}
        closeOnBackdropClick={false}
      />
      <CustomDialog
        isOpen={isImportOpen}
        onClose={onImportClose}
        onConfirm={onImportClose}
        title={importType === "success" ? t.success : t.error}
        message={importMsg}
        confirmText="OK"
        cancelText=""
        type={importType}
        closeOnBackdropClick={false}
      />
    </React.Suspense>
  );
};

export default App;
