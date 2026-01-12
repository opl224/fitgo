import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  User,
  MapPin,
  ChevronRight,
  Dumbbell,
  Activity,
  Thermometer,
  Clock,
  RefreshCw,
  ArrowDown,
  Wind,
  Plus,
  CloudSun,
} from "lucide-react";
import { RunSession, WeatherData, UnitSystem, Language } from "../types";
import { formatTime, getDistanceDisplay, truncate } from "../utils";

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
  setSelectedRunType: (type: string) => void;
  setSelectedPresetName: (name: string | null) => void;
  setTargetPace: (pace: number | null) => void;
  getTranslatedRunType: (type: string) => string;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

const SkeletonItem = () => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-[36px] border border-gray-50 dark:border-gray-800 flex flex-col justify-between h-[160px] w-[240px] shrink-0 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl shrink-0"></div>
      <div className="space-y-2">
        <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
        <div className="h-2 w-12 bg-gray-50 dark:bg-gray-800/50 rounded-full"></div>
      </div>
    </div>
    <div className="h-4 w-full bg-gray-50 dark:bg-gray-800 rounded-full"></div>
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
  onRefresh,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activityListRef = useRef<HTMLDivElement>(null);
  const [currentDateTime, setCurrentDateTime] = useState("");

  // Pull to refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const PULL_THRESHOLD = 80;

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

  useEffect(() => {
    setCurrentDateTime(getFormattedDateTime());
    const timer = setInterval(
      () => setCurrentDateTime(getFormattedDateTime()),
      30000
    );
    return () => clearInterval(timer);
  }, [getFormattedDateTime]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLoading) return;
    touchStartY.current = e.touches[0].clientY;
    setIsPulling(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isLoading || !isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      // Apply some resistance
      const pull = Math.min(diff * 0.4, PULL_THRESHOLD + 20);
      setPullDistance(pull);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > PULL_THRESHOLD && onRefresh) {
      onRefresh();
    }
    setPullDistance(0);
    setIsPulling(false);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="h-screen w-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden select-none relative"
    >
      {/* Pull-to-refresh Indicator */}
      <div
        className="absolute top-0 left-0 w-full flex justify-center pointer-events-none z-50 transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance - 40}px)`,
          opacity: pullDistance / PULL_THRESHOLD,
        }}
      >
        <div className="bg-blue-600 p-2 rounded-full shadow-xl text-white">
          {pullDistance > PULL_THRESHOLD ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <ArrowDown size={20} />
          )}
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 rounded-b-[56px] px-8 pt-14 pb-8 shadow-2xl z-20 relative border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex justify-between items-start mb-8">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-6 w-32 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse"></div>
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse"></div>
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
            onClick={onOpenProfile}
            className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-[28px] border-4 border-white dark:border-gray-700 shadow-2xl active:scale-90 overflow-hidden transition-transform animate-in fade-in slide-in-from-right-4 duration-500"
          >
            {profilePhoto ? (
              <img src={profilePhoto} className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-gray-400 mx-auto mt-3" />
            )}
          </button>
        </div>

        {/* Status Card: Weather, Wind & Date */}
        <div className="animate-in zoom-in fade-in duration-700 delay-200">
          {isLoading ? (
            <div className="h-28 w-full bg-gray-100 dark:bg-gray-800 rounded-[32px] animate-pulse"></div>
          ) : (
            <div className="bg-blue-600 dark:bg-blue-700 rounded-[32px] p-6 text-white shadow-[0_20px_40px_-15px_rgba(37,99,235,0.4)] flex justify-between items-center relative overflow-hidden group">
              {/* Background decorative element */}
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <CloudSun size={100} />
              </div>

              <div className="flex flex-col z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Clock size={14} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
                    {t.currentWeather}
                  </span>
                </div>
                <span className="text-sm font-black uppercase tracking-tight tabular-nums">
                  {currentDateTime}
                </span>
              </div>

              <div className="flex gap-6 items-center z-10">
                {weather ? (
                  <>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <Thermometer size={18} strokeWidth={3} />
                        <span className="text-2xl font-black tabular-nums">
                          {Math.round(weather.temperature)}°
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/60 mt-1">
                        {t.weather}
                      </span>
                    </div>
                    <div className="w-px h-10 bg-white/20"></div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5">
                        <Wind size={18} strokeWidth={3} />
                        <span className="text-2xl font-black tabular-nums">
                          {Math.round(weather.windspeed || 0)}
                        </span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/60 mt-1">
                        KM/H
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <RefreshCw size={20} className="animate-spin opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      Updating
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8 pt-10 overflow-hidden">
        {/* Activity Picker */}
        <div className="shrink-0">
          <h3 className="font-black text-gray-400 dark:text-gray-500 mb-4 uppercase text-[10px] tracking-[0.3em]">
            {t.chooseActivity}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onPrepareRun}
              className="bg-white dark:bg-gray-900 p-6 rounded-[36px] shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-4 active:scale-95 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                <MapPin className="text-blue-600" size={28} />
              </div>
              <span className="font-black text-gray-900 dark:text-white text-[11px] uppercase tracking-widest">
                {t.outdoorRun}
              </span>
            </button>
            <button
              onClick={onStartWorkout}
              className="bg-white dark:bg-gray-900 p-6 rounded-[36px] shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-4 active:scale-95 transition-all group animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75"
            >
              <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
                <Dumbbell className="text-orange-500" size={28} />
              </div>
              <span className="font-black text-gray-900 dark:text-white text-[11px] uppercase tracking-widest">
                {t.training}
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex-1 flex flex-col mt-8 overflow-hidden">
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
            className="flex-1 flex flex-row gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4"
          >
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonItem key={i} />)
            ) : runHistory.length === 0 ? (
              <div className="h-32 w-full bg-white dark:bg-gray-900 rounded-[32px] flex flex-col items-center justify-center border border-gray-100 dark:border-gray-800 animate-in fade-in duration-1000 shrink-0">
                <Activity size={32} className="text-gray-200 mb-3" />
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
                          className={`w-12 h-12 ${
                            isWorkout
                              ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500"
                              : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                          } rounded-2xl flex items-center justify-center shrink-0`}
                        >
                          {isWorkout ? (
                            <Dumbbell size={20} />
                          ) : (
                            <Activity size={20} />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-black text-xs uppercase dark:text-white truncate">
                            {getTranslatedRunType(session.type)}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                            {new Date(session.startTime).toLocaleDateString(
                              undefined,
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
                          <ChevronRight size={14} className="text-gray-300" />
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
                    <Plus size={24} strokeWidth={3} />
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
    </div>
  );
};
