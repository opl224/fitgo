
import React, { useState, useEffect, useCallback } from 'react';
import GriddyIcon from './GriddyIcon';
import { motion, AnimatePresence } from 'motion/react';
import { 
  calculateCalorieProfile, 
  ACTIVITY_METS,
  calculateMETCalories 
} from '../utils/calorieCalculations';
import { CalorieResult, CalorieHistory, UserPhysicalProfile } from '../types';
import { addBackHandler } from '../utils/backButtonService';
import { CustomDialog } from './CustomDialog';

interface CalorieDeficitProgramProps {
  onBack: () => void;
  userProfile: UserPhysicalProfile;
  t: any;
  onProfileUpdate?: (shouldResetHistory?: boolean | 'workouts_only') => void;
}

export const CalorieDeficitProgram: React.FC<CalorieDeficitProgramProps> = ({ 
  onBack, 
  userProfile, 
  t,
  onProfileUpdate
}) => {
  const [results, setResults] = useState<CalorieResult | null>(null);
  const [history, setHistory] = useState<CalorieHistory[]>([]);
  const [showHistory, setShowHistory] = useState(() => {
    const force = localStorage.getItem("force_show_calorie_history");
    if (force === "true") {
      localStorage.removeItem("force_show_calorie_history");
      return true;
    }
    return false;
  });
  const [selectedActivity, setSelectedActivity] = useState<string>('Running (10km/h)');
  const [duration, setDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  
  // New states for deletion and pagination
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isConfirmingDeleteAll, setIsConfirmingDeleteAll] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isLongPressing, setIsLongPressing] = useState<string | null>(null);
  const longPressTimer = React.useRef<any>(null);

  // Physical back button handler and popstate (for swipe back)
  useEffect(() => {
    const handleBackAction = () => {
      if (showHistory) {
        setShowHistory(false);
        return true;
      }
      return false;
    };

    // Capacitor back button
    const removeHandler = addBackHandler(handleBackAction);

    // Browser history for swipe back support
    if (showHistory) {
      const currentState = window.history.state;
      if (!currentState || currentState.type !== 'calorie_history') {
        window.history.pushState({ type: 'calorie_history' }, '');
      }
    }

    const onPopState = (e: PopStateEvent) => {
      if (showHistory) {
        setShowHistory(false);
      }
    };

    window.addEventListener('popstate', onPopState);

    return () => {
      removeHandler();
      window.removeEventListener('popstate', onPopState);
    };
  }, [showHistory]);

  // Enhanced onBack for UI button
  const handleBack = () => {
    if (showHistory) {
      // If we used pushState, we should use back() to keep history clean
      window.history.back();
    } else {
      onBack();
    }
  };

  const handleCalculate = useCallback((saveToHistory = true) => {
    const res = calculateCalorieProfile(
      userProfile.weight,
      userProfile.height,
      userProfile.age,
      userProfile.gender as any,
      userProfile.activityLevel as any
    );
    setResults(res);

    if (saveToHistory) {
      const newHistory: CalorieHistory = {
        id: Date.now().toString(),
        date: Date.now(),
        weight: userProfile.weight,
        height: userProfile.height,
        age: userProfile.age,
        gender: userProfile.gender,
        activityLevel: userProfile.activityLevel,
        results: res
      };

      const updatedHistory = [newHistory, ...history]; // Removed .slice(0, 10)
      setHistory(updatedHistory);
      localStorage.setItem('calorie_history', JSON.stringify(updatedHistory));
    }
  }, [userProfile, history]);

  useEffect(() => {
    // Initial load simulation with caching check
    const loadData = async () => {
      setIsLoading(true);
      
      // Check localStorage first (caching)
      const savedHistory = localStorage.getItem('calorie_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
      
      // Simulate network/db latency for clear loading indicator
      await new Promise(resolve => setTimeout(resolve, 600));
      
      handleCalculate(false); // Don't save to history on initial mount if same
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Update calculations when userProfile changes
  useEffect(() => {
    handleCalculate(false);
  }, [userProfile, handleCalculate]);

  const workoutCalories = results ? calculateMETCalories(
    ACTIVITY_METS[selectedActivity],
    userProfile.weight,
    duration
  ) : 0;

  const translateActivity = (activityKey: string) => {
    const mapping: Record<string, string> = {
      'Walking (Slow)': t.actWalkingSlow,
      'Walking (Brisk)': t.actWalkingBrisk,
      'Running (8km/h)': t.actRunning8,
      'Running (10km/h)': t.actRunning10,
      'Running (12km/h)': t.actRunning12,
      'Cycling (Leisure)': t.actCyclingLeisure,
      'Cycling (Moderate)': t.actCyclingModerate,
      'Swimming (Moderate)': t.actSwimmingModerate,
      'HIIT': t.actHIIT,
      'Strength Training': t.actStrength,
      'Yoga': t.actYoga,
    };
    return mapping[activityKey] || activityKey;
  };

  // Pagination Logic
  const totalPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of history list
    const historyContainer = document.querySelector('.history-list-top');
    if (historyContainer) {
      historyContainer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Deletion Logic
  const handleLongPressStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(id);
      setItemToDelete(id);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 2000); // 2s as requested
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const confirmDeleteSingle = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      // Simulate network delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));
      const updatedHistory = history.filter(item => item.id !== itemToDelete);
      setHistory(updatedHistory);
      localStorage.setItem('calorie_history', JSON.stringify(updatedHistory));
      
      // Adjust page if it becomes empty
      const newTotalPages = Math.ceil(updatedHistory.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
      setIsLongPressing(null);
    }
  };

  const confirmDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setHistory([]);
      localStorage.removeItem('calorie_history');
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to clear history:', error);
    } finally {
      setIsDeleting(false);
      setIsConfirmingDeleteAll(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 dark:bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pt-12 flex items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-20 rounded-b-[48px] shadow-xl pb-10">
        <button
          onClick={handleBack}
          className="p-3 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all"
        >
          <GriddyIcon name="ArrowLeft" size={24} />
        </button>
        <span className="mx-auto font-black text-xl text-gray-800 dark:text-white uppercase tracking-[0.2em]">
          {t.calorieDeficit}
        </span>
        {!showHistory ? (
          <button
            onClick={() => setShowHistory(true)}
            className="p-3 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all"
          >
            <GriddyIcon name="History" size={24} />
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-orange-100 dark:border-orange-900/30 rounded-full" />
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-orange-500 rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <GriddyIcon name="Heart" className="text-orange-500 animate-pulse" size={32} />
                </div>
              </div>
              <p className="mt-6 text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
                {t.updating}
              </p>
            </motion.div>
          ) : showHistory ? (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center history-list-top">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.calculationHistory}</h3>
                {history.length > 0 && (
                  <button
                    onClick={() => setIsConfirmingDeleteAll(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl active:scale-95 transition-all group min-h-[48px]"
                  >
                    <GriddyIcon name="Trash" size={16} className="group-hover:animate-bounce" />
                    <span className="text-[11px] font-black uppercase tracking-widest">{t.deleteAll}</span>
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-800">
                  <GriddyIcon name="Calculator" className="mx-auto text-gray-200 mb-4" size={48} />
                  <p className="text-gray-400 font-bold">{t.noHistoryTitle}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedHistory.map((item) => (
                    <motion.div 
                      layout
                      key={item.id} 
                      onPointerDown={() => handleLongPressStart(item.id)}
                      onPointerUp={handleLongPressEnd}
                      onPointerLeave={handleLongPressEnd}
                      className={`bg-white dark:bg-gray-900 p-6 rounded-[32px] border transition-all relative overflow-hidden group select-none ${
                        isLongPressing === item.id 
                          ? 'border-orange-500 ring-4 ring-orange-500/10 scale-[0.98]' 
                          : 'border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.99]'
                      }`}
                    >
                      {/* Trash Icon Button - Minimal 48x48px tap area */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item.id);
                        }}
                        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 transition-all active:scale-90 z-10"
                      >
                        <GriddyIcon name="Trash" size={18} />
                      </button>

                      <div className="flex justify-between items-start mb-4 pr-12">
                        <div>
                          <p className="text-xs font-black text-orange-500 uppercase">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                          <p className="text-lg font-black dark:text-white">
                            {Math.round(item.results.dailyTarget)} <span className="text-xs text-gray-400">{t.kcalPerDay}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full">
                          <span className="text-[9px] font-black text-gray-400 uppercase">{item.weight}{t.kgLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full">
                          <span className="text-[9px] font-black text-gray-400 uppercase">{item.height}{t.cmLabel}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full">
                          <span className="text-[9px] font-black text-gray-400 uppercase">{item.age}{t.yearsLabel}</span>
                        </div>
                      </div>

                      {/* Long press overlay indicator */}
                      {isLongPressing === item.id && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-orange-500/5 flex items-center justify-center pointer-events-none"
                        >
                          <div className="bg-orange-500 text-white p-2 rounded-full animate-pulse">
                            <GriddyIcon name="Trash" size="24" />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-6 pb-4">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i + 1)}
                          className={`w-12 h-12 rounded-2xl font-black text-sm transition-all active:scale-90 ${
                            currentPage === i + 1
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                              : 'bg-white dark:bg-gray-900 text-gray-400 border border-gray-100 dark:border-gray-800'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="calculator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Profile Overview Card (Read Only) */}
              <div className="bg-white dark:bg-gray-900 p-8 rounded-[48px] shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <GriddyIcon name="Calculator" size={120} />
                </div>
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.weight}</label>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black dark:text-white">{userProfile.weight}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.kgLabel}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.height}</label>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black dark:text-white">{userProfile.height}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.cmLabel}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800 flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-xl text-white">
                    <GriddyIcon name="Target" size={16} />
                  </div>
                  <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-relaxed">
                    {t.autoAdjustedProfile}
                  </p>
                </div>
              </div>

              {results && (
                <>
                  {/* Results Comparison */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <GriddyIcon name="TrendingDown" className="text-orange-500" size={20} />
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.compareMethods}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Mifflin-St Jeor</p>
                        <p className="text-xl font-black dark:text-white">{Math.round(results.bmrMifflin)} <span className="text-[10px] text-gray-400 uppercase">{t.cal}</span></p>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800">
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Harris-Benedict</p>
                        <p className="text-xl font-black dark:text-white">{Math.round(results.bmrHarris)} <span className="text-[10px] text-gray-400 uppercase">{t.cal}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Main Target Card */}
                  <div className="bg-orange-500 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                      <GriddyIcon name="Fire" size={140} />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">{t.dailyTarget}</p>
                          <h2 className="text-5xl font-black tabular-nums">{Math.round(results.dailyTarget)}</h2>
                          <p className="text-sm font-bold opacity-80 mt-1">{t.kcalPerDay}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                          <GriddyIcon name="Target" size={24} />
                        </div>
                      </div>
                      
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '70%' }}
                          className="h-full bg-white rounded-full"
                        />
                      </div>
                      
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter opacity-70">
                        <span>{t.safeDeficit}: {results.recommendedDeficit.min}</span>
                        <span>{t.maxDeficit}: {results.recommendedDeficit.max}</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity & Workout Profiling */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <GriddyIcon name="Activity" className="text-orange-500" size={20} />
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.workoutTailored}</h3>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[48px] border border-gray-100 dark:border-gray-800 space-y-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.chooseActivityType}</label>
                        <div className="relative">
                          <div className="flex overflow-x-auto no-scrollbar gap-3 pb-9 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
                            {Object.keys(ACTIVITY_METS).map((act) => (
                              <button
                                key={act}
                                onClick={() => setSelectedActivity(act)}
                                className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedActivity === act ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}
                              >
                                {translateActivity(act)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.workoutDuration}</label>
                          <span className="text-xl font-black text-orange-500">{duration} <span className="text-xs text-gray-400">{t.unitMin}</span></span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="120" 
                          step="5"
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                      </div>

                      <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-[32px] border border-orange-100 dark:border-orange-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <GriddyIcon name="Zap" size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">{t.estimatedBurn}</p>
                            <p className="text-2xl font-black dark:text-white tabular-nums">{Math.round(workoutCalories)} <span className="text-[10px] text-gray-400 uppercase">{t.cal}</span></p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formula Explanation Section */}
                  <div className="space-y-6 pb-12">
                    <div className="flex items-center gap-2">
                      <GriddyIcon name="Info" className="text-indigo-500" size={20} />
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.howItWorks}</h3>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[48px] border border-gray-100 dark:border-gray-800 space-y-8">
                      <div className="space-y-4">
                        <h4 className="text-sm font-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                          {t.bmrFormula}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                          {t.bmrFormulaDesc
                            .replace('{weight}', userProfile.weight.toString())
                            .replace('{height}', userProfile.height.toString())
                            .replace('{age}', userProfile.age.toString())}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
                          {t.tdeeActivity}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                          {t.tdeeActivityDesc.replace('{activityLevel}', t[userProfile.activityLevel] || userProfile.activityLevel)}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                          {t.targetDeficit}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                          {t.targetDeficitDesc}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Single Confirmation */}
      <CustomDialog
        isOpen={!!itemToDelete && !isConfirmingDeleteAll}
        onClose={() => {
          setItemToDelete(null);
          setIsLongPressing(null);
        }}
        onConfirm={confirmDeleteSingle}
        title={t.deleteHistory}
        message={t.confirmDelete}
        confirmText={t.deleteHistory}
        cancelText={t.cancel}
        type="danger"
      />

      {/* Delete All Confirmation */}
      <CustomDialog
        isOpen={isConfirmingDeleteAll}
        onClose={() => setIsConfirmingDeleteAll(false)}
        onConfirm={confirmDeleteAll}
        title={t.deleteAll}
        message={t.confirmDeleteAll}
        confirmText={t.deleteAll}
        cancelText={t.cancel}
        type="danger"
      />

      {/* Deleting Loader Overlay */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <div className="bg-white dark:bg-gray-900 p-10 rounded-[48px] shadow-2xl flex flex-col items-center gap-6 border border-gray-100 dark:border-gray-800">
              <div className="relative">
                <GriddyIcon name="Loader" size={48} className="text-orange-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <GriddyIcon name="Trash" size={20} className="text-orange-500 animate-pulse" />
                </div>
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
                {t.deleting}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalorieDeficitProgram;
