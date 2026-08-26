import React, { useEffect, useState, useRef, useMemo } from "react";
import GriddyIcon from "./GriddyIcon";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { RunSession, UnitSystem } from "../types";
import {
  getDistanceDisplay,
  formatTime,
  getPaceDisplay,
  getAltitudeDisplay,
} from "../utils";
import { exportToGPX, exportToJSON } from "../utils/exportUtils";
import { RunMap } from "./RunMap";
import { ShareSheet } from "./ShareSheet";

declare const htmlToImage: any;

// Small bundled icon used in the run summary header (replace with your own `icon.png` in `public/icons/` if desired)
const iconImg = new URL("../icons/icon-192.webp", import.meta.url).href;

interface SummaryScreenProps {
  session: RunSession;
  unitSystem: UnitSystem;
  language: string;
  t: any;
  onBack: () => void;
  userName: string;
  profilePhoto: string | null;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  session,
  unitSystem,
  language,
  t,
  onBack,
  userName,
  profilePhoto,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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
  const isCompleted = session.distance >= 100;

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
    ? { value: session.distance.toString(), unit: "%" }
    : getPaceDisplay(paceSecondsPerKm, unitSystem);
  const altitudeDisplay = getAltitudeDisplay(elevationGain, unitSystem);

  const translateType = (type: string) => {
    if (!type) return t.outdoorRun;
    if (t[type]) return t[type];
    const trimmed = type.trim();
    if (trimmed.startsWith("ex")) {
      return t[type] || t.training || type;
    }
    const norm = trimmed.toLowerCase().replace(/\s+/g, "");
    if (norm === "outdoorrun") return t.outdoorRun;
    if (norm === "freerun") return t.freeRun || type;
    if (norm === "interval") return t.interval || type;
    if (norm === "tempo") return t.tempo || type;
    if (norm === "longrun") return t.longRun || type;
    if (norm === "recovery") return t.recovery || type;
    return type;
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

    const isDark = document.documentElement.classList.contains("dark");
    setIsSharing(true);

    // Brief delay to ensure map has settled after any layout changes
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Create a style element to hide elements during capture
      const style = document.createElement('style');
      style.innerHTML = `
        #back-button, #share-button-main, #handle-indicator { visibility: hidden !important; }
        #header-title-container { 
          background-color: ${isDark ? "rgba(31, 41, 55, 0.9)" : "rgba(255, 255, 255, 0.9)"} !important;
          backdrop-filter: none !important;
          border: ${isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.05)"} !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
        }
        #header-title-container h2 { color: ${isDark ? "#ffffff" : "#111827"} !important; }
        #summary-card-outer { 
          margin-top: -64px !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          position: relative !important;
          z-index: 100 !important;
          box-shadow: none !important;
        }
        #summary-content {
          border-radius: 60px 60px 0 0 !important;
          background-color: ${isDark ? "#111827" : "#ffffff"} !important;
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          border: none !important;
        }
        .flex-1.relative {
          min-height: 400px !important;
          z-index: 1 !important;
          background-color: ${isDark ? "#000000" : "#f9fafb"} !important;
        }
        .bg-gradient-to-b {
          min-height: 400px !important;
          height: 100% !important;
          background-image: ${isDark 
            ? "linear-gradient(to bottom, rgba(124, 45, 18, 0.2), #000000)" 
            : "linear-gradient(to bottom, rgba(255, 237, 213, 0.5), #ffffff)"} !important;
        }
        .animate-in.zoom-in, .bg-transparent {
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(style);

      const dataUrl = await htmlToImage.toPng(screenRef.current, {
        quality: 1.0,
        pixelRatio: 4,
        backgroundColor: isDark ? "#000000" : "#f9fafb",
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      document.head.removeChild(style);
      setPreviewUrl(dataUrl);
      setShowPreview(true);
    } catch (error) {
      console.error("Capture failed", error);
      alert(t.shareError);
    } finally {
      setIsSharing(false);
    }
  };

  const handleFinalShare = async () => {
    if (!previewUrl) return;

    const shareText = isWorkout
      ? `${t.workoutSummary}: ${translateType(session.type)} - ${session.distance}% ${t.completed}. #FitGo`
      : `${t.runSummary}: ${distDisplay.value} ${distDisplay.unit} @ ${paceDisplay.value}${paceDisplay.unit}. #FitGo`;

    try {
      // Try navigator.share (web) with a File if available
      try {
        const response = await fetch(previewUrl);
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
        const base64 = previewUrl.split(",")[1];
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
      a.href = previewUrl;
      a.download = "fit-go-activity.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Operation failed", error);
      try {
        await Share.share({
          title: t.appTitle,
          text: shareText,
        });
      } catch (e) {
        alert(t.shareError);
      }
    }
  };

