import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ArrowLeft,
  Dumbbell,
  Zap,
  Flame,
  Activity,
  ChevronRight,
  Play,
  Pause,
  Square,
  Timer,
  CheckCircle2,
  Tally4,
  ShieldCheck,
  Footprints,
  Clock,
  Check,
  Coffee,
  Sparkles,
  Info,
  User as UserIcon,
  AlertTriangle,
  TrendingUp,
  Target,
} from "lucide-react";
import { formatTime } from "../utils";
import { addBackHandler } from "../utils/backButtonService";
import { CustomDialog } from "./CustomDialog";
import { WorkoutAssessment } from "./WorkoutAssessment";
import { UserPhysicalProfile, RunSession } from "../types";

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
}

interface WorkoutScreenProps {
  onBack: () => void;
  onSaveWorkout: (data: {
    name: string;
    duration: number;
    percent: number;
  }) => void;
  runHistory: RunSession[];
  t: any;
}

const EXERCISES_DATA: Exercise[] = [
  {
    id: "pushup",
    nameKey: "exPushups",
    targetKey: "exPushupsTarget",
    descKey: "exPushupsDesc",
    icon: <Zap size={24} />,
    color: "blue",
    category: "strength",
    impact: "low",
    setsCount: 3,
    repsCount: 15,
  },
  {
    id: "squatjump",
    nameKey: "exSquatJumps",
    targetKey: "exSquatJumpsTarget",
    descKey: "exSquatJumpsDesc",
    icon: <Activity size={24} />,
    color: "orange",
    category: "hiit",
    impact: "high",
    setsCount: 3,
    repsCount: 20,
  },
  {
    id: "situp",
    nameKey: "exSitups",
    targetKey: "exSitupsTarget",
    descKey: "exSitupsDesc",
    icon: <Tally4 size={24} />,
    color: "emerald",
    category: "strength",
    impact: "low",
    setsCount: 3,
    repsCount: 20,
  },
  {
    id: "plank",
    nameKey: "exPlank",
    targetKey: "exPlankTarget",
    descKey: "exPlankDesc",
    icon: <ShieldCheck size={24} />,
    color: "red",
    category: "mobility",
    impact: "low",
    duration: 60,
    setsCount: 1,
  },
  {
    id: "lunges",
    nameKey: "exLunges",
    targetKey: "exLungesTarget",
    descKey: "exLungesDesc",
    icon: <Footprints size={24} />,
    color: "purple",
    category: "cardio",
    impact: "low",
    setsCount: 3,
    repsCount: 12,
  },
];

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({
  onBack,
  onSaveWorkout,
  runHistory,
  t,
}) => {
  const [userProfile, setUserProfile] = useState<UserPhysicalProfile | null>(
    () => {
      const saved = localStorage.getItem("userPhysicalProfile");
      return saved ? JSON.parse(saved) : null;
    }
  );

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

  const restTimerRef = useRef<number | null>(null);

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
      restTimerRef.current = window.setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            handleRestEnd();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting]);

  // Register hardware back handler to close nested UI before delegating to app-level handler
  useEffect(() => {
    const handler = () => {
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
  }, [activeExercise, isStarted, showSummary]);

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

  if (!userProfile) {
    return <WorkoutAssessment t={t} onComplete={handleAssessmentComplete} />;
  }

  if (showSummary && finishedSession) {
    const isSuccess = finishedSession.percent === 100;
    return (
      <div className="h-screen w-screen bg-white dark:bg-black flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div
              className={`p-5 rounded-full inline-flex mb-2 ${
                isSuccess
                  ? "bg-green-100 dark:bg-green-900/20 text-green-600"
                  : "bg-orange-100 dark:bg-orange-900/20 text-orange-600"
              }`}
            >
              {isSuccess ? <CheckCircle2 size={48} /> : <Activity size={48} />}
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              {isSuccess ? t.exerciseCompleted : t.workoutSummary}
            </h2>
            <p className="text-blue-600 font-black uppercase tracking-widest text-sm">
              {finishedSession.name}
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 flex flex-col items-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {t.totalTime}
              </p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                {formatTime(finishedSession.duration)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 flex flex-col items-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {t.targetAchieved}
              </p>
              <p
                className={`text-2xl font-black uppercase tabular-nums ${
                  isSuccess ? "text-green-600" : "text-orange-500"
                }`}
              >
                {finishedSession.percent}%
              </p>
            </div>
          </div>

          <button
            onClick={resetToMenu}
            className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-black py-5 rounded-[32px] shadow-xl uppercase tracking-widest text-sm active:scale-95 transition-all"
          >
            {t.finishWorkout}
          </button>
        </div>
      </div>
    );
  }

  if (activeExercise && !isStarted) {
    return (
      <div className="h-screen w-screen bg-white dark:bg-black flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
        <div className="p-6 pt-12 flex items-center z-20">
          <button
            onClick={() => setActiveExercise(null)}
            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="mx-auto font-black text-lg text-gray-900 dark:text-white uppercase tracking-[0.2em]">
            {t.getReady}
          </span>
          <div className="w-12"></div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 overflow-y-auto no-scrollbar">
          <div
            className={`p-8 bg-${activeExercise.color}-100 dark:bg-${activeExercise.color}-900/20 text-${activeExercise.color}-600 rounded-[48px] shadow-2xl shrink-0`}
          >
            {activeExercise.icon}
          </div>
          <div className="space-y-3 shrink-0">
            <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
              {t[activeExercise.nameKey]}
            </h2>
            <p className="text-blue-600 font-black uppercase tracking-widest text-xs">
              {t[activeExercise.targetKey]}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-[40px] p-8 border border-gray-100 dark:border-gray-800 w-full max-w-sm shrink-0">
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t[activeExercise.descKey]}
            </p>
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  {t.sets}
                </p>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {activeExercise.setsCount || 1}
                </p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-800"></div>
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  {activeExercise.duration ? t.duration : t.reps}
                </p>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {activeExercise.duration
                    ? `${activeExercise.duration}s`
                    : activeExercise.repsCount}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleStartWorkout}
            className="w-full max-w-sm bg-blue-600 text-white font-black py-6 rounded-[32px] shadow-2xl uppercase tracking-widest text-lg active:scale-95 transition-all flex items-center justify-center gap-3 border-4 border-white/10 shrink-0"
          >
            <Play fill="white" size={24} /> {t.startWorkout}
          </button>
        </div>
      </div>
    );
  }

  if (activeExercise && isStarted) {
    return (
      <div
        className={`h-screen w-screen flex flex-col animate-in fade-in duration-500 transition-colors overflow-hidden ${
          isResting
            ? "bg-blue-50 dark:bg-blue-950/30"
            : "bg-white dark:bg-black"
        }`}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto no-scrollbar">
          {isResting ? (
            <div className="w-full flex flex-col items-center justify-center space-y-12 animate-in zoom-in duration-300 py-10">
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 p-4 rounded-3xl inline-flex mb-4">
                  <Coffee size={32} className="animate-bounce" />
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
                onClick={handleRestEnd}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black px-12 py-5 rounded-[24px] uppercase tracking-widest text-sm active:scale-95 transition-all shadow-xl border border-blue-100 dark:border-blue-900/50"
              >
                {t.skipRest}
              </button>
            </div>
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
                  <Activity size={20} className="text-blue-600" />
                  <span className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest">
                    {activeExercise.duration
                      ? `${activeExercise.duration}s`
                      : `${activeExercise.repsCount} ${t.reps}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 w-full max-w-md">
                <button
                  onClick={handleCompleteSet}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-8 rounded-[36px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all border-4 border-white/20 flex flex-row items-center justify-center gap-3"
                >
                  <Check size={32} strokeWidth={4} />
                  <span>{t.completeSet}</span>
                </button>
                <button
                  onClick={() => setIsConfirmingStop(true)}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-400 p-8 rounded-[36px] shadow-xl active:scale-95 transition-all"
                >
                  <Square fill="currentColor" size={24} />
                </button>
              </div>
            </div>
          )}
        </div>
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
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-white dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden">
      {/* Modern Tracking Header */}
      <div className="p-6 pt-12 flex flex-col bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-20 rounded-b-[64px] shadow-xl pb-10 transition-all">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all shadow-sm"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="mx-auto font-black text-lg text-gray-900 dark:text-white uppercase tracking-[0.2em]">
            {t.training}
          </span>
          <div className="w-12"></div>
        </div>

        {/* Real-time Progress Stats */}
        <div className="grid grid-cols-2 gap-4 px-2">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-3xl border border-blue-100 dark:border-blue-800 flex items-center gap-4 group transition-all">
            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-110">
              <TrendingUp size={20} />
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
              <Clock size={20} />
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
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 pb-24 -mt-4 z-10 pt-10">
        {/* Health & Profile Banner */}
        <div className="bg-gray-900 dark:bg-blue-600 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <Dumbbell size={120} />
          </div>
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Sparkles size={14} className="text-yellow-400" />
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
              onClick={() => {
                localStorage.removeItem("userPhysicalProfile");
                setUserProfile(null);
              }}
              className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-colors"
            >
              <UserIcon size={20} />
            </button>
          </div>
        </div>

        {/* Injury Warning */}
        {userProfile.hasInjury && (
          <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-[32px] border border-red-100 dark:border-red-900/30 flex items-start gap-4 animate-in slide-in-from-left-4 duration-500">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
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

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {t.allExercises}
            </h3>
            <div className="flex items-center gap-1.5">
              <Target size={12} className="text-blue-600" />
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                {t.basedOnBMI}:{" "}
                {Math.round(
                  userProfile.weight / (userProfile.height / 100) ** 2
                )}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            {exercises.map((ex, idx) => (
              <button
                key={ex.id}
                onClick={() => handleSelectExercise(ex)}
                className="w-full bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all hover:border-blue-500/50 animate-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${idx * 75}ms` }}
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`p-4 bg-${ex.color}-50 dark:bg-${ex.color}-900/20 text-${ex.color}-600 rounded-2xl transition-transform group-hover:scale-110 shadow-sm`}
                  >
                    {ex.icon}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black dark:text-white uppercase tracking-tight">
                        {t[ex.nameKey]}
                      </p>
                      {idx < 2 && (
                        <Sparkles
                          size={12}
                          className="text-yellow-500 fill-yellow-500"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      {t[ex.targetKey]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {ex.impact === "low" && (
                    <span className="text-[8px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md uppercase tracking-tighter">
                      {t.safe}
                    </span>
                  )}
                  <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30">
                    <ChevronRight
                      className="text-gray-300 group-hover:text-blue-500 transition-colors"
                      size={18}
                    />
                  </div>
                </div>
              </button>
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
      </div>
    </div>
  );
};
