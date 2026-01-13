import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  ArrowLeft,
  MapPin,
  Activity,
  Flame,
  User,
  Locate,
  Plus,
  Minus,
  Eye,
  Sun,
  Timer,
  Zap,
  Square,
  Pause,
  Play,
  Share2,
  Trash2,
  Calendar,
  ChevronRight,
  Gauge,
  Mountain,
  Radar,
  SignalHigh,
  Footprints,
  Tally4,
  ShieldCheck,
  Settings,
  AlertCircle,
  Info,
  Dumbbell,
  TrendingUp,
} from "lucide-react";
import { Geolocation } from "@capacitor/geolocation";
import { App as CapacitorApp } from "@capacitor/app";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share as CapacitorShare } from "@capacitor/share";
import {
  Screen,
  RunSession,
  GeoPoint,
  Language,
  WeatherData,
  UnitSystem,
  ActiveSession,
  AudioCuesSettings,
  PaceZone,
} from "./types";
import { handleBackHandlers } from "./utils/backButtonService";
import { en } from "./locale/en";
import { id } from "./locale/id";
import { jp } from "./locale/jp";
import {
  formatTime,
  formatPaceString,
  getDistanceDisplay,
  getSpeedDisplay,
  getPaceDisplay,
  getAltitudeDisplay,
} from "./utils";

// Components
import { OnboardingScreen } from "./components/OnboardingScreen";
import { Dashboard } from "./components/Dashboard";
import { WorkoutScreen } from "./components/WorkoutScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { SummaryScreen } from "./components/SummaryScreen";
import { RunMap } from "./components/RunMap";
import { StatCard } from "./components/StatCard";
import { CustomDialog } from "./components/CustomDialog";
import { AboutScreen } from "./components/AboutScreen";
import { TermsScreen } from "./components/TermsScreen";
import { checkForUpdate } from "./utils/updateService";

const translations = { en, id, jp };

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Radius bumi dalam KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const triggerHaptic = (pattern: number | number[] = 50) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

class ErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  { hasError: boolean; error?: Error | null; info?: string | null }
> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Captured runtime error:", error, info);
    this.setState({ hasError: true, error, info: info.componentStack || null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-black mb-2">
              Terjadi kesalahan pada aplikasi
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Silakan lihat log konsol untuk detail atau tekan tombol reload.
            </p>
            <details className="text-xs text-red-700 dark:text-red-300 mb-4 whitespace-pre-wrap">
              {this.state.error?.message}
              <pre className="mt-2 text-[11px]">{this.state.info}</pre>
            </details>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Reload
              </button>
              <button
                onClick={() =>
                  this.setState({ hasError: false, error: null, info: null })
                }
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactNode;
  }
}

