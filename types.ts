
export type Screen = 'onboarding' | 'dashboard' | 'run' | 'summary' | 'history' | 'profile' | 'workout' | 'about' | 'terms';

export type RunType = 'Free Run' | 'Interval' | 'Tempo' | 'Recovery' | 'Long Run';

export type WorkoutType = 'HIIT' | 'Strength' | 'Yoga' | 'Cardio';

export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number;
  paceZoneId?: string;
}

export interface RunSession {
  id: string;
  type: string; 
  startTime: number;
  endTime?: number;
  duration: number;
  distance: number;
  path: GeoPoint[];
  calories: number;
  avgPace: string; 
}

export interface UserPhysicalProfile {
  gender: 'male' | 'female' | 'other';
  age: number;
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  goal: 'weightloss' | 'muscle' | 'endurance' | 'health';
  hasInjury: boolean;
  injuryDetail?: string;
  frequency: number;
}

export interface WorkoutSession {
  id: string;
  type: WorkoutType;
  startTime: number;
  duration: number;
  calories: number;
  exercises: { name: string; reps: number; sets: number }[];
}

export interface ActiveSession {
    type: string;
    elapsedTime: number;
    distance: number;
    path: GeoPoint[];
    targetPace: number | null;
    selectedPresetName: string | null;
    isPaused: boolean;
}

export type Language = 'en' | 'id' | 'jp';

export type UnitSystem = 'metric' | 'imperial' | 'custom';

export interface PaceZone {
  id: string;
  name: string;
  minPace: number;
  maxPace: number;
  color: string;
}

export interface AudioCuesSettings {
    enabled: boolean;
    paceAlerts: boolean;
    distanceMilestones: boolean;
    alertFrequency: number;
}

export interface WorkoutPreset {
  id: string;
  name: string;
  type: RunType;
  targetPace?: number;
}

export interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed?: number;
  humidity?: number;
  hourly?: {
      temperature_2m: number[];
      weathercode: number[];
  }
}
