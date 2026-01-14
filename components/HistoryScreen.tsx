import React, { useRef, useState, useMemo } from "react";
import {
  ArrowLeft,
  History,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Activity,
  Dumbbell,
  Calendar,
  Filter,
  X,
} from "lucide-react";
import { RunSession, UnitSystem } from "../types";
import { addBackHandler } from "../utils/backButtonService";
import { formatTime, getDistanceDisplay, getPaceDisplay } from "../utils";
import { CustomDialog } from "./CustomDialog";

interface HistoryScreenProps {
  onBack: () => void;
  runHistory: RunSession[];
  unitSystem: UnitSystem;
  t: any;
  onHistorySelect: (session: RunSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  getTranslatedRunType: (type: string) => string;
  language: string;
}

const ITEMS_PER_PAGE = 10;

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onBack,
  runHistory,
  unitSystem,
  t,
  onHistorySelect,
  onDeleteSession,
  onExportData,
  onImportData,
  getTranslatedRunType,
  language,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [filterType, setFilterType] = useState<"all" | "run" | "workout">(
    "all"
  );
  const [filterDate, setFilterDate] = useState<string>(""); // YYYY-MM-DD

  // Filtering Logic
  const filteredHistory = useMemo(() => {
    return runHistory.filter((session) => {
      const isWorkout = !session.path || session.path.length === 0;

      // Type Filter
      if (filterType === "run" && isWorkout) return false;
      if (filterType === "workout" && !isWorkout) return false;

      // Date Filter
      if (filterDate) {
        const sessionDate = new Date(session.startTime)
          .toISOString()
          .split("T")[0];
        if (sessionDate !== filterDate) return false;
      }

      return true;
    });
  }, [runHistory, filterType, filterDate]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHistory.length / ITEMS_PER_PAGE)
  );

  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages || 1);
    }
  }, [totalPages, currentPage]);

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  const translateType = (type: string) => {
    return getTranslatedRunType(type);
  };

  const handleDeleteRequest = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSessionToDelete(id);
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      const id = sessionToDelete;
      setIsDeletingId(id);
      setTimeout(() => {
        onDeleteSession(id);
        setIsDeletingId(null);
        setSessionToDelete(null);
      }, 300);
    }
  };

  const scrollToListTop = () => {
    const container = document.getElementById("history-scroll-container");
    if (container) container.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      scrollToListTop();
    }
  };

  const clearFilters = () => {
    setFilterType("all");
    setFilterDate("");
    setCurrentPage(1);
  };

  // Register hardware back handler to close filters/modals first
  React.useEffect(() => {
    const handler = () => {
      if (sessionToDelete) {
        setSessionToDelete(null);
        return true;
      }
      if (filterDate || filterType !== "all") {
        clearFilters();
        return true;
      }
      return false;
    };

    const remove = addBackHandler(handler);
    return () => remove();
  }, [sessionToDelete, filterDate, filterType]);

  return (
    <div className="h-screen w-screen bg-gray-50 dark:bg-black flex flex-col transition-colors duration-300">

      {/* Header - Android Style (Large) */}
      <div className="p-6 pt-12 flex flex-col bg-white dark:bg-gray-900 shadow-xl z-20 border-b border-gray-100 dark:border-gray-800 rounded-b-[64px] pb-8 transition-all">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="mx-auto font-black text-2xl text-gray-900 dark:text-white uppercase tracking-tighter">
            {t.history}
          </span>
          <div className="w-12"></div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-4 px-2">
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
              <div className="w-12 flex-shrink-0" />
              <button
                onClick={() => {
                  setFilterType("all");
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterType === "all"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}
              >
                {t.allExercises || "All"}
              </button>
              <button
                onClick={() => {
                  setFilterType("run");
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${filterType === "run"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}
              >
                <MapPin size={14} /> {t.outdoorRun}
              </button>
              <button
                onClick={() => {
                  setFilterType("workout");
                  setCurrentPage(1);
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${filterType === "workout"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}
              >
                <Dumbbell size={14} /> {t.training || 'Training'}
              </button>
              <div className="w-12 flex-shrink-0" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[20px] px-5 py-3.5 text-xs font-black uppercase tracking-widest dark:text-white focus:ring-2 ring-blue-500 shadow-inner appearance-none"
              />
              {!filterDate && (
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-gray-400">
                  <Calendar size={16} />
                </div>
              )}
            </div>
            {(filterType !== "all" || filterDate) && (
              <button
                onClick={clearFilters}
                className="p-3.5 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-[20px] active:scale-90 transition-all"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        id="history-scroll-container"
        className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32 -mt-4 z-10 pt-10 edge-blur-v"
      >
        {/* Backup/Restore Card - Keep for utility */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-[40px] p-8 border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in duration-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 className="font-black text-gray-900 dark:text-white text-base uppercase tracking-wider">
                {t.syncData}
              </h4>
              <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5 tracking-widest">
                {t.backupInfo}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={onExportData}
              disabled={runHistory.length === 0}
              className={`flex flex-col items-center justify-center gap-2 py-5 rounded-2xl transition-all group ${runHistory.length === 0
                ? "bg-gray-200 dark:bg-gray-800 opacity-50 cursor-not-allowed"
                : "bg-gray-50 dark:bg-gray-700/50 active:scale-95"
                }`}
            >
              <Download size={22} className={runHistory.length === 0 ? "text-gray-400" : "text-blue-600"} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${runHistory.length === 0 ? "text-gray-400" : "text-gray-700 dark:text-gray-200"
                }`}>
                {t.exportData}
              </span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700/50 py-5 rounded-2xl active:scale-95 transition-all group"
            >
              <Upload size={22} className="text-purple-600" />
              <span className="text-[10px] font-black text-gray-700 dark:text-gray-200 uppercase tracking-widest">
                {t.importData}
              </span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportData(file);
                  e.target.value = "";
                }
              }}
            />
          </div>
        </div>

        {paginatedHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-6 animate-in fade-in duration-700">
            <div className="p-8 bg-gray-100 dark:bg-gray-900 rounded-full">
              <History size={64} className="opacity-20" />
            </div>
            <div className="text-center">
              <p className="font-black uppercase tracking-[0.3em] text-sm opacity-40">
                {filterType === 'workout' ? t.noTrainingRecordYet : t.noHistoryTitle}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedHistory.map((session) => {
                const isDeleting = isDeletingId === session.id;
                const isWorkout = !session.path || session.path.length === 0;
                const paceSecondsPerKm =
                  !isWorkout && session.distance > 0
                    ? session.duration / session.distance
                    : 0;
                const displayDistance = isWorkout
                  ? { value: session.distance, unit: "%" }
                  : getDistanceDisplay(session.distance, unitSystem);
                const displayPace = isWorkout
                  ? session.avgPace
                  : getPaceDisplay(paceSecondsPerKm, unitSystem);
                const date = new Date(session.startTime);

                return (
                  <div
                    key={session.id}
                    onClick={() => onHistorySelect(session)}
                    className={`bg-white dark:bg-gray-900 rounded-[48px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all cursor-pointer group hover:border-blue-500/30 relative overflow-hidden ${isDeleting
                      ? "opacity-0 scale-95"
                      : "opacity-100 scale-100"
                      }`}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-5">
                        <div
                          className={`w-14 h-14 ${isWorkout
                            ? "bg-orange-50 dark:bg-orange-950 text-orange-500"
                            : "bg-blue-50 dark:bg-blue-950 text-blue-600"
                            } rounded-[24px] flex items-center justify-center shadow-inner`}
                        >
                          {isWorkout ? (
                            <Dumbbell size={28} />
                          ) : (
                            <MapPin size={28} />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                            {translateType(session.type)}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar size={12} className="text-gray-400" />
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                              {date.toLocaleDateString(
                                language === "id" ? "id-ID" : language === "jp" ? "ja-JP" : "en-US",
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}{" "}
                              •{" "}
                              {date.toLocaleTimeString(
                                language === "id" ? "id-ID" : language === "jp" ? "ja-JP" : "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteRequest(e, session.id)}
                        className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-[20px] active:scale-90 transition-all hover:bg-red-100 z-20"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-gray-50 dark:border-gray-800 pt-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">
                          {isWorkout ? t.targetAchieved : t.distance}
                        </span>
                        <div className="flex items-baseline gap-0.5">
                          <span
                            className={`text-2xl font-black tabular-nums tracking-tighter ${isWorkout
                              ? "text-orange-500"
                              : "text-gray-900 dark:text-white"
                              }`}
                          >
                            {displayDistance.value}
                          </span>
                          <span className="text-[10px] font-black text-gray-400 uppercase">
                            {displayDistance.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">
                          {t.duration}
                        </span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                          {formatTime(session.duration)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] uppercase font-black text-gray-400 mb-1 tracking-widest">
                          {isWorkout ? t.goal : t.pace}
                        </span>
                        <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                          {displayPace}
                        </span>
                      </div>
                    </div>

                    {/* Action Indicator Row */}
                    <div className="mt-6 flex justify-center">
                      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-1.5 rounded-full flex items-center gap-2 group-hover:bg-blue-600 transition-all group-hover:px-8">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-white transition-colors">
                          {t.viewDetails}
                        </span>
                        <ChevronRight
                          size={14}
                          className="text-gray-300 group-hover:text-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clean Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-12 mb-8 px-2 bg-white dark:bg-gray-900 p-6 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-5 rounded-[24px] transition-all active:scale-90 ${currentPage === 1
                    ? "text-gray-200 dark:text-gray-800"
                    : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                    }`}
                >
                  <ChevronLeft size={24} />
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">
                    Page
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                      {currentPage}
                    </span>
                    <span className="text-sm font-black text-gray-300 dark:text-gray-700 uppercase">
                      / {totalPages}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-5 rounded-[24px] transition-all active:scale-90 ${currentPage === totalPages
                    ? "text-gray-200 dark:text-gray-800"
                    : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                    }`}
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CustomDialog
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={confirmDelete}
        title={t.deleteHistory}
        message={t.confirmDelete}
        confirmText={t.deleteHistory}
        cancelText={t.cancel}
        type="danger"
      />
    </div>
  );
};
