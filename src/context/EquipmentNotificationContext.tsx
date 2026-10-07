import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  EquipmentRecord,
  EquipmentAlertNotification,
  INITIAL_EQUIPMENT_DATA,
  evaluateEquipmentSafetyThresholds,
  getInitialFleetAlerts,
  playAlertChime,
} from '../services/equipmentTelemetryService';

interface EquipmentNotificationContextType {
  equipmentList: EquipmentRecord[];
  alerts: EquipmentAlertNotification[];
  activeToast: EquipmentAlertNotification | null;
  dismissToast: () => void;
  unreadCount: number;
  criticalCount: number;
  acknowledgeAlert: (alertId: string) => void;
  markAllAsRead: () => void;
  clearAllAlerts: () => void;
  simulateSensorPulse: () => void;
  simulateStressSpike: (unitCode?: string) => void;
  resetTelemetryToBaseline: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  updateEquipmentMetric: (
    equipmentId: string,
    updates: Partial<Pick<EquipmentRecord, 'vibrationMmS' | 'bearingTempC' | 'operatingHours' | 'oilParticlePpm' | 'hydraulicPressurePsi'>>
  ) => void;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  onNavigateToEquipment: (equipmentId: string) => void;
  registerNavigationHandler: (fn: (equipmentId: string) => void) => void;
}

const EquipmentNotificationContext = createContext<EquipmentNotificationContextType | undefined>(undefined);

export const EquipmentNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [equipmentList, setEquipmentList] = useState<EquipmentRecord[]>(INITIAL_EQUIPMENT_DATA);
  const [alerts, setAlerts] = useState<EquipmentAlertNotification[]>(() => getInitialFleetAlerts());
  const [activeToast, setActiveToast] = useState<EquipmentAlertNotification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [navigationHandler, setNavigationHandler] = useState<((id: string) => void) | null>(null);

  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length;

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // When a toast is triggered, auto-dismiss after 7 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true, read: true, acknowledgedAt: timeNow } : a))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Update specific equipment metrics and trigger threshold notifications if exceeded
  const updateEquipmentMetric = useCallback(
    (
      equipmentId: string,
      updates: Partial<Pick<EquipmentRecord, 'vibrationMmS' | 'bearingTempC' | 'operatingHours' | 'oilParticlePpm' | 'hydraulicPressurePsi'>>
    ) => {
      setEquipmentList((prev) => {
        const target = prev.find((e) => e.id === equipmentId);
        if (!target) return prev;

        const updated: EquipmentRecord = {
          ...target,
          ...updates,
        };

        // Check for new threshold violations
        const newViolations = evaluateEquipmentSafetyThresholds(updated);

        if (newViolations.length > 0) {
          setAlerts((currAlerts) => {
            const existingIds = new Set(currAlerts.map((a) => a.id));
            const fresh = newViolations.filter((v) => !existingIds.has(v.id));

            if (fresh.length > 0) {
              const highestAlert = fresh[0];
              setActiveToast(highestAlert);
              if (soundEnabled) {
                playAlertChime(highestAlert.severity);
              }
              return [...fresh, ...currAlerts];
            }
            return currAlerts;
          });
        }

        return prev.map((e) => (e.id === equipmentId ? updated : e));
      });
    },
    [soundEnabled]
  );

  // Simulates real-time sensor jitter/tick across the fleet
  const simulateSensorPulse = useCallback(() => {
    const targetIdx = Math.floor(Math.random() * equipmentList.length);
    const target = equipmentList[targetIdx];
    if (!target) return;

    // Small telemetry shift (+/- jitter)
    const vibJitter = Number(((Math.random() - 0.45) * 0.4).toFixed(2));
    const newVib = Math.max(1.5, Number((target.vibrationMmS + vibJitter).toFixed(1)));
    const tempJitter = Math.floor((Math.random() - 0.4) * 3);
    const newTemp = Math.max(50, target.bearingTempC + tempJitter);

    updateEquipmentMetric(target.id, {
      vibrationMmS: newVib,
      bearingTempC: newTemp,
    });
  }, [equipmentList, updateEquipmentMetric]);

  // Simulates an immediate severe stress event (e.g. bearing thermal surge or high vibration spike)
  const simulateStressSpike = useCallback(
    (unitCode?: string) => {
      const target = unitCode
        ? equipmentList.find((e) => e.unitCode === unitCode) || equipmentList[0]
        : equipmentList[Math.floor(Math.random() * equipmentList.length)];

      if (!target) return;

      // Spike vibration or temperature above safe threshold
      const shouldSpikeVib = Math.random() > 0.5;
      const spikeVib = shouldSpikeVib
        ? Number((target.vibrationThreshold * 1.45 + Math.random() * 1.5).toFixed(1))
        : target.vibrationMmS;
      const spikeTemp = !shouldSpikeVib
        ? target.bearingTempThreshold + 12 + Math.floor(Math.random() * 8)
        : target.bearingTempC;
      const spikeOil = target.oilParticlePpm + 18;

      updateEquipmentMetric(target.id, {
        vibrationMmS: spikeVib,
        bearingTempC: spikeTemp,
        oilParticlePpm: spikeOil,
      });
    },
    [equipmentList, updateEquipmentMetric]
  );

  // Reset to initial baseline data
  const resetTelemetryToBaseline = useCallback(() => {
    setEquipmentList(INITIAL_EQUIPMENT_DATA);
    setAlerts(getInitialFleetAlerts());
    setActiveToast(null);
  }, []);

  const registerNavigationHandler = useCallback((fn: (id: string) => void) => {
    setNavigationHandler(() => fn);
  }, []);

  const onNavigateToEquipment = useCallback(
    (equipmentId: string) => {
      if (navigationHandler) {
        navigationHandler(equipmentId);
      }
      setIsNotificationCenterOpen(false);
      setActiveToast(null);
    },
    [navigationHandler]
  );

  return (
    <EquipmentNotificationContext.Provider
      value={{
        equipmentList,
        alerts,
        activeToast,
        dismissToast,
        unreadCount,
        criticalCount,
        acknowledgeAlert,
        markAllAsRead,
        clearAllAlerts,
        simulateSensorPulse,
        simulateStressSpike,
        resetTelemetryToBaseline,
        soundEnabled,
        setSoundEnabled,
        updateEquipmentMetric,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
        onNavigateToEquipment,
        registerNavigationHandler,
      }}
    >
      {children}
    </EquipmentNotificationContext.Provider>
  );
};

const defaultFallbackContext: EquipmentNotificationContextType = {
  equipmentList: INITIAL_EQUIPMENT_DATA,
  alerts: [],
  activeToast: null,
  dismissToast: () => {},
  unreadCount: 0,
  criticalCount: 0,
  acknowledgeAlert: () => {},
  markAllAsRead: () => {},
  clearAllAlerts: () => {},
  simulateSensorPulse: () => {},
  simulateStressSpike: () => {},
  resetTelemetryToBaseline: () => {},
  soundEnabled: false,
  setSoundEnabled: () => {},
  updateEquipmentMetric: () => {},
  isNotificationCenterOpen: false,
  setIsNotificationCenterOpen: () => {},
  onNavigateToEquipment: () => {},
  registerNavigationHandler: () => {},
};

export const useEquipmentNotifications = () => {
  const context = useContext(EquipmentNotificationContext);
  if (!context) {
    console.warn('useEquipmentNotifications accessed outside of EquipmentNotificationProvider, using safe fallback.');
    return defaultFallbackContext;
  }
  return context;
};
