import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Share2,
  Flame,
  Activity,
  Timer,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Loader2,
  Gauge,
  Mountain,
  MapPin,
  Dumbbell,
  Zap,
  Check,
} from "lucide-react";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { RunSession, UnitSystem } from "../types";
import {
  getDistanceDisplay,
  formatTime,
  getPaceDisplay,
  getAltitudeDisplay,
} from "../utils";
import { RunMap } from "./RunMap";

declare const html2canvas: any;

// Small bundled icon used in the run summary header (replace with your own `icon.png` in `public/icons/` if desired)
const iconImg = new URL("../icons/icon-192.webp", import.meta.url).href;

interface SummaryScreenProps {
  session: RunSession;
  unitSystem: UnitSystem;
  language: string;
  t: any;
  onBack: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  session,
  unitSystem,
  language,
  t,
  onBack,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);

  // Workout icon: prefer a user-provided `/icons/barbel.png` in `public/` if available, otherwise fall back to `iconImg`.
  const [workIcon, setWorkIcon] = useState<string>(iconImg);

  useEffect(() => {
    let mounted = true;
    // Check public path '/icons/barbel.png' at runtime (doesn't break build if missing)
    fetch("/icons/barbel.png", { method: "HEAD" })
      .then((res) => {
        if (mounted && res.ok) setWorkIcon("/icons/barbel.png");
      })
      .catch(() => {
        /* ignore - keep fallback */
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isWorkout = session.type !== "Outdoor Run";

  const elevationGain = useMemo(() => {
    if (isWorkout) return 0;
    let gain = 0;
    for (let i = 1; i < session.path.length; i++) {
      const diff =
        (session.path[i].altitude || 0) - (session.path[i - 1].altitude || 0);
      if (diff > 0) gain += diff;
    }
    return gain;
  }, [session.path, isWorkout]);

  const paceSecondsPerKm =
    !isWorkout && session.distance > 0
      ? session.duration / session.distance
      : 0;
  const distDisplay = isWorkout
    ? { value: session.distance, unit: "%" }
    : getDistanceDisplay(session.distance, unitSystem);
  const paceDisplay = isWorkout
    ? session.avgPace
    : getPaceDisplay(paceSecondsPerKm, unitSystem);
  const altitudeDisplay = getAltitudeDisplay(elevationGain, unitSystem);

  const translateType = (type: string) => {
    const key = type.toLowerCase().replace(/\s/g, "");
    const camelKey = key.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    ).replace(/\s+/g, '');
    return t[key] || t[camelKey] || t[`ex${key.charAt(0).toUpperCase() + key.slice(1)}`] || t[`ex${key}`] || t.outdoorRun || type;
  };

  const dateStr = new Date(session.startTime).toLocaleDateString(
    language === "id" ? "id-ID" : language === "jp" ? "ja-JP" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const handleShare = async () => {
    if (!screenRef.current || isSharing) return;

    setIsSharing(true);
    // Brief delay to ensure map has settled after any layout changes
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const canvas = await html2canvas(screenRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: window.devicePixelRatio || 2,
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc: Document) => {
          // Hide interactive UI elements in the export
          const header = clonedDoc.getElementById("summary-header");
          if (header) header.style.visibility = "hidden";
          const backBtn = clonedDoc.getElementById("summary-footer-btn");
          if (backBtn) backBtn.style.visibility = "hidden";

          // Force map container in clone to be fully visible and opaque
          const mapContainer = clonedDoc.querySelector(
            ".leaflet-container"
          ) as HTMLElement;
          if (mapContainer) {
            mapContainer.style.opacity = "1";
          }
        },
      });

      const dataUrl = canvas.toDataURL("image/png", 0.9);
      const shareText = isWorkout
        ? `${t.workoutSummary}: ${translateType(session.type)} - ${session.distance}% ${t.completed}. #FitGo`
        : `${t.runSummary}: ${distDisplay.value} ${distDisplay.unit} @ ${paceDisplay}. #FitGo`;

      // Try navigator.share (web) with a File if available
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], "fit-go-activity.png", {
          type: "image/png",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: t.appTitle,
            text: shareText,
          });
          return;
        }
      } catch (e) {
        console.debug("navigator.share unavailable or failed", e);
      }

      // Capacitor Filesystem fallback: write base64 to cache and call native Share
      try {
        const base64 = dataUrl.split(",")[1];
        const filename = `fit-go-share-${Date.now()}.png`;
        const saved = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Cache,
        });
        const fileUri = (saved as any).uri || (saved as any).path || undefined;
        if (fileUri) {
          await Share.share({
            title: t.appTitle,
            text: shareText,
            url: fileUri,
          });
          return;
        }
      } catch (fsErr) {
        console.error("Filesystem write/share failed:", fsErr);
      }

      // Final fallback: download the image directly
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "fit-go-activity.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Share failed", error);
      try {
        await Share.share({
          title: t.appTitle,
          text: `Fit Go: ${isWorkout ? translateType(session.type) : "Activity"} completed!`,
        });
      } catch (e) {
        alert(t.shareError);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      ref={screenRef}
      className="h-screen w-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden relative"
    >
      <div
        id="summary-header"
        className="absolute top-12 left-0 w-full px-6 flex justify-between items-center z-[400]"
      >
        <button
          onClick={onBack}
          className="p-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-xl text-gray-900 dark:text-white active:scale-95 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur px-6 py-3 rounded-2xl shadow-xl border border-white/20">
          <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">
            {isWorkout ? t.workoutSummary : t.runSummary}
          </h2>
        </div>
        <button
          onClick={handleShare}
          disabled={isSharing}
          className={`p-4 rounded-2xl shadow-xl active:scale-95 transition-all ${isSharing
            ? "bg-gray-100 dark:bg-gray-700 text-gray-400"
            : isWorkout
              ? "bg-orange-500 text-white"
              : "bg-blue-600 text-white"
            }`}
        >
          {isSharing ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Share2 size={24} />
          )}
        </button>
      </div>

      <div className="flex-1 relative">
        {isWorkout ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-orange-50/50 to-white dark:from-orange-950/10 dark:to-black">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] shadow-2xl animate-in zoom-in duration-700 border-2 border-orange-500/10 relative">
              <div className="absolute -top-3 -right-3 bg-green-500 text-white p-2 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-500 delay-500">
                <Check size={20} strokeWidth={4} />
              </div>
              <Dumbbell size={64} className="text-orange-500" />
            </div>
            <div className="mt-8 text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 px-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-tight">
                {translateType(session.type)}
              </h3>
              <p className="text-orange-500 font-black uppercase tracking-widest text-[10px]">
                {t.exerciseCompleted}
              </p>
            </div>
          </div>
        ) : (
          <RunMap
            currentLocation={null}
            path={session.path}
            isRunning={false}
            isFollowingUser={false}
            isSheetExpanded={true}
            isDarkMode={false}
            isZenMode={false}
            readOnly={true}
          />
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-t-[56px] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] z-[500] px-8 pt-6 pb-12 relative border-t border-gray-100 dark:border-gray-800 edge-blur-v">
        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-8"></div>

        <div className="space-y-8">
          {/* Primary Stats */}
          <div className="flex items-center justify-between relative px-2">
            <div className="flex flex-col animate-in slide-in-from-left-4 duration-700">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {t.duration}
              </span>
              <span className="text-4xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                {formatTime(session.duration)}
              </span>
            </div>

            {!isWorkout && (
              <>
                {/* Center icon between duration and distance */}
                <div className="absolute left-1/2 -translate-x-1/2 top-6 pointer-events-none animate-in fade-in duration-500">
                  <img
                    src={iconImg}
                    className="w-12 h-12 object-contain"
                    alt="Activity Icon"
                  />
                </div>
              </>
            )}

            {isWorkout && (
              <>
                {/* Center icon between duration and target achieved */}
                <div className="absolute left-1/2 -translate-x-1/2 top-6 pointer-events-none animate-in fade-in duration-500">
                  <img
                    src={workIcon}
                    className="w-12 h-12 object-contain"
                    alt="Barbell Icon"
                  />
                </div>
              </>
            )}

            <div className="flex flex-col items-end text-right animate-in slide-in-from-right-4 duration-700">
              <span
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isWorkout
                  ? "text-orange-500"
                  : "text-blue-600 dark:text-blue-400"
                  }`}
              >
                {isWorkout ? t.targetAchieved : t.distance}
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-4xl font-black tabular-nums tracking-tighter ${isWorkout
                    ? "text-orange-500"
                    : "text-blue-600 dark:text-blue-400"
                    }`}
                >
                  {distDisplay.value}
                </span>
                <span className="text-sm font-black text-gray-400 uppercase">
                  {distDisplay.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div
              className={`bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl flex flex-col gap-1 border border-transparent transition-all ${isWorkout
                ? "hover:border-orange-500/20"
                : "hover:border-blue-500/20"
                }`}
            >
              <div
                className={`flex items-center gap-1.5 ${isWorkout ? "text-orange-500" : "text-purple-500"
                  }`}
              >
                {isWorkout ? <Zap size={14} /> : <Activity size={14} />}
                <p className="text-[8px] font-black uppercase tracking-widest">
                  {isWorkout ? t.goal : t.pace}
                </p>
              </div>
              <p className="text-lg font-black dark:text-white tabular-nums">
                {paceDisplay}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl flex flex-col gap-1 border border-transparent hover:border-red-500/20 transition-all">
              <div className="flex items-center gap-1.5 text-red-500">
                <Flame size={14} />
                <p className="text-[8px] font-black uppercase tracking-widest">
                  {t.cal}
                </p>
              </div>
              <p className="text-lg font-black dark:text-white tabular-nums">
                {session.calories}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-3xl flex flex-col gap-1 border border-transparent hover:border-teal-500/20 transition-all">
              <div className="flex items-center gap-1.5 text-teal-500">
                {isWorkout ? <Calendar size={14} /> : <Mountain size={14} />}
                <p className="text-[8px] font-black uppercase tracking-widest">
                  {isWorkout ? t.completed : t.gain}
                </p>
              </div>
              <p className="text-lg font-black dark:text-white tabular-nums">
                {isWorkout ? (
                  t.completed
                ) : (
                  <>
                    {altitudeDisplay.value}
                    <span className="text-[8px] text-gray-400 ml-0.5">
                      {altitudeDisplay.unit}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5 pt-2">
            <div className="flex items-center gap-3 px-2">
              <div
                className={`p-2 rounded-lg ${isWorkout
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600"
                  : "bg-green-100 dark:bg-green-900/30 text-green-600"
                  }`}
              >
                <CheckCircle2 size={16} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {dateStr}
              </p>
            </div>

            <button
              id="summary-footer-btn"
              onClick={onBack}
              className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black py-5 rounded-[32px] shadow-xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 active:scale-95 transition-all border-b-4 border-black/10 dark:border-white/10"
            >
              {t.backHome} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
