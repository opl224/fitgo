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
      <div className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar pb-24 z-10">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-[40px] flex items-center gap-5 border border-blue-100 dark:border-blue-900/30">
          <ShieldAlert size={40} className="text-blue-600" />
          <div>
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest">
              {t.termsImportant}
            </h3>
            <p className="text-base font-medium text-gray-600 dark:text-gray-300">
              {t.termsReadCarefully}
            </p>
          </div>
        </div>

        <section className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {t.termsSection1Title}
            </h4>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {t.termsSection1Desc}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {t.termsSection2Title}
            </h4>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {t.termsSection2Desc}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {t.termsSection3Title}
            </h4>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {t.termsSection3Desc}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              {t.termsSection4Title}
            </h4>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              {t.termsSection4Desc}
            </p>
          </div>
        </section>

        <div className="p-8 bg-gray-50 dark:bg-gray-800 rounded-[40px] border border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <Mail size={24} className="text-blue-600" />
            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
              {t.termsQuestionsIssues}
            </h4>
          </div>
          <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
            {t.termsContactDesc}
          </p>
          <a
            href="mailto:siapaajaboleh202@gmail.com"
            className="inline-block text-xl font-black text-blue-600 dark:text-blue-400 border-b-2 border-blue-600/20 pb-1"
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
