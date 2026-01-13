
import React, { useState } from 'react';
import { ChevronRight, MapPin, Dumbbell, BarChart3, Zap } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
  t: any;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, t }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Track Your Run",
      description: "Pantau rute lari Anda secara real-time dengan integrasi GPS yang akurat.",
      icon: <MapPin size={48} className="text-blue-600" />,
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Bodyweight Mastery",
      description: "Latihan beban tubuh yang dirancang untuk membakar kalori di mana saja tanpa alat.",
      icon: <Dumbbell size={48} className="text-orange-500" />,
      color: "bg-orange-50 dark:bg-orange-900/20"
    },
    {
      title: "Analyze Progress",
      description: "Dapatkan statistik mendalam tentang performa Anda untuk mencapai target kesehatan.",
      icon: <BarChart3 size={48} className="text-emerald-500" />,
      color: "bg-emerald-50 dark:bg-emerald-900/20"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="h-screen w-screen bg-white dark:bg-black flex flex-col p-8 transition-colors duration-500 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12">
        <div 
          key={currentStep}
          className={`w-32 h-32 ${steps[currentStep].color} rounded-[40px] flex items-center justify-center shadow-2xl animate-in zoom-in fade-in duration-700`}
        >
          {steps[currentStep].icon}
        </div>

        <div key={`text-${currentStep}`} className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            {steps[currentStep].title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium px-4 leading-relaxed">
            {steps[currentStep].description}
          </p>
        </div>
      </div>

      <div className="space-y-8 pb-12">
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-800'}`} 
            />
          ))}
        </div>

        <button 
          onClick={nextStep}
          className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black py-6 rounded-[32px] shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-sm"
        >
          {currentStep === steps.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
