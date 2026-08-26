
import React, { useState, useEffect } from "react";
import GriddyIcon from "./GriddyIcon";
import { motion, AnimatePresence } from "motion/react";
import { UpdateCard } from "./UpdateCard";

interface UpdateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVersion: string;
  isDarkMode: boolean;
  t: any;
}

export const UpdateAdminModal: React.FC<UpdateAdminModalProps> = ({
  isOpen,
  onClose,
  currentVersion,
  isDarkMode,
  t
}) => {
  const [version, setVersion] = useState(currentVersion);
  const [priority, setPriority] = useState<"critical" | "optional">("optional");
  const [fileSize, setFileSize] = useState("5 MB");
  const [downloadUrl, setDownloadUrl] = useState(`https://github.com/opl224/fitgo-updates/releases/tag/v${currentVersion}`);
  const [newFeatures, setNewFeatures] = useState<string[]>([]);
  const [bugFixes, setBugFixes] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  
  const [tempFeature, setTempFeature] = useState("");
  const [tempFix, setTempFix] = useState("");
  const [tempImprovement, setTempImprovement] = useState("");
  
  const [showPreview, setShowPreview] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const addItem = (type: "feature" | "fix" | "improvement") => {
    if (type === "feature" && tempFeature.trim()) {
      setNewFeatures([...newFeatures, tempFeature.trim()]);
      setTempFeature("");
    } else if (type === "fix" && tempFix.trim()) {
      setBugFixes([...bugFixes, tempFix.trim()]);
      setTempFix("");
    } else if (type === "improvement" && tempImprovement.trim()) {
      setImprovements([...improvements, tempImprovement.trim()]);
      setTempImprovement("");
    }
  };

  const removeItem = (type: "feature" | "fix" | "improvement", index: number) => {
    if (type === "feature") setNewFeatures(newFeatures.filter((_, i) => i !== index));
    if (type === "fix") setBugFixes(bugFixes.filter((_, i) => i !== index));
    if (type === "improvement") setImprovements(improvements.filter((_, i) => i !== index));
  };

  const generateJSON = () => {
    const data = {
      version,
      priority,
      fileSize,
      downloadUrl,
      changelog: {
        newFeatures,
        bugFixes,
        improvements
      },
      android: {
        versionName: version,
        downloadUrl: downloadUrl
      }
    };
    return JSON.stringify(data, null, 4);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateJSON());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                  <GriddyIcon name="FileCode" size={20} />
                </div>
                <h2 className="text-lg font-black dark:text-white uppercase tracking-tight">{t.updateManager}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <GriddyIcon name="X" size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {/* Version & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.versionName}</label>
                  <input 
                    type="text" 
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={t.versionPlaceholder || "e.g. 1.2.1"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.priority}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setPriority("optional")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        priority === "optional" 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" 
                          : "border-gray-100 dark:border-gray-800 text-gray-400"
                      }`}
                    >
                      <GriddyIcon name="Info" size={16} />
                      <span className="text-xs font-bold">{t.optionalUpdate}</span>
                    </button>
                    <button 
                      onClick={() => setPriority("critical")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        priority === "critical" 
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600" 
                          : "border-gray-100 dark:border-gray-800 text-gray-400"
                      }`}
                    >
                      <GriddyIcon name="Alert" size={16} />
                      <span className="text-xs font-bold">{t.criticalUpdate}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Size & Download URL */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.fileSize}</label>
                  <input 
                    type="text" 
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{t.downloadUrl}</label>
                  <input 
                    type="text" 
                    value={downloadUrl}
                    onChange={(e) => setDownloadUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder={t.githubPlaceholder || "GitHub Release URL"}
                  />
                </div>
              </div>

              {/* Sections for Features, Fixes, Improvements */}
              {[
                { label: t.newFeatures, type: "feature", icon: <GriddyIcon name="Zap" size={16} />, color: "text-blue-500", items: newFeatures, temp: tempFeature, setTemp: setTempFeature },
                { label: t.improvements, type: "improvement", icon: <GriddyIcon name="Trend" size={16} />, color: "text-green-500", items: improvements, temp: tempImprovement, setTemp: setTempImprovement },
                { label: t.bugFixes, type: "fix", icon: <GriddyIcon name="Bug" size={16} />, color: "text-orange-500", items: bugFixes, temp: tempFix, setTemp: setTempFix }
              ].map((section) => (
                <div key={section.type} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className={`flex items-center gap-2 ${section.color}`}>
                      {section.icon}
                      <label className="text-[10px] font-black uppercase tracking-widest">{section.label}</label>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{section.items.length} {t.itemsLabel || "items"}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={section.temp}
                      onChange={(e) => section.setTemp(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addItem(section.type as any)}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder={`${t.addFeature || "Add item"}...`}
                    />
                    <button 
                      onClick={() => addItem(section.type as any)}
                      className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      <GriddyIcon name="Plus" size={20} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {section.items.map((item, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx} 
                        className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-100/50 dark:border-gray-700/50 group"
                      >
                        <span className="text-sm dark:text-gray-300 font-medium">{item}</span>
                        <button onClick={() => removeItem(section.type as any, idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                          <GriddyIcon name="Trash" size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPreview(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-[0.98]"
                >
                  <GriddyIcon name="Eye" size={16} />
                  {t.preview}
                </button>
                <button 
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  <GriddyIcon name={isCopied ? "Check" : "Copy"} size={16} />
                  {isCopied ? t.copied : t.copyJson}
                </button>
              </div>
              <p className="text-[9px] text-center font-bold text-gray-400 uppercase tracking-widest">
                {t.copyJsonDesc}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Preview Card */}
      <UpdateCard 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onDownload={() => {}}
        currentVersion={currentVersion}
        latestVersion={version}
        isDarkMode={isDarkMode}
        t={t}
        updateDetail={{
          version,
          releaseDate: new Date().toLocaleDateString(t.locale || 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase(),
          fileSize: fileSize,
          priority,
          changelog: {
            newFeatures,
            bugFixes,
            improvements
          }
        }}
      />
    </AnimatePresence>
  );
};
