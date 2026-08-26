
import React from "react";
import GriddyIcon from "./GriddyIcon";
import { motion, AnimatePresence } from "motion/react";

export interface UpdateDetail {
  version: string;
  releaseDate: string;
  fileSize: string;
  priority: "critical" | "optional";
  changelog: {
    newFeatures: string[];
    bugFixes: string[];
    improvements: string[];
  };
}

interface UpdateCardProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onShowHistory?: () => void;
  currentVersion: string;
  latestVersion: string;
  updateDetail: UpdateDetail;
  isDarkMode: boolean;
  t: any;
}

import styles from "./UpdateCard.module.css";

export const UpdateCard: React.FC<UpdateCardProps> = ({
  isOpen,
  onClose,
  onDownload,
  onShowHistory,
  currentVersion,
  latestVersion,
  updateDetail,
  isDarkMode,
  t
}) => {
  const isCritical = updateDetail.priority === "critical";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Card Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={styles.container}
          >
            {/* Header */}
            <div className="p-8 pb-0 flex flex-col items-start relative z-20 shrink-0 w-full">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-black/80 dark:bg-white/80 rounded-full text-white dark:text-black transition-colors"
                aria-label="Close"
              >
                <GriddyIcon name="X" size={20} />
              </button>

              <div className="flex flex-col items-start gap-4 mb-2 w-full">
                <div className="flex flex-col items-start text-left w-full">
                  <h2 className="text-[24px] font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">
                    {t.updateAvailable}
                  </h2>
                  <div className="flex items-center gap-2 justify-start">
                    <span className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      v{currentVersion}
                    </span>
                    <span className="text-blue-600 font-black">•</span>
                    <span className={`text-sm font-black uppercase tracking-widest ${
                      isCritical ? "text-red-500" : "text-blue-600"
                    }`}>
                      v{latestVersion}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vertical Metadata List */}
              <div className={styles.metadataContainer}>
                <div className={`${styles.metadataItem} ${
                  isCritical 
                    ? "text-red-600 dark:text-red-400" 
                    : "text-blue-600 dark:text-blue-400"
                } mb-1`}>
                  <GriddyIcon name="Alert" size={14} />
                  {isCritical ? t.criticalUpdate : t.optionalUpdate}
                </div>
                
                <div className="flex items-center gap-6 text-gray-500 dark:text-gray-400">
                  <div className={styles.metadataItem}>
                    <GriddyIcon name="Calendar" size={14} />
                    {updateDetail.releaseDate || "11 FEB 2024"}
                  </div>
                  <div className={styles.metadataItem}>
                    <GriddyIcon name="HardDrive" size={14} />
                    {updateDetail.fileSize || "24.5 MB"}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content with Edge Blur */}
            <div className={styles.scrollableContent}>
              {updateDetail.changelog.newFeatures.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-start gap-2 px-1">
                    <div className={styles.adaptiveIconBg}>
                      <GriddyIcon name="Zap" size={14} />
                    </div>
                    <span className="text-[14px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.newFeatures}</span>
                  </div>
                  <div className="space-y-2">
                    {updateDetail.changelog.newFeatures.map((item, i) => (
                      <motion.div 
                        key={i}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-transparent hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-snug">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {updateDetail.changelog.improvements.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-start gap-2 px-1">
                    <div className={styles.adaptiveIconBg}>
                      <GriddyIcon name="Trend" size={14} />
                    </div>
                    <span className="text-[14px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.improvements}</span>
                  </div>
                  <div className="space-y-2">
                    {updateDetail.changelog.improvements.map((item, i) => (
                      <motion.div 
                        key={i}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-transparent hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-snug">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {updateDetail.changelog.bugFixes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-start gap-2 px-1">
                    <div className={styles.adaptiveIconBg}>
                      <GriddyIcon name="Bug" size={14} />
                    </div>
                    <span className="text-[14px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t.bugFixes}</span>
                  </div>
                  <div className="space-y-2">
                    {updateDetail.changelog.bugFixes.map((item, i) => (
                      <motion.div 
                        key={i}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-transparent hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-snug">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-8 pt-4 pb-8 space-y-4 shrink-0 relative z-20">
              <div className="flex flex-col gap-4 w-full max-w-[400px] mx-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={onDownload}
                  className={`${styles.actionButton} text-white ${
                    isCritical 
                      ? "bg-[#FF4B4B] border-[#D33131] shadow-[0_4px_0_#D33131]" 
                      : "bg-[#58CC02] border-[#46A302] shadow-[0_4px_0_#46A302] hover:bg-[#61E002]"
                  }`}
                >
                  <GriddyIcon name="Download" size={18} className="stroke-[3px]" />
                  <span className="drop-shadow-sm">{t.downloadUpdateNow}</span>
                </motion.button>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onShowHistory}
                    className={`${styles.actionButton} text-white bg-[#1CB0F6] border-[#1899D6] shadow-[0_4px_0_#1899D6] active:shadow-none`}
                  >
                    <GriddyIcon name="History" size={14} className="stroke-[3px]" />
                    {t.history}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className={`${styles.actionButton} text-white bg-[#1CB0F6] border-[#1899D6] shadow-[0_4px_0_#1899D6] active:shadow-none`}
                  >
                    {t.later}
                  </motion.button>
                </div>
              </div>
              
              <p className="text-[9px] text-center font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-4">
                FitGo v{latestVersion}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
