import { useState, useEffect } from 'react';

/**
 * Hook to track online/offline status with stability check
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isStable, setIsStable] = useState(true);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const performStabilityCheck = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setIsStable(false);
        return;
      }

      try {
        // Ping a reliable endpoint to verify actual internet access
        const response = await fetch('https://www.google.com/favicon.ico', {
          mode: 'no-cors',
          cache: 'no-store'
        });
        setIsOnline(true);
        setIsStable(true);
      } catch (error) {
        // navigator.onLine is true but cannot reach internet
        setIsOnline(false);
        setIsStable(false);
      }
    };

    const handleOnline = () => {
      performStabilityCheck();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setIsStable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 30 seconds for stability
    checkInterval = setInterval(performStabilityCheck, 30000);

    // Initial check
    performStabilityCheck();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, []);

  return { isOnline, isStable };
};

/**
 * Check if current platform has internet (simple wrapper for navigator.onLine)
 */
export const checkConnectivity = (): boolean => {
  return navigator.onLine;
};
