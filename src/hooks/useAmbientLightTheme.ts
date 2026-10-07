import { useState, useEffect, useCallback, useRef } from 'react';

export interface AmbientLightState {
  isMobile: boolean;
  darkMode: boolean;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleDarkMode: () => void;
  ambientLux: number | null;
  sensorAvailable: boolean;
  autoAmbientEnabled: boolean;
  setAutoAmbientEnabled: (enabled: boolean) => void;
  simulateLux: (lux: number) => void;
  lightCondition: 'dark_subterranean' | 'indoor_coreshed' | 'bright_sunlight';
}

// System Ambient Light Threshold:
// < 50 lux: Dim/Underground Mine/Night -> Dark Mode active
// >= 50 lux: Daylight/Open Pit/High ambient -> Light Mode active for maximum outdoor screen legibility
const LUX_DARK_THRESHOLD = 50;

export function useAmbientLightTheme(isMobileSimulator: boolean = false): AmbientLightState {
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    // Check initial document state or localStorage
    const saved = localStorage.getItem('mineai_theme');
    if (saved !== null) return saved === 'dark';
    return true; // default dark for mining command center
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isNarrow = window.innerWidth < 1024;
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent);
    return isMobileSimulator || isNarrow || (isTouch && isNarrow) || isMobileUA;
  });

  const [ambientLux, setAmbientLux] = useState<number | null>(null);
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(false);
  const [autoAmbientEnabled, setAutoAmbientEnabled] = useState<boolean>(true);

  // Keep a ref to track whether mobile mode is active
  const isMobileRef = useRef<boolean>(isMobile);
  useEffect(() => {
    isMobileRef.current = isMobile || isMobileSimulator;
  }, [isMobile, isMobileSimulator]);

  // Detect mobile vs desktop screen changes
  useEffect(() => {
    const checkMobile = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNarrow = window.innerWidth < 1024;
      const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(navigator.userAgent);
      const mobileActive = isMobileSimulator || isNarrow || (isTouch && isNarrow) || isMobileUA;
      setIsMobile(mobileActive);
    };

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobileSimulator]);

  // Synchronize 'dark' CSS class on document.documentElement (<html class="dark">)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (darkMode) {
        root.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      localStorage.setItem('mineai_theme', darkMode ? 'dark' : 'light');
    }
  }, [darkMode]);

  // Ambient Light Sensor API Integration for Mobile
  useEffect(() => {
    // Only engage automatic ambient light sensor switching on Mobile
    if (!isMobile && !isMobileSimulator) {
      return;
    }

    if (!autoAmbientEnabled) {
      return;
    }

    let sensorInstance: any = null;
    let isDisposed = false;

    // Helper to evaluate and apply lux to dark class
    const handleLuxReading = (lux: number) => {
      if (isDisposed) return;
      setAmbientLux(Math.round(lux));

      // Automated toggle based on system ambient light sensor:
      // In underground mine adits or dim conditions (< 50 lux), toggle dark mode ON
      // In bright daylight or outdoor open-pit (> 50 lux), toggle light mode ON (remove dark class)
      const shouldBeDark = lux < LUX_DARK_THRESHOLD;
      setDarkModeState(shouldBeDark);
    };

    // 1. Try standard W3C AmbientLightSensor (Generic Sensor API)
    if (typeof window !== 'undefined' && 'AmbientLightSensor' in window) {
      try {
        const AmbientSensor = (window as any).AmbientLightSensor;
        const sensor = new AmbientSensor({ frequency: 1 });

        sensor.addEventListener('reading', () => {
          if (typeof sensor.illuminance === 'number') {
            setSensorAvailable(true);
            handleLuxReading(sensor.illuminance);
          }
        });

        sensor.addEventListener('error', (event: any) => {
          console.warn('[AmbientLightSensor] Sensor hardware notification:', event.error?.name);
          setSensorAvailable(false);
        });

        sensor.start();
        sensorInstance = sensor;
        setSensorAvailable(true);
      } catch (err) {
        console.warn('[AmbientLightSensor] Initialization catch:', err);
      }
    }

    // 2. Try legacy devicelight event (Firefox on mobile / Android webviews)
    const handleDeviceLight = (event: any) => {
      if (typeof event.value === 'number') {
        setSensorAvailable(true);
        handleLuxReading(event.value);
      }
    };
    window.addEventListener('devicelight', handleDeviceLight);

    // 3. Fallback: If hardware sensor is not physically present, check system color scheme
    if (!sensorInstance) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleMediaChange = (e: MediaQueryListEvent) => {
        if (autoAmbientEnabled && (isMobileRef.current || isMobileSimulator)) {
          setDarkModeState(e.matches);
          setAmbientLux(e.matches ? 20 : 600);
        }
      };

      try {
        mediaQuery.addEventListener('change', handleMediaChange);
      } catch {
        // Safari fallback
        mediaQuery.addListener(handleMediaChange);
      }

      // Initialize initial ambient estimation if null
      if (ambientLux === null) {
        setAmbientLux(mediaQuery.matches ? 25 : 450);
      }

      return () => {
        isDisposed = true;
        window.removeEventListener('devicelight', handleDeviceLight);
        try {
          mediaQuery.removeEventListener('change', handleMediaChange);
        } catch {
          mediaQuery.removeListener(handleMediaChange);
        }
      };
    }

    return () => {
      isDisposed = true;
      if (sensorInstance) {
        try {
          sensorInstance.stop();
        } catch {
          // ignore
        }
      }
      window.removeEventListener('devicelight', handleDeviceLight);
    };
  }, [isMobile, isMobileSimulator, autoAmbientEnabled]);

  // Manual Toggle function for Desktop (and manual override on Mobile)
  const toggleDarkMode = useCallback(() => {
    // If user manually toggles on mobile, we disable auto ambient lock for user convenience
    if (isMobile || isMobileSimulator) {
      setAutoAmbientEnabled(false);
    }
    setDarkModeState((prev) => !prev);
  }, [isMobile, isMobileSimulator]);

  const setDarkMode = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setDarkModeState(value);
  }, []);

  // Simulator helper for testing ambient light changes in the field
  const simulateLux = useCallback((lux: number) => {
    setAmbientLux(lux);
    setAutoAmbientEnabled(true);
    const shouldBeDark = lux < LUX_DARK_THRESHOLD;
    setDarkModeState(shouldBeDark);
  }, []);

  const lightCondition: 'dark_subterranean' | 'indoor_coreshed' | 'bright_sunlight' =
    (ambientLux ?? (darkMode ? 15 : 500)) < LUX_DARK_THRESHOLD
      ? 'dark_subterranean'
      : (ambientLux ?? 500) < 1000
      ? 'indoor_coreshed'
      : 'bright_sunlight';

  return {
    isMobile,
    darkMode,
    setDarkMode,
    toggleDarkMode,
    ambientLux,
    sensorAvailable,
    autoAmbientEnabled,
    setAutoAmbientEnabled,
    simulateLux,
    lightCondition,
  };
}
