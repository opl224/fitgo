
import React from 'react';
import { AlertCircle, Trash2, X, Check } from 'lucide-react';

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type?: 'danger' | 'info' | 'success';
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Dialog Card */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 border border-gray-100 dark:border-gray-800 animate-in zoom-in fade-in duration-300">
        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-3xl mb-6 ${
            type === 'danger' ? 'bg-red-50 dark:bg-red-950/30 text-red-500' : 
            type === 'success' ? 'bg-green-50 dark:bg-green-950/30 text-green-500' : 
            'bg-blue-50 dark:bg-blue-950/30 text-blue-500'
          }`}>
            {type === 'danger' ? <Trash2 size={32} /> : type === 'success' ? <Check size={32} /> : <AlertCircle size={32} />}
          </div>
          
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">
            {title}
          </h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg ${
                type === 'danger' ? 'bg-red-500 text-white shadow-red-500/20' : 
                type === 'success' ? 'bg-green-500 text-white shadow-green-500/20' : 
                'bg-blue-600 text-white shadow-blue-600/20'
              }`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
