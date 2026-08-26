import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import bottleWaterAnim from "../animations/bottle-water.json";
import GriddyIcon from "./GriddyIcon";
import ActionCenterPanel from "./ActionCenterPanel";
import { RunSession, WeatherData, UnitSystem, Language, Screen } from "../types";
import { formatTime, getDistanceDisplay, truncate } from "../utils";
import { AppTour } from "./AppTour";

interface DashboardProps {
  userName: string;
  weather: WeatherData | null;
  profilePhoto: string | null;
  onOpenProfile: () => void;
  runHistory: RunSession[];
  unitSystem: UnitSystem;
  language: Language;
  t: any;
  onNavigateHistory: () => void;
  onHistorySelect: (session: RunSession) => void;
  onPrepareRun: () => void;
  onStartWorkout: () => void;
  getTranslatedRunType: (type: string) => string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  isOnline?: boolean;
  isStable?: boolean;
  onRefresh?: () => Promise<void>;
  hasUpdate?: boolean;
  updateInfo?: {
    hasUpdate: boolean;
    latestVersion: string;
    downloadUrl: string;
  };
  dashboardUpdateSeen?: boolean;
  onNavigate: (screen: Screen) => void;
  sheetRef?: React.RefObject<HTMLDivElement | null>;
  isSheetExpanded?: boolean;
  onToggleSheet?: () => void;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  sheetVelocity?: number;
  sheetHeightPx?: number;
  isDarkMode: boolean;
  hasSeenTour?: boolean;
  setHasSeenTour?: (seen: boolean) => void;
}