const App: React.FC = () => {
  // --- Persistent State ---
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    const hasSeen = localStorage.getItem("hasOnboarded");
    return hasSeen === "true" ? "dashboard" : "onboarding";
  });

  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem("language") as Language) || "id"
  );
  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || "Runner"
  );
  const [runHistory, setRunHistory] = useState<RunSession[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("runHistory") || "[]");
    } catch {
      return [];
    }
  });
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    () => (localStorage.getItem("unitSystem") as UnitSystem) || "metric"
  );
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() =>
    localStorage.getItem("profilePhoto")
  );
  const [audioCues, setAudioCues] = useState<AudioCuesSettings>(() => {
    try {
      const saved = localStorage.getItem("audioCues");
      return saved
        ? JSON.parse(saved)
        : {
          enabled: true,
          paceAlerts: true,
          distanceMilestones: true,
          alertFrequency: 60,
        };
    } catch {
      return {
        enabled: true,
        paceAlerts: true,
        distanceMilestones: true,
        alertFrequency: 60,
      };
    }
  });

  // --- Running State ---
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [totalGain, setTotalGain] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [path, setPath] = useState<GeoPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [isFollowingUser, setIsFollowingUser] = useState(true);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isGPSSearching, setIsGPSSearching] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<RunSession | null>(
    null
  );
  const [isConfirmingBack, setIsConfirmingBack] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // --- Update State ---
  const APP_VERSION = "1.0.1";
  const [updateInfo, setUpdateInfo] = useState({
    hasUpdate: false,
    latestVersion: APP_VERSION,
    downloadUrl: ""
  });
  const [dashboardUpdateSeen, setDashboardUpdateSeen] = useState(false);
  const [settingsUpdateSeen, setSettingsUpdateSeen] = useState(false);

  // Check for updates
  useEffect(() => {
    const check = async () => {
      const info = await checkForUpdate(APP_VERSION);
      if (info.hasUpdate) {
        setUpdateInfo(info);
      }
    };
    check();
  }, []);

  // --- Refs ---
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<string | null>(null);
  const lastLocationTimeRef = useRef<number>(Date.now());

  const t = useMemo(() => (translations as any)[language], [language]);

  // --- Weather Logic ---
  const fetchWeather = useCallback(
    async (lat: number, lon: number) => {
      if (isWeatherLoading) return;
      setIsWeatherLoading(true);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await response.json();
        if (data && data.current_weather) {
          setWeather({
            temperature: data.current_weather.temperature,
            weathercode: data.current_weather.weathercode,
            windspeed: data.current_weather.windspeed,
          });
        }
      } catch (error) {
        console.error("Gagal mengambil data cuaca:", error);
      } finally {
        setIsWeatherLoading(false);
      }
    },
    [isWeatherLoading]
  );

  // Update weather when location is first found
  useEffect(() => {
    if (currentLocation && !weather && !isWeatherLoading) {
      fetchWeather(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation, weather, fetchWeather, isWeatherLoading]);

  // --- Effects ---
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("audioCues", JSON.stringify(audioCues));
  }, [audioCues]);

  // Timer Logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        if (Date.now() - lastLocationTimeRef.current > 8000) {
          setCurrentPace(0);
          setIsGPSSearching(true);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // GPS Tracking Logic
  const handlePositionUpdate = useCallback(
    (position: any) => {
      if (!position || !position.coords) return;

      const { latitude, longitude, altitude, accuracy, speed } =
        position.coords;
      lastLocationTimeRef.current = Date.now();
      setIsGPSSearching(false);
      setGpsError(null);

      const pace = speed > 0.5 ? 1000 / speed : 0;
      const newPoint: GeoPoint = {
        latitude,
        longitude,
        altitude,
        timestamp: position.timestamp || Date.now(),
      };

      setCurrentLocation(newPoint);
      setCurrentAccuracy(accuracy);
      setCurrentPace(pace);

      if (isRunning) {
        setPath((prev) => {
          const last = prev[prev.length - 1];
          if (last) {
            const d = calculateDistance(
              last.latitude,
              last.longitude,
              latitude,
              longitude
            );
            if (d > 0.002 && accuracy < 35) {
              if (altitude !== null && last.altitude !== null) {
                const diff = altitude - last.altitude;
                if (diff > 0) setTotalGain((g) => g + diff);
              }
              setDistance((prevD) => prevD + d);
              return [...prev, newPoint];
            }
            return prev;
          }
          return [newPoint];
        });
      }
    },
    [isRunning]
  );

  const startTracking = useCallback(async () => {
    try {
      // Gracefully handle permissions for web
      try {
        const permission = await Geolocation.checkPermissions();
        if (permission.location !== "granted") {
          await Geolocation.requestPermissions();
        }
      } catch (e) {
        // Fallback for web where checkPermissions is not implemented
        console.warn(
          "Capacitor permission check not implemented on this platform, relying on browser prompts."
        );
      }

      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        (position, err) => {
          if (err) {
            const msg = err.message || JSON.stringify(err);
            console.error("GPS Watch Error:", msg);
            setIsGPSSearching(true);
            if (msg.toLowerCase().includes("denied")) {
              setGpsError(t.gpsDenied || "GPS Permission Denied");
            }
            return;
          }
          handlePositionUpdate(position);
        }
      );
      watchIdRef.current = watchId;
    } catch (e: any) {
      console.error("Tracking setup failed:", e.message || e);
    }
  }, [handlePositionUpdate, t]);

  useEffect(() => {
    startTracking();
    return () => {
      if (watchIdRef.current)
        Geolocation.clearWatch({ id: watchIdRef.current });
    };
  }, [startTracking]);

  // --- Backup Handlers ---
  const handleExportData = async () => {
    try {
      const backupData = {
        userName,
        runHistory,
        language,
        unitSystem,
        profilePhoto,
        audioCues,
        userPhysicalProfile: JSON.parse(
          localStorage.getItem("userPhysicalProfile") || "null"
        ),
        exportDate: new Date().toISOString(),
        appVersion: "1.0.1",
      };

      const json = JSON.stringify(backupData, null, 2);

      // Try Capacitor Filesystem + Share to save/send file on native
      try {
        const filename = `fitgo-backup-${new Date().toISOString().split("T")[0]
          }.json`;
        const saved = await Filesystem.writeFile({
          path: filename,
          data: json,
          directory: Directory.Documents,
        });
        const fileUri = (saved as any).uri || (saved as any).path;
        if (fileUri) {
          try {
            await CapacitorShare.share({
              title: "Fit Go Backup",
              text: "Backup file",
              url: fileUri,
            });
            triggerHaptic(100);
            setExportDialogMsg(t.exportSuccess || "Backup saved");
            setExportDialogType("success");
            setExportDialogOpen(true);
            return;
          } catch (shareErr) {
            console.debug("Share failed, fallback to download", shareErr);
          }
        }
      } catch (fsErr) {
        console.debug("Filesystem write failed, fallback to download", fsErr);
      }

      // Fallback to browser download
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fitgo-backup-${new Date().toISOString().split("T")[0]
        }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      triggerHaptic(100);
      setExportDialogMsg(t.exportSuccess || "Backup saved");
      setExportDialogType("success");
      setExportDialogOpen(true);
    } catch (error) {
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

        if (!importedData.runHistory)
          throw new Error("Format file tidak valid");

        if (importedData.userName) setUserName(importedData.userName);
        if (importedData.runHistory) setRunHistory(importedData.runHistory);
        if (importedData.language) setLanguage(importedData.language);
        if (importedData.unitSystem) setUnitSystem(importedData.unitSystem);
        if (importedData.profilePhoto)
          setProfilePhoto(importedData.profilePhoto);
        if (importedData.audioCues) setAudioCues(importedData.audioCues);

        localStorage.setItem("userName", importedData.userName || userName);
        localStorage.setItem(
          "runHistory",
          JSON.stringify(importedData.runHistory)
        );
        localStorage.setItem("language", importedData.language || language);
        localStorage.setItem(
          "unitSystem",
          importedData.unitSystem || unitSystem
        );
        localStorage.setItem("profilePhoto", importedData.profilePhoto || "");
        localStorage.setItem(
          "audioCues",
          JSON.stringify(importedData.audioCues)
        );
        if (importedData.userPhysicalProfile) {
          localStorage.setItem(
            "userPhysicalProfile",
            JSON.stringify(importedData.userPhysicalProfile)
          );
        }

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

  // --- Handlers ---
  const handleRefresh = async () => {
    if (currentLocation) {
      await fetchWeather(currentLocation.latitude, currentLocation.longitude);
      triggerHaptic(50);
    }
  };

  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);

  // Dialog states for export/import success/error
  const [isExportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDialogMsg, setExportDialogMsg] = useState("");
  const [exportDialogType, setExportDialogType] = useState<
    "success" | "danger" | "info"
  >("success");

  const [isImportDialogOpen, setImportDialogOpen] = useState(false);
  const [importDialogMsg, setImportDialogMsg] = useState("");
  const [importDialogType, setImportDialogType] = useState<
    "success" | "danger" | "info"
  >("success");

  // Exit confirmation states
  const [showExitToast, setShowExitToast] = useState(false);
  const exitPressTimeRef = useRef<number>(0);
  const EXIT_TIMEOUT = 2000; // 2 seconds

  const handleBackRequest = useCallback(() => {
    // Let registered back handlers (components) capture the event first
    try {
      const handled = handleBackHandlers();
      if (handled) return;
    } catch (e) {
      // ignore if service not available
    }

    if (currentScreen === "run" && (isRunning || elapsedTime > 0)) {
      setIsConfirmingBack(true);
      return;
    }

    // If we're on the summary screen and we have a previous screen, go back to it
    if (currentScreen === "summary" && prevScreen) {
      setCurrentScreen(prevScreen);
      setPrevScreen(null);
      return;
    }

    if (currentScreen === "terms") {
      setCurrentScreen("about");
      return;
    }
    if (currentScreen === "about") {
      setCurrentScreen("profile");
      return;
    }

    // Exit confirmation on dashboard
    if (currentScreen === "dashboard") {
      const now = Date.now();
      if (now - exitPressTimeRef.current < EXIT_TIMEOUT) {
        // Second press within timeout - exit app
        try {
          if (CapacitorApp && typeof CapacitorApp.exitApp === "function") {
            CapacitorApp.exitApp();
          }
        } catch (e) {
          console.debug("exitApp not available");
        }
        return;
      }
      // First press - show toast
      exitPressTimeRef.current = now;
      setShowExitToast(true);
      setTimeout(() => setShowExitToast(false), EXIT_TIMEOUT);
      return;
    }

    setCurrentScreen("dashboard");
  }, [currentScreen, isRunning, elapsedTime, prevScreen]);

  // Listen to Android hardware back button and route it to the same handler as the on-screen back icon
  useEffect(() => {
    let listenerHandle: any = null;
    try {
      if (CapacitorApp && typeof CapacitorApp.addListener === "function") {
        listenerHandle = CapacitorApp.addListener("backButton", () => {
          handleBackRequest();
        });
      }
    } catch (e) {
      // not available on web or failed to attach
      console.debug("backButton listener not attached:", e);
    }

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === "function")
        listenerHandle.remove();
    };
  }, [handleBackRequest]);

  const confirmCancelRun = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setDistance(0);
    setTotalGain(0);
    setPath([]);
    setCurrentScreen("dashboard");
  };

  const handleFinishRun = () => {
    triggerHaptic([50, 50, 150]);
    setIsRunning(false);

    const avgPaceVal = distance > 0 ? elapsedTime / distance : 0;
    const session: RunSession = {
      id: Date.now().toString(),
      type: "Outdoor Run",
      startTime: Date.now() - elapsedTime * 1000,
      duration: elapsedTime,
      distance,
      path,
      calories: Math.floor(distance * 60),
      avgPace: formatPaceString(avgPaceVal),
    };

    const updatedHistory = [session, ...runHistory];
    setRunHistory(updatedHistory);
    localStorage.setItem("runHistory", JSON.stringify(updatedHistory));

    setSelectedSession(session);
    setPrevScreen("run");
    setCurrentScreen("summary");

    setElapsedTime(0);
    setDistance(0);
    setTotalGain(0);
    setPath([]);
  };

  const handleSaveWorkout = (workoutData: {
    name: string;
    duration: number;
    percent: number;
  }) => {
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
    const updatedHistory = [session, ...runHistory];
    setRunHistory(updatedHistory);
    localStorage.setItem("runHistory", JSON.stringify(updatedHistory));
    setSelectedSession(session);
    setPrevScreen("workout");
    setCurrentScreen("summary");
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem("hasOnboarded", "true");
    setCurrentScreen("dashboard");
  };

  const avgPaceRaw = distance > 0 ? elapsedTime / distance : 0;
  const caloriesBurned = Math.floor(distance * 60);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-black transition-colors font-sans antialiased overflow-hidden">
        {currentScreen === "onboarding" && (
          <OnboardingScreen onComplete={handleOnboardingComplete} t={t} />
        )}

        {currentScreen === "dashboard" && (
          <Dashboard
            userName={userName}
            weather={weather}
            profilePhoto={profilePhoto}
            onOpenProfile={() => {
              // If update is available and not seen on dashboard, mark as seen
              if (updateInfo.hasUpdate && !dashboardUpdateSeen) {
                setDashboardUpdateSeen(true);
              }
              setCurrentScreen("profile");
            }}
            runHistory={runHistory}
            unitSystem={unitSystem}
            language={language}
            t={t}
            onNavigateHistory={() => setCurrentScreen("history")}
            onHistorySelect={(s) => {
              setSelectedSession(s);
              setPrevScreen("dashboard");
              setCurrentScreen("summary");
            }}
            onPrepareRun={() => setCurrentScreen("run")}
            onStartWorkout={() => setCurrentScreen("workout")}
            setSelectedRunType={() => { }}
            setSelectedPresetName={() => { }}
            setTargetPace={() => { }}
            getTranslatedRunType={(type) =>
              t[type.toLowerCase().replace(/\s/g, "")] || type
            }
            isLoading={isWeatherLoading}
            onRefresh={handleRefresh}
            // Update Props
            hasUpdate={updateInfo.hasUpdate && !dashboardUpdateSeen}
          />
        )}

        {currentScreen === "run" && (
          <div className="h-screen w-screen relative bg-gray-100 dark:bg-gray-950 overflow-hidden flex flex-col">
            <RunMap
              currentLocation={currentLocation}
              path={path}
              isRunning={isRunning}
              isFollowingUser={isFollowingUser}
              isSheetExpanded={isSheetExpanded}
              isDarkMode={isDarkMode}
              isZenMode={isZenMode}
              onToggleFollow={() => setIsFollowingUser(!isFollowingUser)}
              onToggleZenMode={() => setIsZenMode(!isZenMode)}
            />

            <div
              className={`absolute top-12 left-0 w-full px-6 flex justify-between items-center z-[400] transition-opacity duration-300 ${isZenMode ? "opacity-0" : "opacity-100"
                }`}
            >
              <button
                onClick={handleBackRequest}
                className="p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-xl text-gray-900 dark:text-white active:scale-95"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-2 bg-gray-900/90 dark:bg-blue-600/90 backdrop-blur px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
                {isGPSSearching ? (
                  <>
                    <Radar
                      size={16}
                      className="text-yellow-400 animate-pulse"
                    />
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                      {t.searching}
                    </span>
                  </>
                ) : (
                  <>
                    <SignalHigh size={16} className="text-green-400" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                      GPS {Math.round(currentAccuracy || 0)}M
                    </span>
                  </>
                )}
              </div>
            </div>

            {gpsError && (
              <div className="absolute top-28 left-6 right-6 z-[450] animate-in slide-in-from-top-4 duration-500">
                <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="text-xs font-black uppercase tracking-widest leading-tight">
                    {gpsError}
                  </p>
                </div>
              </div>
            )}

            {/* Float Stats in Zen Mode */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 z-[600] transition-all duration-700 pointer-events-none ${isZenMode
                ? "bottom-36 opacity-100 translate-y-0 scale-100"
                : "bottom-10 opacity-0 translate-y-12 scale-90"
                }`}
            >
              <div className="bg-white/85 dark:bg-gray-900/85 backdrop-blur-3xl px-8 py-4 rounded-full shadow-2xl border border-white/30 dark:border-white/10 flex items-center gap-6 whitespace-nowrap">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">
                    {t.duration}
                  </span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-0.5">
                    {t.distance}
                  </span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                    {getDistanceDisplay(distance, unitSystem).value}{" "}
                    <span className="text-xs">
                      {getDistanceDisplay(distance, unitSystem).unit}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Controls Sheet */}
            <div
              className={`mt-auto bg-white dark:bg-gray-900 rounded-t-[56px] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] z-[500] px-8 pt-4 transition-all duration-500 relative flex flex-col ${isZenMode
                ? "h-0 opacity-0 pointer-events-none translate-y-full"
                : isSheetExpanded
                  ? "h-[75vh]"
                  : "h-[38vh]"
                }`}
            >
              <div
                className="w-full flex justify-center py-4 cursor-pointer"
                onClick={() => setIsSheetExpanded(!isSheetExpanded)}
              >
                <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {/* Primary Stats Row - Always Visible */}
                <div className="flex justify-between items-start mb-8 px-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                      {t.duration}
                    </span>
                    <span className="text-5xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                      {formatTime(elapsedTime)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">
                      {t.distance}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-blue-600 tabular-nums tracking-tighter">
                        {getDistanceDisplay(distance, unitSystem).value}
                      </span>
                      <span className="text-sm font-black text-gray-400 uppercase tracking-widest">
                        {getDistanceDisplay(distance, unitSystem).unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid 2x2 - Hidden when collapsed */}
                <div
                  className={`grid grid-cols-2 gap-4 transition-all duration-500 overflow-hidden ${isSheetExpanded
                    ? "max-h-[500px] opacity-100 mb-8"
                    : "max-h-0 opacity-0 mb-0"
                    }`}
                >
                  {/* Speed Card */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                        <Gauge size={16} strokeWidth={3} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t.speed}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black dark:text-white tabular-nums">
                        {getSpeedDisplay(currentPace, unitSystem).value}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                        {getSpeedDisplay(currentPace, unitSystem).unit}
                      </span>
                    </div>
                  </div>

                  {/* Calories Card */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-500">
                        <Flame size={16} strokeWidth={3} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t.cal}
                      </span>
                    </div>
                    <span className="text-3xl font-black dark:text-white tabular-nums">
                      {caloriesBurned}
                    </span>
                  </div>

                  {/* Gain Card */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-500">
                        <TrendingUp size={16} strokeWidth={3} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t.gain}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black dark:text-white tabular-nums">
                        {Math.round(totalGain)}
                      </span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                        m
                      </span>
                    </div>
                  </div>

                  {/* Pace Card */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[32px] flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
                        <Activity size={16} strokeWidth={3} />
                      </div>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {t.pace} (AVG)
                      </span>
                    </div>
                    <span className="text-3xl font-black dark:text-white tabular-nums tracking-tighter">
                      {getPaceDisplay(avgPaceRaw, unitSystem)}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Button - Always Visible */}
                <div className="px-2">
                  {!isRunning && elapsedTime === 0 ? (
                    <button
                      onClick={() => {
                        triggerHaptic(200);
                        setIsRunning(true);
                      }}
                      className="w-full bg-blue-600 text-white font-black py-7 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] text-xl flex items-center justify-center gap-4 active:scale-95 uppercase tracking-[0.2em] border-b-4 border-blue-800/50"
                    >
                      <Play fill="white" size={24} /> {t.startRun}
                    </button>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          triggerHaptic(50);
                          setIsRunning(!isRunning);
                        }}
                        className={`flex-1 font-black py-7 rounded-[32px] shadow-2xl text-xl flex items-center justify-center gap-4 active:scale-95 uppercase tracking-[0.2em] transition-all border-b-4 ${isRunning
                          ? "bg-orange-500 text-white border-orange-700/50"
                          : "bg-green-500 text-white border-green-700/50"
                          }`}
                      >
                        {isRunning ? (
                          <>
                            <Pause size={24} fill="white" /> {t.pause}
                          </>
                        ) : (
                          <>
                            <Play size={24} fill="white" /> {t.resume}
                          </>
                        )}
                      </button>
                      {!isRunning && (
                        <button
                          onClick={handleFinishRun}
                          className="bg-red-500 text-white font-black px-12 rounded-[32px] shadow-2xl flex items-center justify-center active:scale-95 transition-all border-b-4 border-red-700/50"
                        >
                          <Square size={28} fill="white" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <CustomDialog
              isOpen={isConfirmingBack}
              onClose={() => setIsConfirmingBack(false)}
              onConfirm={confirmCancelRun}
              title={t.confirmDelete}
              message={t.confirmDelete}
              confirmText={t.deleteHistory}
              cancelText={t.cancel}
              type="danger"
            />
          </div>
        )}

        {currentScreen === "workout" && (
          <WorkoutScreen
            onBack={handleBackRequest}
            t={t}
            onSaveWorkout={handleSaveWorkout}
            runHistory={runHistory}
          />
        )}

        {currentScreen === "summary" && selectedSession && (
          <SummaryScreen
            session={selectedSession}
            unitSystem={unitSystem}
            language={language}
            t={t}
            onBack={handleBackRequest}
          />
        )}

        {currentScreen === "history" && (
          <HistoryScreen
            onBack={handleBackRequest}
            runHistory={runHistory}
            unitSystem={unitSystem}
            t={t}
            onHistorySelect={(s) => {
              setSelectedSession(s);
              setPrevScreen("history");
              setCurrentScreen("summary");
            }}
            onDeleteSession={(id) => {
              const updated = runHistory.filter((s) => s.id !== id);
              setRunHistory(updated);
              localStorage.setItem("runHistory", JSON.stringify(updated));
            }}
            onExportData={handleExportData}
            onImportData={handleImportData}
            getTranslatedRunType={(type) =>
              t[type.toLowerCase().replace(/\s/g, "")] || type
            }
          />
        )}

        {currentScreen === "profile" && (
          <ProfileScreen
            onBack={handleBackRequest}
            userName={userName}
            setUserName={setUserName}
            profilePhoto={profilePhoto}
            setProfilePhoto={setProfilePhoto}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            language={language}
            setLanguage={setLanguage}
            unitSystem={unitSystem}
            setUnitSystem={setUnitSystem}
            customDistanceUnit="km"
            setCustomDistanceUnit={() => { }}
            customAltitudeUnit="m"
            setCustomAltitudeUnit={() => { }}
            audioCues={audioCues}
            setAudioCues={setAudioCues}
            paceZones={[]}
            setPaceZones={() => { }}
            onClearCache={() => { }}
            t={t}
            onOpenAbout={() => setCurrentScreen("about")}
            // Update Props
            appVersion={APP_VERSION}
            updateInfo={{
              hasUpdate: updateInfo.hasUpdate,
              latestVersion: updateInfo.latestVersion,
              downloadUrl: updateInfo.downloadUrl,
              isSeen: settingsUpdateSeen
            }}
            onAckUpdate={() => setSettingsUpdateSeen(true)}
          />
        )}

        {currentScreen === "about" && (
          <AboutScreen
            onBack={handleBackRequest}
            onOpenTerms={() => setCurrentScreen("terms")}
            t={t}
          />
        )}

        {currentScreen === "terms" && (
          <TermsScreen onBack={() => setCurrentScreen("about")} t={t} />
        )}

        {/* Export/Import Dialogs */}
        <CustomDialog
          isOpen={isExportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          onConfirm={() => setExportDialogOpen(false)}
          title={exportDialogType === "success" ? t.success || "Berhasil" : t.error || "Error"}
          message={exportDialogMsg}
          confirmText="OK"
          cancelText=""
          type={exportDialogType}
        />

        <CustomDialog
          isOpen={isImportDialogOpen}
          onClose={() => setImportDialogOpen(false)}
          onConfirm={() => setImportDialogOpen(false)}
          title={importDialogType === "success" ? t.success || "Berhasil" : t.error || "Error"}
          message={importDialogMsg}
          confirmText="OK"
          cancelText=""
          type={importDialogType}
        />

        {/* Exit Toast */}
        {showExitToast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-gray-900 dark:bg-gray-800 text-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-700">
              <p className="text-sm font-black uppercase tracking-widest">
                {t.pressAgainToExit || "Tekan lagi untuk keluar"}
              </p>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
