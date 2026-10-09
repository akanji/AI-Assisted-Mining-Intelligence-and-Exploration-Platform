import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Brush,
  Area,
  ComposedChart,
} from 'recharts';
import {
  Activity,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Gauge,
  Zap,
  Info,
  Clock,
  Wrench,
  ChevronRight,
  Filter,
  Maximize2,
  Layers,
  Cpu,
  BarChart3,
  TrendingUp,
  Radio,
} from 'lucide-react';
import {
  CRITICAL_MINING_EQUIPMENT_LIST,
  CriticalMiningEquipment,
  EquipmentVibrationDataPoint,
} from '../data/equipmentVibrationHistory';
import { downloadCSV } from '../utils/exportUtils';

type TimeRangeKey = '1H' | '24H' | '7D' | '30D';

export const EquipmentVibrationTimeSeriesChart: React.FC = () => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('EQ-TD-01');
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('1H');
  const [visibleMetrics, setVisibleMetrics] = useState<{
    rmsVelocity: boolean;
    peakAccel: boolean;
    bearingTemp: boolean;
    frequency: boolean;
  }>({
    rmsVelocity: true,
    peakAccel: true,
    bearingTemp: true,
    frequency: false,
  });

  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [liveStreamTick, setLiveStreamTick] = useState<number>(0);
  const [customSeriesData, setCustomSeriesData] = useState<
    Record<string, Record<TimeRangeKey, EquipmentVibrationDataPoint[]>>
  >(() => {
    const initial: Record<string, Record<TimeRangeKey, EquipmentVibrationDataPoint[]>> = {};
    CRITICAL_MINING_EQUIPMENT_LIST.forEach((eq) => {
      initial[eq.id] = {
        '1H': [...eq.data['1H']],
        '24H': [...eq.data['24H']],
        '7D': [...eq.data['7D']],
        '30D': [...eq.data['30D']],
      };
    });
    return initial;
  });

  const selectedEquipment = useMemo(() => {
    return (
      CRITICAL_MINING_EQUIPMENT_LIST.find((eq) => eq.id === selectedEquipmentId) ||
      CRITICAL_MINING_EQUIPMENT_LIST[0]
    );
  }, [selectedEquipmentId]);

  // Current active data series for chart
  const activeData = useMemo(() => {
    const eqData = customSeriesData[selectedEquipmentId];
    if (eqData && eqData[timeRange]) {
      return eqData[timeRange];
    }
    return selectedEquipment.data[timeRange];
  }, [customSeriesData, selectedEquipmentId, timeRange, selectedEquipment]);

  // Live streaming ticker that simulates incoming sensor telemetry packets
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setLiveStreamTick((prev) => prev + 1);

      setCustomSeriesData((prev) => {
        const nextState = { ...prev };
        const eqData = nextState[selectedEquipmentId];
        if (!eqData) return prev;

        const current1H = eqData['1H'] ? [...eqData['1H']] : [];
        const lastPoint = current1H[current1H.length - 1];
        if (!lastPoint) return prev;

        const now = new Date();
        const noise = (Math.sin(Date.now() * 0.002) + Math.cos(Date.now() * 0.005)) * 0.35;
        const baseRms = selectedEquipment.currentRmsMmS;
        const newRms = Math.max(0.6, Number((baseRms + noise).toFixed(2)));
        const newPeakG = Math.max(0.2, Number((selectedEquipment.currentPeakG + noise * 0.5).toFixed(2)));
        const newTemp = Number((selectedEquipment.currentTempC + Math.sin(Date.now() * 0.001) * 0.4).toFixed(1));
        const newFreq = Math.round(selectedEquipment.currentFreqHz + (Math.random() - 0.5) * 6);

        let status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
        if (newRms >= selectedEquipment.criticalThresholdMmS) status = 'CRITICAL';
        else if (newRms >= selectedEquipment.warningThresholdMmS) status = 'WARNING';

        const newPoint: EquipmentVibrationDataPoint = {
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          fullTimestamp: now.toLocaleString(),
          rmsVelocityMmS: newRms,
          peakAccelerationG: newPeakG,
          dominantFrequencyHz: newFreq,
          bearingTempC: newTemp,
          crestFactor: Number((newPeakG / (newRms * 0.35 + 0.1)).toFixed(2)),
          motorLoadPct: Math.round(78 + Math.sin(Date.now() * 0.003) * 14),
          status,
          note: status === 'CRITICAL' ? 'Automated telemetry threshold alert' : undefined,
        };

        // Keep rolling buffer of 30 points
        const updated1H = [...current1H.slice(1), newPoint];
        eqData['1H'] = updated1H;
        return nextState;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLiveStreaming, selectedEquipmentId, selectedEquipment]);

  // Statistics calculation for the active time range
  const statistics = useMemo(() => {
    if (!activeData || activeData.length === 0) {
      return {
        peakRms: 0,
        avgRms: 0,
        peakG: 0,
        peakTemp: 0,
        currentRms: 0,
        currentStatus: 'OPTIMAL' as const,
      };
    }

    const rmsValues = activeData.map((d) => d.rmsVelocityMmS);
    const peakGValues = activeData.map((d) => d.peakAccelerationG);
    const tempValues = activeData.map((d) => d.bearingTempC);

    const peakRms = Math.max(...rmsValues);
    const avgRms = Number((rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length).toFixed(2));
    const peakG = Math.max(...peakGValues);
    const peakTemp = Math.max(...tempValues);
    const currentPoint = activeData[activeData.length - 1];

    return {
      peakRms,
      avgRms,
      peakG,
      peakTemp,
      currentRms: currentPoint.rmsVelocityMmS,
      currentTemp: currentPoint.bearingTempC,
      currentStatus: currentPoint.status,
    };
  }, [activeData]);

  const handleExportCSV = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Historical_Vibration_${selectedEquipment.id}_${timeRange}_${dateStr}.csv`;
    const headers = [
      'Timestamp',
      'Full Timestamp',
      'Equipment ID',
      'Equipment Name',
      'RMS Velocity (mm/s)',
      'Peak Acceleration (g)',
      'Dominant Frequency (Hz)',
      'Bearing Temp (C)',
      'Crest Factor',
      'Motor Load (%)',
      'ISO Health Status',
      'Notes',
    ];

    const rows = activeData.map((d) => [
      d.timestamp,
      `"${d.fullTimestamp}"`,
      selectedEquipment.id,
      `"${selectedEquipment.name}"`,
      d.rmsVelocityMmS,
      d.peakAccelerationG,
      d.dominantFrequencyHz,
      d.bearingTempC,
      d.crestFactor,
      d.motorLoadPct,
      d.status,
      `"${d.note || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCSV(filename, csvContent);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Control Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-stone-900/90 via-[#2A1810]/90 to-stone-900/90 border-2 border-amber-500/50 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-stone-950 font-black shadow-lg">
              <Activity size={22} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <span>Critical Mining Equipment Vibration Time-Series</span>
              </h2>
              <p className="text-xs text-amber-200/90 font-mono">
                Continuous Piezoelectric Accelerometer &amp; Optical Pyrometer Telemetry Stream &bull; ISO 10816-3 Standard
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          {/* Live Streaming Toggle */}
          <button
            type="button"
            id="btn-toggle-live-vibration-stream"
            onClick={() => setIsLiveStreaming((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border shadow-md cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-white'
            }`}
          >
            {isLiveStreaming ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Pause size={13} />
                <span>Live Stream Active</span>
              </>
            ) : (
              <>
                <Play size={13} />
                <span>Stream Paused</span>
              </>
            )}
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            id="btn-export-vibration-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Download historical sensor readings as CSV"
          >
            <Download size={13} className="text-amber-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Equipment Selector Cards Carousel / Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-stone-400 px-1">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-amber-500/80">
            <Radio size={13} />
            <span>Select Critical Mining Asset</span>
          </span>
          <span>{CRITICAL_MINING_EQUIPMENT_LIST.length} Monitored Units</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CRITICAL_MINING_EQUIPMENT_LIST.map((equipment) => {
            const isSelected = equipment.id === selectedEquipmentId;
            const statusColor =
              equipment.currentStatus === 'CRITICAL'
                ? 'border-rose-500/80 bg-rose-950/30 text-rose-300'
                : equipment.currentStatus === 'WARNING'
                ? 'border-amber-500/80 bg-amber-950/30 text-amber-300'
                : 'border-emerald-500/80 bg-emerald-950/30 text-emerald-300';

            return (
              <button
                key={equipment.id}
                id={`btn-select-equipment-${equipment.id}`}
                type="button"
                onClick={() => setSelectedEquipmentId(equipment.id)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all relative overflow-hidden flex flex-col justify-between gap-2.5 cursor-pointer shadow-lg ${
                  isSelected
                    ? 'bg-stone-900 border-amber-500 ring-2 ring-amber-500/40 shadow-amber-950/40'
                    : 'bg-stone-900/80 border-stone-800/80 hover:border-amber-500/50 hover:bg-stone-850'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-stone-400 font-bold block">
                      {equipment.id} &bull; {equipment.category}
                    </span>
                    <h4 className="font-extrabold text-white text-xs font-['Space_Grotesk'] line-clamp-1">
                      {equipment.name}
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black border flex-shrink-0 ${statusColor}`}
                  >
                    {equipment.currentStatus}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-stone-800/80 font-mono text-[10px]">
                  <div>
                    <span className="text-stone-500 block text-[9px]">RMS (mm/s)</span>
                    <strong
                      className={`text-xs ${
                        equipment.currentRmsMmS >= equipment.criticalThresholdMmS
                          ? 'text-rose-400'
                          : equipment.currentRmsMmS >= equipment.warningThresholdMmS
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {equipment.currentRmsMmS}
                    </strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[9px]">Peak Accel</span>
                    <strong className="text-white text-xs">{equipment.currentPeakG}g</strong>
                  </div>
                  <div>
                    <span className="text-stone-500 block text-[9px]">Bearing Temp</span>
                    <strong className="text-amber-300 text-xs">{equipment.currentTempC}°C</strong>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Chart Viewport with Controls */}
      <div className="p-4 sm:p-6 rounded-3xl bg-stone-900/90 border-2 border-stone-800 shadow-2xl space-y-5">
        {/* Chart Header Bar: Asset Info + Time Range Filter + Metric Toggles */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                {selectedEquipment.id}
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-white font-['Space_Grotesk']">
                {selectedEquipment.name}
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-0.5 font-mono">
              Location: <span className="text-stone-300">{selectedEquipment.location}</span> &bull; Machine Class:{' '}
              <span className="text-stone-300">{selectedEquipment.isoClass}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Window Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-950/80 border border-stone-800 font-mono text-xs">
              {(['1H', '24H', '7D', '30D'] as TimeRangeKey[]).map((range) => (
                <button
                  key={range}
                  type="button"
                  id={`btn-time-range-${range}`}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                  }`}
                >
                  {range === '1H' ? '1 Hour (Live)' : range === '24H' ? '24 Hours' : range === '7D' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>

            {/* Metric Toggle Switches */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <button
                type="button"
                onClick={() =>
                  setVisibleMetrics((prev) => ({ ...prev, rmsVelocity: !prev.rmsVelocity }))
                }
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  visibleMetrics.rmsVelocity
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-stone-950/60 border-stone-800 text-stone-500'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>RMS Velocity</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setVisibleMetrics((prev) => ({ ...prev, peakAccel: !prev.peakAccel }))
                }
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  visibleMetrics.peakAccel
                    ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-sm'
                    : 'bg-stone-950/60 border-stone-800 text-stone-500'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                <span>Peak Accel (g)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setVisibleMetrics((prev) => ({ ...prev, bearingTemp: !prev.bearingTemp }))
                }
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  visibleMetrics.bearingTemp
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-sm'
                    : 'bg-stone-950/60 border-stone-800 text-stone-500'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                <span>Bearing Temp (°C)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setVisibleMetrics((prev) => ({ ...prev, frequency: !prev.frequency }))
                }
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  visibleMetrics.frequency
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-stone-950/60 border-stone-800 text-stone-500'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Dominant Freq</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Metrics Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-2xl bg-black/40 border border-stone-800/80 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
              Current RMS
            </span>
            <div className="flex items-baseline gap-1">
              <strong
                className={`text-xl font-extrabold font-mono ${
                  statistics.currentRms >= selectedEquipment.criticalThresholdMmS
                    ? 'text-rose-400'
                    : statistics.currentRms >= selectedEquipment.warningThresholdMmS
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {statistics.currentRms}
              </strong>
              <span className="text-[10px] text-stone-400 font-mono">mm/s</span>
            </div>
            <span className="text-[9px] text-stone-500 block">ISO 10816 Severity</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-stone-800/80 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
              Peak Accel (g)
            </span>
            <div className="flex items-baseline gap-1">
              <strong className="text-xl font-extrabold text-pink-400 font-mono">
                {statistics.peakG}
              </strong>
              <span className="text-[10px] text-stone-400 font-mono">g-force</span>
            </div>
            <span className="text-[9px] text-stone-500 block">Shock Impact</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-stone-800/80 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
              Bearing Temp
            </span>
            <div className="flex items-baseline gap-1">
              <strong className="text-xl font-extrabold text-orange-400 font-mono">
                {statistics.currentTemp}°C
              </strong>
            </div>
            <span className="text-[9px] text-stone-500 block">Thermal Pyrometer</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-stone-800/80 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
              Period Mean RMS
            </span>
            <div className="flex items-baseline gap-1">
              <strong className="text-xl font-extrabold text-amber-200 font-mono">
                {statistics.avgRms}
              </strong>
              <span className="text-[10px] text-stone-400 font-mono">mm/s</span>
            </div>
            <span className="text-[9px] text-stone-500 block">{timeRange} Average</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-stone-800/80 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
              Health Score
            </span>
            <div className="flex items-baseline gap-1">
              <strong
                className={`text-xl font-extrabold font-mono ${
                  selectedEquipment.healthScorePct >= 80
                    ? 'text-emerald-400'
                    : selectedEquipment.healthScorePct >= 60
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {selectedEquipment.healthScorePct}%
              </strong>
            </div>
            <span className="text-[9px] text-stone-500 block">Composite Health</span>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-stone-800/80 space-y-1">
            <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
              Predicted RUL
            </span>
            <div className="flex items-baseline gap-1">
              <strong className="text-xl font-extrabold text-cyan-300 font-mono">
                {selectedEquipment.predictedRulHours}
              </strong>
              <span className="text-[10px] text-stone-400 font-mono">hrs</span>
            </div>
            <span className="text-[9px] text-stone-500 block">Remaining Life</span>
          </div>
        </div>

        {/* The Time-Series Line Chart Container */}
        <div className="h-[360px] sm:h-[420px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={activeData}
              margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
            >
              <defs>
                <linearGradient id="rmsVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="peakAccelGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#292524" vertical={false} />

              <XAxis
                dataKey="timestamp"
                stroke="#78716C"
                tick={{ fill: '#A8A29E', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#44403C' }}
                dy={8}
              />

              {/* Primary Y-Axis for Velocity (mm/s) and Acceleration (g) */}
              <YAxis
                yAxisId="vibrationAxis"
                stroke="#F59E0B"
                domain={[0, 'auto']}
                tick={{ fill: '#F59E0B', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#44403C' }}
                label={{
                  value: 'Vibration RMS (mm/s) & Peak (g)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#F59E0B',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />

              {/* Secondary Y-Axis for Bearing Temperature (°C) */}
              <YAxis
                yAxisId="tempAxis"
                orientation="right"
                stroke="#FB923C"
                domain={[40, 110]}
                tick={{ fill: '#FB923C', fontSize: 10, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#44403C' }}
                label={{
                  value: 'Bearing Temp (°C)',
                  angle: 90,
                  position: 'insideRight',
                  fill: '#FB923C',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />

              {/* Standard ISO 10816 Warning Reference Line */}
              <ReferenceLine
                yAxisId="vibrationAxis"
                y={selectedEquipment.warningThresholdMmS}
                stroke="#EAB308"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Warning Limit (${selectedEquipment.warningThresholdMmS} mm/s)`,
                  fill: '#FACC15',
                  fontSize: 9,
                  fontFamily: 'monospace',
                  position: 'top',
                }}
              />

              {/* Standard ISO 10816 Critical Trip Reference Line */}
              <ReferenceLine
                yAxisId="vibrationAxis"
                y={selectedEquipment.criticalThresholdMmS}
                stroke="#EF4444"
                strokeDasharray="4 4"
                strokeWidth={2}
                label={{
                  value: `Alarm Trip Threshold (${selectedEquipment.criticalThresholdMmS} mm/s)`,
                  fill: '#F87171',
                  fontSize: 9,
                  fontFamily: 'monospace',
                  position: 'top',
                }}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload as EquipmentVibrationDataPoint;
                    return (
                      <div className="p-3.5 rounded-2xl bg-stone-950/95 border border-amber-500/60 shadow-2xl text-xs font-mono space-y-2 min-w-[220px]">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                          <span className="text-stone-400 font-bold">{label}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              dataPoint.status === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : dataPoint.status === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {dataPoint.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between items-center text-amber-300">
                            <span>RMS Velocity:</span>
                            <strong>{dataPoint.rmsVelocityMmS} mm/s</strong>
                          </div>
                          <div className="flex justify-between items-center text-pink-300">
                            <span>Peak Accel:</span>
                            <strong>{dataPoint.peakAccelerationG} g</strong>
                          </div>
                          <div className="flex justify-between items-center text-orange-300">
                            <span>Bearing Temp:</span>
                            <strong>{dataPoint.bearingTempC} °C</strong>
                          </div>
                          <div className="flex justify-between items-center text-cyan-300">
                            <span>Dominant Freq:</span>
                            <strong>{dataPoint.dominantFrequencyHz} Hz</strong>
                          </div>
                          <div className="flex justify-between items-center text-stone-400">
                            <span>Crest Factor:</span>
                            <span>{dataPoint.crestFactor}</span>
                          </div>
                        </div>

                        {dataPoint.note && (
                          <div className="pt-1.5 border-t border-stone-800 text-[10px] text-rose-300 flex items-center gap-1">
                            <AlertTriangle size={11} className="flex-shrink-0" />
                            <span>{dataPoint.note}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => {
                  const labelMap: Record<string, string> = {
                    rmsVelocityMmS: 'RMS Velocity (mm/s)',
                    peakAccelerationG: 'Peak Acceleration (g)',
                    bearingTempC: 'Bearing Temp (°C)',
                    dominantFrequencyHz: 'Dominant Freq (Hz)',
                  };
                  return (
                    <span className="text-stone-300 font-mono text-xs font-semibold">
                      {labelMap[value] || value}
                    </span>
                  );
                }}
              />

              {/* Area Shading for RMS Velocity */}
              {visibleMetrics.rmsVelocity && (
                <Area
                  yAxisId="vibrationAxis"
                  type="monotone"
                  dataKey="rmsVelocityMmS"
                  fill="url(#rmsVelocityGradient)"
                  stroke="none"
                />
              )}

              {/* Primary RMS Velocity Line */}
              {visibleMetrics.rmsVelocity && (
                <Line
                  yAxisId="vibrationAxis"
                  type="monotone"
                  dataKey="rmsVelocityMmS"
                  name="rmsVelocityMmS"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 2.5, fill: '#F59E0B', strokeWidth: 1 }}
                  activeDot={{ r: 6, fill: '#F59E0B', stroke: '#FFFFFF' }}
                />
              )}

              {/* Peak Acceleration Line */}
              {visibleMetrics.peakAccel && (
                <Line
                  yAxisId="vibrationAxis"
                  type="monotone"
                  dataKey="peakAccelerationG"
                  name="peakAccelerationG"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={{ r: 2, fill: '#EC4899' }}
                  activeDot={{ r: 5, fill: '#EC4899', stroke: '#FFFFFF' }}
                />
              )}

              {/* Bearing Temperature Line (Secondary Axis) */}
              {visibleMetrics.bearingTemp && (
                <Line
                  yAxisId="tempAxis"
                  type="monotone"
                  dataKey="bearingTempC"
                  name="bearingTempC"
                  stroke="#FB923C"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 5, fill: '#FB923C', stroke: '#FFFFFF' }}
                />
              )}

              {/* Dominant Frequency Line */}
              {visibleMetrics.frequency && (
                <Line
                  yAxisId="vibrationAxis"
                  type="monotone"
                  dataKey="dominantFrequencyHz"
                  name="dominantFrequencyHz"
                  stroke="#06B6D4"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#06B6D4' }}
                />
              )}

              {/* Brush Navigation Zoom for Large 24H, 7D, 30D datasets */}
              {(timeRange === '7D' || timeRange === '30D') && (
                <Brush
                  dataKey="timestamp"
                  height={24}
                  stroke="#F59E0B"
                  fill="#1C1917"
                  tickFormatter={(val) => val}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* AI Predictive Diagnostic & Closed-Loop Recommendations */}
        <div className="p-4 rounded-2xl bg-black/50 border border-stone-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-900/40 text-purple-400 border border-purple-700/40">
                <Cpu size={15} />
              </div>
              <h4 className="font-extrabold text-white text-xs font-['Space_Grotesk']">
                AI Vibration Telemetry Diagnostic &bull; Closed-Loop Mitigation Command
              </h4>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                selectedEquipment.currentStatus === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : selectedEquipment.currentStatus === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              ISO 10816 Status: {selectedEquipment.currentStatus}
            </span>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            <strong className="text-amber-400 font-semibold">Automated Engineering Recommendation: </strong>
            {selectedEquipment.recommendation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] font-mono text-stone-400">
            <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
              <span className="text-stone-500 block text-[10px]">Failure Mode Prediction:</span>
              <span className="text-stone-200 font-semibold">
                {selectedEquipment.currentStatus === 'CRITICAL'
                  ? 'Rotary Bearing Spalling & Cage Fracture'
                  : selectedEquipment.currentStatus === 'WARNING'
                  ? 'Harmonic Resonance & Torsional Slip'
                  : 'Normal Hydrodynamic Lubrication Film'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
              <span className="text-stone-500 block text-[10px]">Corrective SCADA Action:</span>
              <span className="text-emerald-300 font-semibold">
                {selectedEquipment.currentStatus === 'CRITICAL'
                  ? 'Active Dampening Loop Engaged (-60% RPM, +40% WOB)'
                  : selectedEquipment.currentStatus === 'WARNING'
                  ? 'Dynamic Torque Limiter Enforced (1/4-Turn Reverse)'
                  : 'Autonomous Cruise Maintenance'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-800">
              <span className="text-stone-500 block text-[10px]">Inspection Work Order:</span>
              <span className="text-cyan-300 font-semibold">
                WO-{selectedEquipment.id.replace('EQ-', '')}-{Math.floor(1000 + Math.random() * 9000)} (Dispatched)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
