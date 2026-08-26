import { useState, useEffect, useRef, useCallback } from "react";
import { registerPlugin } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { BackgroundGeolocationPlugin, Location } from "@capacitor-community/background-geolocation";
import { GeoPoint, RunSession, UnitSystem } from "../types";
import { calculateDistance, triggerHaptic, formatPaceString } from "../utils";
import simplify from 'simplify-js';
import { saveRunToFile } from "../utils/fileStorage";

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

const STORAGE_KEYS = {
  CURRENT_PATH: 'fitgo_current_path',
  CURRENT_STATS: 'fitgo_current_stats',
};

const MAX_BUFFER_SIZE = 1000;
const SESSION_EXPIRY_DAYS = 7;

export const useTracking = (
  isRunning: boolean,
  setIsRunning: (val: boolean) => void,
  unitSystem: UnitSystem,
  t: any,
  runHistory: RunSession[],
  setRunHistory: (val: RunSession[]) => void,
  onSessionFinish: (session: RunSession) => void
) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [totalGain, setTotalGain] = useState(0);
  const [currentPace, setCurrentPace] = useState(0);
  const [path, setPath] = useState<[number, number][]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [isGPSSearching, setIsGPSSearching] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Performance Optimization Refs
  const pathRef = useRef<[number, number][]>([]); // Full path for summary
  const bufferRef = useRef<[number, number][]>([]); // Circular buffer for real-time (max 1000)
  const distanceRef = useRef(0);
  const totalGainRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const lastSamplingTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<string | null>(null);
  const lastLocationTimeRef = useRef<number>(Date.now());

  // Recovery Logic: Load from Preferences if app crashed
  useEffect(() => {
    const loadSavedData = async () => {
      const { value: savedPath } = await Preferences.get({ key: STORAGE_KEYS.CURRENT_PATH });
      const { value: savedStats } = await Preferences.get({ key: STORAGE_KEYS.CURRENT_STATS });

      if (savedPath) {
        pathRef.current = JSON.parse(savedPath);
        // Sync buffer from last points of path
        bufferRef.current = pathRef.current.slice(-MAX_BUFFER_SIZE);
        setPath([...bufferRef.current]);
      }
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        distanceRef.current = stats.distance || 0;
        setDistance(stats.distance || 0);
        setElapsedTime(stats.elapsedTime || 0);
        totalGainRef.current = stats.totalGain || 0;
        setTotalGain(stats.totalGain || 0);
      }
    };
    loadSavedData();
    
    // Auto-delete old sessions (> 7 days)
    const cleanupOldSessions = async () => {
      const now = Date.now();
      const expiryTime = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      const filteredHistory = runHistory.filter(session => (now - session.startTime) < expiryTime);
      if (filteredHistory.length !== runHistory.length) {
        setRunHistory(filteredHistory);
      }
    };
    cleanupOldSessions();
  }, []);

  // Persistent storage update
  const persistData = useCallback(async () => {
    await Preferences.set({
      key: STORAGE_KEYS.CURRENT_PATH,
      value: JSON.stringify(pathRef.current),
    });
    await Preferences.set({
      key: STORAGE_KEYS.CURRENT_STATS,
      value: JSON.stringify({
        distance: distanceRef.current,
        elapsedTime,
        totalGain: totalGainRef.current,
      }),
    });
  }, [elapsedTime]);

  // Throttled UI Update with Lazy Update (every 5 points)
  const updateUI = useCallback((force = false) => {
    const now = Date.now();
    // Lazy Update: Update only every 5 points or every 2 seconds if forced
    if (force || (pathRef.current.length % 5 === 0 && now - lastUpdateTimeRef.current > 1000)) {
      setPath([...bufferRef.current]); // UI only uses circular buffer for performance
      setDistance(distanceRef.current);
      setTotalGain(totalGainRef.current);
      lastUpdateTimeRef.current = now;
      persistData();
    }
  }, [persistData]);

  // Timer Logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        
        if (Date.now() - lastLocationTimeRef.current > 8000) {
          setCurrentPace(0);
          setIsGPSSearching(true);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handlePositionUpdate = useCallback(
    (location: Location) => {
      if (!location) return;

      const { latitude, longitude, altitude, accuracy, speed, time } = location;
      const now = Date.now();
      lastLocationTimeRef.current = now;
      setIsGPSSearching(false);
      setGpsError(null);

      const currentSpeed = speed || 0;
      const pace = currentSpeed > 0.5 ? 1000 / currentSpeed : 0;
      const newPoint: GeoPoint = {
        latitude,
        longitude,
        altitude,
        timestamp: time || now,
      };

      setCurrentLocation(newPoint);
      setCurrentAccuracy(accuracy);
      setCurrentPace(pace);

      // Warning for dangerous areas (Placeholder for actual geofencing logic)
      if (accuracy > 50) {
        // Low accuracy warning
      }

      if (isRunning) {
        // Sampling Rate: 1-2 seconds (1500ms)
        if (now - lastSamplingTimeRef.current < 1500) return;
        lastSamplingTimeRef.current = now;

        const lastCoords = pathRef.current[pathRef.current.length - 1];
        const d = lastCoords 
          ? calculateDistance(lastCoords[1], lastCoords[0], latitude, longitude) 
          : 0;

        // Filter: > 5 meters and accuracy < 35m
        if (!lastCoords || (d > 0.005 && accuracy < 35)) {
          if (lastCoords && altitude !== null && currentLocation?.altitude !== null) {
            const diff = altitude - (currentLocation?.altitude || 0);
            if (diff > 0) totalGainRef.current += diff;
          }
          distanceRef.current += d;
          
          const newCoord: [number, number] = [longitude, latitude];
          pathRef.current.push(newCoord);
          
          // Manage Circular Buffer for real-time tracking (max 1000 points)
          bufferRef.current.push(newCoord);
          if (bufferRef.current.length > MAX_BUFFER_SIZE) {
            bufferRef.current.shift();
          }
          
          updateUI();
        }
      }
    },
    [isRunning, currentLocation, updateUI]
  );

  const startTracking = useCallback(async () => {
    try {
      if (watchIdRef.current) {
        await BackgroundGeolocation.removeWatcher({ id: watchIdRef.current }).catch(() => {});
      }

      watchIdRef.current = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: t.backgroundMessage || "Aplikasi sedang merekam aktivitas lari Anda",
          backgroundTitle: t.backgroundTitle || "Tracking Aktif",
          requestPermissions: true,
          stale: false,
          distanceFilter: 2, // Low distance filter to get enough points for sampling
        },
        (location, error) => {
          if (error) {
            setIsGPSSearching(true);
            if (error.code === "NOT_AUTHORIZED") {
              setGpsError(t.gpsDenied || "GPS Permission Denied");
            }
            return;
          }
          if (location) {
            requestAnimationFrame(() => handlePositionUpdate(location));
          }
        }
      );
    } catch (e: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Tracking setup failed:", e.message || e);
      }
    }
  }, [handlePositionUpdate, t]);

  useEffect(() => {
    startTracking();
    return () => {
      if (watchIdRef.current) {
        BackgroundGeolocation.removeWatcher({ id: watchIdRef.current }).catch(console.error);
      }
    };
  }, [startTracking]);

  const clearSessionData = useCallback(async () => {
    await Preferences.remove({ key: STORAGE_KEYS.CURRENT_PATH });
    await Preferences.remove({ key: STORAGE_KEYS.CURRENT_STATS });
    pathRef.current = [];
    setPath([]);
    setElapsedTime(0);
    setDistance(0);
    setTotalGain(0);
    distanceRef.current = 0;
    totalGainRef.current = 0;
    lastUpdateTimeRef.current = 0;
  }, []);

  const handleFinishRun = useCallback(async () => {
    triggerHaptic([50, 50, 150]);
    setIsRunning(false);

    const currentDistance = distanceRef.current;
    const currentPath = [...pathRef.current].map(coord => ({
      longitude: coord[0],
      latitude: coord[1],
      altitude: null,
      timestamp: Date.now()
    }));
    
    const avgPaceVal = currentDistance > 0 ? elapsedTime / currentDistance : 0;
    
    const session: RunSession = {
      id: Date.now().toString(),
      type: "Outdoor Run",
      startTime: Date.now() - elapsedTime * 1000,
      duration: elapsedTime,
      distance: currentDistance,
      path: currentPath,
      calories: Math.floor(currentDistance * 60),
      avgPace: formatPaceString(avgPaceVal),
    };

    // Save to filesystem for native persistence
    await saveRunToFile(session);

    onSessionFinish(session);
    await clearSessionData();
  }, [elapsedTime, setIsRunning, onSessionFinish, clearSessionData]);

  const confirmCancelRun = useCallback(async () => {
    setIsRunning(false);
    await clearSessionData();
  }, [setIsRunning, clearSessionData]);

  return {
    elapsedTime,
    distance,
    totalGain,
    currentPace,
    path,
    currentLocation,
    currentAccuracy,
    isGPSSearching,
    gpsError,
    handleFinishRun,
    confirmCancelRun
  };
};
