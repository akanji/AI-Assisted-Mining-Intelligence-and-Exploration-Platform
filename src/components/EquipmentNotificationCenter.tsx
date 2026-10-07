import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Flame,
  Activity,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  Zap,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Sliders,
  Filter,
  ArrowUpRight,
  ExternalLink,
  Cpu,
  Clock,
  Radio,
  Hourglass,
} from 'lucide-react';
import { useEquipmentNotifications } from '../context/EquipmentNotificationContext';
import { EquipmentLifeExpectancyWidget } from './EquipmentLifeExpectancyWidget';

export const EquipmentNotificationCenter: React.FC = () => {
  const {
    equipmentList,
    alerts,
    unreadCount,
    criticalCount,
    activeToast,
    dismissToast,
    acknowledgeAlert,
    markAllAsRead,
    clearAllAlerts,
    simulateSensorPulse,
    simulateStressSpike,
    resetTelemetryToBaseline,
    soundEnabled,
    setSoundEnabled,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    onNavigateToEquipment,
  } = useEquipmentNotifications();

  const [activePanelTab, setActivePanelTab] = useState<'ALERTS' | 'LIFE_EXPECTANCY'>('ALERTS');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'UNACK'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationCenterOpen(false);
      }
    }
    if (isNotificationCenterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationCenterOpen, setIsNotificationCenterOpen]);

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity === 'CRITICAL') return alert.severity === 'CRITICAL';
    if (filterSeverity === 'UNACK') return !alert.acknowledged;
    return true;
  });

  return (
    <>
      {/* Top Header Notification Bell Trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          id="btn-top-equipment-notifications"
          onClick={() => {
            setIsNotificationCenterOpen(!isNotificationCenterOpen);
            if (!isNotificationCenterOpen) {
              markAllAsRead();
            }
          }}
          className={`p-2 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center ${
            criticalCount > 0
              ? 'bg-rose-950/90 text-rose-300 border border-rose-500 hover:bg-rose-900 shadow-md shadow-rose-950/50'
              : unreadCount > 0
              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/50 hover:bg-amber-900'
              : 'bg-stone-800/80 text-stone-300 border border-stone-700/60 hover:bg-stone-700 hover:text-white'
          }`}
          title="Equipment Wear & Safety Threshold Notifications"
        >
          <Bell size={16} className={criticalCount > 0 ? 'animate-bounce text-rose-400' : ''} />

          {/* Badge Counter */}
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-extrabold flex items-center justify-center min-w-[18px] h-[18px] shadow-md border ${
                criticalCount > 0
                  ? 'bg-rose-500 text-white border-rose-300 animate-pulse'
                  : 'bg-amber-500 text-stone-950 border-amber-300'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Notification Center Panel */}
        {isNotificationCenterOpen && (
          <div
            id="equipment-notification-panel"
            className="absolute right-0 mt-2 w-[350px] sm:w-[480px] md:w-[520px] max-h-[88vh] rounded-2xl bg-[#1C100B] border-2 border-amber-500/60 shadow-2xl z-50 flex flex-col overflow-hidden text-xs backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Notification Center Header */}
            <div className="p-3.5 bg-gradient-to-r from-stone-900 to-[#2A1810] border-b border-amber-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Cpu size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-white text-xs font-['Space_Grotesk'] tracking-tight">
                      Equipment Wear &amp; Safety Alarms
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <p className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                    <span>Live SCADA Telemetry Guard</span>
                    <span>•</span>
                    <span className="text-amber-300">{alerts.length} Total Alerts</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Audio chime toggle */}
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    soundEnabled
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-stone-800 text-stone-500 border-stone-700'
                  }`}
                  title={soundEnabled ? 'Audio Chime Enabled' : 'Audio Chime Muted'}
                >
                  {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsNotificationCenterOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Primary Panel Mode Tabs (Alerts vs Life Expectancy Widget) */}
            <div className="px-3 pt-2 bg-black/60 border-b border-stone-800 flex items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                id="btn-tab-panel-alerts"
                onClick={() => setActivePanelTab('ALERTS')}
                className={`px-3 py-1.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 ${
                  activePanelTab === 'ALERTS'
                    ? 'bg-[#1C100B] text-amber-300 border-t-2 border-x border-amber-500/60 shadow'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                }`}
              >
                <Bell size={13} className={criticalCount > 0 ? 'text-rose-400' : ''} />
                <span>Live Alarms ({alerts.length})</span>
                {criticalCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                id="btn-toggle-life-expectancy-widget"
                onClick={() => setActivePanelTab('LIFE_EXPECTANCY')}
                className={`px-3 py-1.5 rounded-t-xl font-bold transition-all flex items-center gap-1.5 ${
                  activePanelTab === 'LIFE_EXPECTANCY'
                    ? 'bg-[#1C100B] text-amber-300 border-t-2 border-x border-amber-500/60 shadow'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/40'
                }`}
              >
                <Hourglass size={13} className="text-amber-400" />
                <span>Life Expectancy AI</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  Forecast
                </span>
              </button>
            </div>

            {activePanelTab === 'LIFE_EXPECTANCY' ? (
              <div className="flex-1 overflow-y-auto max-h-[540px] p-2 space-y-2">
                <EquipmentLifeExpectancyWidget
                  equipmentList={equipmentList}
                  onNavigateToEquipment={onNavigateToEquipment}
                />
              </div>
            ) : (
              <>
                {/* Live Telemetry Simulation Control Bar */}
                <div className="px-3.5 py-2 bg-black/40 border-b border-stone-800 flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-stone-400 font-medium flex items-center gap-1">
                    <Radio size={12} className="text-emerald-400 animate-pulse" />
                    <span>Simulate Sensor Feeds:</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={simulateSensorPulse}
                      className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold border border-stone-700 flex items-center gap-1"
                      title="Simulate random sensor vibration/thermal jitter"
                    >
                      <Activity size={11} className="text-amber-400" />
                      <span>Jitter Tick</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => simulateStressSpike()}
                      className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-[10px] font-extrabold border border-rose-700 flex items-center gap-1 animate-pulse"
                      title="Inject a high-vibration/thermal threshold breach event"
                    >
                      <Zap size={11} className="text-rose-300" />
                      <span>Stress Spike</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetTelemetryToBaseline}
                      className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700"
                      title="Reset fleet telemetry to nominal baseline"
                    >
                      <RotateCcw size={11} />
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="px-3.5 py-1.5 bg-stone-900/60 border-b border-stone-800/80 flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFilterSeverity('ALL')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        filterSeverity === 'ALL'
                          ? 'bg-amber-500 text-stone-950 font-extrabold'
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      All ({alerts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterSeverity('CRITICAL')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        filterSeverity === 'CRITICAL'
                          ? 'bg-rose-500 text-white font-extrabold'
                          : 'text-rose-400 hover:text-rose-200'
                      }`}
                    >
                      Critical ({alerts.filter((a) => a.severity === 'CRITICAL').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterSeverity('UNACK')}
                      className={`px-2 py-0.5 rounded transition-all ${
                        filterSeverity === 'UNACK'
                          ? 'bg-yellow-500 text-stone-950 font-extrabold'
                          : 'text-yellow-400 hover:text-yellow-200'
                      }`}
                    >
                      Pending ({alerts.filter((a) => !a.acknowledged).length})
                    </button>
                  </div>

                  {alerts.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllAlerts}
                      className="text-stone-500 hover:text-stone-300 text-[10px] underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Alert List View */}
                <div className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-stone-800/60 p-2 space-y-1.5">
                  {filteredAlerts.length === 0 ? (
                    <div className="p-8 text-center space-y-2 text-stone-400">
                      <ShieldCheck size={32} className="mx-auto text-emerald-400 opacity-80" />
                      <p className="font-semibold text-xs text-stone-200">All Equipment Metrics Within Safe Limits</p>
                      <p className="text-[11px] text-stone-500">
                        No active mechanical threshold breaches in the selected filter view.
                      </p>
                    </div>
                  ) : (
                    filteredAlerts.map((alert) => {
                      const isCritical = alert.severity === 'CRITICAL';
                      const isHigh = alert.severity === 'HIGH';

                      return (
                        <div
                          key={alert.id}
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            alert.acknowledged
                              ? 'bg-stone-900/40 border-stone-800/60 opacity-75'
                              : isCritical
                              ? 'bg-gradient-to-br from-rose-950/60 to-stone-900 border-rose-500/60 shadow-lg'
                              : isHigh
                              ? 'bg-gradient-to-br from-amber-950/50 to-stone-900 border-amber-500/50'
                              : 'bg-stone-900/70 border-stone-800'
                          }`}
                        >
                          {/* Alert Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black border ${
                                  isCritical
                                    ? 'bg-rose-500/25 text-rose-300 border-rose-500/60 animate-pulse'
                                    : isHigh
                                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                                }`}
                              >
                                {alert.severity}
                              </span>

                              <span className="font-extrabold text-white text-xs font-['Space_Grotesk']">
                                {alert.unitCode}
                              </span>

                              <span className="text-[10px] text-stone-400 truncate max-w-[140px]">
                                {alert.equipmentName}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-stone-400 flex-shrink-0 flex items-center gap-1">
                              <Clock size={10} />
                              <span>{alert.timestamp}</span>
                            </span>
                          </div>

                          {/* Threshold Violation Value Pill */}
                          <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-lg border border-stone-800 text-[11px] font-mono">
                            <span className="text-stone-400">{alert.metricName}:</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-black ${
                                  isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-yellow-300'
                                }`}
                              >
                                {alert.currentValue} {alert.unit}
                              </span>
                              <span className="text-stone-500 text-[10px]">
                                (Safe Limit: {alert.thresholdValue} {alert.unit})
                              </span>
                            </div>
                          </div>

                          {/* Message and Action */}
                          <p className="text-[11px] text-stone-300 leading-snug">{alert.message}</p>

                          <div className="p-2 rounded bg-stone-950/80 border border-stone-800/80 text-[10px] text-amber-200/90 font-mono">
                            <strong className="text-amber-400 uppercase">Prescribed Action: </strong>
                            {alert.actionSuggested}
                          </div>

                          {/* Card Action Buttons */}
                          <div className="pt-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 text-[10px] text-stone-400">
                              <span>{alert.assignedZone}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {!alert.acknowledged ? (
                                <button
                                  type="button"
                                  onClick={() => acknowledgeAlert(alert.id)}
                                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold transition-colors flex items-center gap-1"
                                >
                                  <CheckCircle2 size={11} className="text-emerald-400" />
                                  <span>Acknowledge</span>
                                </button>
                              ) : (
                                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 size={11} />
                                  <span>Ack at {alert.acknowledgedAt}</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => onNavigateToEquipment(alert.equipmentId)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] font-black transition-colors flex items-center gap-1 shadow"
                              >
                                <span>Inspect</span>
                                <ArrowUpRight size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Notification Center Bottom Footer */}
                <div className="p-2.5 bg-stone-950 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                  <span className="text-[10px]">Threshold standard: ISO 10816-3</span>
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-amber-400 hover:text-amber-300 font-bold text-[10px]"
                  >
                    Mark all read
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Real-time Floating Popup Toast Notification */}
      {activeToast && (
        <div
          id="realtime-equipment-toast"
          className="fixed bottom-6 right-6 z-50 max-w-md w-full rounded-2xl bg-[#1C100B]/95 border-2 border-rose-500 p-4 shadow-2xl backdrop-blur-xl text-xs space-y-2.5 animate-in slide-in-from-bottom-5 duration-300 ring-4 ring-rose-500/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 animate-bounce">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px] font-black tracking-wider uppercase animate-pulse">
                    THRESHOLD EXCEEDED
                  </span>
                  <span className="font-extrabold text-white font-['Space_Grotesk'] text-sm">
                    {activeToast.unitCode}
                  </span>
                </div>
                <p className="text-stone-300 text-xs font-semibold mt-0.5">{activeToast.equipmentName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissToast}
              className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-2 rounded-xl bg-black/60 border border-stone-800 font-mono text-[11px] flex items-center justify-between">
            <span className="text-stone-400">{activeToast.metricName}:</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-rose-400">
                {activeToast.currentValue} {activeToast.unit}
              </span>
              <span className="text-stone-500">/ Limit: {activeToast.thresholdValue} {activeToast.unit}</span>
            </div>
          </div>

          <p className="text-stone-200 text-[11px] leading-relaxed">{activeToast.message}</p>

          <div className="pt-1 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                acknowledgeAlert(activeToast.id);
                dismissToast();
              }}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Acknowledge</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateToEquipment(activeToast.equipmentId);
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-extrabold text-xs shadow-lg flex items-center gap-1.5 transition-all"
            >
              <span>Inspect Equipment &amp; LOTO</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
