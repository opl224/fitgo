import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GriddyIcon } from "./GriddyIcon";
import { formatTime } from "../utils";
import { addBackHandler } from "../utils/backButtonService";
import { CustomDialog } from "./CustomDialog";
import { WorkoutAssessment } from "./WorkoutAssessment";
import { UserPhysicalProfile, RunSession } from "../types";
import { calculateCalorieProfile } from "../utils/calorieCalculations";
import { storage } from "../utils/secureStorage";

interface Exercise {
  id: string;
  nameKey: string;
  targetKey: string;
  descKey: string;
  icon: React.ReactNode;
  color: string;
  category: "strength" | "cardio" | "mobility" | "hiit";
  impact: "low" | "high";
  duration?: number;
  setsCount?: number;
  repsCount?: number;
  videoUrl?: string;
}

/**
 * ResponsiveVideoPlayer: A clean iframe-based player for Google Drive videos.
 */
const ResponsiveVideoPlayer: React.FC<{ url: string; title: string; t: any }> = ({ url, title, t }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Convert Google Drive view link to embed link
  const embedUrl = useMemo(() => {
    if (!url) return "";
    try {
      const fileId = url.match(/\/d\/(.+?)\//)?.[1];
      // Using /preview is standard, but we add ?usp=sharing to hint public access
      // and ensure we don't include any other params that might trigger redirects
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
    } catch {
      return url;
    }
  }, [url]);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {t.tutorialVideo}
        </span>
      </div>
      <div className="relative w-full pt-[56.25%] bg-gray-100 dark:bg-gray-800 rounded-[32px] overflow-hidden shadow-inner border border-gray-200/50 dark:border-gray-700/50 group">
        {isLoading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-gray-50 dark:bg-gray-900">
            <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
              {t.loadingVideo}
            </span>
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900">
            <GriddyIcon name="Alert" size={32} className="text-red-500 mb-2" />
            <p className="text-[10px] font-bold text-gray-500 uppercase leading-relaxed">
              {t.videoError}
            </p>
          </div>
        ) : (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full border-none"
            allow="autoplay; fullscreen; picture-in-picture"
            onLoad={() => setIsLoading(false)}
            onError={() => setError(true)}
            title={title}
            loading="lazy"
          />
        )}
      </div>
    </div>
  );
};

// --- Sub-components for better organization ---

/**
 * SummaryView: Displayed after a workout is completed or stopped.
 * Shows performance metrics and status (Completed/Unfinished).
 */
