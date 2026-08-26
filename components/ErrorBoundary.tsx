import React from "react";
import { storage } from "../utils/secureStorage";
import { Capacitor } from "@capacitor/core";

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  info?: string | null;
}

/**
 * ErrorBoundary component to catch runtime errors and prevent app crashes.
 * Displays a fallback UI with error details and reload option.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Captured runtime error:", error, info);
    
    // Log error to persistent storage for debugging
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        timestamp: new Date().toISOString(),
        platform: Capacitor.getPlatform(),
        version: "1.0.1" // Should ideally be dynamic
      };
      
      const existingLogs = await storage.get("error_logs") || [];
      existingLogs.unshift(errorLog);
      await storage.set("error_logs", existingLogs.slice(0, 10)); // Keep last 10 logs
    } catch (e) {
      console.warn("Failed to log error to storage", e);
    }

    this.setState({ 
      info: info.componentStack || null 
    });
  }

  handleResetApp = async () => {
    if (confirm("Reset aplikasi akan menghapus semua data lokal dan cache. Lanjutkan?")) {
      try {
        await storage.clear();
        window.location.reload();
      } catch (e) {
        alert("Gagal mereset aplikasi. Silakan hapus data aplikasi melalui pengaturan Android.");
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 border-2 border-red-500 rounded-[32px] shadow-2xl overflow-hidden">
            <div className="bg-red-500 p-6 flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest text-center">
                Ups! Ada Masalah
              </h2>
            </div>
            
            <div className="p-8 flex flex-col gap-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center font-bold">
                Aplikasi mengalami kesalahan sistem yang tidak terduga. Kami telah mencatat masalah ini untuk diperbaiki.
              </p>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Error Detail:</p>
                <p className="text-[11px] font-mono text-red-500 break-words line-clamp-3">
                  {this.state.error?.message || "Unknown error"}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Coba Muat Ulang
                </button>
                
                <button
                  onClick={this.handleResetApp}
                  className="w-full py-4 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs border border-gray-100 dark:border-gray-700 active:scale-95 transition-all"
                >
                  Reset & Bersihkan Cache
                </button>
              </div>
              
              <p className="text-[9px] text-gray-400 text-center font-medium">
                Jika masalah berlanjut, silakan hubungi pengembang.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
