import { useState, useEffect, useCallback } from "react";
import { WeatherData, GeoPoint, Language } from "../types";
import { storage } from "../utils/secureStorage";

/**
 * Custom hook to manage weather data fetching and caching.
 * @param language - Current app language for reverse geocoding.
 * @param isOnline - Current network status.
 * @param isStable - Stability of the network connection.
 * @param isInitialLoad - Whether the app is in its initial loading phase.
 * @param isRefreshing - Whether a global refresh is in progress.
 */
export const useWeather = (
  language: Language,
  isOnline: boolean,
  isStable: boolean,
  isInitialLoad: boolean,
  isRefreshing: boolean
) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const fetchWeather = useCallback(
    async (lat: number, lon: number) => {
      // Only skip if we're already loading and it's NOT the initial load or a refresh
      if (isWeatherLoading && !isInitialLoad && !isRefreshing) return;
      
      setIsWeatherLoading(true);
      
      // Load cached weather if available and offline or unstable
      if (!isOnline || !isStable) {
        try {
          const cachedWeather = await storage.get("cachedWeather");
          if (cachedWeather) {
            console.log("[Weather] Using cached data (Offline/Unstable)");
            setWeather(cachedWeather);
          }
        } catch (e) {
          console.error("[Weather] Failed to load cached weather:", e);
        } finally {
          setIsWeatherLoading(false);
        }
        return;
      }
      
      setIsWeatherLoading(true);
      try {
        const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 8000) => {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeout);
          try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
          } catch (e) {
            clearTimeout(id);
            throw e;
          }
        };

        const [weatherRes, geoRes] = await Promise.all([
          fetchWithTimeout(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
          ),
          fetchWithTimeout(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
            { headers: { "Accept-Language": language } }
          ),
        ]);

        const weatherData = await weatherRes.json();
        const geoData = await geoRes.json();

        if (weatherData && weatherData.current_weather) {
          const address = geoData.address || {};
          const cityName =
            address.city ||
            address.town ||
            address.village ||
            address.suburb ||
            address.county ||
            "Unknown Location";

          const newWeather = {
            temperature: weatherData.current_weather.temperature,
            weathercode: weatherData.current_weather.weathercode,
            windspeed: weatherData.current_weather.windspeed,
            locationName: cityName,
          };
          
          setWeather(newWeather);
          // Save to cache
          await storage.set("cachedWeather", newWeather);
        }
      } catch (error) {
        console.error("Gagal mengambil data cuaca atau lokasi:", error);
      } finally {
        setIsWeatherLoading(false);
      }
    },
    [isWeatherLoading, isInitialLoad, language, isOnline, isStable, isRefreshing]
  );

  return { weather, setWeather, isWeatherLoading, setIsWeatherLoading, fetchWeather };
};
