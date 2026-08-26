import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation, PanInfo } from "motion/react";
import { GriddyIcon } from "./GriddyIcon";
import { Language, Screen } from "../types";
import { addBackHandler } from "../utils/backButtonService";
import ChatScreen from "./ChatScreen";

interface ActionCenterPanelProps {
  t: any;
  language: Language;
  userName?: string;
  isDarkMode: boolean;
  onNavigate?: (screen: Screen) => void;
}

const ActionCenterPanel: React.FC<ActionCenterPanelProps> = ({
  t,
  language,
  userName,
  isDarkMode,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<"chat" | "outdoor" | "exercise" | null>(null);
  const controls = useAnimation();

  // Handle back navigation
  const handleClose = useCallback(() => {
    if (activeFeature) {
      setActiveFeature(null);
      setIsOpen(false);
      return true;
    }
    if (isOpen) {
      setIsOpen(false);
      return true;
    }
    return false;
  }, [isOpen, activeFeature]);

  useEffect(() => {
    if (isOpen || activeFeature) {
      return addBackHandler(handleClose);
    }
  }, [isOpen, activeFeature, handleClose]);

  // Constants
  const PEEK_HEIGHT = 60; // Height of the trigger area

  // Handle drag to open
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y < -50) {
      setIsOpen(true);
    } else if (info.offset.y > 50) {
      setIsOpen(false);
      setActiveFeature(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      controls.start({ y: 0 });
    } else {
      controls.start({ y: 0 }); // We use y:0 but toggle visibility/rendering
    }
  }, [isOpen, controls]);

  const features = [
    { 
      id: "outdoor", 
      label: t.outdoorRun, 
      image: "/icons/3d-map.png", 
      route: "run",
      color: "#f59e0b", // Amber
      shadowColor: "#d97706" 
    },
    { 
      id: "chat", 
      label: t.chatbot, 
      image: "/icon.png", 
      route: "chat",
      color: "#ffffff", 
      shadowColor: "#e5e7eb" 
    },
    { 
      id: "exercise", 
      label: t.training, 
      image: "/icons/barbel.png", 
      route: "workout",
      color: "#3b82f6", // Blue
      shadowColor: "#2563eb" 
    },
  ];

  const handleIconClick = (feat: any) => {
    if (feat.id === "chat") {
       if (onNavigate) {
          setIsOpen(false);
          setActiveFeature(null);
          setTimeout(() => {
            onNavigate("chatbot" as Screen);
          }, 300);
       }
    } else {
       // Direct Navigation
       if (onNavigate && feat.route) {
          setIsOpen(false);
          setActiveFeature(null);
          setTimeout(() => {
            onNavigate(feat.route as Screen);
          }, 300);
       }
    }
  };

  return (
    <>
      {/* 1. Swipe Trigger Area (Always visible at bottom) */}
      {!isOpen && !activeFeature && (
        <motion.div
          id="tour-action-center"
          className="fixed bottom-0 left-0 right-0 h-[60px] z-[90] flex flex-col items-center justify-center cursor-grab active:cursor-grabbing bg-transparent"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 0.98 }}
        >
          {/* Visual Indicator of the hidden arc */}
          <div className="w-full h-full flex items-end justify-center pb-4">
             <div className="w-12 h-1.5 bg-gray-300/50 dark:bg-gray-600/50 rounded-full backdrop-blur-sm" />
          </div>
        </motion.div>
      )}

      {/* 2. Arc Menu Overlay */}
      <AnimatePresence>
        {isOpen && !activeFeature && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[100]"
              onClick={() => setIsOpen(false)}
            />

            {/* Arc Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[110] flex flex-col justify-end items-center pointer-events-none"
              style={{ height: "450px" }} 
            >
              {/* 1. THE HILL SHAPE (Visual Bukit) */}
              <div 
                className="w-[150%] h-[500px] bg-[#1E1E1E] absolute -bottom-[280px] rounded-[50%] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10 pointer-events-auto flex justify-center"
              >
                <div className="relative w-full h-full flex justify-center">
                  
                  {/* TOMBOL X - Sekarang di bawah tengah bukit */}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute bottom-[300px] w-12 h-12 rounded-full bg-[#2A2A2A] text-white flex items-center justify-center border border-white/10 shadow-lg active:scale-90 transition-transform z-30"
                  >
                    <GriddyIcon name="X" size={20} />
                  </button>

                  {/* 2. WRAPPER IKON - Jangkarnya diturunkan agar ikon menempel ke bukit */}
                  <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-0 h-0">
                    {features.map((feat, i) => {
                      // Radius diperkecil agar tidak terlalu melebar ke samping di layar HP
                      const radius = 125; 
                      const angles = [-155, -90, -25]; 
                      const angleDegree = angles[i];
                      const angleRadian = (angleDegree * Math.PI) / 180;

                      const x = Math.cos(angleRadian) * radius;
                      const y = Math.sin(angleRadian) * radius;

                      return (
                        <motion.div
                          key={feat.id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            x: x, 
                            y: y + 90, 
                          }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="absolute pointer-events-auto flex flex-col items-center gap-2"
                          style={{ width: '100px', marginLeft: '-50px' }}
                        >
                          <div className="relative group">
                            <button
                              onClick={() => handleIconClick(feat)}
                              aria-label={feat.label}
                              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 active:translate-y-1"
                              style={{ 
                                backgroundColor: feat.color,
                                boxShadow: `0 6px 0 ${feat.shadowColor}`,
                                transform: 'translateY(0)'
                              }}
                              onMouseDown={(e) => {
                                e.currentTarget.style.boxShadow = `0 2px 0 ${feat.shadowColor}`;
                                e.currentTarget.style.transform = 'translateY(4px)';
                              }}
                              onMouseUp={(e) => {
                                e.currentTarget.style.boxShadow = `0 6px 0 ${feat.shadowColor}`;
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = `0 6px 0 ${feat.shadowColor}`;
                                e.currentTarget.style.transform = 'translateY(0)';
                              }}
                            >
                              <img 
                                src={feat.image} 
                                alt="" 
                                className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" 
                              />
                            </button>
                          </div>
                          <span className="text-[10px] font-black text-white uppercase text-center w-full tracking-widest drop-shadow-md">
                            {feat.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Full Screen Feature Overlay (Chat, etc) */}
      <AnimatePresence>
        {isOpen && activeFeature === "exercise" && (
          <motion.div
             initial={{ y: "100%" }}
             animate={{ y: 0 }}
             exit={{ y: "100%" }}
             transition={{ type: "spring", damping: 25, stiffness: 200 }}
             className="fixed inset-0 z-[120] bg-white dark:bg-[#121212] flex flex-col"
           >
             <div className="flex-1 flex flex-col w-full h-full">
                <div className="px-4 pt-12 pb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#121212]">
                  <button onClick={() => setActiveFeature(null)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <GriddyIcon name="ArrowLeft" size={24} className="text-gray-800 dark:text-white" />
                  </button>
                  <h2 className="font-bold text-lg dark:text-white">{t.workoutMenu}</h2>
                </div>
                <div className="flex-1 p-6 grid grid-cols-2 gap-4 content-start overflow-y-auto">
                    {[
                      { key: "Running", label: t.activityRunning },
                      { key: "Cycling", label: t.activityCycling },
                      { key: "HIIT", label: t.activityHIIT },
                      { key: "Yoga", label: t.activityYoga },
                      { key: "Swimming", label: t.activitySwimming },
                      { key: "Gym", label: t.activityGym }
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                           // Example navigation
                           if (onNavigate) {
                             setIsOpen(false);
                             setActiveFeature(null);
                             setTimeout(() => onNavigate('workout'), 300);
                           }
                        }}
                        className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-2xl flex flex-col items-center justify-center gap-3 border border-gray-100 dark:border-gray-800 hover:border-blue-500 transition-colors cursor-pointer"
                      >
                         <GriddyIcon name="Activity" className="w-8 h-8 text-blue-500" />
                         <span className="font-medium dark:text-gray-300">{item.label}</span>
                      </div>
                    ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ActionCenterPanel;
