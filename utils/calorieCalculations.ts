
import { CalorieResult } from '../types';

/**
 * Menghitung BMR menggunakan rumus Mifflin-St Jeor
 */
export const calculateMifflinStJeor = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number => {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === 'female' ? base - 161 : base + 5;
};

/**
 * Menghitung BMR menggunakan rumus Harris-Benedict
 */
export const calculateHarrisBenedict = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number => {
  if (gender === 'female') {
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
  return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
};

/**
 * Faktor Aktivitas Harian
 */
export const ACTIVITY_FACTORS = {
  sedentary: 1.2,      // Minim aktivitas
  light: 1.375,        // Olahraga 1-3x/minggu
  moderate: 1.55,       // Olahraga 3-5x/minggu
  active: 1.725,       // Olahraga 6-7x/minggu
  athlete: 1.9,        // Olahraga 2x sehari / fisik sangat berat
};

/**
 * Menghitung Kalori Terbakar menggunakan METs
 * Rumus: (MET * weight * duration_hours)
 */
export const calculateMETCalories = (
  met: number,
  weight: number,
  durationMinutes: number
): number => {
  return (met * weight * (durationMinutes / 60));
};

/**
 * Daftar METs umum untuk berbagai aktivitas
 */
export const ACTIVITY_METS: Record<string, number> = {
  'Walking (Slow)': 2.0,
  'Walking (Brisk)': 3.5,
  'Running (8km/h)': 8.3,
  'Running (10km/h)': 9.8,
  'Running (12km/h)': 11.5,
  'Cycling (Leisure)': 4.0,
  'Cycling (Moderate)': 8.0,
  'Swimming (Moderate)': 5.8,
  'HIIT': 8.0,
  'Strength Training': 3.5,
  'Yoga': 2.5,
};

/**
 * Fungsi utama untuk menghitung profil kalori lengkap
 */
export const calculateCalorieProfile = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: keyof typeof ACTIVITY_FACTORS
): CalorieResult => {
  const bmrMifflin = calculateMifflinStJeor(weight, height, age, gender);
  const bmrHarris = calculateHarrisBenedict(weight, height, age, gender);
  
  // Gunakan rata-rata atau Mifflin sebagai standar TDEE
  const activityFactor = ACTIVITY_FACTORS[activityLevel];
  const tdee = bmrMifflin * activityFactor;
  
  const recommendedDeficit = {
    min: 500,
    max: 1000
  };
  
  const dailyTarget = tdee - 500; // Standar defisit 500 kkal

  return {
    bmrMifflin,
    bmrHarris,
    tdee,
    recommendedDeficit,
    dailyTarget,
    activityFactor
  };
};
