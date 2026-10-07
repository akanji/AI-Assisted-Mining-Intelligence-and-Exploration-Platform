import React from 'react';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  ScanEye,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  DollarSign,
  Droplets,
  HardHat,
  Radio,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  YAxis,
  XAxis,
  ReferenceLine,
} from 'recharts';
import {
  EXPLORATION_TARGETS,
  MINERALS_DATABASE,
  MINER_HEALTH_DATA,
  MINE_TELEMETRY,
  REGIONAL_EXTRACTION_TONNAGE,
} from '../data/miningData';
import { ActiveTab, Region } from '../types';
import { FieldWeatherRadar } from './FieldWeatherRadar';
import { RecentActivityFeed } from './RecentActivityFeed';

interface ExecutiveDashboardProps {
  onNavigate: (tab: ActiveTab) => void;
  onSelectRegion: (region: Region) => void;
  selectedRegion: Region;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigate,
  onSelectRegion,
  selectedRegion,
}) => {
  const filteredTargets = EXPLORATION_TARGETS.filter(
    (t) => selectedRegion === 'Canada' || t.region === selectedRegion
  );

  const totalBudget = EXPLORATION_TARGETS.reduce((acc, t) => acc + t.budgetUSD, 0);
  const totalExpenditure = EXPLORATION_TARGETS.reduce((acc, t) => acc + t.expenditureUSD, 0);
  const activeDrillholes = 18;
  const criticalMineralsTracked = MINERALS_DATABASE.filter((m) => m.criticalMineral).length;
  const safeWorkersCount = MINER_HEALTH_DATA.filter((m) => m.status === 'Normal').length;
  const activeRegionProfile = REGIONAL_EXTRACTION_TONNAGE[selectedRegion];
  const activeRegionHistory = activeRegionProfile.sevenDayHistory;
  const peakDayPoint = activeRegionHistory.reduce(
    (max, pt) => (pt.tonnage > max.tonnage ? pt : max),
    activeRegionHistory[0]
  );
  const minDayPoint = activeRegionHistory.reduce(
    (min, pt) => (pt.tonnage < min.tonnage ? pt : min),
    activeRegionHistory[0]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Disclaimer Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-400 flex-shrink-0" />
          <span>
            <strong>DEMO DATA — NOT REAL EXPLORATION RESULTS.</strong> AI-generated prospectivity indications are decision-support hypotheses requiring field drill verification (JORC Code / NI 43-101 compliant).
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
          v4.8 ENTERPRISE
        </span>
      </div>

      {/* Hero Welcome / Platform Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#381F14] to-[#4C1D95] border border-amber-500/30 p-6 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-60 h-60 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={13} />
              <span>Multimodal Geological Computer Vision & Hyperspectral Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-['Space_Grotesk']">
              AI-ASSISTED MINING INTELLIGENCE & EXPLORATION
            </h1>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              Real-world mineral targeting, drill-core hyperspectral computer vision, occupational miner health telemetry, and JORC/NI 43-101 compliant A2A judge orchestration across Canada, USA, Europe, Australia, and Africa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-dash-run-vision"
              onClick={() => onNavigate('vision')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-lg hover:shadow-amber-500/25 transition-all"
            >
              <ScanEye size={18} />
              <span>Scan Rock / Core Specimen</span>
            </button>
            <button
              id="btn-dash-open-map"
              onClick={() => onNavigate('gis_map')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-white font-semibold text-sm border border-purple-500/40 transition-colors"
            >
              <Globe size={18} className="text-amber-400" />
              <span>Launch GIS Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Region Selection Card with 7-Day Daily Extraction Tonnage Recharts Mini-Trend Sparklines */}
      <div
        id="region-selection-card"
        className="rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#1F120C] to-[#160C08] border border-amber-900/50 p-4 sm:p-5 shadow-xl space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Globe size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-['Space_Grotesk']">
                  Regional Operations &amp; Daily Extraction Tonnage
                </h2>
                <span className="text-[11px] text-amber-300/90 font-mono">
                  · 7-Day Trend (t/d)
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Select an operating jurisdiction to inspect 7-day run-of-mine (ROM) extraction tonnage fluctuation and filter targets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-300 bg-stone-900/80 border border-stone-800 px-3 py-1.5 rounded-xl">
            <BarChart3 size={14} className="text-amber-400" />
            <span>
              Active Hub: <strong className="text-white">{activeRegionProfile.hubName}</strong>
            </span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span className="font-mono text-amber-300 font-bold">
              {activeRegionProfile.currentTonnage.toLocaleString()} t/d
            </span>
          </div>
        </div>

        {/* 5-Region Selection Cards with Individual Recharts Mini-Trend Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(['Canada', 'USA', 'Europe', 'Australia', 'Africa'] as Region[]).map((region) => {
            const profile = REGIONAL_EXTRACTION_TONNAGE[region];
            const isSelected = selectedRegion === region;
            const isPositive = profile.sevenDayDeltaPct >= 0;
            const strokeColor = isSelected
              ? '#f59e0b'
              : isPositive
              ? '#34d399'
              : '#fb7185';
            const gradientId = `sparkline-grad-${region.toLowerCase()}`;

            return (
              <button
                key={region}
                type="button"
                id={`btn-region-${region.toLowerCase()}`}
                onClick={() => onSelectRegion(region)}
                className={`text-left rounded-xl p-3.5 transition-all border flex flex-col justify-between relative overflow-hidden group ${
                  isSelected
                    ? 'bg-gradient-to-br from-amber-500/20 via-[#2E1A10] to-stone-900 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                    : 'bg-stone-900/70 hover:bg-stone-900 border-stone-800/90 hover:border-amber-500/40'
                }`}
              >
                {/* Top row: Region name + 7d % change */}
                <div className="flex items-start justify-between gap-1 w-full">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-extrabold tracking-wide uppercase font-['Space_Grotesk'] ${
                          isSelected ? 'text-amber-300' : 'text-stone-200 group-hover:text-white'
                        }`}
                      >
                        {region}
                      </span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </div>
                    <p className="text-[10px] text-stone-400 truncate max-w-[135px] mt-0.5">
                      {profile.primaryCommodity}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-bold ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {isPositive ? '+' : ''}
                    {profile.sevenDayDeltaPct}%
                  </span>
                </div>

                {/* Middle row: Daily Extraction Tonnage KPI */}
                <div className="my-2">
                  <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                    Daily Extraction Tonnage
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base font-extrabold text-white font-mono">
                      {profile.currentTonnage.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">t/d</span>
                  </div>
                </div>

                {/* Recharts Mini-Trend Sparkline (Last 7 Days) */}
                <div className="w-full h-12 mt-1" onClick={(e) => e.stopPropagation()}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={profile.sevenDayHistory}
                      margin={{ top: 4, right: 2, left: 2, bottom: 2 }}
                    >
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={strokeColor} stopOpacity={0.45} />
                          <stop offset="95%" stopColor={strokeColor} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <YAxis domain={['dataMin - 800', 'dataMax + 800']} hide />
                      <ReferenceLine
                        y={profile.sevenDayAvgTonnage}
                        stroke="#78716c"
                        strokeDasharray="2 2"
                        strokeOpacity={0.6}
                      />
                      <Tooltip
                        cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '2 2' }}
                        content={({ active, payload }) => {
                          if (!active || !payload || !payload.length) return null;
                          const pt = payload[0].payload;
                          return (
                            <div className="rounded-lg bg-stone-950/95 border border-stone-700 px-2 py-1 text-[10px] shadow-xl">
                              <div className="font-bold text-stone-200">
                                {pt.day} ({pt.dateLabel})
                              </div>
                              <div className="font-mono text-amber-300 font-bold">
                                {Number(pt.tonnage).toLocaleString()} t/d
                              </div>
                              <div className="text-stone-400">
                                Eq Grade: {pt.gradeAuEqGpt} g/t
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="tonnage"
                        stroke={strokeColor}
                        strokeWidth={2}
                        fill={`url(#${gradientId})`}
                        dot={{ r: 1.5, fill: strokeColor, strokeWidth: 0 }}
                        activeDot={{ r: 3.5, fill: '#fff', stroke: strokeColor, strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/70 mt-1">
                  <span>7d Avg: {(profile.sevenDayAvgTonnage / 1000).toFixed(1)}k t</span>
                  <span className="font-mono text-stone-500">D-6 → Today</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded 7-Day Daily Extraction Tonnage Fluctuation Strip for Selected Region */}
        <div className="rounded-xl bg-stone-950/70 border border-stone-800/90 p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 lg:max-w-xs">
            <div className="flex items-center gap-2 text-xs">
              <Activity size={14} className="text-amber-400" />
              <span className="font-bold text-white">
                {selectedRegion} — 7-Day Extraction Fluctuation
              </span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Continuous haul-truck &amp; primary crusher weighbridge telemetry across{' '}
              <span className="text-stone-200 font-medium">{activeRegionProfile.hubName}</span>.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-300 pt-0.5 font-mono">
              <span>
                7d Peak:{' '}
                <strong className="text-emerald-400">
                  {peakDayPoint.tonnage.toLocaleString()} t/d
                </strong>{' '}
                ({peakDayPoint.dateLabel})
              </span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>
                7d Low:{' '}
                <strong className="text-amber-300">
                  {minDayPoint.tonnage.toLocaleString()} t/d
                </strong>{' '}
                ({minDayPoint.dateLabel})
              </span>
            </div>
          </div>

          <div className="flex-1 h-24 min-w-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeRegionHistory}
                margin={{ top: 6, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="selected-region-tonnage-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fill: '#a8a29e', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} hide />
                <ReferenceLine
                  y={activeRegionProfile.sevenDayAvgTonnage}
                  stroke="#a8a29e"
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const pt = payload[0].payload;
                    const diffFromTarget = pt.tonnage - pt.targetTonnage;
                    return (
                      <div className="rounded-lg bg-stone-900 border border-amber-500/40 px-3 py-2 text-xs shadow-xl space-y-0.5">
                        <div className="font-bold text-white flex items-center justify-between gap-3">
                          <span>
                            {pt.day} · {pt.dateLabel}
                          </span>
                          <span className="text-amber-400 font-mono">
                            {pt.gradeAuEqGpt} g/t AuEq
                          </span>
                        </div>
                        <div className="font-mono text-stone-200">
                          Extracted:{' '}
                          <strong className="text-amber-300">
                            {Number(pt.tonnage).toLocaleString()} t/d
                          </strong>
                        </div>
                        <div className="font-mono text-[11px] text-stone-400">
                          Target: {Number(pt.targetTonnage).toLocaleString()} t/d (
                          <span
                            className={
                              diffFromTarget >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }
                          >
                            {diffFromTarget >= 0 ? '+' : ''}
                            {diffFromTarget.toLocaleString()} t
                          </span>
                          )
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tonnage"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#selected-region-tonnage-grad)"
                  dot={{ r: 3, fill: '#f59e0b', stroke: '#1c1917', strokeWidth: 1.5 }}
                  activeDot={{ r: 5, fill: '#fef3c7', stroke: '#f59e0b', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Targets */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Exploration Targets</span>
            <MapPin size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-['Space_Grotesk']">
              {EXPLORATION_TARGETS.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">+3 this quarter</span>
          </div>
          <p className="mt-1 text-xs text-stone-400 truncate">
            Top: {EXPLORATION_TARGETS[0].name} (Score 94)
          </p>
        </div>

        {/* Card 2: Drillholes & Core Logging */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Active Drill Programs</span>
            <Layers size={16} className="text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-['Space_Grotesk']">
              {activeDrillholes} Holes
            </span>
            <span className="text-xs text-amber-400 font-medium">14,280 m total</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Average high grade: 4.6 g/t Au & 2.15% Li
          </p>
        </div>

        {/* Card 3: Miner Health & Occupational Safety */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Occupational Health</span>
            <ShieldCheck size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-300 font-['Space_Grotesk']">
              {safeWorkersCount} / {MINER_HEALTH_DATA.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium">Normal Vitals</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">
            Respirable silica: &lt; 0.05 ppm (Safe threshold)
          </p>
        </div>

        {/* Card 4: Exploration Capital & Budget */}
        <div className="rounded-xl p-4 bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span className="font-semibold uppercase tracking-wider">Exploration Budget</span>
            <DollarSign size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-300 font-['Space_Grotesk']">
              ${(totalBudget / 1000000).toFixed(1)}M
            </span>
            <span className="text-xs text-stone-400">
              ${(totalExpenditure / 1000000).toFixed(1)}M spent
            </span>
          </div>
          <div className="mt-2 w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full"
              style={{ width: `${(totalExpenditure / totalBudget) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real-Time Localized Field Weather & Safety Radar */}
      <FieldWeatherRadar
        selectedRegion={selectedRegion}
        onSelectRegion={onSelectRegion}
      />

      {/* AI Vibration Signals & Drilling Telemetry Module Quick Link */}
      <div className="rounded-2xl bg-gradient-to-r from-[#2A1810] via-[#1F120C] to-[#160C08] border border-amber-900/50 p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
            <Radio size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                New Acoustic Subsurface Intelligence
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                ANT &bull; MSE Closed Loops
              </span>
            </div>
            <h3 className="text-sm font-bold text-white font-['Space_Grotesk'] mt-0.5">
              AI-Driven Mineral Exploration &amp; Vibration Telemetry Blueprint
            </h3>
            <p className="text-xs text-stone-300 mt-0.5">
              Ambient Noise Tomography (ANT), diamond-bit acoustic feedback (0–400 kHz), Teale&apos;s MSE calculations, and LEO satellite fleet orchestration.
            </p>
          </div>
        </div>

        <button
          id="btn-dash-open-vibration-signals"
          onClick={() => onNavigate('vibration_signals')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs shadow-md transition-all whitespace-nowrap flex-shrink-0"
        >
          <span>Open Vibration Center</span>
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Real-Time Geological & System Activity Feed */}
      <RecentActivityFeed
        onNavigate={onNavigate}
        selectedRegion={selectedRegion}
      />

      {/* Main Grid: Priority Targets & Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: High-Priority Exploration Targets */}
        <div className="lg:col-span-2 rounded-2xl bg-[#2A1810]/70 border border-stone-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-['Space_Grotesk']">
                <TrendingUp size={18} className="text-amber-400" />
                <span>High-Priority Exploration Targets</span>
              </h2>
              <p className="text-xs text-stone-400">
                AI Target Ranking incorporating hyperspectral SWIR, aeromagnetics, and geochemistry
              </p>
            </div>
            <button
              onClick={() => onNavigate('gis_map')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>View All on Map</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {filteredTargets.map((target) => (
              <div
                key={target.id}
                className="p-4 rounded-xl bg-stone-900/60 border border-stone-800/80 hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                      {target.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-600/40">
                      {target.commodity}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                      {target.stage}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 line-clamp-1">{target.geologicalRationale}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {target.keyAnomalies.map((anomaly, aIdx) => (
                      <span
                        key={aIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-200/90 border border-amber-500/20"
                      >
                        {anomaly}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1 text-sm font-extrabold text-amber-400 font-['Space_Grotesk']">
                    <span>Target Score:</span>
                    <span className="text-base text-white">{target.targetScore} / 100</span>
                  </div>
                  <span className="text-[11px] text-stone-400">Risk: {target.riskScore}%</span>
                  <button
                    onClick={() => onNavigate('gis_map')}
                    className="mt-1 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 transition-colors"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Miner Safety & Environmental Telemetry */}
        <div className="rounded-2xl bg-[#2A1810]/70 border border-stone-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <HardHat size={18} className="text-emerald-400" />
                  <span>Occupational Safety Radar</span>
                </h3>
                <p className="text-xs text-stone-400">Live underground mine atmosphere & vitals</p>
              </div>
              <button
                onClick={() => onNavigate('healthcare_esg')}
                className="text-xs text-amber-400 hover:underline font-medium"
              >
                Details
              </button>
            </div>

            {/* Atmosphere readings */}
            <div className="space-y-2.5">
              {MINE_TELEMETRY.slice(0, 3).map((zone, zIdx) => (
                <div
                  key={zIdx}
                  className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-stone-200">{zone.zoneName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        zone.hazardStatus === 'Safe'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {zone.hazardStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-stone-400 pt-1">
                    <div>
                      O₂: <strong className="text-white">{zone.o2Pct}%</strong>
                    </div>
                    <div>
                      CO: <strong className="text-white">{zone.coPpm} ppm</strong>
                    </div>
                    <div>
                      Silica: <strong className="text-white">{zone.respirableSilicaUgM3} µg/m³</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Callout */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/60 to-stone-900 border border-purple-600/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-900 text-amber-300">
                <Zap size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Ask MineAI for Instant Guidance</p>
                <p className="text-[11px] text-stone-400">Contextual answers for your active tool</p>
              </div>
            </div>
            <button
              id="btn-dash-ask-mineai"
              onClick={() => onNavigate('assistant')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors"
            >
              Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
