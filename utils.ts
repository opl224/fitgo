import { UnitSystem } from "./types";

export const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const formatPaceString = (seconds: number) => {
  const pMin = Math.floor(seconds / 60);
  const pSec = Math.floor(seconds % 60);
  return `${pMin}'${pSec.toString().padStart(2, "0")}"`;
};

export const getDistanceDisplay = (
  km: number,
  system: UnitSystem,
  customUnit?: string
) => {
  if (system === "custom" && customUnit) {
    return { value: km.toFixed(2), unit: customUnit };
  }
  if (system === "imperial") {
    return { value: (km * 0.621371).toFixed(2), unit: "mi" };
  }
  return { value: km.toFixed(2), unit: "km" };
};

export const getPaceDisplay = (secondsPerKm: number, system: UnitSystem) => {
  const unit = system === "imperial" ? "/mi" : "/km";
  if (secondsPerKm === 0 || !isFinite(secondsPerKm) || secondsPerKm > 3600)
    return { value: "-'-\"", unit };

  if (system === "imperial") {
    const secondsPerMile = secondsPerKm * 1.60934;
    return { value: formatPaceString(secondsPerMile), unit };
  }
  return { value: formatPaceString(secondsPerKm), unit };
};

export const getAltitudeDisplay = (
  meters: number | null,
  system: UnitSystem,
  customUnit?: string
) => {
  const defaultUnit = system === "imperial" ? "ft" : "m";
  if (meters === null)
    return {
      value: "--",
      unit: system === "custom" ? customUnit || defaultUnit : defaultUnit,
    };

  if (system === "custom" && customUnit) {
    return { value: Math.round(meters).toString(), unit: customUnit };
  }
  if (system === "imperial") {
    return { value: Math.round(meters * 3.28084).toString(), unit: "ft" };
  }
  return { value: Math.round(meters).toString(), unit: "m" };
};

export const getSpeedDisplay = (secondsPerKm: number, system: UnitSystem) => {
  if (secondsPerKm <= 0 || !isFinite(secondsPerKm))
    return { value: "0.0", unit: system === "imperial" ? "mph" : "km/h" };

  if (system === "imperial") {
    const kmh = 3600 / secondsPerKm;
    return { value: (kmh * 0.621371).toFixed(1), unit: "mph" };
  }
  const kmh = 3600 / secondsPerKm;
  return { value: kmh.toFixed(1), unit: "km/h" };
};

export const parsePaceString = (paceStr: string): number => {
  const parts = paceStr.split(":");
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return 0;
};

export const truncate = (s: string, max = 9) => {
  if (!s) return s;
  return s.length > max ? s.slice(0, max) + "…" : s;
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371; // Radius bumi dalam KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const triggerHaptic = (pattern: number | number[] = 50) => {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};
