import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  HeartPulse,
  HardHat,
  Wind,
  AlertTriangle,
  Radio,
  Ambulance,
  CheckCircle2,
  Droplets,
  Leaf,
  Activity,
  UserCheck,
  Send,
  Globe,
  MapPin,
  Compass,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';
import { MINER_HEALTH_DATA, MINE_TELEMETRY, REGIONAL_ESG_SITES } from '../data/miningData';
import { Region, RegionalMineSiteESG } from '../types';
import { HealthcareLogo } from './HealthcareLogo';
import { SafetyIncidentTrendsChart } from './SafetyIncidentTrendsChart';
import { SafetyDowntimeCorrelationChart } from './SafetyDowntimeCorrelationChart';
import { PredictiveMaintenanceModule } from './PredictiveMaintenanceModule';

export interface MinerHealthAndESGProps {
  selectedRegion?: Region;
  onSelectRegion?: (region: Region) => void;
}

export const MinerHealthAndESG: React.FC<MinerHealthAndESGProps> = ({
  selectedRegion = 'Canada',
  onSelectRegion,
}) => {
  const [workers] = useState(MINER_HEALTH_DATA);
  const [dispatchMessage, setDispatchMessage] = useState<string | null>(null);
  const [selectedWorker, setSelectedWorker] = useState(MINER_HEALTH_DATA[0]);
  const [activeRegion, setActiveRegion] = useState<Region>(selectedRegion);
  const [visibleSiteIds, setVisibleSiteIds] = useState<string[]>(
    REGIONAL_ESG_SITES[selectedRegion].map((s) => s.siteId)
  );
  const [focusedSiteId, setFocusedSiteId] = useState<string | null>(null);
  const [showIcmmBenchmark, setShowIcmmBenchmark] = useState<boolean>(true);

  useEffect(() => {
    setActiveRegion(selectedRegion);
    setVisibleSiteIds(REGIONAL_ESG_SITES[selectedRegion].map((s) => s.siteId));
    setFocusedSiteId(null);
  }, [selectedRegion]);

  const handleRegionSelect = (reg: Region) => {
    setActiveRegion(reg);
    setVisibleSiteIds(REGIONAL_ESG_SITES[reg].map((s) => s.siteId));
    setFocusedSiteId(null);
    if (onSelectRegion) {
      onSelectRegion(reg);
    }
  };

  const regionSites: RegionalMineSiteESG[] = REGIONAL_ESG_SITES[activeRegion];

  const toggleSiteVisibility = (siteId: string) => {
    setVisibleSiteIds((prev) => {
      if (prev.includes(siteId)) {
        return prev.length > 1 ? prev.filter((id) => id !== siteId) : prev;
      }
      return [...prev, siteId];
    });
  };

  // Build Recharts RadarChart data structure comparing all mine sites in the selected region
  const radarChartData = useMemo(() => {
    const dimensions: Array<{
      key: keyof RegionalMineSiteESG['scores'];
      metric: string;
      benchmark: number;
    }> = [
      { key: 'tailingsStewardship', metric: 'Tailings & Water', benchmark: 88 },
      { key: 'decarbonization', metric: 'Decarbonization', benchmark: 85 },
      { key: 'occupationalSafety', metric: 'Zero-Harm Safety', benchmark: 90 },
      { key: 'biodiversityReclamation', metric: 'Biodiversity & Land', benchmark: 82 },
      { key: 'communityFPIC', metric: 'Community & FPIC', benchmark: 86 },
      { key: 'airSilicaSuppression', metric: 'Air & Silica Control', benchmark: 87 },
    ];

    return dimensions.map((dim) => {
      const entry: Record<string, string | number> = {
        metric: dim.metric,
        icmmBenchmark: dim.benchmark,
      };
      regionSites.forEach((site) => {
        entry[site.siteId] = site.scores[dim.key];
      });
      return entry;
    });
  }, [regionSites]);

  const regionalAvgEsg = Math.round(
    regionSites.reduce((sum, s) => sum + s.overallEsgScore, 0) / regionSites.length
  );

  const handleTriggerMedicalDispatch = (workerName: string, zone: string) => {
    setDispatchMessage(`EMERGENCY MEDICAL DISPATCH DISPATCHED: Mine Rescue Squad mobilized to ${zone} for ${workerName}. Stretcher & oxygen resuscitator en route.`);
    setTimeout(() => {
      setDispatchMessage(null);
    }, 7000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Healthcare Emblem */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-900/40 pb-4">
        <div className="flex items-center gap-3">
          <HealthcareLogo size="lg" showText={false} />
          <div>
            <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Occupational Health, Life Safety & ESG Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-0.5">
              Underground miner biometrics, respirable silica dust monitoring, toxic gas detection, and environmental ESG compliance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Zero-Harm Protocol Active</span>
          </span>
        </div>
      </div>

      {/* Emergency Dispatch Banner */}
      {dispatchMessage && (
        <div className="p-4 rounded-xl bg-rose-950 border-2 border-rose-500 text-rose-100 flex items-center justify-between animate-fadeIn shadow-2xl">
          <div className="flex items-center gap-3">
            <Ambulance size={24} className="text-rose-400 animate-bounce" />
            <span className="font-bold text-sm">{dispatchMessage}</span>
          </div>
          <button
            onClick={() => setDispatchMessage(null)}
            className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded text-xs font-bold"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Top 4 Safety Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl p-4 bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="uppercase font-semibold">Active Miners Monitored</span>
            <HardHat size={16} className="text-amber-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white font-['Space_Grotesk']">
            {workers.length}
          </p>
          <span className="text-xs text-emerald-400 font-medium">100% telemetry connection</span>
        </div>

        <div className="rounded-xl p-4 bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="uppercase font-semibold">Respirable Silica Dust</span>
            <Wind size={16} className="text-purple-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-purple-300 font-['Space_Grotesk']">
            0.028 <span className="text-sm font-normal text-stone-400">ppm</span>
          </p>
          <span className="text-xs text-emerald-400 font-medium">&lt; 0.05 ppm OSHA Limit</span>
        </div>

        <div className="rounded-xl p-4 bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="uppercase font-semibold">Ventilation Airflow</span>
            <Activity size={16} className="text-sky-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-sky-300 font-['Space_Grotesk']">
            145 <span className="text-sm font-normal text-stone-400">m³/s</span>
          </p>
          <span className="text-xs text-emerald-400 font-medium">Nominal cross-ventilation</span>
        </div>

        <div className="rounded-xl p-4 bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="uppercase font-semibold">Water Recycled (ESG)</span>
            <Droplets size={16} className="text-emerald-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-300 font-['Space_Grotesk']">
            92.4%
          </p>
          <span className="text-xs text-emerald-400 font-medium">Closed-loop tailing circuits</span>
        </div>
      </div>

      {/* Geographical Visualization Layer & Recharts Radar Comparison of ESG Compliance Scores */}
      <div
        id="geographical-esg-radar-layer"
        className="rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#1E110B] to-[#140B07] border border-amber-900/50 p-5 shadow-xl space-y-5"
      >
        {/* Header & Region Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Globe size={14} />
              <span>SPATIAL ESG TELEMETRY &amp; MULTI-SITE RADAR BENCHMARKING</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2">
              <Leaf size={20} className="text-emerald-400" />
              <span>
                Geographical ESG Compliance Layer — {activeRegion} Operating Sites
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Interactive spatial coordinate map and Recharts multi-axis Radar comparison of ICMM / TSM ESG compliance scores across mine sites in {activeRegion}.
            </p>
          </div>

          {/* Region Selector Controls */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-950/80 p-1.5 rounded-xl border border-stone-800">
            <span className="text-[11px] font-bold text-stone-400 px-2 flex items-center gap-1">
              <Compass size={12} className="text-amber-400" />
              <span>Region:</span>
            </span>
            {(['Canada', 'USA', 'Europe', 'Australia', 'Africa'] as Region[]).map((reg) => (
              <button
                key={reg}
                type="button"
                id={`btn-esg-region-${reg.toLowerCase()}`}
                onClick={() => handleRegionSelect(reg)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeRegion === reg
                    ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Split: Left = Geographical Spatial Map Layer, Right = Recharts ESG RadarChart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 6 Cols: Interactive Geographical Mine Site Visualization Layer */}
          <div className="lg:col-span-6 rounded-xl bg-stone-950/90 border border-stone-800 p-4 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <MapPin size={14} />
                  <span>{activeRegion} Spatial Mine Site ESG Overlay</span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  Click any mine site pin to highlight or toggle its polygon on the ESG Radar Chart
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-stone-400 block">Regional ESG Mean</span>
                <span className="text-sm font-extrabold text-emerald-400">{regionalAvgEsg} / 100</span>
              </div>
            </div>

            {/* Interactive SVG Geographical Coordinate Map Canvas */}
            <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-stone-800 bg-[#0F171E]">
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <radialGradient id="esg-terrain-glow" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#064e3b" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="#1c1917" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#0c0a09" stopOpacity="0.8" />
                  </radialGradient>
                </defs>

                {/* Base Terrain Fill */}
                <rect x="0" y="0" width="100" height="100" fill="url(#esg-terrain-glow)" />

                {/* Graticule Lat/Lng Grid Lines */}
                {[20, 40, 60, 80].map((pos) => (
                  <g key={pos}>
                    <line
                      x1={pos}
                      y1="0"
                      x2={pos}
                      y2="100"
                      stroke="#334155"
                      strokeWidth="0.25"
                      strokeDasharray="1.5 1.5"
                    />
                    <line
                      x1="0"
                      y1={pos}
                      x2="100"
                      y2={pos}
                      stroke="#334155"
                      strokeWidth="0.25"
                      strokeDasharray="1.5 1.5"
                    />
                  </g>
                ))}

                {/* Stylized Regional Geological Province Contours */}
                <path
                  d="M 10,30 Q 35,12 65,24 T 92,48 Q 78,82 45,86 T 12,62 Z"
                  fill="#065f46"
                  fillOpacity="0.14"
                  stroke="#10b981"
                  strokeWidth="0.4"
                  strokeDasharray="2 1"
                />
                <path
                  d="M 22,42 Q 48,26 74,40 T 80,72 Q 52,80 28,68 Z"
                  fill="#78350f"
                  fillOpacity="0.14"
                  stroke="#f59e0b"
                  strokeWidth="0.35"
                />

                {/* Inter-site ESG Corridor Telemetry Links */}
                {regionSites.length >= 3 && (
                  <polygon
                    points={regionSites
                      .map((s) => `${s.coordinates.mapX},${s.coordinates.mapY}`)
                      .join(' ')}
                    fill="#f59e0b"
                    fillOpacity="0.06"
                    stroke="#f59e0b"
                    strokeWidth="0.35"
                    strokeDasharray="1.2 1.2"
                  />
                )}
              </svg>

              {/* HTML Interactive Mine Site Pins Overlaid on Geographical Map */}
              {regionSites.map((site) => {
                const isVisible = visibleSiteIds.includes(site.siteId);
                const isFocused = focusedSiteId === site.siteId;
                return (
                  <button
                    key={site.siteId}
                    type="button"
                    onClick={() => {
                      setFocusedSiteId((prev) => (prev === site.siteId ? null : site.siteId));
                      if (!visibleSiteIds.includes(site.siteId)) {
                        toggleSiteVisibility(site.siteId);
                      }
                    }}
                    style={{
                      left: `${site.coordinates.mapX}%`,
                      top: `${site.coordinates.mapY}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all z-10 ${
                      isVisible ? 'opacity-100 scale-100' : 'opacity-45 scale-90'
                    }`}
                  >
                    {/* Pulsing ESG Compliance Halo */}
                    <span
                      className="absolute -inset-3 rounded-full animate-ping opacity-30"
                      style={{ backgroundColor: site.colorHex }}
                    />
                    <div
                      className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xl transition-transform ${
                        isFocused
                          ? 'scale-110 ring-2 ring-white bg-stone-950'
                          : 'bg-stone-950/95 hover:scale-105'
                      }`}
                      style={{ borderColor: site.colorHex }}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: site.colorHex }}
                      />
                      <span className="text-[11px] font-bold text-white whitespace-nowrap">
                        {site.siteName.split(' ')[0]}
                      </span>
                      <span
                        className="text-[10px] font-mono font-extrabold"
                        style={{ color: site.colorHex }}
                      >
                        {site.overallEsgScore}
                      </span>
                    </div>

                    {/* Geographical Coordinate & Telemetry Tooltip on Hover */}
                    <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-2.5 rounded-xl bg-stone-950/95 border border-amber-500/50 text-left text-[10px] shadow-2xl z-30 pointer-events-none">
                      <div className="font-bold text-white text-xs">{site.siteName}</div>
                      <div className="text-stone-400">{site.subProvince}</div>
                      <div className="font-mono text-amber-300 mt-1">
                        Lat {site.coordinates.lat.toFixed(2)}° · Lng {site.coordinates.lng.toFixed(2)}° · {site.elevationM}m
                      </div>
                      <div className="mt-1 pt-1 border-t border-stone-800 flex items-center justify-between text-emerald-400 font-mono">
                        <span>ESG Score: {site.overallEsgScore}/100</span>
                        <span>H₂O Rec: {site.waterRecycledPct}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Map Corner Legend & Coordinate System Stamp */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-stone-950/85 border border-stone-800/90 text-[10px] text-stone-300">
                <span className="font-mono">
                  CRS: WGS84 · {activeRegion} Mining Jurisdiction ({regionSites.length} Active Sites)
                </span>
                <span className="font-mono text-emerald-400">
                  InSAR &amp; Piezometer Telemetry: ONLINE
                </span>
              </div>
            </div>

            {/* Site Toggle Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                {regionSites.map((site) => {
                  const active = visibleSiteIds.includes(site.siteId);
                  return (
                    <button
                      key={site.siteId}
                      type="button"
                      onClick={() => toggleSiteVisibility(site.siteId)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-stone-900 text-white border-stone-700 shadow-sm'
                          : 'bg-stone-950 text-stone-500 border-stone-800/60'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: active ? site.colorHex : '#57534e',
                        }}
                      />
                      <span className="truncate max-w-[140px]">{site.siteName.split(' ')[0]}</span>
                      <span className="font-mono text-[10px] text-stone-400">
                        ({site.overallEsgScore})
                      </span>
                    </button>
                  );
                })}
              </div>

              <label className="flex items-center gap-1.5 text-[11px] text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showIcmmBenchmark}
                  onChange={(e) => setShowIcmmBenchmark(e.target.checked)}
                  className="rounded border-stone-700 bg-stone-900 text-amber-500"
                />
                <span>ICMM Benchmark</span>
              </label>
            </div>
          </div>

          {/* Right 6 Cols: Recharts Multi-Site ESG Compliance RadarChart */}
          <div className="lg:col-span-6 rounded-xl bg-stone-950/90 border border-stone-800 p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Award size={14} />
                  <span>Multi-Site ESG Compliance Radar Chart (Recharts)</span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  6-axis sustainability &amp; occupational health comparison across {activeRegion} mine sites
                </p>
              </div>
              {focusedSiteId && (
                <button
                  type="button"
                  onClick={() => setFocusedSiteId(null)}
                  className="text-[11px] text-amber-400 hover:underline font-semibold"
                >
                  Show All Equally
                </button>
              )}
            </div>

            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="74%" data={radarChartData}>
                  <PolarGrid stroke="#44403c" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: '#e7e5e4', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[60, 100]}
                    tick={{ fill: '#a8a29e', fontSize: 9 }}
                    axisLine={false}
                  />

                  {showIcmmBenchmark && (
                    <Radar
                      name="ICMM / TSM Benchmark"
                      dataKey="icmmBenchmark"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fill="#94a3b8"
                      fillOpacity={0.08}
                      isAnimationActive={false}
                    />
                  )}

                  {regionSites
                    .filter((s) => visibleSiteIds.includes(s.siteId))
                    .map((site) => {
                      const isFocused = focusedSiteId === site.siteId;
                      const isDimmed = focusedSiteId !== null && !isFocused;
                      return (
                        <Radar
                          key={site.siteId}
                          name={site.siteName}
                          dataKey={site.siteId}
                          stroke={site.colorHex}
                          strokeWidth={isFocused ? 3 : 2}
                          fill={site.colorHex}
                          fillOpacity={isFocused ? 0.35 : isDimmed ? 0.06 : 0.18}
                          isAnimationActive={false}
                        />
                      );
                    })}

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c0a09',
                      borderColor: '#f59e0b',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      color: '#f5f5f4',
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: '11px',
                      paddingTop: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom 3-Card Site ESG Breakdown Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {regionSites.map((site) => {
            const isFocused = focusedSiteId === site.siteId;
            return (
              <div
                key={site.siteId}
                onClick={() =>
                  setFocusedSiteId((prev) => (prev === site.siteId ? null : site.siteId))
                }
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  isFocused
                    ? 'bg-stone-900 border-amber-400 shadow-lg'
                    : 'bg-stone-900/70 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: site.colorHex }}
                      />
                      <h4 className="font-bold text-white text-xs sm:text-sm font-['Space_Grotesk']">
                        {site.siteName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      {site.subProvince} · {site.coordinates.lat.toFixed(2)}°, {site.coordinates.lng.toFixed(2)}°
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <span
                      className="text-lg font-extrabold"
                      style={{ color: site.colorHex }}
                    >
                      {site.overallEsgScore}
                    </span>
                    <span className="text-[10px] text-stone-400 block">ESG Index</span>
                  </div>
                </div>

                <div className="text-[11px] text-stone-300 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400 flex-shrink-0" />
                  <span className="truncate">{site.certification}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800/80 text-[11px] font-mono">
                  <div>
                    <span className="text-stone-400 block text-[10px]">Water Rec.</span>
                    <strong className="text-emerald-400">{site.waterRecycledPct}%</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">Scope 1+2</span>
                    <strong className="text-amber-300">{site.scope1And2IntensityKgCO2ePerT} kg/t</strong>
                  </div>
                  <div>
                    <span className="text-stone-400 block text-[10px]">TRIFR</span>
                    <strong className="text-sky-300">{site.trifrPerMillionHours}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Quarterly Health and Safety Incident Trends Chart */}
      <SafetyIncidentTrendsChart />

      {/* Equipment Maintenance Downtime vs. Safety Incident Frequency Correlation Chart (Recharts) */}
      <SafetyDowntimeCorrelationChart />

      {/* Predictive Maintenance & Equipment Safety Analytics Module */}
      <PredictiveMaintenanceModule />

      {/* Main Grid: Live Personnel Vitals & Underground Sensor Array */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Worker Biometric Telemetry */}
        <div className="lg:col-span-2 rounded-2xl bg-[#2A1810]/70 border border-stone-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-['Space_Grotesk']">
                <HeartPulse size={18} className="text-rose-400" />
                <span>Underground Personnel Biometric Roster</span>
              </h2>
              <p className="text-xs text-stone-400">
                Continuous heart rate, SpO₂, core temperature, and heat-stress fatigue index
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              Live Mesh Beacon
            </span>
          </div>

          <div className="space-y-3">
            {workers.map((worker) => {
              const isUrgent = worker.status === 'Urgent Check';
              const isAdvisory = worker.status === 'Advisory';
              return (
                <div
                  key={worker.workerId}
                  onClick={() => setSelectedWorker(worker)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    selectedWorker.workerId === worker.workerId
                      ? 'bg-purple-950/60 border-amber-500 shadow-md'
                      : 'bg-stone-900/70 border-stone-800/80 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl font-bold text-xs ${
                        isUrgent
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : isAdvisory
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      <HardHat size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{worker.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                          {worker.workerId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isUrgent
                              ? 'bg-rose-600 text-white'
                              : isAdvisory
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {worker.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {worker.role} • <strong className="text-stone-300">{worker.zone}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-center">
                      <span className="text-stone-400 block text-[10px]">Heart Rate</span>
                      <strong
                        className={`text-sm ${
                          worker.heartRateBpm > 100 ? 'text-rose-400 font-extrabold' : 'text-emerald-300'
                        }`}
                      >
                        {worker.heartRateBpm} BPM
                      </strong>
                    </div>
                    <div className="text-center">
                      <span className="text-stone-400 block text-[10px]">Core Temp</span>
                      <strong
                        className={`text-sm ${
                          worker.coreTempC > 38.0 ? 'text-rose-400 font-extrabold' : 'text-white'
                        }`}
                      >
                        {worker.coreTempC}°C
                      </strong>
                    </div>
                    <div className="text-center">
                      <span className="text-stone-400 block text-[10px]">SpO₂</span>
                      <strong className="text-sm text-sky-300">{worker.oxygenSaturationPct}%</strong>
                    </div>

                    {isUrgent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTriggerMedicalDispatch(worker.name, worker.zone);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-colors flex items-center gap-1"
                      >
                        <Ambulance size={14} />
                        <span>Dispatch Medic</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Toxic Gas & Ventilation Telemetry */}
        <div className="rounded-2xl bg-[#2A1810]/70 border border-stone-800 p-5 space-y-4">
          <div className="border-b border-stone-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Space_Grotesk']">
              <Wind size={18} className="text-amber-400" />
              <span>Atmospheric Sensors & InSAR</span>
            </h3>
            <p className="text-xs text-stone-400">Underground air safety and tailings dam integrity</p>
          </div>

          <div className="space-y-3">
            {MINE_TELEMETRY.map((station, sIdx) => (
              <div
                key={sIdx}
                className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-stone-200">{station.zoneName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      station.hazardStatus === 'Safe'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {station.hazardStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400">
                  <div className="p-2 rounded bg-black/40 border border-stone-800">
                    <span>Oxygen (O₂):</span>
                    <p className="text-sm font-bold text-white mt-0.5">{station.o2Pct}%</p>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-stone-800">
                    <span>Carbon Monoxide:</span>
                    <p className="text-sm font-bold text-white mt-0.5">{station.coPpm} ppm</p>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-stone-800">
                    <span>Methane (CH₄):</span>
                    <p className="text-sm font-bold text-white mt-0.5">{station.ch4Pct}%</p>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-stone-800">
                    <span>Silica Dust:</span>
                    <p className="text-sm font-bold text-amber-400 mt-0.5">
                      {station.respirableSilicaUgM3} µg/m³
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ESG Standard compliance note */}
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/30 text-xs space-y-1">
            <span className="text-[10px] font-bold uppercase text-purple-300">ESG Standards Compliant</span>
            <p className="text-[11px] text-stone-300">
              Audited against ICMM (International Council on Mining and Metals) Health & Safety framework and TSM (Towards Sustainable Mining).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
