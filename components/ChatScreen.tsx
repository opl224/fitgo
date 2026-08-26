import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import GriddyIcon from "./GriddyIcon";
import { motion, AnimatePresence } from "motion/react";
import { FAQItem as FAQType, Language } from "../types";
import faqDataRaw from "../data/chatbot_faq.json";
import pkg from "../package.json";

import { Capacitor } from "@capacitor/core";
import { addBackHandler } from "../utils/backButtonService";

interface ChatScreenProps {
  t: any;
  language: Language;
  userName?: string;
  onBack?: () => void;
  isDarkMode: boolean;
  isEmbedded?: boolean;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "app" | "tips" | "trouble";
}

const ChatScreen: React.FC<ChatScreenProps> = ({ t, language, userName, onBack, isDarkMode, isEmbedded = false }) => {
  const platform = Capacitor.getPlatform();
  const isIOS = platform === "ios";
  
  const iconImg = "/icon.png";
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<FAQItem[]>([]);
  const [chatMessages, setChatMessages] = useState<{ type: "bot" | "user"; text: string; date: Date; isTechSection?: boolean }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Add hardware back button handler for Android
    if (isEmbedded || !onBack) return;
    
    // Explicit handler to handle nested UI states (like focused search)
    // before delegating to the global back handler in App.tsx
    const backHandler = () => {
      if (isSearchFocused) {
        setIsSearchFocused(false);
        return true;
      }
      // Return false to let App.tsx handle closing the chatbot screen
      return false;
    };

    const removeHandler = addBackHandler(backHandler);

    return () => {
      removeHandler();
    };
  }, [onBack, isEmbedded, isSearchFocused]);

  // Handle scroll effect
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    setIsScrolling(true);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1500); // Shimmer duration
  }, []);

  const fullTechStack = useMemo(() => {
    const deps = pkg.dependencies || {};
    const devDeps = pkg.devDependencies || {};
    
    return [
      {
        category: t.programmingLanguages,
        items: ["TypeScript", "JavaScript (ES6+)"]
      },
      {
        category: t.frameworks,
        items: [`React ${deps.react?.replace(/[\^~]/g, '') || '19'}`]
      },
      {
        category: t.libraries,
        items: [
          `Capacitor Core ${deps['@capacitor/core']?.replace(/[\^~]/g, '') || ''}`,
          `Motion ${deps['motion']?.replace(/[\^~]/g, '') || ''}`
        ]
      },
      {
        category: t.plugins,
        items: [
          `Leaflet ${deps['leaflet']?.replace(/[\^~]/g, '') || ''}`,
          "Griddy Icons",
          "Capacitor Camera & Filesystem"
        ]
      },
      {
        category: t.databases,
        items: ["Local Storage", "Secure Storage Plugin"]
      },
      {
        category: t.devTools,
        items: [`Vite ${devDeps.vite?.replace(/[\^~]/g, '') || '6'}`, "TypeScript Compiler", "ESLint"]
      }
    ];
  }, [t, pkg]);

  const TechSection = () => (
    <div className="space-y-6 w-full mt-2 tech-section-container">
      {/* Bagian 2: Daftar Lengkap (Full Stack) */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-4 px-1">
          <GriddyIcon name="Database" className="w-4 h-4 text-indigo-500 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#636E72] dark:text-[#B3B3B3]">
            {t.techUsedTitle}
          </span>
        </div>
        <div className="space-y-4">
          {fullTechStack.map((stack, i) => (
            <div 
              key={i}
              className="bg-[#F8F9FA] dark:bg-[#252525] p-3 rounded-2xl border border-[#E9ECEF] dark:border-[#2A2A2A] w-full"
            >
              <h5 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 px-1">
                {stack.category}
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {stack.items.map((item, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-white dark:bg-[#1E1E1E] text-xs md:text-[9px] font-medium text-[#2D3436] dark:text-white rounded-lg border border-[#E9ECEF] dark:border-[#2A2A2A] shadow-sm break-words whitespace-normal inline-block"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const faqData: FAQItem[] = useMemo(() => {
    return (faqDataRaw as FAQType[]).map(item => ({
      id: item.id,
      category: item.category,
      question: language === "id" ? item.question.id : language === "jp" ? item.question.jp : item.question.en,
      answer: language === "id" ? item.answer.id : language === "jp" ? item.answer.jp : item.answer.en
    }));
  }, [language]);

  useEffect(() => {
    if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);

    if (searchQuery.length >= 1) {
      setIsSuggestLoading(true);
      suggestTimeoutRef.current = setTimeout(() => {
        const filtered = faqData.filter(item => 
          item.question.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 6);
        setSuggestedQuestions(filtered);
        setIsSuggestLoading(false);
      }, 300);
    } else {
      setSuggestedQuestions([]);
      setIsSuggestLoading(false);
    }

    return () => {
      if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);
    };
  }, [searchQuery, faqData]);

  useEffect(() => {
    if (chatMessages.length === 0) {
      const greeting = userName 
        ? t.chatbotGreetingNamed.replace("{name}", userName) 
        : t.chatbotGreeting;
      
      setChatMessages([
        { 
          type: "bot", 
          text: greeting, 
          date: new Date() 
        }
      ]);
    }
  }, [language, userName, t]);

  useEffect(() => {
    const scrollToBottom = () => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };

    if (chatMessages.length > 0) {
      scrollToBottom();
      const timeoutId = setTimeout(scrollToBottom, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [chatMessages, isTyping]);

const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    // Reset state saat mengirim pesan
    setSuggestedQuestions([]);
    setIsSuggestLoading(false);
    if (suggestTimeoutRef.current) clearTimeout(suggestTimeoutRef.current);

    // Tambahkan pesan user
    setChatMessages(prev => [...prev, { type: "user", text, date: new Date() }]);
    setIsTyping(true);
    setSearchQuery(""); // Clear search bar

    // Simulate response delay
    setTimeout(() => {
      const lowerText = text.toLowerCase().trim();

      // 1. Daftar kata yang ingin diblokir agar TIDAK memicu Tech Section
      const forbiddenKeywords = ["google"];
      const isForbidden = forbiddenKeywords.some(k => {
        const regex = new RegExp(`\\b${k}\\b`, 'i'); // Hanya cocok jika kata utuh
        return regex.test(lowerText);
      });

      // 2. Daftar kata kunci teknologi yang valid
      const techKeywords = ["teknologi", "tech", "stack", "react", "typescript", "capacitor", "gemini", "ai"];
    const isAskingTech = techKeywords.some(k => {
      const regex = new RegExp(`\\b${k}\\b`, 'i');
      return regex.test(lowerText);
    });

    // 3. Cari di FAQ dengan logika yang lebih ketat
    // Kita cari yang benar-benar mirip, bukan cuma asal ada hurufnya
    const match = faqData.find(item => {
      const q = item.question.toLowerCase();
      // Utamakan kecocokan yang lebih spesifik
      return q === lowerText || q.includes(lowerText) && lowerText.length > 3;
    });

    // 4. Logika Keputusan Respon
    if (isForbidden && !match) {
      // Jika ngetik 'ai' atau 'gemini' dan tidak ada di FAQ, langsung "Tidak ditemukan"
      setChatMessages(prev => [...prev, { type: "bot", text: t.techNotFound, date: new Date() }]);
    } else if (match) {
      // Jika ada kecocokan di FAQ
      setChatMessages(prev => [...prev, { 
        type: "bot", 
        text: match.answer, 
        date: new Date(),
        isTechSection: match.id.startsWith('tech_') 
      }]);
    } else if (isAskingTech) {
      // Jika tanya teknologi secara umum
      setChatMessages(prev => [...prev, { 
        type: "bot", 
        text: t.techSearchResponse, 
        date: new Date(),
        isTechSection: true 
      }]);
    } else {
      // Default: Tidak ditemukan
      setChatMessages(prev => [...prev, { type: "bot", text: t.techNotFound, date: new Date() }]);
    }
    
    setIsTyping(false);
  }, 800);
}, [faqData, t]);

  const rootClass = isEmbedded 
    ? "flex flex-col h-full w-full overflow-hidden whatsapp-bg-container bg-white dark:bg-[#0A0A0A]" 
    : "fixed inset-0 bg-[#FFFFFF] dark:bg-[#0A0A0A] z-[100] flex flex-col h-screen w-full overflow-hidden whatsapp-bg-container";

  return (
    <div className={rootClass}>
      {/* Header */}
      {(!isEmbedded || isEmbedded) && ( // Always show header if requested, or control via prop. 
      // The user asked to redesign the header. If embedded, we might want a different header or none.
      // But for "Fitgo Assistant" curved card request, it seems to apply to the main view.
      // If isEmbedded is true (inside ActionCenterPanel), we might want the header there too.
      // Let's assume we show it.
        <div className="px-4 pt-4 pb-2 z-20 safe-top sticky top-0">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-[24px] shadow-lg shadow-black/5 border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
            <button 
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-800 dark:text-white"
              aria-label="Back"
            >
              <GriddyIcon name="ArrowLeft" size={24} />
            </button>
            
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Fitgo Assistant</h3>
              <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                 <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
              </div>
            </div>

            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
               <img src={iconImg} alt="Bot" className="w-6 h-6 object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar transition-colors chat-container-bg ${isScrolling ? 'chat-shimmer-active' : ''}`}
        style={{
          scrollBehavior: "smooth",
          paddingTop: "16px"
        }}
      >
        <div className="imessage">
          {chatMessages.map((msg, i) => {
            const isLastOfGroup = i === chatMessages.length - 1 || chatMessages[i + 1].type !== msg.type;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex flex-col ${msg.type === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`flex items-end gap-2 ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.type === "bot" && (
                    <div className="w-8 h-8 bg-[#F8F9FA] dark:bg-[#1E1E1E] rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-[#E9ECEF] dark:border-[#2A2A2A] shrink-0 mb-1">
                      <img src={iconImg} alt="FitGO" className="w-5 h-5 object-contain" />
                    </div>
                  )}
                  <p className={`
                      ${msg.type === "user" ? "from-me" : "from-them"} 
                      ${!isLastOfGroup ? "no-tail" : ""}
                      ${msg.text.length > 20 ? "bubble-multi-line" : "bubble-single-line"}
                    `}
                  >
                    {/* Gunakan text.trim() langsung tanpa span jika memungkinkan, 
                        atau span dengan display inline agar tidak menambah width sendiri */}
                    <span style={{ display: 'inline' }}>{msg.text.trim()}</span>
                  </p>
                </div>
                {msg.isTechSection && <TechSection />}
                <span className={`text-[9px] text-[#B3B3B3] mt-1 font-medium ${msg.type === "user" ? "px-2" : "px-10"}`}>
                  {msg.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            );
          })}
          
          {isTyping && (
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 bg-[#F8F9FA] dark:bg-[#1E1E1E] rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-[#E9ECEF] dark:border-[#2A2A2A] shrink-0 mb-1">
                <img src={iconImg} alt="FitGO" className="w-5 h-5 object-contain" />
              </div>
              <div className="from-them flex items-center gap-1 py-3 px-4">
                <span className="w-1.5 h-1.5 bg-[#636E72] dark:bg-[#B3B3B3] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-1.5 h-1.5 bg-[#636E72] dark:bg-[#B3B3B3] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-1.5 h-1.5 bg-[#636E72] dark:bg-[#B3B3B3] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
        </div>
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 relative transition-colors safe-bottom glass-footer overflow-hidden">
        <AnimatePresence>
          {suggestedQuestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-4 flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar"
            >
              {suggestedQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleSendMessage(q.question)}
                  className="px-3 py-1.5 bg-[#F8F9FA] dark:bg-[#252525] border border-[#E9ECEF] dark:border-[#2A2A2A] rounded-full text-xs text-[#2D3436] dark:text-white hover:bg-[#00B894] hover:text-white hover:border-[#00B894] dark:hover:bg-[#00B894] transition-all whitespace-nowrap active:scale-95"
                >
                  {q.question}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 relative group">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(searchQuery)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              placeholder={t.chatbotPlaceholder}
              className="w-full bg-[#F8F9FA] dark:bg-[#252525] text-sm text-[#2D3436] dark:text-white px-4 py-3 rounded-2xl border border-[#E9ECEF] dark:border-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#00B894]/20 focus:border-[#00B894] transition-all placeholder:text-[#B3B3B3]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSuggestLoading ? (
                <GriddyIcon name="Loader" className="w-4 h-4 text-[#00B894] animate-spin" />
              ) : (
                <GriddyIcon name="Search" className={`w-4 h-4 transition-colors ${isSearchFocused ? "text-[#00B894]" : "text-[#B3B3B3]"}`} />
              )}
            </div>
          </div>
          <button
            onClick={() => handleSendMessage(searchQuery)}
            disabled={!searchQuery.trim()}
            className="w-11 h-11 bg-[#00B894] dark:bg-[#00B894] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#00B894]/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            <GriddyIcon name="Send" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