  const handleShareClick = () => {
    if (isWorkout) {
      handleShare(); // Workouts only have PNG share
    } else {
      setIsShareSheetOpen(true);
    }
  };

  const handleExportGPX = async () => {
    try {
      setIsSharing(true);
      const coords = session.path.map(p => [p.longitude, p.latitude] as [number, number]);
      await exportToGPX(coords, session.startTime);
    } catch (e: any) {
      alert(e.message || "Failed to export GPX");
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsSharing(true);
      const coords = session.path.map(p => [p.longitude, p.latitude] as [number, number]);
      await exportToJSON(coords, session);
    } catch (e: any) {
      alert(e.message || "Failed to export JSON");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <div
        ref={screenRef}
        className="h-screen w-screen bg-gray-100 dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden relative"
      >
      <div
        id="summary-header"
        className="absolute top-12 left-0 w-full px-6 flex justify-between items-center z-[400]"
      >
        <button
          id="back-button"
          onClick={onBack}
          className="p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-[28px] shadow-xl text-gray-900 dark:text-white active:scale-95 transition-all border border-white/20"
        >
          <GriddyIcon name="ArrowLeft" size={24} />
        </button>

        <div id="header-title-container" className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl px-6 py-3 rounded-[28px] shadow-xl border border-white/20 flex-1 mx-4 text-center">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest truncate">
            {translateType(session.type)}
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            id="share-button-main"
            onClick={handleShareClick}
            disabled={isSharing}
            className={`p-4 rounded-[28px] shadow-xl text-white active:scale-95 transition-all border border-white/20 ${isWorkout
              ? "bg-orange-500/90 hover:bg-orange-600 shadow-orange-500/20"
              : "bg-blue-600/90 hover:bg-blue-700 shadow-blue-600/20"
              } ${isSharing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSharing ? (
              <GriddyIcon name="Loader" size={24} className="animate-spin" />
            ) : (
              <GriddyIcon name="Share" size={24} />
            )}
          </button>
        </div>
      </div>

      <ShareSheet
        isOpen={isShareSheetOpen}
        onClose={() => setIsShareSheetOpen(false)}
        onSharePNG={handleShare}
        onShareGPX={handleExportGPX}
        isProcessing={isSharing}
        t={t}
      />

          <div className="flex-1 relative overflow-hidden">
            {isWorkout ? (
              <div className="w-full h-full flex flex-col items-center justify-center pt-8 bg-pink-200 to-white dark:from-orange-950/10 dark:to-black">
                <div className="animate-in zoom-in duration-700 relative bg-transparent flex flex-col items-center">
                  <div className="relative mb-6">
                    <div className={`absolute -top-9 -right-[20px] p-2.5 rounded-[18px] shadow-xl animate-in fade-in zoom-in duration-500 delay-500 z-10 ${
                      isCompleted ? "bg-green-500" : "bg-red-500"
                    }`}>
                      {isCompleted ? (
                        <GriddyIcon name="Check" size={20} strokeWidth={4} className="text-white" />
                      ) : (
                        <GriddyIcon name="X" size={20} strokeWidth={4} className="text-white" />
                      )}
                    </div>
                    <img
                      src={workIcon}
                      className="w-24 h-24 object-contain drop-shadow-2xl"
                      alt="Workout"
                    />
                  </div>
                  <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <p className={`${isCompleted ? "text-orange-500" : "text-red-500"} font-black uppercase tracking-[0.3em] text-[13px]`}>
                      {isCompleted ? t.exerciseCompleted : "BELUM"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
          <RunMap
            currentLocation={null}
            path={session.path}
            isFollowingUser={false}
            isSheetExpanded={true}
            isDarkMode={false}
            isZenMode={false}
            readOnly={true}
          />
        )}
      </div>

      <div
        id="summary-card-outer"
        className="z-[500] -mt-16 h-[50vh] overflow-hidden rounded-t-[60px] animate-in slide-in-from-bottom-full duration-700 ease-out shadow-[0_-25px_50px_rgba(0,0,0,0.15)]"
      >
        <div
          id="summary-content"
          className="bg-white dark:bg-gray-900 border-t border-gray-200/50 h-full w-full px-8 pt-10 pb-12 relative transition-all duration-700 border-t border-gray-200/50 dark:border-none"
        >
          {/* Handle indicator */}
          <div id="handle-indicator" className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>

                <div className="flex items-center justify-center mb-6 w-full">
                  <span 
                    className="text-sm md:text-base font-black text-center uppercase tracking-widest text-blue-400"
                    role="heading" 
                    aria-level={2}
                  >
                    {isWorkout ? t.workoutSummaryTitle : t.runSummary}
                  </span>
                </div>

          <div className="space-y-6 mt-6">
            {/* Primary Stats */}
            <div className="flex items-center justify-between relative px-2">
              <div className="flex flex-col animate-in slide-in-from-left-4 duration-700">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                  {t.duration}
                </span>
                <span className="text-4xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                  {formatTime(session.duration)}
                </span>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none animate-in fade-in duration-500">
                <div className="bg-transparent">
                  {isWorkout ? (
                    <img 
                      src={workIcon} 
                      className="w-12 h-12 object-contain drop-shadow-lg bg-transparent" 
                      alt="Workout Icon" 
                    />
                  ) : (
                    <img 
                      src={iconImg} 
                      className="w-14 h-14 object-contain drop-shadow-lg bg-transparent" 
                      alt="Run Icon" 
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end text-right animate-in slide-in-from-right-4 duration-700">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${isWorkout
                    ? "text-orange-500"
                    : "text-blue-600 dark:text-blue-400"
                    }`}
                >
                  {isWorkout ? "Intensitas" : t.distance}
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
                  <span className="text-xs font-black text-gray-400 uppercase">
                    {distDisplay.unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div
                className={`bg-gray-50 dark:bg-gray-800/40 p-4 rounded-[32px] flex flex-col gap-1 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm transition-all ${isWorkout
                  ? "hover:border-orange-500/20"
                  : "hover:border-blue-500/20"
                  }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${isWorkout ? "text-orange-500" : "text-purple-500"
                    }`}
                >
                  {isWorkout ? <GriddyIcon name="Repetisi" size={14} /> : <GriddyIcon name="Gauge" size={14} />}
                  <p className="text-[8px] font-black uppercase tracking-widest">
                    {isWorkout ? t.repetitions : t.pace}
                  </p>
                </div>
                <p className="text-lg font-black dark:text-white tabular-nums">
                  {isWorkout ? (
                    session.type.toLowerCase().includes("lunges") ? "3 x 12" : (isCompleted ? t.completed : t.notCompleted)
                  ) : (
                    <>
                      {paceDisplay.value}
                      <span className="text-[8px] text-gray-400 ml-0.5 font-black uppercase">
                        {paceDisplay.unit}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-[32px] flex flex-col gap-1 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm hover:border-red-500/20 transition-all">
                <div className="flex items-center gap-1.5 text-red-500">
                  <GriddyIcon name="Fire" size={14} />
                  <p className="text-[8px] font-black uppercase tracking-widest">
                    {t.cal}
                  </p>
                </div>
                <p className="text-lg font-black dark:text-white tabular-nums">
                  {session.calories}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-[32px] flex flex-col gap-1 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm hover:border-teal-500/20 transition-all">
                <div className={`flex items-center gap-1.5 ${isWorkout ? (isCompleted ? "text-teal-500" : "text-red-500") : "text-teal-500"}`}>
                  {isWorkout ? (isCompleted ? <GriddyIcon name="Check" size={14} /> : <GriddyIcon name="X" size={14} />) : <GriddyIcon name="Mountain" size={14} />}
                  <p className="text-[8px] font-black uppercase tracking-widest">
                    {isWorkout ? t.status : t.gain}
                  </p>
                </div>
                <p className="text-lg font-black dark:text-white tabular-nums truncate">
                  {isWorkout ? (
                    isCompleted ? t.completed : t.notCompleted
                  ) : (
                    <>
                      {altitudeDisplay.value}
                      <span className="text-[8px] text-gray-400 ml-0.5 font-black uppercase">
                        {altitudeDisplay.unit}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex justify-center mb-4">
                <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-200/50 dark:border-white/5">
                  <p className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                    {dateStr}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center pt-6 border-t border-gray-100 dark:border-gray-800/50 mb-12">
                <div className="flex flex-col items-center w-full">
                  <div
                    onClick={onBack}
                    className="flex items-center gap-4 group cursor-pointer active:scale-95 transition-all bg-gray-50 dark:bg-gray-800/30 pl-4 pr-6 py-2 rounded-full border border-gray-200/50 dark:border-white/10 shadow-sm hover:shadow-md"
                  >
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-blue-500 transition-colors">
                      {t.achievedBy || "ACHIEVED BY"}
                    </p>

                    <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-3">
                      <div className="relative">
                        {profilePhoto ? (
                          <img
                            src={profilePhoto}
                            alt={userName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-md group-hover:border-blue-500 transition-all"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-sm border-2 border-white dark:border-gray-700 shadow-md group-hover:scale-105 transition-all">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                          {userName}
                        </p>
                        <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">
                          FIT GO RUNNER
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Image Review Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 z-[1000] flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex justify-between items-center p-6 pt-12">
            <button
              onClick={() => {
                setShowPreview(false);
                setPreviewUrl(null);
              }}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <GriddyIcon name="X" size={24} />
            </button>
            <h3 className="text-white font-black uppercase tracking-widest text-sm">
              Preview {t.runSummary || "Summary"}
            </h3>
            <div className="w-12" /> {/* Spacer */}
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center animate-in zoom-in-95 duration-500">
              <img
                src={previewUrl || undefined}
                alt="Activity Summary"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 pb-12 grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={() => {
                setShowPreview(false);
                setPreviewUrl(null);
                handleShare();
              }}
              className="flex items-center justify-center gap-2 py-4 bg-white/10 hover:bg-white/20 text-white rounded-[24px] font-black uppercase tracking-wider text-sm transition-all active:scale-95 border border-white/10"
            >
              <GriddyIcon name="Refresh" size={18} />
              {t.regenerate || "Re-capture"}
            </button>
            <button
              onClick={() => {
                handleFinalShare();
              }}
              className={`flex items-center justify-center gap-2 py-4 rounded-[24px] font-black uppercase tracking-wider text-sm transition-all active:scale-95 shadow-xl ${
                isWorkout ? "bg-orange-500 text-white" : "bg-blue-600 text-white"
              }`}
            >
              <GriddyIcon name="Share" size={18} />
              {t.share || "Share"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SummaryScreen;
