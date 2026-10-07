import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Wrench,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Zap,
  Flame,
  Droplets,
  HardHat,
  Sliders,
  Sparkles,
  ChevronRight,
  FileText,
  RotateCcw,
  Check,
  X,
  Gauge,
  Info,
  Layers,
  ArrowRight,
  ExternalLink,
  Cpu,
  Bell,
} from 'lucide-react';
import {
  EquipmentRecord,
  MaintenanceUrgency,
  HistoricalTelemetryPoint,
} from '../services/equipmentTelemetryService';
import { useEquipmentNotifications } from '../context/EquipmentNotificationContext';

export type { MaintenanceUrgency, HistoricalTelemetryPoint, EquipmentRecord };

export const PredictiveMaintenanceModule: React.FC = () => {
  const {
    equipmentList,
    updateEquipmentMetric,
    simulateStressSpike,
    registerNavigationHandler,
    alerts,
    criticalCount,
    setIsNotificationCenterOpen,
  } = useEquipmentNotifications();

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(equipmentList[0]?.id || 'eq-lhd-01');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dutyIntensityMultiplier, setDutyIntensityMultiplier] = useState<number>(1.0); // 1.0 = Normal, 1.25 = Heavy Production, 1.5 = Severe Rock Stress
  const [safetyIncidentWeight, setSafetyIncidentWeight] = useState<number>(1.2);
  const [dispatchedOrders, setDispatchedOrders] = useState<Record<string, { orderId: string; date: string; technician: string }>>({});
  const [showWorkOrderModal, setShowWorkOrderModal] = useState<boolean>(false);
  const [modalEquipment, setModalEquipment] = useState<EquipmentRecord | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const moduleContainerRef = useRef<HTMLDivElement>(null);

  // Sync selected equipment with current list state
  const selectedEquipment = useMemo(() => {
    return equipmentList.find((e) => e.id === selectedEquipmentId) || equipmentList[0];
  }, [equipmentList, selectedEquipmentId]);

  // Register navigation handler so clicking from the top bar notification navigates and selects the target equipment
  useEffect(() => {
    registerNavigationHandler((targetId: string) => {
      setSelectedEquipmentId(targetId);
      if (moduleContainerRef.current) {
        moduleContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [registerNavigationHandler]);

  // Predictive Maintenance Calculation Logic
  // Combines Weibull cumulative wear, vibration severity ratio, thermal delta, and safety incident frequency
  const calculatePredictiveMetrics = (eq: EquipmentRecord) => {
    // 1. Wear ratio based on operating hours vs MTBF, scaled by duty intensity
    const hoursRatio = (eq.operatingHours / eq.mtbfHours) * dutyIntensityMultiplier;
    
    // 2. Vibration severity ratio
    const vibRatio = eq.vibrationMmS / eq.vibrationThreshold;

    // 3. Thermal stress ratio
    const tempDeltaRatio = Math.max(1, (eq.bearingTempC - 60) / (eq.bearingTempThreshold - 60));

    // 4. Safety incident risk factor (historical near misses and mechanical safety events)
    const safetyRiskFactor = 1 + (eq.historicalSafetyIncidentsCount * 0.12 * safetyIncidentWeight);

    // 5. Composite Risk Score (0 - 100)
    const baseScore = (hoursRatio * 35) + (vibRatio * 35) + (tempDeltaRatio * 15) + ((eq.oilParticlePpm / 100) * 15);
    const weightedScore = Math.min(100, Math.round(baseScore * safetyRiskFactor * 0.72));

    // 6. Remaining Useful Life (RUL) in operating hours
    const baselineRul = Math.max(0, eq.mtbfHours - eq.operatingHours);
    const stressPenalty = Math.max(1, (vibRatio * 0.4 + tempDeltaRatio * 0.3 + (safetyRiskFactor - 1)));
    const predictedRulHours = Math.round(Math.max(12, baselineRul / (stressPenalty * dutyIntensityMultiplier)));

    // 7. Recommended Maintenance Window
    let urgency: MaintenanceUrgency = 'Routine (30d+)';
    let urgencyColor = 'text-emerald-400';
    let urgencyBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    let recommendedSchedule = 'Routine scheduled overhaul at 30-day turnaround';

    if (weightedScore >= 78 || predictedRulHours < 100) {
      urgency = 'Critical (Within 48h)';
      urgencyColor = 'text-rose-400 font-extrabold';
      urgencyBadge = 'bg-rose-500/25 text-rose-200 border-rose-500/50 animate-pulse';
      recommendedSchedule = 'Immediate stop-work isolation & overhaul within 48 hours';
    } else if (weightedScore >= 60 || predictedRulHours < 350) {
      urgency = 'High (Within 7d)';
      urgencyColor = 'text-amber-400 font-bold';
      urgencyBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      recommendedSchedule = 'Priority maintenance window within 7 working days';
    } else if (weightedScore >= 40 || predictedRulHours < 750) {
      urgency = 'Moderate (14-21d)';
      urgencyColor = 'text-yellow-400';
      urgencyBadge = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      recommendedSchedule = 'Schedule service during upcoming bi-weekly stope turnaround (14-21d)';
    }

    return {
      riskScore: weightedScore,
      predictedRulHours,
      urgency,
      urgencyColor,
      urgencyBadge,
      recommendedSchedule,
      failureProbabilityPct: Math.min(96, Math.round(weightedScore * 0.94)),
    };
  };

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter((eq) => {
      if (categoryFilter === 'all') return true;
      return eq.category === categoryFilter;
    });
  }, [equipmentList, categoryFilter]);

  // Aggregate fleet predictive statistics
  const fleetSummary = useMemo(() => {
    let criticalCount = 0;
    let highCount = 0;
    let totalAvoidanceUSD = 0;
    let totalPendingLaborHours = 0;

    equipmentList.forEach((eq) => {
      const metrics = calculatePredictiveMetrics(eq);
      if (metrics.urgency === 'Critical (Within 48h)') criticalCount++;
      if (metrics.urgency === 'High (Within 7d)') highCount++;
      totalAvoidanceUSD += eq.estimatedCostAvoidanceUSD;
      totalPendingLaborHours += eq.estimatedLaborHours;
    });

    return {
      totalMonitored: equipmentList.length,
      criticalCount,
      highCount,
      totalAvoidanceUSD,
      totalPendingLaborHours,
    };
  }, [equipmentList, dutyIntensityMultiplier, safetyIncidentWeight]);

  const handleDispatchWorkOrder = (eq: EquipmentRecord) => {
    const orderId = `WO-PM-${Math.floor(10000 + Math.random() * 90000)}`;
    const technicians = [
      'Marcus Vance (Lead Millwright)',
      'Elena Rostova (Hydraulic Specialist)',
      'Carlos Mendez (Instrumentation Tech)',
      'Devon Keith (Reliability Engineer)',
    ];
    const tech = technicians[Math.floor(Math.random() * technicians.length)];
    const today = new Date().toISOString().split('T')[0];

    setDispatchedOrders((prev) => ({
      ...prev,
      [eq.id]: { orderId, date: today, technician: tech },
    }));

    setNotificationMsg(
      `WORK ORDER ${orderId} DISPATCHED for ${eq.unitCode} (${eq.name}). Lockout protocol initiated. Assigned: ${tech}.`
    );

    setTimeout(() => {
      setNotificationMsg(null);
    }, 6000);
  };

  return (
    <div
      ref={moduleContainerRef}
      id="predictive-maintenance-module"
      className="rounded-2xl bg-[#1C100B]/90 border border-amber-900/60 p-5 space-y-6 shadow-2xl backdrop-blur-md"
    >
      {/* Module Title & Overview Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-900/40 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-600/20 text-amber-400 border border-amber-500/30">
            <Cpu size={22} className="text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
                Predictive Maintenance &amp; Equipment Safety Analytics
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                Weibull Hazard Modeling v3.4
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sensor Telemetry
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1 max-w-3xl">
              Synthesizes real-time operating hours, mechanical vibration spectrography, thermal gradient shifts, and historical near-miss safety logs to prescribe optimal maintenance windows before catastrophic component failure.
            </p>
          </div>
        </div>

        {/* Fleet Status Snapshot Pills */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <button
            type="button"
            onClick={() => setIsNotificationCenterOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 flex items-center gap-2 transition-all cursor-pointer"
            title="Click to view real-time equipment safety threshold alarms"
          >
            <Bell size={13} className="text-rose-400 animate-pulse" />
            <span className="text-stone-300 text-[11px]">Active Alarms:</span>
            <span className="font-extrabold text-rose-300 text-sm">{criticalCount} Critical</span>
          </button>
          <div className="px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center gap-2">
            <span className="text-stone-400 text-[11px]">High Priority:</span>
            <span className="font-extrabold text-amber-400 text-sm">{fleetSummary.highCount} Units</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center gap-2">
            <span className="text-stone-400 text-[11px]">Cost Avoidance:</span>
            <span className="font-extrabold text-emerald-300 text-sm">
              ${(fleetSummary.totalAvoidanceUSD / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
      </div>

      {/* Dispatch Confirmation Banner */}
      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-100 flex items-center justify-between text-xs animate-fadeIn shadow-xl">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{notificationMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotificationMsg(null)}
            className="p-1 rounded text-emerald-300 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Predictive Simulation & Sensitivity Control Bar */}
      <div className="p-3.5 rounded-xl bg-[#2A1810]/70 border border-amber-900/40 grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-xs">
        {/* Operating Duty Intensity Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-stone-300 font-medium flex items-center gap-1.5">
              <Sliders size={13} className="text-amber-400" />
              <span>Operating Shift Intensity:</span>
            </span>
            <span className="font-mono text-amber-300 font-bold">
              {dutyIntensityMultiplier === 1.0 ? '1.0x (Standard Shift)' : dutyIntensityMultiplier === 1.25 ? '1.25x (Heavy Production)' : '1.50x (Severe Hard-Rock)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400">1.0x</span>
            <input
              type="range"
              min="1.0"
              max="1.5"
              step="0.25"
              value={dutyIntensityMultiplier}
              onChange={(e) => setDutyIntensityMultiplier(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5"
            />
            <span className="text-[10px] text-stone-400">1.5x</span>
          </div>
        </div>

        {/* Safety Incident Weighting Multiplier */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-stone-300 font-medium flex items-center gap-1.5">
              <ShieldAlert size={13} className="text-rose-400" />
              <span>Historical Incident Multiplier:</span>
            </span>
            <span className="font-mono text-rose-300 font-bold">
              {safetyIncidentWeight.toFixed(1)}x Risk Weight
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400">1.0x</span>
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.2"
              value={safetyIncidentWeight}
              onChange={(e) => setSafetyIncidentWeight(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer h-1.5"
            />
            <span className="text-[10px] text-stone-400">2.0x</span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-start md:justify-end gap-1 flex-wrap">
          {(['all', 'Haulage & Loading', 'Drilling & Blasting', 'Ventilation & Infrastructure'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-amber-500 text-stone-950 font-bold shadow'
                  : 'bg-stone-900/80 text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              {cat === 'all' ? 'All Units' : cat.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Fleet Grid & Detailed Predictive Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Equipment Fleet Status List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-400 px-1 font-mono">
            <span>MONITORED HEAVY ASSETS ({filteredEquipment.length})</span>
            <span>SORTED BY PREDICTIVE RISK SEVERITY</span>
          </div>

          <div className="space-y-2.5">
            {filteredEquipment
              .slice()
              .sort((a, b) => {
                const metricA = calculatePredictiveMetrics(a);
                const metricB = calculatePredictiveMetrics(b);
                return metricB.riskScore - metricA.riskScore;
              })
              .map((eq) => {
                const metrics = calculatePredictiveMetrics(eq);
                const isSelected = selectedEquipment.id === eq.id;
                const dispatchInfo = dispatchedOrders[eq.id];

                return (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedEquipmentId(eq.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-950/80 to-[#2A1810] border-amber-400/80 shadow-lg ring-1 ring-amber-400/50'
                        : 'bg-stone-900/75 border-stone-800/90 hover:border-stone-700 hover:bg-stone-900'
                    }`}
                  >
                    {/* Left: Code, Name & Zone */}
                    <div className="flex items-start gap-3 min-w-[220px]">
                      <div
                        className={`p-2 rounded-xl flex-shrink-0 text-center font-mono font-extrabold text-xs flex flex-col items-center justify-center w-12 h-12 ${
                          metrics.riskScore >= 78
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                            : metrics.riskScore >= 60
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        <span className="text-[10px] leading-none uppercase">Risk</span>
                        <span className="text-base font-black">{metrics.riskScore}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-white text-sm font-['Space_Grotesk']">
                            {eq.unitCode}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold border uppercase tracking-wider ${metrics.urgencyBadge}">
                            {metrics.urgency.split(' ')[0]}
                          </span>
                          {dispatchInfo && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-700 font-mono">
                              WO DISPATCHED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-200 font-semibold mt-0.5 line-clamp-1">{eq.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                          <span>{eq.assignedZone}</span>
                          <span>•</span>
                          <span className="font-mono text-stone-300">Level -{eq.levelDepthM}m</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Sensor Telemetry Spark Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-black/40 p-2 rounded-lg border border-stone-800/80">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Vibration</span>
                        <strong
                          className={
                            eq.vibrationMmS >= eq.vibrationThreshold
                              ? 'text-rose-400 font-bold'
                              : 'text-stone-200'
                          }
                        >
                          {eq.vibrationMmS} mm/s
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Temp</span>
                        <strong
                          className={
                            eq.bearingTempC >= eq.bearingTempThreshold
                              ? 'text-amber-400 font-bold'
                              : 'text-stone-200'
                          }
                        >
                          {eq.bearingTempC}°C
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Pred. RUL</span>
                        <strong className="text-emerald-300 font-extrabold">{metrics.predictedRulHours}h</strong>
                      </div>
                    </div>

                    {/* Right: Quick Action Button */}
                    <div className="flex sm:flex-col items-center justify-end gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalEquipment(eq);
                          setShowWorkOrderModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors flex items-center gap-1"
                        title="View detailed predictive diagnostics & safety correlation"
                      >
                        <span>Inspect</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right 5 Cols: Selected Equipment In-Depth Diagnostics & Prescribed Schedule */}
        <div className="lg:col-span-5 rounded-2xl bg-stone-950/80 border border-stone-800 p-4 space-y-4">
          {(() => {
            const selectedMetrics = calculatePredictiveMetrics(selectedEquipment);
            const dispatchRecord = dispatchedOrders[selectedEquipment.id];

            return (
              <>
                {/* Header & Risk Gauge */}
                <div className="border-b border-stone-800 pb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/40">
                        {selectedEquipment.unitCode}
                      </span>
                      <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                        {selectedEquipment.name}
                      </h3>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">{selectedEquipment.model}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-stone-400 block">Failure Risk</span>
                    <span className="text-xl font-black text-rose-400 font-mono">
                      {selectedMetrics.failureProbabilityPct}%
                    </span>
                  </div>
                </div>

                {/* Prescribed Schedule Recommendation Box */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Calendar size={14} className="text-amber-400" />
                      <span>Suggested Maintenance Schedule:</span>
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${selectedMetrics.urgencyBadge}`}>
                      {selectedMetrics.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-stone-200 font-medium leading-relaxed">
                    {selectedMetrics.recommendedSchedule}
                  </p>

                  <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-stone-400">
                      Remaining Useful Life: <strong className="text-emerald-300">{selectedMetrics.predictedRulHours} operating hours</strong>
                    </span>
                    <span className="text-stone-400">
                      Est. Labor: <strong className="text-white">{selectedEquipment.estimatedLaborHours}h</strong>
                    </span>
                  </div>
                </div>

                {/* Historical Safety Incident Correlation */}
                <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-300 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-rose-400" />
                      <span>Historical Safety Incident Linkage</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {selectedEquipment.historicalSafetyIncidentsCount} Near-Miss Events
                    </span>
                  </div>
                  <p className="text-stone-300 text-[11px] leading-relaxed">
                    {selectedEquipment.safetyIncidentSummary}
                  </p>
                </div>

                {/* 6-Month Historical Telemetry Trend Visualizer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span className="font-semibold text-stone-300 flex items-center gap-1">
                      <TrendingUp size={13} className="text-amber-400" />
                      <span>Historical Degradation Trend (6-Month Vibration mm/s)</span>
                    </span>
                    <span className="font-mono text-[10px] text-rose-400">Threshold: {selectedEquipment.vibrationThreshold} mm/s</span>
                  </div>

                  {/* SVG Trend Sparkline Chart */}
                  <div className="p-3 rounded-xl bg-black/60 border border-stone-800 space-y-2">
                    <div className="h-20 w-full relative">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80" preserveAspectRatio="none">
                        {/* Threshold Line */}
                        <line
                          x1="0"
                          y1="35"
                          x2="300"
                          y2="35"
                          stroke="#ef4444"
                          strokeDasharray="4 4"
                          strokeWidth="1.2"
                          opacity="0.65"
                        />
                        {/* Vibration Area Fill */}
                        <path
                          d={`M 10,${70 - (selectedEquipment.historicalTelemetry[0].vibrationMmS / 10) * 60} 
                              L 65,${70 - (selectedEquipment.historicalTelemetry[1].vibrationMmS / 10) * 60} 
                              L 125,${70 - (selectedEquipment.historicalTelemetry[2].vibrationMmS / 10) * 60} 
                              L 185,${70 - (selectedEquipment.historicalTelemetry[3].vibrationMmS / 10) * 60} 
                              L 245,${70 - (selectedEquipment.historicalTelemetry[4].vibrationMmS / 10) * 60} 
                              L 290,${70 - (selectedEquipment.historicalTelemetry[5].vibrationMmS / 10) * 60} 
                              L 290,75 L 10,75 Z`}
                          fill="url(#vibGradient)"
                          opacity="0.25"
                        />
                        {/* Vibration Polyline */}
                        <polyline
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={`
                            10,${70 - (selectedEquipment.historicalTelemetry[0].vibrationMmS / 10) * 60}
                            65,${70 - (selectedEquipment.historicalTelemetry[1].vibrationMmS / 10) * 60}
                            125,${70 - (selectedEquipment.historicalTelemetry[2].vibrationMmS / 10) * 60}
                            185,${70 - (selectedEquipment.historicalTelemetry[3].vibrationMmS / 10) * 60}
                            245,${70 - (selectedEquipment.historicalTelemetry[4].vibrationMmS / 10) * 60}
                            290,${70 - (selectedEquipment.historicalTelemetry[5].vibrationMmS / 10) * 60}
                          `}
                        />
                        {/* Sparkline Points */}
                        {selectedEquipment.historicalTelemetry.map((pt, idx) => {
                          const cx = 10 + idx * 56;
                          const cy = 70 - (pt.vibrationMmS / 10) * 60;
                          return (
                            <circle
                              key={idx}
                              cx={cx}
                              cy={cy}
                              r={pt.nearMisses > 0 ? '4' : '2.5'}
                              fill={pt.nearMisses > 0 ? '#ef4444' : '#fbbf24'}
                              stroke="#000"
                              strokeWidth="1"
                            />
                          );
                        })}
                        <defs>
                          <linearGradient id="vibGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-1 border-t border-stone-800">
                      {selectedEquipment.historicalTelemetry.map((pt, idx) => (
                        <div key={idx} className="text-center">
                          <span className="block">{pt.month}</span>
                          <span className="text-stone-300 font-bold">{pt.vibrationMmS}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Real-Time Telemetry Wear & Safety Threshold Breacher */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-stone-900 to-black/90 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                      <Activity size={14} className="text-amber-400" />
                      <span>Live Wear Telemetry &amp; Threshold Guard</span>
                    </span>
                    <button
                      type="button"
                      id={`btn-spike-stress-${selectedEquipment.id}`}
                      onClick={() => simulateStressSpike(selectedEquipment.unitCode)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-700/80 font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      title="Simulate sudden mechanical/thermal spike exceeding safety threshold"
                    >
                      <Zap size={11} className="text-rose-400 animate-pulse" />
                      <span>Trigger Wear Spike</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 text-[11px] font-mono">
                    {/* Vibration Velocity Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400 flex items-center gap-1">
                          <span>Vibration Velocity:</span>
                        </span>
                        <span
                          className={`font-bold ${
                            selectedEquipment.vibrationMmS >= selectedEquipment.vibrationThreshold
                              ? 'text-rose-400 font-black flex items-center gap-1'
                              : 'text-emerald-400'
                          }`}
                        >
                          {selectedEquipment.vibrationMmS >= selectedEquipment.vibrationThreshold && (
                            <AlertTriangle size={12} className="text-rose-400 inline" />
                          )}
                          {selectedEquipment.vibrationMmS.toFixed(1)} mm/s
                          <span className="text-stone-500 font-normal ml-1">
                            (Limit: {selectedEquipment.vibrationThreshold} mm/s)
                          </span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="12.0"
                        step="0.1"
                        value={selectedEquipment.vibrationMmS}
                        onChange={(e) =>
                          updateEquipmentMetric(selectedEquipment.id, {
                            vibrationMmS: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-amber-500 cursor-pointer h-1.5"
                      />
                    </div>

                    {/* Bearing Temperature Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-400">Bearing Core Temp:</span>
                        <span
                          className={`font-bold ${
                            selectedEquipment.bearingTempC >= selectedEquipment.bearingTempThreshold
                              ? 'text-rose-400 font-black flex items-center gap-1'
                              : 'text-amber-300'
                          }`}
                        >
                          {selectedEquipment.bearingTempC >= selectedEquipment.bearingTempThreshold && (
                            <AlertTriangle size={12} className="text-rose-400 inline" />
                          )}
                          {selectedEquipment.bearingTempC}°C
                          <span className="text-stone-500 font-normal ml-1">
                            (Limit: {selectedEquipment.bearingTempThreshold}°C)
                          </span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min="45"
                        max="115"
                        step="1"
                        value={selectedEquipment.bearingTempC}
                        onChange={(e) =>
                          updateEquipmentMetric(selectedEquipment.id, {
                            bearingTempC: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-rose-500 cursor-pointer h-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Prescribed Work Actions Checklist */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-stone-300 block">Prescribed Maintenance Procedures:</span>
                  <div className="space-y-1">
                    {selectedEquipment.prescribedActions.slice(0, 3).map((act, aIdx) => (
                      <div key={aIdx} className="flex items-start gap-2 p-1.5 rounded bg-stone-900/60 border border-stone-800/80 text-[11px] text-stone-300">
                        <CheckCircle2 size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dispatch Work Order Button & Status */}
                <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-mono text-stone-400">
                    Avoided Downtime Cost: <strong className="text-emerald-300">${(selectedEquipment.estimatedCostAvoidanceUSD / 1000).toFixed(0)}k</strong>
                  </div>

                  {dispatchRecord ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                      <Check size={14} />
                      <span>{dispatchRecord.orderId} Scheduled</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      id="btn-dispatch-work-order"
                      onClick={() => handleDispatchWorkOrder(selectedEquipment)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs shadow-lg transition-all flex items-center gap-1.5"
                    >
                      <Wrench size={14} />
                      <span>Approve &amp; Dispatch Work Order</span>
                    </button>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Deep Dive Inspection & Work Order Modal */}
      {showWorkOrderModal && modalEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl bg-stone-950 border border-amber-500/40 p-5 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base font-['Space_Grotesk']">
                    Predictive Maintenance Work Order Package
                  </h3>
                  <p className="text-xs text-stone-400">
                    Unit: {modalEquipment.unitCode} • {modalEquipment.name} ({modalEquipment.model})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkOrderModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Diagnostic Parameters Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-stone-400 block text-[10px]">Operating Run</span>
                <span className="text-white font-bold text-sm">{modalEquipment.operatingHours} hrs</span>
                <span className="text-stone-500 block text-[9px]">MTBF: {modalEquipment.mtbfHours} hrs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-stone-400 block text-[10px]">Vibration RMS</span>
                <span className={`text-sm font-bold ${modalEquipment.vibrationMmS > modalEquipment.vibrationThreshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {modalEquipment.vibrationMmS} mm/s
                </span>
                <span className="text-stone-500 block text-[9px]">Limit: {modalEquipment.vibrationThreshold} mm/s</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-stone-400 block text-[10px]">Bearing Temp</span>
                <span className={`text-sm font-bold ${modalEquipment.bearingTempC > modalEquipment.bearingTempThreshold ? 'text-amber-400' : 'text-white'}`}>
                  {modalEquipment.bearingTempC}°C
                </span>
                <span className="text-stone-500 block text-[9px]">Limit: {modalEquipment.bearingTempThreshold}°C</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800">
                <span className="text-stone-400 block text-[10px]">Hydraulic Psi</span>
                <span className="text-white font-bold text-sm">{modalEquipment.hydraulicPressurePsi} psi</span>
                <span className="text-stone-500 block text-[9px]">Nom: {modalEquipment.hydraulicPressureNominal} psi</span>
              </div>
            </div>

            {/* Prescribed Step-by-Step Mechanical Procedures */}
            <div className="space-y-2">
              <span className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                <FileText size={14} className="text-amber-400" />
                <span>Standard Operating Procedure (SOP) &amp; Safety Isolation Tasks:</span>
              </span>
              <div className="space-y-1.5">
                {modalEquipment.prescribedActions.map((act, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-stone-900/80 border border-stone-800">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] flex items-center justify-center flex-shrink-0 font-bold">
                      {i + 1}
                    </span>
                    <span className="text-stone-300 text-xs">{act}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Spare Parts & Warehouse Stock Check */}
            <div className="space-y-2">
              <span className="font-bold text-stone-200 text-xs flex items-center gap-1.5">
                <Layers size={14} className="text-amber-400" />
                <span>Requisite Warehouse Spare Parts &amp; Consumables:</span>
              </span>
              <div className="divide-y divide-stone-800 border border-stone-800 rounded-xl overflow-hidden bg-stone-900/70">
                {modalEquipment.requiredParts.map((part, pIdx) => (
                  <div key={pIdx} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-amber-300 font-bold text-[11px] block">{part.partNo}</span>
                      <span className="text-stone-300 text-[11px]">{part.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-stone-400 text-[11px]">Qty: {part.qty}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          part.inStock
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {part.inStock ? 'IN STOCK (BAY 4)' : 'ORDER EXPEDITED'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowWorkOrderModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
              >
                Close Inspector
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDispatchWorkOrder(modalEquipment);
                  setShowWorkOrderModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs shadow-lg flex items-center gap-1.5"
              >
                <Wrench size={14} />
                <span>Confirm &amp; Issue Work Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
