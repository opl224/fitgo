import React from 'react';
import { GriddyIcon } from './GriddyIcon';

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type?: 'danger' | 'info' | 'success';
  isLoading?: boolean;
  closeOnBackdropClick?: boolean;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger',
  isLoading = false,
  closeOnBackdropClick = true
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdropClick && !isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={handleBackdropClick}
      />
      
      {/* Dialog Card */}
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative z-10 border border-gray-100 dark:border-gray-800 animate-in zoom-in fade-in duration-300">
        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-3xl mb-6 ${
            type === 'danger' ? 'bg-red-50 dark:bg-red-950/30 text-red-500' : 
            type === 'success' ? 'bg-green-50 dark:bg-green-950/30 text-green-500' : 
            'bg-blue-50 dark:bg-blue-950/30 text-blue-500'
          }`}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
            ) : (
              type === 'danger' ? <GriddyIcon name="Trash" size={32} /> : type === 'success' ? <GriddyIcon name="Check" size={32} /> : <GriddyIcon name="Alert" size={32} />
            )}
          </div>
          
          <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">
            {title}
          </h3>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="flex flex-col gap-4 w-full mt-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) {
                  onConfirm();
                }
              }}
              disabled={isLoading}
              className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl flex items-center justify-center ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              } ${
                type === 'danger' ? 'bg-red-500 text-white shadow-red-500/25' : 
                type === 'success' ? 'bg-green-500 text-white shadow-green-500/25' : 
                'bg-blue-600 text-white shadow-blue-600/25'
              }`}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : null}
              {confirmText}
            </button>
            {!isLoading && cancelText && (
              <button 
                onClick={onClose}
                className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                {cancelText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