const WeatherVisual: React.FC<{ weather: WeatherData | null; timePeriod: "day" | "afternoon" | "night" }> = React.memo(({ weather, timePeriod }) => {
  if (!weather) return null;

  const code = weather.weathercode;
  const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 99);
  const isCloudy = (code >= 1 && code <= 3) || (code >= 45 && code <= 48);

  return (
    <div className="weather-visual-container">
      {/* Night Sky: Stars (Always behind everything at night) */}
      {timePeriod === "night" && !isRain && (
        <div className="star-container">
          {[...Array(16)].map((_, i) => {
            const size = Math.random() * 3 + 1;
            const twinkleDuration = Math.random() * 1 + 1; // 1-2s
            const twinkleDelay = Math.random() * 2 + 3; // 3-5s
            const opacity = Math.random() * 0.7 + 0.3;
            return (
              <div
                key={i}
                className="star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  opacity,
                  animation: `star-appear 0.5s ease-out, star-twinkle ${twinkleDuration}s ease-in-out ${twinkleDelay}s infinite`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Sun Visuals (Behind clouds) */}
      {(timePeriod === "day" || timePeriod === "afternoon") && !isRain && (
        <>
          <div className="sunshine" />
          <div className={timePeriod === "day" ? "sun" : "sun-sunset-core"} />
        </>
      )}

      {timePeriod === "night" && !isRain && (
        <div className="moon">
          <span className="crater cr1" />
          <span className="crater cr2" />
          <span className="crater cr3" />
        </div>
      )}

      {/* Clouds (Top level) */}
      {(isCloudy || isRain) && (
        <div className="cloud-group" style={{ '--cloud-color': (timePeriod === 'night' ? '#ffffff' : '#b3e5fc') } as React.CSSProperties}>
          <div className="cloud-front">
            <span className="cloud-part left-front" />
            <span className="cloud-part right-front" />
          </div>
          <div className="cloud-back">
            <span className="cloud-part left-back" />
            <span className="cloud-part right-back" />
          </div>
          {isRain && (
            <div className="rain-drops">
              {Array.from({ length: 18 }).map((_, i) => {
                const left = (i * 7 + Math.random() * 5) % 100;
                const startTop = (i * 3) % 20 - 30;
                const delay = (i * 0.13) % 1.2;
                const duration = 0.8 + (i * 0.05) % 0.5;
                const height = 10 + (i * 2) % 10;
                const width = 1.5 + (i * 0.2) % 1.5;
                return (
                  <div
                    key={i}
                    className="drop"
                    style={{
                      left: `${left}%`,
                      top: `${startTop}px`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`,
                      height: `${height}px`,
                      width: `${width}px`,
                      backgroundColor: '#60a5fa',
                      opacity: 0.4 + (i * 0.03) % 0.4,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

const SkeletonItem = () => (
  <div className="bg-white dark:bg-gray-900/50 p-6 rounded-[36px] border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-[160px] w-[240px] shrink-0 backdrop-blur-sm relative overflow-hidden">
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800/80 rounded-2xl shrink-0 skeleton"></div>
      <div className="space-y-3 flex-1">
        <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800/80 rounded-full skeleton"></div>
        <div className="h-2 w-16 bg-gray-50 dark:bg-gray-800/40 rounded-full skeleton"></div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-4 w-full bg-gray-50 dark:bg-gray-800/60 rounded-full skeleton"></div>
      <div className="h-3 w-2/3 bg-gray-50/50 dark:bg-gray-800/30 rounded-full skeleton"></div>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({
  userName,
  weather,
  profilePhoto,
  onOpenProfile,
  runHistory,
  unitSystem,
  language,
  t,
  onNavigateHistory,
  onHistorySelect,
  onPrepareRun,
  onStartWorkout,
  getTranslatedRunType,
  isLoading = false,
  isRefreshing = false,
  isOnline = true,
  isStable = true,
  onRefresh,
  hasUpdate = false,
  onNavigate,
  isDarkMode,
  hasSeenTour,
  setHasSeenTour,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activityListRef = useRef<HTMLDivElement>(null);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [updateDismissed] = useState(false);

  // Pull to refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const hapticTriggered = useRef(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const PULL_THRESHOLD = 150;
  const MAX_PULL = 200;

  const triggerHapticFeedback = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(20);
    }
  }, []);

  const getFormattedDateTime = useCallback(() => {
    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    const localeMap = { en: "en-US", id: "id-ID", jp: "ja-JP" };
    const locale = localeMap[language] || "en-US";
    const dateStr = new Intl.DateTimeFormat(locale, dateOptions).format(now);
    const timeStr = new Intl.DateTimeFormat(locale, timeOptions).format(now);
    return `${dateStr} • ${timeStr}`;
  }, [language]);

  const timePeriod = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    const totalMin = hour * 60 + min;
    if (totalMin >= 360 && totalMin < 900) return "day"; // 06:00 - 15:00
    if (totalMin >= 900 && totalMin < 1110) return "afternoon"; // 15:00 - 18:30
    return "night";
  }, [currentDateTime]);

  const getWeatherCardStyle = () => {
    if (timePeriod === "day") {
      return {
        background: "radial-gradient(178.94% 106.41% at 26.42% 106.41%, #FFF7B1 0%, #FFFFFF 71.88%)",
        color: "#574D33"
      };
    }
    if (timePeriod === "afternoon") {
      return {
        background: "radial-gradient(178.94% 106.41% at 26.42% 106.41%, #FF9A9E 0%, #FAD0C4 99%, #FAD0C4 100%)",
        color: "#4A2C2C"
      };
    }
    return {
      background: "radial-gradient(171.8% 103.59% at 26.42% 106.41%, #1e272e 0%, #000000 100%)",
      color: "#FFFFFF"
    };
  };

  useEffect(() => {
    setCurrentDateTime(getFormattedDateTime());
    const timer = setInterval(
      () => setCurrentDateTime(getFormattedDateTime()),
      30000
    );
    return () => clearInterval(timer);
  }, [getFormattedDateTime]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLoading || isRefreshing) return;
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
      hapticTriggered.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isLoading || isRefreshing || !isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      // Apply elastic resistance
      const pull = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(pull);
      
      // Trigger haptic once when threshold reached
      if (pull >= PULL_THRESHOLD && !hapticTriggered.current) {
        triggerHapticFeedback();
        hapticTriggered.current = true;
      } else if (pull < PULL_THRESHOLD && hapticTriggered.current) {
        hapticTriggered.current = false;
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isPulling) return;
    
    if (pullDistance >= PULL_THRESHOLD && onRefresh) {
      onRefresh();
      // Lottie animation will play via useEffect
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  // Sync Lottie looping state with refreshing state
  useEffect(() => {
    if (isRefreshing) {
      if (lottieRef.current) {
        lottieRef.current.play();
      }
    } else {
      if (lottieRef.current && !isPulling) {
        lottieRef.current.stop();
      }
    }
  }, [isRefreshing, isPulling]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="h-screen w-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden select-none relative"
    >
      {/* Offline Banner */}
      {(!isOnline || !isStable) && (
        <div className="absolute top-0 left-0 w-full z-[100] animate-in slide-in-from-top duration-300">
          <div className={`${!isOnline ? "bg-red-500" : "bg-amber-500"} text-white px-4 py-2 flex items-center justify-between gap-2 shadow-lg`}>
            <div className="flex items-center gap-2">
              <GriddyIcon name="WifiOff" size={14} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {!isOnline ? t.noConnection : t.unstableConnection}
              </span>
            </div>
            {onRefresh && (
              <button 
                onClick={() => onRefresh()}
                className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-colors"
              >
                {t.retry}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pull-to-refresh Indicator */}
      <div
        className="absolute top-0 left-0 w-full flex justify-center pointer-events-none z-[100] transition-all duration-300"
        style={{
          transform: `translateY(${isRefreshing ? 60 : pullDistance - 40}px)`,
          opacity: isRefreshing ? 1 : pullDistance / 100,
        }}
      >
        <div className="w-24 h-24 flex items-center justify-center overflow-hidden transition-all duration-500 bg-transparent">
          {isRefreshing ? (
            <Lottie 
              lottieRef={lottieRef}
              animationData={bottleWaterAnim}
              loop={true}
              autoplay={true}
              className="w-28 h-28 bg-transparent"
              style={{ backgroundColor: 'transparent' }}
            />
          ) : (
            <div 
              className="text-blue-600 dark:text-blue-400"
              style={{ 
                transform: `rotate(${pullDistance * 2.4}deg)`,
                opacity: Math.min(pullDistance / PULL_THRESHOLD, 1)
              }}
            >
              <GriddyIcon 
                name="Refresh" 
                size={40} 
                strokeWidth={3}
                className={pullDistance >= PULL_THRESHOLD ? "text-blue-500 scale-110 transition-transform" : ""}
              />
            </div>
          )}
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 rounded-b-[56px] px-8 pt-6 pb-16 z-10 relative border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex justify-between items-start mb-8">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            {isLoading || isRefreshing ? (
              <div className="space-y-3">
                <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full skeleton"></div>
                <div className="h-10 w-40 bg-gray-200 dark:bg-gray-800 rounded-2xl skeleton"></div>
              </div>
            ) : (
              <div className="flex flex-col">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">
                  {t.hello},<br />
                  <span
                    title={userName}
                    className="text-blue-600 dark:text-blue-400 inline-block whitespace-nowrap"
                  >
                    {truncate(userName, 9)}
                  </span>
                </h2>
              </div>
            )}
          </div>
          <button
            id="tour-profile"
            onClick={onOpenProfile}
            className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-[28px] border-4 border-white dark:border-gray-700 shadow-2xl active:scale-90 transition-transform animate-in fade-in slide-in-from-right-4 duration-500"
          >
            {profilePhoto ? (
              <img src={profilePhoto} className="w-full h-full object-cover rounded-[24px]" />
            ) : (
              <GriddyIcon name="User" size={28} className="text-gray-400 mx-auto mt-3" />
            )}
            {hasUpdate && !updateDismissed && (
              <div
                className="absolute top-[20%] right-[70%] -translate-y-1/2 mr-2 bg-red-500 rounded-full shadow z-30 animate-pulse"
                style={{ width: 10, height: 10 }}
                aria-label={t.updateAvailable}
              />
            )}
          </button>
        </div>

        {/* Status Card: Weather, Wind & Date - Now overlapping */}
        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 translate-y-10 z-20 w-full max-w-xs sm:max-w-sm">
            <div className="animate-in zoom-in fade-in duration-700 delay-200">
            {isLoading || isRefreshing ? (
              <div className="h-[190px] w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-[42px] shadow-2xl border border-white/20 dark:border-gray-700/30 flex flex-col p-8 justify-between relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-full skeleton"></div>
                  <div className="h-3 w-16 bg-gray-100 dark:bg-gray-700/50 rounded-full skeleton"></div>
                </div>
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl skeleton"></div>
              </div>
              <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-2xl skeleton"></div>
            </div>
          ) : (
              <div
                id="tour-weather"
                className="weather-card shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
                style={getWeatherCardStyle()}
              >
                <WeatherVisual weather={weather} timePeriod={timePeriod} />

                <div className="card-info">
                  <span className="label !font-black !text-[15px] opacity-60" style={{ color: getWeatherCardStyle().color }}>{currentDateTime}</span>
                  {weather && (
                    <div className="flex items-center gap-2 mt-1 opacity-40">
                      <GriddyIcon name="Wind" size={12} strokeWidth={3} style={{ color: getWeatherCardStyle().color }} />
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: getWeatherCardStyle().color }}>
                        {Math.round(weather.windspeed || 0)} KM/H
                      </span>
                    </div>
                  )}
                </div>

                <div className="weather-temp" style={{ color: getWeatherCardStyle().color }}>
                  {weather ? `${Math.round(weather.temperature)}°` : (isOnline ? "--°" : <GriddyIcon name="WifiOff" size={32} opacity={0.5} />)}
                </div>

                <div className="weather-stats">
                  {weather && weather.locationName ? (
                    <div className="stat-chip" style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: getWeatherCardStyle().color }}>
                      <GriddyIcon name="MapPin" size={14} />
                      <span className="truncate max-w-[150px]">{weather.locationName}</span>
                    </div>
                  ) : !isOnline && (
                    <div className="stat-chip" style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: getWeatherCardStyle().color }}>
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.noInternet}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8 pt-44 overflow-hidden relative z-10">
        {/* Edge Blur Bottom */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-gray-50 dark:from-black to-transparent z-10 pointer-events-none" />

        {/* Activity Picker */}
        <div className="shrink-0">
          <h3 className="font-black text-gray-400 dark:text-gray-500 mb-6 uppercase text-[10px] tracking-[0.3em]">
            {t.chooseActivity}
          </h3>
          <div className="grid grid-cols-2 gap-8">
            {isLoading || isRefreshing ? (
              <>
                <div className="h-[140px] bg-white dark:bg-gray-900 rounded-[36px] shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl skeleton"></div>
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded-full skeleton"></div>
                </div>
                <div className="h-[140px] bg-white dark:bg-gray-900 rounded-[36px] shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl skeleton"></div>
                  <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded-full skeleton"></div>
                </div>
              </>
            ) : (
              <>
                <button
                  id="tour-run"
                  onClick={onPrepareRun}
                  disabled={!isOnline}
                  className={`bg-white dark:bg-gray-900 p-6 rounded-[36px] shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-4 active:scale-95 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500 ${!isOnline ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                >
                  <div className={`w-14 h-14 ${!isOnline ? 'bg-gray-100 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                    <GriddyIcon name="MapPin" className={!isOnline ? 'text-gray-400' : 'text-blue-600'} size={28} />
                  </div>
                  <span className="font-black text-gray-900 dark:text-white text-[11px] uppercase tracking-widest">
                    {t.outdoorRun}
                  </span>
                  {!isOnline && (
                    <span className="text-[8px] font-bold text-red-500 uppercase tracking-tighter -mt-2">
                      {t.noInternet}
                    </span>
                  )}
                </button>
                <button
                  id="tour-workout"
                  onClick={onStartWorkout}
                  className="bg-white dark:bg-gray-900 p-6 rounded-[36px] shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-4 active:scale-95 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75"
                >
                  <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                    <GriddyIcon name="Dumbbell" className="text-orange-500" size={28} />
                  </div>
                  <span className="font-black text-gray-900 dark:text-white text-[11px] uppercase tracking-widest">
                    {t.training}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex-1 flex flex-col mt-4 overflow-hidden">
          <div className="flex justify-between items-center mb-4 px-1 shrink-0">
            <h3 className="font-black text-gray-400 dark:text-gray-500 uppercase text-[10px] tracking-[0.3em]">
              {t.recentActivity}
            </h3>
            <button
              onClick={onNavigateHistory}
              className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl active:scale-95 transition-all"
            >
              {t.seeAll}
            </button>
          </div>

          <div
            ref={activityListRef}
            className="flex-1 flex flex-row gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 edge-blur px-8"
          >
            {isLoading || isRefreshing ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} />)
            ) : runHistory.length === 0 ? (
              <div className="h-32 w-full bg-white dark:bg-gray-900 rounded-[32px] flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800 animate-in fade-in duration-1000 shrink-0">
                <GriddyIcon name="History" size={32} className="text-gray-200 mb-3" />
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  {t.noRuns}
                </p>
              </div>
            ) : (
              <>
                {runHistory.slice(0, 4).map((session, i) => {
                  const isWorkout = !session.path || session.path.length === 0;
                  return (
                    <div
                      key={session.id}
                      onClick={() => onHistorySelect(session)}
                      className="bg-white dark:bg-gray-900 p-6 rounded-[36px] shadow-sm border border-gray-50 dark:border-gray-800 flex flex-col justify-between active:scale-[0.98] transition-all cursor-pointer animate-in fade-in slide-in-from-right-4 duration-500 snap-center w-[240px] shrink-0"
                      style={{
                        height: "160px",
                        animationDelay: `${i * 100}ms`,
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 ${isWorkout
                            ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500"
                            : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                            } rounded-2xl flex items-center justify-center shrink-0`}
                        >
                          {isWorkout ? (
                            <GriddyIcon name="Dumbbell" size={20} />
                          ) : (
                            <GriddyIcon name="MapPin" size={20} />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-black text-xs uppercase dark:text-white truncate">
                            {getTranslatedRunType(session.type)}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                            {new Date(session.startTime).toLocaleDateString(
                              language === "id" ? "id-ID" : language === "jp" ? "ja-JP" : "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                            {isWorkout
                              ? session.distance
                              : getDistanceDisplay(session.distance, unitSystem)
                                .value}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                            {isWorkout
                              ? "%"
                              : getDistanceDisplay(session.distance, unitSystem)
                                .unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          <span>{formatTime(session.duration)}</span>
                          <GriddyIcon name="ChevronRight" size={14} className="text-gray-300" />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Plus / View More Card */}
                <div
                  onClick={onNavigateHistory}
                  className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-[36px] border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer snap-center w-[240px] shrink-0"
                  style={{ height: "160px" }}
                >
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                    <GriddyIcon name="Plus" size={24} strokeWidth={3} />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {t.seeAll}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ActionCenterPanel 
        t={t}
        language={language}
        userName={userName}
        isDarkMode={isDarkMode}
        onNavigate={onNavigate}
      />
      <AppTour 
        t={t} 
        hasSeenTour={hasSeenTour} 
        setHasSeenTour={setHasSeenTour} 
      />
    </div>
  );
};

export default Dashboard;
