
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GriddyIcon } from './GriddyIcon';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSharePNG: () => void;
  onShareGPX: () => void;
  isProcessing: boolean;
  t: any;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({
  isOpen,
  onClose,
  onSharePNG,
  onShareGPX,
  isProcessing,
  t
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[600]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 rounded-t-[40px] z-[601] p-8 pb-12 shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-8" />
            
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 text-center">
              {t?.shareActivity || "Share Activity"}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  onSharePNG();
                  onClose();
                }}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[32px] border-2 border-transparent active:border-blue-500 transition-all group"
              >
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/20 group-active:scale-90 transition-transform">
                  <GriddyIcon name="Image" size={28} />
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-sm">PNG Image</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Social Media</span>
              </button>
              
              <button
                onClick={() => {
                  onShareGPX();
                  onClose();
                }}
                disabled={isProcessing}
                className="flex flex-col items-center justify-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-[32px] border-2 border-transparent active:border-orange-500 transition-all group"
              >
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-orange-500/20 group-active:scale-90 transition-transform">
                  <GriddyIcon name="Map" size={28} />
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-sm">GPX Data</span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Strava / Garmin</span>
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="w-full mt-8 py-4 bg-gray-100 dark:bg-gray-800 rounded-2xl font-bold text-gray-700 dark:text-gray-300 active:scale-95 transition-all"
            >
              {t?.cancel || "Cancel"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