const SummaryView: React.FC<{
  session: { name: string; duration: number; percent: number };
  t: any;
  onFinish: () => void;
}> = ({ session, t, onFinish }) => {
  const isSuccess = session.percent === 100;
  return (
    <div className="h-screen w-screen bg-white dark:bg-black flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 flex flex-col items-center justify-center">
        <div className="text-center space-y-2">
          <div
            className={`p-4 rounded-full inline-flex ${
              isSuccess
                ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                : "bg-red-100 dark:bg-red-900/20 text-red-600"
            }`}
          >
            {isSuccess ? <GriddyIcon name="Check" size={40} /> : <GriddyIcon name="X" size={40} />}
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            {isSuccess ? t.exerciseCompleted : t.unfinished}
          </h2>
          <p className="text-blue-600 font-black uppercase tracking-widest text-xs">
            {session.name}
          </p>
        </div>

        <div className="w-full max-w-xs grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 flex flex-col items-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
              {t.totalTime}
            </p>
            <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">
              {formatTime(session.duration)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-[24px] border border-gray-100 dark:border-gray-800 flex flex-col items-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
              {t.targetAchieved}
            </p>
            <p
              className={`text-xl font-black uppercase tabular-nums ${
                isSuccess ? "text-green-600" : "text-red-500"
              }`}
            >
              {session.percent}%
            </p>
          </div>
        </div>

        <button
          onClick={onFinish}
          className="w-full max-w-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black py-4 rounded-[24px] shadow-xl uppercase tracking-widest text-xs active:scale-95 transition-all"
        >
          {t.finishWorkout}
        </button>
      </div>
    </div>
  );
};

const ReadyView: React.FC<{
  exercise: Exercise;
  t: any;
  onBack: () => void;
  onStart: () => void;
}> = ({ exercise, t, onBack, onStart }) => (
  <div className="h-screen w-screen bg-white dark:bg-black flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
    <div className="p-6 pt-12 flex items-center z-20">
      <button
        onClick={onBack}
        className="p-3 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all"
      >
        <GriddyIcon name="ArrowLeft" size={24} />
      </button>
      <span className="mx-auto font-black text-lg text-gray-900 dark:text-white uppercase tracking-[0.2em]">
        {t.getReady}
      </span>
      <div className="w-12"></div>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 overflow-y-auto no-scrollbar">
      <div
        className={`p-8 bg-${exercise.color}-100 dark:bg-${exercise.color}-900/20 text-${exercise.color}-600 rounded-[48px] shadow-2xl shrink-0`}
      >
        {exercise.icon}
      </div>
      <div className="space-y-3 shrink-0">
        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
          {t[exercise.nameKey]}
        </h2>
        <p className="text-blue-600 font-black uppercase tracking-widest text-xs">
          {t[exercise.targetKey]}
        </p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[40px] p-8 border border-gray-100 dark:border-gray-800 w-full max-w-sm shrink-0">
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          {t[exercise.descKey]}
        </p>
        
        {exercise.videoUrl && (
          <div className="mb-8">
            <ResponsiveVideoPlayer url={exercise.videoUrl} title={t[exercise.nameKey]} t={t} />
          </div>
        )}

        <div className="flex justify-center gap-6">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
              {t.sets}
            </p>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {exercise.setsCount || 1}
            </p>
          </div>
          <div className="w-px h-10 bg-gray-200 dark:bg-gray-800"></div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
              {exercise.duration ? t.duration : t.reps}
            </p>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              {exercise.duration
                ? `${exercise.duration}s`
                : exercise.repsCount}
            </p>
          </div>
        </div>
      </div>
      <button
        onClick={onStart}
        className="w-full max-w-sm bg-blue-600 text-white font-black py-6 rounded-[32px] shadow-2xl uppercase tracking-widest text-lg active:scale-95 transition-all flex items-center justify-center gap-3 border-4 border-white/10 shrink-0"
      >
        <GriddyIcon name="Play" size={24} filled/> {t.startWorkout}
      </button>
    </div>
  </div>
);

/**
 * RestView: Circular timer shown between sets.
 */
const RestView: React.FC<{
  restRemaining: number;
  t: any;
  onSkip: () => void;
}> = ({ restRemaining, t, onSkip }) => (
  <div className="w-full flex flex-col items-center justify-center space-y-12 animate-in zoom-in duration-300 py-10">
    <div className="text-center">
      <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 p-4 rounded-3xl inline-flex mb-4">
        <GriddyIcon name="BeerAlt" size={32} className="animate-bounce" />
      </div>
      <h2 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
        {t.restSession}
      </h2>
    </div>
    <div className="relative flex items-center justify-center">
      <svg className="w-64 h-64 transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          className="text-gray-200 dark:text-gray-800"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          stroke="currentColor"
          strokeWidth="12"
          fill="transparent"
          strokeDasharray="314%"
          strokeDashoffset={`${314 - (314 * restRemaining) / 30}%`}
          strokeLinecap="round"
          className="text-blue-600 transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-7xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
          {restRemaining}
        </span>
      </div>
    </div>
    <button
      onClick={onSkip}
      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black px-12 py-5 rounded-[24px] uppercase tracking-widest text-sm active:scale-95 transition-all shadow-xl border border-blue-100 dark:border-blue-900/50"
    >
      {t.skipRest}
    </button>
  </div>
);

/**
 * WorkoutHeader: Top navigation and daily progress stats.
 */
const WorkoutHeader: React.FC<{
  onBack: () => void;
  dailyStats: { count: number; duration: number };
  isRefreshing: boolean;
  t: any;
}> = ({ onBack, dailyStats, isRefreshing, t }) => (
  <div className="p-6 pt-12 flex flex-col bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-20 rounded-b-[64px] shadow-xl pb-10 transition-all">
    <div className="flex items-center mb-6">
      <button
        onClick={onBack}
        className="p-3 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all shadow-sm"
      >
        <GriddyIcon name="ArrowLeft" size={24} />
      </button>
      <span className="mx-auto font-black text-lg text-gray-900 dark:text-white uppercase tracking-[0.2em]">
        {t.training}
      </span>
      <div className="w-12"></div>
    </div>

    <div className="grid grid-cols-2 gap-4 px-2">
      {isRefreshing ? (
        <>
          <div className="h-20 animate-pulse rounded-3xl" />
          <div className="h-20 animate-pulse rounded-3xl" />
        </>
      ) : (
        <>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-3xl border border-blue-100 dark:border-blue-800 flex items-center gap-4 group transition-all">
            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
              <GriddyIcon name="TrendingUp" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black dark:text-white tabular-nums">
                {dailyStats.count}
              </span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                {t.completed}
              </span>
            </div>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-3xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-4 group transition-all">
            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm transition-transform group-hover:scale-110">
              <GriddyIcon name="Clock" size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-black dark:text-white tabular-nums">
                {Math.floor(dailyStats.duration / 60)}m
              </span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                {t.totalTime}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

/**
 * HealthBanner: Personal health info, goals, and calories.
 */
const HealthBanner: React.FC<{
  userProfile: UserPhysicalProfile;
  calorieData: any;
  onEditProfile: () => void;
  onOpenCalorie: () => void;
  t: any;
}> = ({ userProfile, calorieData, onEditProfile, onOpenCalorie, t }) => (
  <div className="space-y-4">
    <div className="bg-gray-900 dark:bg-blue-600 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
      <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
        <GriddyIcon name="Dumbbell" size={120} />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <GriddyIcon name="Badge" size={14} className="text-yellow-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {t.basedOnProfile}
              </span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">
              {t.bodyweightMastery}
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase bg-white/20 px-3 py-1 rounded-full">
                {t[userProfile.goal] || userProfile.goal}
              </span>
              <span className="text-[10px] font-bold uppercase bg-white/20 px-3 py-1 rounded-full">
                {userProfile.weight}kg
              </span>
            </div>
          </div>
          <button
            onClick={onEditProfile}
            className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 active:scale-90 active:bg-white/30 transition-all shadow-sm group/btn"
          >
            <GriddyIcon name="User" size={20} className="group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>

        {calorieData && (
          <button
            onClick={onOpenCalorie}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl flex items-center justify-between group/cal hover:bg-white/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover/cal:scale-110 transition-transform">
                <GriddyIcon name="Flame" size={24} />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-0.5">
                  {t.dailyTarget}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black tabular-nums">
                    {Math.round(calorieData.dailyTarget)}
                  </span>
                  <span className="text-[10px] font-bold text-white/80 uppercase">
                    {t.cal}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-0.5">
                TDEE
              </span>
              <span className="text-sm font-bold tabular-nums text-white/90">
                {Math.round(calorieData.tdee)}
              </span>
            </div>
          </button>
        )}
      </div>
    </div>

    {userProfile.hasInjury && (
      <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-[32px] border border-red-100 dark:border-red-900/30 flex items-start gap-4 animate-in slide-in-from-left-4 duration-500">
        <GriddyIcon name="Alert" size={24} className="text-red-500 shrink-0" />
        <div>
          <h4 className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">
            {t.injuryAlert}
          </h4>
          <p className="text-[10px] text-red-500/80 font-medium leading-relaxed">
            {t.injuryRecommendation}
          </p>
        </div>
      </div>
    )}
  </div>
);

/**
 * ExerciseListItem: Individual exercise button in the list.
 */
const ExerciseListItem: React.FC<{
  exercise: Exercise;
  idx: number;
  isCompleted: boolean;
  onSelect: (ex: Exercise) => void;
  t: any;
}> = ({ exercise, idx, isCompleted, onSelect, t }) => (
  <button
    onClick={() => onSelect(exercise)}
    className="w-full bg-white dark:bg-gray-900 p-5 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all hover:border-blue-500/30 animate-in slide-in-from-bottom-4 duration-500"
    style={{ animationDelay: `${idx * 50}ms` }}
  >
    <div className="flex items-center gap-4">
      <div
        className={`p-3.5 bg-${exercise.color}-50 dark:bg-${exercise.color}-900/20 text-${exercise.color}-600 rounded-2xl transition-transform group-hover:scale-105 shadow-sm`}
      >
        {exercise.icon}
      </div>
      <div className="text-left">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
            {t[exercise.nameKey]}
          </h4>
          {isCompleted && (
            <div className="bg-green-100 dark:bg-green-900/30 p-0.5 rounded-full">
              <GriddyIcon name="Check" size={10} className="text-green-600" />
            </div>
          )}
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {exercise.duration ? `${exercise.duration}s` : `${exercise.repsCount} ${t.reps}`} • {exercise.setsCount} {t.sets}
        </p>
      </div>
    </div>
    <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
      <GriddyIcon name="ChevronRight" size={18} />
    </div>
  </button>
);

/**
 * ActiveWorkoutView: The main interface during an ongoing exercise session.
 */
const ActiveWorkoutView: React.FC<{
  activeExercise: Exercise;
  isResting: boolean;
  restRemaining: number;
  elapsedTime: number;
  currentSet: number;
  onCompleteSet: () => void;
  onStop: () => void;
  onSkipRest: () => void;
  t: any;
}> = ({
  activeExercise,
  isResting,
  restRemaining,
  elapsedTime,
  currentSet,
  onCompleteSet,
  onStop,
  onSkipRest,
  t,
}) => (
  <div
    className={`h-screen w-screen flex flex-col animate-in fade-in duration-500 transition-colors overflow-hidden ${
      isResting ? "bg-blue-50 dark:bg-blue-950/30" : "bg-white dark:bg-black"
    }`}
  >
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto no-scrollbar">
      {isResting ? (
        <RestView restRemaining={restRemaining} t={t} onSkip={onSkipRest} />
      ) : (
        <div className="w-full flex flex-col items-center justify-between min-h-full py-6">
          <div className="flex flex-col items-center space-y-6 w-full">
            <div
              className={`p-8 bg-${activeExercise.color}-100 dark:bg-${activeExercise.color}-900/20 text-${activeExercise.color}-600 rounded-[40px] shadow-2xl`}
            >
              {activeExercise.icon}
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">
                {t[activeExercise.nameKey]}
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-2 rounded-2xl inline-block mt-4 border border-blue-100 dark:border-blue-800 shadow-sm">
                <p className="text-[12px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  {t.set} {currentSet} / {activeExercise.setsCount}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 w-full p-10 rounded-[48px] border border-gray-100 dark:border-gray-800 shadow-lg flex flex-col items-center gap-6 my-6">
            <span className="text-7xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
              {formatTime(elapsedTime)}
            </span>
            <div className="flex items-center gap-4">
              <GriddyIcon name="Activity" size={20} className="text-blue-600" />
              <span className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest">
                {activeExercise.duration
                  ? `${activeExercise.duration}s`
                  : `${activeExercise.repsCount} ${t.reps}`}
              </span>
            </div>
          </div>
          <div className="flex gap-4 w-full max-w-md">
            <button
              onClick={onCompleteSet}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-8 rounded-[36px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all border-4 border-white/20 flex flex-row items-center justify-center gap-3"
            >
              <GriddyIcon name="Check" size={32} />
              <span>{t.completeSet}</span>
            </button>
            <button
              onClick={onStop}
              className="w-20 h-30 bg-red-600 text-white rounded-[32px] flex items-center justify-center shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 bg-white rounded-lg shadow-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

interface WorkoutScreenProps {
  onBack: () => void;
  onSaveWorkout: (data: {
    name: string;
    duration: number;
    percent: number;
  }) => void;
  onOpenCalorie: () => void;
  onProfileUpdate?: (shouldResetHistory?: boolean | 'workouts_only') => void;
  runHistory: RunSession[];
  t: any;
}

const EXERCISES_DATA: Exercise[] = [
  {
    id: "pushup",
    nameKey: "exPushups",
    targetKey: "exPushupsTarget",
    descKey: "exPushupsDesc",
    icon: <GriddyIcon name="Activity" size={24} />,
    color: "blue",
    category: "strength",
    impact: "low",
    setsCount: 3,
    repsCount: 15,
    videoUrl: "https://drive.google.com/file/d/1LKPUskyTToAKymISvL_zlqE5-SYVebvd/view?usp=drive_link",
  },
  {
    id: "squatjump",
    nameKey: "exSquatJumps",
    targetKey: "exSquatJumpsTarget",
    descKey: "exSquatJumpsDesc",
    icon: <GriddyIcon name="Activity" size={24} />,
    color: "orange",
    category: "hiit",
    impact: "high",
    setsCount: 3,
    repsCount: 20,
    videoUrl: "https://drive.google.com/file/d/1hHDDfaS13KckD1K3tExhntv1MgebON5w/view?usp=drive_link",
  },
  {
    id: "situp",
    nameKey: "exSitups",
    targetKey: "exSitupsTarget",
    descKey: "exSitupsDesc",
    icon: <GriddyIcon name="Activity" size={24} />,
    color: "emerald",
    category: "strength",
    impact: "low",
    setsCount: 3,
    repsCount: 20,
    videoUrl: "https://drive.google.com/file/d/1q_z7Ve5ME4tyeqXfmgLu6qBMDHxpkLOL/view?usp=drive_link",
  },
  {
    id: "plank",
    nameKey: "exPlank",
    targetKey: "exPlankTarget",
    descKey: "exPlankDesc",
    icon: <GriddyIcon name="Activity" size={24} />,
    color: "red",
    category: "mobility",
    impact: "low",
    duration: 60,
    setsCount: 1,
    videoUrl: "https://drive.google.com/file/d/14DnGwImkQXkAJD9OxB9-pgp8ILO3WKZH/view?usp=drive_link",
  },
  {
    id: "lunges",
    nameKey: "exLunges",
    targetKey: "exLungesTarget",
    descKey: "exLungesDesc",
    icon: <GriddyIcon name="Activity" size={24} />,
    color: "purple",
    category: "cardio",
    impact: "low",
    setsCount: 3,
    repsCount: 12,
    videoUrl: "https://drive.google.com/file/d/1-wyU-nujZdxU2Ws7doTg8gSnx_4Trcqa/view?usp=drive_link",
  },
];

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({
  onBack,
  onSaveWorkout,
  onOpenCalorie,
  onProfileUpdate,
  runHistory,
  t,
}) => {
  const [userProfile, setUserProfile] = useState<UserPhysicalProfile | null>(
    () => {
      const saved = localStorage.getItem("userPhysicalProfile");
      return saved ? JSON.parse(saved) : null;
    }
  );

  const calorieData = useMemo(() => {
    if (!userProfile) return null;
    return calculateCalorieProfile(
      userProfile.weight,
      userProfile.height,
      userProfile.age,
      userProfile.gender as any,
      userProfile.activityLevel as any
    );
  }, [userProfile]);

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restRemaining, setRestRemaining] = useState(30);
  const [showSummary, setShowSummary] = useState(false);
  const [finishedSession, setFinishedSession] = useState<{
    name: string;
    target: string;
    duration: number;
    percent: number;
  } | null>(null);
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserPhysicalProfile | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Real-time Daily Progress Monitor
  const dailyStats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayWorkouts = runHistory.filter((session) => {
      const isWorkout = !session.path || session.path.length === 0;
      return (
        isWorkout && new Date(session.startTime).setHours(0, 0, 0, 0) === today
      );
    });

    const totalDuration = todayWorkouts.reduce(
      (acc, curr) => acc + curr.duration,
      0
    );
    const totalExercises = todayWorkouts.length;

    return {
      count: totalExercises,
      duration: totalDuration,
      completed: todayWorkouts.filter((w) => w.distance === 100).length,
    };
  }, [runHistory]);

  // Integrated Recommendation & Filtering Logic
  const exercises = useMemo(() => {
    if (!userProfile) return EXERCISES_DATA;

    const bmi = userProfile.weight / (userProfile.height / 100) ** 2;

    return [...EXERCISES_DATA].sort((a, b) => {
      // High BMI or Weight loss goal -> Cardio/HIIT first
      if (bmi > 25 || userProfile.goal === "weightloss") {
        if (a.category === "hiit" || a.category === "cardio") return -1;
        if (b.category === "hiit" || b.category === "cardio") return 1;
      }
      // Muscle/Strength focus
      if (userProfile.goal === "muscle") {
        if (a.category === "strength") return -1;
        if (b.category === "strength") return 1;
      }
      // Injury safety -> Low impact first
      if (userProfile.hasInjury) {
        if (a.impact === "low" && b.impact === "high") return -1;
        if (a.impact === "high" && b.impact === "low") return 1;
      }
      return 0;
    });
  }, [userProfile]);

  useEffect(() => {
    let interval: number;
    if (isWorkoutRunning && !isResting) {
      interval = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isWorkoutRunning, isResting]);

  useEffect(() => {
    if (isResting) {
      timerRef.current = window.setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            handleRestEnd();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isResting]);

  // Register hardware back handler to close nested UI before delegating to app-level handler
  useEffect(() => {
    const handler = () => {
      if (isConfirmingReset) {
        setIsConfirmingReset(false);
        setTempProfile(null);
        return true;
      }
      if (isEditingProfile) {
        setIsEditingProfile(false);
        return true;
      }
      if (showSummary) {
        resetToMenu();
        return true;
      }
      if (activeExercise) {
        if (isStarted) {
          // If running, prompt to confirm stop
          setIsConfirmingStop(true);
          return true;
        }
        setActiveExercise(null);
        return true;
      }
      return false;
    };

    const remove = addBackHandler(handler);
    return () => remove();
  }, [activeExercise, isStarted, showSummary, isEditingProfile, isConfirmingReset]);

  const handleAssessmentComplete = (profile: UserPhysicalProfile) => {
    setUserProfile(profile);
    localStorage.setItem("userPhysicalProfile", JSON.stringify(profile));
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate([100, 50, 100]);
  };

  const handleSelectExercise = (ex: Exercise) => {
    setActiveExercise(ex);
    setIsStarted(false);
    setIsWorkoutRunning(false);
    setElapsedTime(0);
    setCurrentSet(1);
    setIsResting(false);
  };

  const handleStartWorkout = () => {
    setIsStarted(true);
    setIsWorkoutRunning(true);
  };

  const handleCompleteSet = () => {
    if (!activeExercise) return;

    if (currentSet < (activeExercise.setsCount || 1)) {
      setIsResting(true);
      setRestRemaining(30);
      if (typeof navigator !== "undefined" && navigator.vibrate)
        navigator.vibrate([50, 30, 50]);
    } else {
      handleFinish(100);
    }
  };

  const handleRestEnd = () => {
    setIsResting(false);
    setCurrentSet((prev) => prev + 1);
    if (typeof navigator !== "undefined" && navigator.vibrate)
      navigator.vibrate(100);
  };

  const handleFinish = (percent: number) => {
    const exerciseNameKey = activeExercise!.nameKey;
    const session = {
      name: t[exerciseNameKey],
      target: t[activeExercise!.targetKey],
      duration: elapsedTime,
      percent: percent,
      typeKey: exerciseNameKey, // Store the key for re-translation in history
    };

    onSaveWorkout({
      name: exerciseNameKey, // Important: save the translation KEY
      duration: elapsedTime,
      percent: percent,
    });

    setFinishedSession(session);
    setIsWorkoutRunning(false);
    setIsResting(false);
    setShowSummary(true);
  };

  const confirmStopEarly = () => {
    if (!activeExercise) return;
    const completedSets = isResting ? currentSet : currentSet - 1;
    const totalSets = activeExercise.setsCount || 1;
    const progress = Math.floor((completedSets / totalSets) * 100);
    handleFinish(progress);
  };

  const resetToMenu = () => {
    setActiveExercise(null);
    setIsStarted(false);
    setShowSummary(false);
    setElapsedTime(0);
    setFinishedSession(null);
    setCurrentSet(1);
    setIsResting(false);
  };

  const confirmResetProgress = async () => {
    try {
      // Safety check: If we are editing, we MUST have a tempProfile.
      // If missing, abort to prevent accidental profile wipe.
      if (isEditingProfile && !tempProfile) {
        console.error("Critical: tempProfile is missing during edit confirmation");
        setIsConfirmingReset(false);
        return;
      }

      setIsDeletingHistory(true);
      
      // Clear calorie history as it is tied to the program
      localStorage.removeItem("calorie_history");
      await storage.remove("calorie_history");
      
      // Save new profile if we were editing (Priority)
      if (tempProfile) {
        // Sync to secure storage and localStorage in parallel where possible but await critical
        const savePromises = [
          storage.set("userPhysicalProfile", tempProfile).catch(console.error),
          new Promise<void>((resolve) => {
            localStorage.setItem("userPhysicalProfile", JSON.stringify(tempProfile));
            localStorage.setItem("gender", tempProfile.gender);
            localStorage.setItem("age", tempProfile.age.toString());
            localStorage.setItem("weight", tempProfile.weight.toString());
            localStorage.setItem("height", tempProfile.height.toString());
            localStorage.setItem("activityLevel", tempProfile.activityLevel);
            localStorage.setItem("goal", tempProfile.goal);
            localStorage.setItem("hasInjury", tempProfile.hasInjury.toString());
            localStorage.setItem("frequency", tempProfile.frequency.toString());
            resolve();
          })
        ];

        // Update local state IMMEDIATELY so UI is ready
        setUserProfile(tempProfile);
        
        // Wait for storage to ensure data persistence before unmounting (usually fast)
        await Promise.all(savePromises);
      } else {
        // Legacy reset path
        if (!isEditingProfile) {
          localStorage.removeItem("userPhysicalProfile");
          localStorage.removeItem("gender");
          localStorage.removeItem("age");
          localStorage.removeItem("weight");
          localStorage.removeItem("height");
          localStorage.removeItem("activityLevel");
          localStorage.removeItem("goal");
          localStorage.removeItem("hasInjury");
          localStorage.removeItem("frequency");
          
          await storage.remove("userPhysicalProfile");
          setUserProfile(null);
        }
      }
      
      // Notify parent to filter history (keep runs, remove workouts)
      // Done before unmounting to ensure parent state is consistent
      if (onProfileUpdate) {
        onProfileUpdate('workouts_only');
      }
      
      // Cleanup local state
      setIsDeletingHistory(false);
      setIsConfirmingReset(false);
      setTempProfile(null);
      
      // Navigate immediately by closing the editing view
      // This triggers the re-render to show the main WorkoutScreen
      setIsEditingProfile(false);
      
      // Reset scroll position to top
      window.scrollTo(0, 0);
      
      // Provide haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Show toast feedback
      setShowUpdateToast(true);
      setTimeout(() => setShowUpdateToast(false), 3000);
      
    } catch (error) {
      console.error("Failed to reset progress:", error);
      setIsDeletingHistory(false);
      setIsConfirmingReset(false);
      
      // Even if there's an error in storage, if we have a valid profile, 
      // we should probably let the user proceed to the workout screen 
      // rather than being stuck in assessment mode.
      if (tempProfile) {
        // Fallback: Just update local state and navigate
        setUserProfile(tempProfile);
        setIsEditingProfile(false);
      }
    }
  };

  const handleEditComplete = (profile: UserPhysicalProfile) => {
    setTempProfile(profile);
    setIsConfirmingReset(true);
  };

  if (!userProfile || isEditingProfile) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={isEditingProfile ? "edit" : "initial"}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="h-screen w-screen bg-white dark:bg-black"
        >
          <WorkoutAssessment 
            t={t} 
            onComplete={isEditingProfile ? handleEditComplete : handleAssessmentComplete} 
            initialProfile={userProfile || undefined}
          />
          
          <CustomDialog
            isOpen={isConfirmingReset}
            onClose={() => {
              setIsConfirmingReset(false);
              setTempProfile(null);
              setIsEditingProfile(false); // Navigate back to WorkoutScreen (main view)
            }}
            onConfirm={confirmResetProgress}
            title={t.confirmProfileChange}
            message={t.resetProgressWarning}
            confirmText={t.confirmChange}
            cancelText={t.cancel}
            type="danger"
            isLoading={isDeletingHistory}
            closeOnBackdropClick={false}
          />
          
          <CustomDialog
            isOpen={showSuccessDialog}
            onClose={() => {
              setShowSuccessDialog(false);
              setIsEditingProfile(false);
            }}
            onConfirm={() => {
              setShowSuccessDialog(false);
              setIsEditingProfile(false);
            }}
            title={t.success}
            message={t.resetSuccessMessage}
            confirmText="OK"
            cancelText=""
            type="success"
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (showSummary && finishedSession) {
    return (
      <SummaryView 
        session={finishedSession} 
        t={t} 
        onFinish={resetToMenu} 
      />
    );
  }

  if (activeExercise && !isStarted) {
    return (
      <ReadyView
        exercise={activeExercise}
        t={t}
        onBack={() => setActiveExercise(null)}
        onStart={handleStartWorkout}
      />
    );
  }

  if (activeExercise && isStarted) {
    return (
      <>
        <ActiveWorkoutView
          activeExercise={activeExercise}
          isResting={isResting}
          restRemaining={restRemaining}
          elapsedTime={elapsedTime}
          currentSet={currentSet}
          onCompleteSet={handleCompleteSet}
          onStop={() => setIsConfirmingStop(true)}
          onSkipRest={handleRestEnd}
          t={t}
        />
        <CustomDialog
          isOpen={isConfirmingStop}
          onClose={() => setIsConfirmingStop(false)}
          onConfirm={confirmStopEarly}
          title={t.workoutSummary}
          message={t.confirmDelete}
          confirmText={t.finishWorkout}
          cancelText={t.cancel}
          type="info"
        />
      </>
    );
  }

  return (
    <div className="h-screen w-screen bg-white dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden">
      <WorkoutHeader 
        onBack={onBack} 
        dailyStats={dailyStats} 
        isRefreshing={isRefreshing} 
        t={t} 
      />

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-24 -mt-4 z-10 pt-10">
        {isRefreshing ? (
          <div className="space-y-6">
            <div className="h-48 animate-pulse rounded-[40px]" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 animate-pulse rounded-[32px]" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <HealthBanner
              userProfile={userProfile}
              calorieData={calorieData}
              onEditProfile={() => setIsEditingProfile(true)}
              onOpenCalorie={onOpenCalorie}
              t={t}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {t.allExercises}
                </h3>
                <div className="flex items-center gap-1.5">
                  <GriddyIcon name="Target" size={12} className="text-blue-600" />
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                    {t.basedOnBMI}: {Math.round(userProfile.weight / (userProfile.height / 100) ** 2)}
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                {exercises.map((ex, idx) => (
                  <ExerciseListItem
                    key={ex.id}
                    exercise={ex}
                    idx={idx}
                    isCompleted={runHistory.some(s => s.type === ex.nameKey && s.distance >= 100)}
                    onSelect={handleSelectExercise}
                    t={t}
                  />
                ))}
              </div>
            </div>

            <div className="p-8 rounded-[48px] bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 text-center animate-in fade-in duration-1000 delay-500">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {t.comingSoon}
              </p>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-2 uppercase">
                {t.customHiit}
              </p>
            </div>
          </>
        )}
      </div>
      {/* Update Toast */}
      <AnimatePresence>
        {showUpdateToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 inset-x-0 mx-auto w-fit z-[9999] pointer-events-none"
          >
            <div className="bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-3 backdrop-blur-md">
              <GriddyIcon name="Check" size={18} />
              <span className="text-sm font-bold uppercase tracking-wide">
                {t.profileUpdated || "Profil & Riwayat Diperbarui"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutScreen;
