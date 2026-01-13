import React from "react";
import {
  ArrowLeft,
  Target,
  ShieldCheck,
  HeartPulse,
  Code2,
  Copyright,
  Mail,
  ChevronRight,
} from "lucide-react";

interface AboutScreenProps {
  onBack: () => void;
  onOpenTerms: () => void;
  t: any;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({
  onBack,
  onOpenTerms,
  t,
}) => {
  return (
    <div className="h-screen w-screen bg-white dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 pt-12 flex items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-20 rounded-b-[64px] shadow-xl pb-12 transition-all">
        <button
          onClick={onBack}
          className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="mx-auto font-black text-xl text-gray-800 dark:text-white uppercase tracking-[0.2em]">
          {t.about}
        </span>
        <div className="w-12"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-24 -mt-4 transition-all z-10">
        {/* App Branding Section */}
        <div className="flex flex-col items-center pt-8">
          <div className="w-28 h-28 bg-transparent rounded-[36px] flex items-center justify-center shadow-2xl mb-6 border-4 border-white/20">
            <img
              src="/icon.png"
              alt="Fit Go Icon"
              className="w-50 h-50 object-contain"
            />
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">
            Fit GO
          </h2>
          <p className="text-[12px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">
            Version 1.0.1
          </p>
        </div>

        {/* Purpose Section */}
        <div className="space-y-4 px-2">
          <div className="flex items-center gap-3">
            <Target size={22} className="text-blue-600" />
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
              {t.appPurpose}
            </h3>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm leading-relaxed">
            <p className="text-base font-medium text-gray-600 dark:text-gray-300">
              {t.aboutDesc1}
            </p>
            <p className="text-base font-medium text-gray-600 dark:text-gray-300 mt-6">
              {t.aboutDesc2}
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-2 gap-5 px-2">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-[36px] border border-emerald-100 dark:border-emerald-900/30 flex flex-col items-center text-center gap-4">
            <HeartPulse size={28} className="text-emerald-500" />
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-tight">
              {t.missionEmpowerHealth}
            </span>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-[36px] border border-orange-100 dark:border-orange-900/30 flex flex-col items-center text-center gap-4">
            <Code2 size={28} className="text-orange-500" />
            <span className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-tight">
              {t.missionModernTech}
            </span>
          </div>
        </div>

        {/* Navigation & Contact Links */}
        <div className="space-y-4 px-2">
          <button
            onClick={onOpenTerms}
            className="w-full flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-[32px] border border-gray-100 dark:border-gray-800 active:scale-95 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
                <ShieldCheck size={24} />
              </div>
              <span className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">
                {t.termsConditions}
              </span>
            </div>
            <ChevronRight
              size={20}
              className="text-gray-400 group-hover:translate-x-1 transition-transform"
            />
          </button>

          <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-[40px] border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                <Mail size={24} />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                {t.supportBugReports}
              </h4>
            </div>
            <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
              {t.supportDesc}
            </p>
            <a
              href="mailto:siapaajaboleh202@gmail.com"
              className="inline-block text-lg font-black text-blue-600 dark:text-blue-400 border-b-2 border-blue-600/20 pb-1"
            >
              siapaajaboleh202@gmail.com
            </a>
          </div>
        </div>

        <div className="pt-8 flex flex-col items-center justify-center gap-2 opacity-30 pb-12">
          <div className="flex items-center gap-2">
            <Copyright size={14} />
            <span className="text-[11px] font-black uppercase tracking-widest">
              2026 FIT GO
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-tighter">
            {t.developedWithLove}
          </p>
        </div>
      </div>
    </div>
  );
};
