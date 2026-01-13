import React from "react";
import { ArrowLeft, ShieldAlert, Mail, Copyright } from "lucide-react";

interface TermsScreenProps {
  onBack: () => void;
  t: any;
}

export const TermsScreen: React.FC<TermsScreenProps> = ({ onBack, t }) => {
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
          {t.termsConditions}
        </span>
        <div className="w-12"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-24 -mt-4 transition-all z-10">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-[32px] flex items-center gap-4 border border-blue-100 dark:border-blue-900/30">
          <ShieldAlert size={32} className="text-blue-600 shrink-0" />
          <div>
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
              {t.termsImportant}
            </h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {t.termsReadCarefully}
            </p>
          </div>
        </div>

        <section className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <h4 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">
              {t.termsSection1Title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {t.termsSection1Desc}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <h4 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">
              {t.termsSection2Title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {t.termsSection2Desc}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <h4 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">
              {t.termsSection3Title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {t.termsSection3Desc}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <h4 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">
              {t.termsSection4Title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {t.termsSection4Desc}
            </p>
          </div>
        </section>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-[32px] border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
              <Mail size={20} />
            </div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">
              {t.termsQuestionsIssues}
            </h4>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            {t.termsContactDesc}
          </p>
          <a
            href="mailto:siapaajaboleh202@gmail.com"
            className="inline-block text-base font-black text-blue-600 dark:text-blue-400 border-b-2 border-blue-600/20 pb-1"
          >
            siapaajaboleh202@gmail.com
          </a>
        </div>

        <div className="pt-8 flex items-center justify-center gap-3 opacity-30 pb-12">
          <Copyright size={16} />
          <span className="text-sm font-black uppercase tracking-[0.2em]">
            2026 FIT GO
          </span>
        </div>
      </div>
    </div>
  );
};
