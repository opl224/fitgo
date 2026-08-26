import React from "react";
import GriddyIcon from "./GriddyIcon";
import ProfileCard from "./ProfileCard";
import { addBackHandler } from "../utils/backButtonService";
import CircularText from "./CircularText";
import EmailButton from "./EmailButton";
import { App } from "@capacitor/app";

interface AboutScreenProps {
  onBack: () => void;
  onNavigate: (screen: any) => void;
  t: any;
  appVersion: string;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({
  onBack,
  onNavigate,
  t,
  appVersion: propAppVersion,
}) => {
  const [showProfileCard, setShowProfileCard] = React.useState(false);
  const avatar = "/me.png";
  const [appVersion, setAppVersion] = React.useState<string>(propAppVersion);

  React.useEffect(() => {
    App.getInfo().then(info => {
      if (info && info.version) setAppVersion(info.version);
    }).catch(() => { /* ignore */ });
  }, []);

  React.useEffect(() => {
    if (showProfileCard) {
      window.history.pushState({ profileCard: true }, "");
      const handlePopState = () => setShowProfileCard(false);
      const backHandler = () => {
        setShowProfileCard(false);
        return true;
      };
      const remove = addBackHandler(backHandler);
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        try { remove(); } catch {}
        if (window.history.state?.profileCard) {
          window.history.back();
        }
      };
    }
  }, [showProfileCard]);

  return (
    <div className="h-screen w-screen bg-white dark:bg-black flex flex-col transition-colors duration-300 overflow-hidden">
      {/* Header */}
        <div className={`p-6 pt-12 flex items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-20 rounded-b-[64px] shadow-xl pb-12 transition-all ${showProfileCard ? "filter blur-[16px]" : ""}`}>
          
          {/* 1. Sisi Kiri - Diberi lebar tetap (w-16) agar sama dengan sisi kanan */}
          <div className="w-16 flex justify-start">
            <button
              onClick={onBack}
              className="p-3 rounded-2xl text-gray-900 dark:text-white active:scale-90 transition-all"
            >
              <GriddyIcon name="ArrowLeft" size={24} />
            </button>
          </div>

          {/* 2. Judul Tengah - Mengambil sisa ruang (flex-1) */}
          <div className="flex-1 flex justify-center px-2">
            <span className="font-black text-lg text-gray-800 dark:text-white uppercase tracking-[0.15em] text-center leading-tight">
              {t.about}
            </span>
          </div>

          {/* 3. Sisi Kanan - Lebar w-16 agar seimbang dengan kiri */}
          <div className="w-16 flex justify-end">
            <button
              onClick={() => setShowProfileCard(true)}
              className="relative w-16 h-16 flex items-center justify-center rounded-full active:scale-95 transition-all overflow-hidden"
            >
              <CircularText
                text="*opal*opal"
                onHover="speedUp"
                spinDuration={20}
              />
            </button>
          </div>
        </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-24 -mt-4 transition-all z-10 ${showProfileCard ? "filter blur-[16px]" : ""}`}>
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
            {t.versionLabel} {appVersion}
          </p>
        </div>

        {/* Structural Change Notification */}
        <div className="mx-2 p-5 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-[32px] border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm text-indigo-600">
            <GriddyIcon name="Chat" size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              {t.structuralUpdateTitle}
            </h4>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
              {t.structuralUpdateDesc}
            </p>
          </div>
        </div>

        {/* Purpose Section */}
        <div className="space-y-4 px-2">
          <div className="flex items-center gap-3">
            <GriddyIcon name="Target" size={22} className="text-blue-600" />
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
            <GriddyIcon name="HeartPulse" size={28} className="text-emerald-500" />
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-tight whitespace-pre-line">
              {t.missionEmpowerHealth}
            </span>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-[36px] border border-orange-100 dark:border-orange-900/30 flex flex-col items-center text-center gap-4">
            <GriddyIcon name="Code" size={28} className="text-orange-500" />
            <span className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest leading-tight whitespace-pre-line">
              {t.missionModernTech}
            </span>
          </div>
        </div>

        {/* Navigation & Contact Links */}
        <div className="space-y-4 px-2">
          <button
            onClick={() => onNavigate("terms")}
            className="w-full flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 rounded-[32px] border border-gray-100 dark:border-gray-800 active:scale-95 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
                <GriddyIcon name="ShieldCheck" size={24} />
              </div>
              <span className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">
                {t.termsConditions}
              </span>
            </div>
            <GriddyIcon
              name="ChevronRight"
              size={20}
              className="text-gray-400 group-hover:translate-x-1 transition-transform"
            />
          </button>

          <div className="p-8 bg-gray-50 dark:bg-gray-800/50 rounded-[40px] border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                <GriddyIcon name="Mail" size={24} />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                {t.supportBugReports}
              </h4>
            </div>
            <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
              {t.supportDesc}
            </p>
            <div className="flex flex-col items-center gap-3">
              <EmailButton
                onPress={() => {
                  const email = "siapaajaboleh202@gmail.com";
                  const subject = encodeURIComponent(t.supportSubject || "Support & Bug Report");
                  const mailto = `mailto:${email}?subject=${subject}`;
                  window.location.href = mailto;
                }}
                label={t.pressMe}
              />
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col items-center justify-center gap-2 opacity-30 pb-12">
          <div className="flex items-center gap-2">
            <GriddyIcon name="Copyright" size={14} />
            <span className="text-sm font-black uppercase tracking-[0.2em] dark:text-white">
              2026 FIT GO
            </span>
          </div>
        </div>
      </div>

      {showProfileCard && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[80px] pointer-events-none"
          />
          <div className="relative z-10 w-full max-w-sm flex items-center justify-center animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <ProfileCard
              avatarUrl={avatar}
              miniAvatarUrl={avatar}
              showUserInfo={true}
              enableTilt={true}
              enableMobileTilt={false}
              onContactClick={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutScreen;
