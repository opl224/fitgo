
import React from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Scale,
  Activity,
  Target,
  ShieldAlert,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import { UserPhysicalProfile } from '../types';

interface WorkoutAssessmentProps {
  onComplete: (profile: UserPhysicalProfile) => void;
  t: any;
}

const StepperInput: React.FC<{
  label: string;
  value: number;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (val: number) => void;
}> = ({ label, value, unit, min = 0, max = 300, step = 1, onChange }) => {
  const increment = () => value < max && onChange(value + step);
  const decrement = () => value > min && onChange(value - step);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-[32px] border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2 transition-all shadow-sm w-full">
      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      <div className="flex items-center justify-between w-full px-2">
        <button
          onClick={decrement}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-blue-600 active:scale-90 transition-all"
        >
          <Minus size={18} strokeWidth={3} />
        </button>

        <div className="flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">
              {value || "0"}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase">{unit}</span>
          </div>
        </div>

        <button
          onClick={increment}
          className="w-10 h-10 rounded-2xl bg-blue-600 shadow-md flex items-center justify-center text-white active:scale-90 transition-all"
        >
          <Plus size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export const WorkoutAssessment: React.FC<WorkoutAssessmentProps> = ({ onComplete, t }) => {
  const [step, setStep] = React.useState(1);
  const [profile, setProfile] = React.useState<Partial<UserPhysicalProfile>>({
    gender: 'male',
    age: 25,
    weight: 70,
    height: 170,
    activityLevel: 'moderate',
    goal: 'health',
    hasInjury: false,
    frequency: 3
  });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleComplete = () => {
    if (profile.age && profile.weight && profile.height) {
      onComplete(profile as UserPhysicalProfile);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 py-4 overflow-x-hidden touch-none w-full max-w-full">
      <div className="space-y-2 text-center px-4">
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">{t.step} 1 {t.of} 3</span>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">{t.askAge}</h2>
        <p className="text-gray-500 text-sm font-medium">{t.physicalDesc}</p>
      </div>

      <div className="flex justify-center gap-2 px-4">
        {(['male', 'female'] as const).map((g) => (
          <button
            key={g}
            onClick={() => setProfile({ ...profile, gender: g })}
            className={`flex-1 px-4 py-3 rounded-full border-2 font-black uppercase tracking-widest text-[9px] transition-all min-w-0 ${profile.gender === g ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-md' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}
          >
            {t[g] || g}
          </button>
        ))}
      </div>

      <div className="space-y-4 w-full max-w-xs sm:max-w-sm mx-auto px-4">
        <StepperInput
          label={t.age}
          value={profile.age || 0}
          unit={t.yearsLabel}
          min={10} max={100}
          onChange={(val) => setProfile({ ...profile, age: val })}
        />
        <StepperInput
          label={t.weight}
          value={profile.weight || 0}
          unit={t.kgLabel}
          min={30} max={250}
          onChange={(val) => setProfile({ ...profile, weight: val })}
        />
        <StepperInput
          label={t.height}
          value={profile.height || 0}
          unit={t.cmLabel}
          min={100} max={250}
          onChange={(val) => setProfile({ ...profile, height: val })}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 py-4 flex flex-col">
      <div className="space-y-2 text-center px-6">
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">{t.step} 2 {t.of} 3</span>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">{t.trainingGoal}</h2>
        <p className="text-gray-500 text-sm font-medium">{t.goalDesc}</p>
      </div>

      {/* Area Scroll Horizontal diperluas dengan padding vertikal agar scale-105 tidak terpotong */}
      <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-6 px-10 py-10">
        {[
          { id: 'weightloss', icon: <Scale />, color: 'orange' },
          { id: 'muscle', icon: <Dumbbell />, color: 'blue' },
          { id: 'endurance', icon: <Activity />, color: 'emerald' },
          { id: 'health', icon: <Target />, color: 'purple' }
        ].map((g) => (
          <button
            key={g.id}
            onClick={() => setProfile({ ...profile, goal: g.id as any })}
            className={`flex-shrink-0 w-[200px] snap-center p-8 rounded-[48px] border-2 flex flex-col items-center gap-6 transition-all duration-300 ${profile.goal === g.id ? `border-${g.color}-500 bg-${g.color}-50 dark:bg-${g.color}-900/20 text-${g.color}-500 shadow-2xl scale-110` : 'border-gray-100 dark:border-gray-800 text-gray-400 opacity-60'}`}
          >
            <div className={`p-6 rounded-[32px] bg-white dark:bg-gray-800 shadow-lg`}>
              {React.cloneElement(g.icon as React.ReactElement, { size: 36 } as any)}
            </div>
            <span className="font-black uppercase tracking-widest text-[11px] text-center">{t[g.id] || g.id}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4 px-8 mt-4">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block text-center">{t.activityLevel}</label>
        <div className="relative">
          <div className="flex overflow-x-auto no-scrollbar gap-2 justify-start sm:justify-center px-10 py-2" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
            {(['sedentary', 'light', 'moderate', 'active', 'athlete'] as const).map(lvl => (
              <button
                key={lvl}
                onClick={() => setProfile({ ...profile, activityLevel: lvl })}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-wider transition-all ${profile.activityLevel === lvl ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-transparent border-gray-100 dark:border-gray-800 text-gray-400'}`}
              >
                {t[lvl] || lvl}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 py-4">
      <div className="space-y-2 text-center px-6">
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">{t.step} 3 {t.of} 3</span>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">{t.healthStatus}</h2>
        <p className="text-gray-500 text-sm font-medium">{t.healthDesc}</p>
      </div>

      <div className="px-6">
        <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-[48px] border border-gray-100 dark:border-gray-800 space-y-8 shadow-inner max-w-md mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-3xl ${profile.hasInjury ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'} transition-colors shadow-lg`}>
                <ShieldAlert size={28} />
              </div>
              <span className="font-black dark:text-white uppercase tracking-tight text-lg">{t.everInjured}</span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setProfile({ ...profile, hasInjury: true })}
                className={`flex-1 px-6 py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] transition-all border-2 ${profile.hasInjury ? 'bg-red-500 text-white border-red-500 shadow-lg' : 'bg-transparent text-gray-400 border-gray-100 dark:border-gray-800'}`}
              >
                {t.yes}
              </button>
              <button
                onClick={() => setProfile({ ...profile, hasInjury: false })}
                className={`flex-1 px-6 py-4 rounded-3xl font-black uppercase tracking-widest text-[11px] transition-all border-2 ${!profile.hasInjury ? 'bg-green-600 text-white border-green-600 shadow-lg' : 'bg-transparent text-gray-400 border-gray-100 dark:border-gray-800'}`}
              >
                {t.no}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 text-center">
        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.weeklyFrequency}</label>
        <div className="relative">
          <div className="flex overflow-x-auto no-scrollbar gap-3 px-10 py-2" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
            {[1, 2, 3, 4, 5, 6, 7].map(f => (
              <button
                key={f}
                onClick={() => setProfile({ ...profile, frequency: f })}
                className={`flex-shrink-0 w-16 h-16 rounded-2xl font-black text-xl transition-all flex items-center justify-center ${profile.frequency === f ? 'bg-blue-600 text-white shadow-xl scale-110' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white dark:bg-black flex flex-col transition-colors duration-500 overflow-x-hidden select-none w-full max-w-full">
      {/* Fixed Progress Bar Header */}
      <div className="h-24 shrink-0 flex items-end justify-center px-12 pb-6 z-[200] bg-white dark:bg-black border-b border-gray-50 dark:border-gray-900">
        <div className="w-full max-w-xs h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-blue-600 transition-all duration-700 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Fixed Footer Navigation */}
      <div className="h-32 shrink-0 p-6 flex items-start bg-white dark:bg-black border-t border-gray-50 dark:border-gray-900">
        <div className="flex gap-4 w-full max-w-md mx-auto">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="p-5 bg-gray-50 dark:bg-gray-800 rounded-[28px] text-gray-900 dark:text-white active:scale-95 transition-all border border-gray-100 dark:border-gray-700"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <button
            onClick={step === 3 ? handleComplete : nextStep}
            className={`flex-1 font-black py-5 rounded-[28px] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-xs border-b-4 bg-blue-600 text-white border-blue-800/30`}
          >
            {step === 3 ? (
              <>
                {t.finishAsessment} <Check size={20} strokeWidth={3} />
              </>
            ) : (
              <>
                {t.next} <ChevronRight size={20} strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
