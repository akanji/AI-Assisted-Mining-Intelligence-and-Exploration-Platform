import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  Activity,
  BarChart3,
  Layers,
  Sparkles,
  Scale,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { DrillHole, DrillInterval } from '../types';

interface DrillLogVisualizationChartProps {
  selectedHole: DrillHole;
}

export interface DownholeDensityConcentrationPoint {
  intervalIndex: number;
  depthLabel: string;
  midDepthM: number;
  fromM: number;
  toM: number;
  thicknessM: number;
  lithology: string;
  mineralization: string;
  color: string;
  coreDensityGcm3: number;
  auGpt: number;
  cuPct: number;
  liPct: number;
  primaryConcentration: number;
  primaryUnit: string;
  mineralConcentrationPct: number;
  rockCompetencyRqd: number;
}

// Derive petrophysically realistic bulk density (g/cm³) from lithology + mineral assays
function computeCoreSampleDensity(interval: DrillInterval, index: number): number {
  const lith = (interval.lithology || '').toLowerCase();
  const min = (interval.mineralization || interval.alteration || '').toLowerCase();
  const au = interval.assayAuGpt ?? 0;
  const cu = interval.assayCuPct ?? 0;
  const li = interval.assayLiPct ?? 0;

  let baseDensity = 2.72; // average crustal silicate rock (g/cm³)

  if (lith.includes('overburden') || lith.includes('till') || lith.includes('saprolite') || lith.includes('regolith')) {
    baseDensity = 2.18;
  } else if (lith.includes('leached') || lith.includes('limonite')) {
    baseDensity = 2.44;
  } else if (lith.includes('pegmatite') || lith.includes('spodumene')) {
    baseDensity = 2.78 + Math.min(0.38, li * 0.14);
  } else if (lith.includes('breccia') || lith.includes('massive') || min.includes('semi-massive')) {
    baseDensity = 3.24;
  } else if (lith.includes('basalt') || lith.includes('andesite') || lith.includes('amphibolite') || lith.includes('komatiite')) {
    baseDensity = 2.94;
  } else if (lith.includes('diorite') || lith.includes('monzonite') || lith.includes('granodiorite')) {
    baseDensity = 2.81;
  } else if (lith.includes('rhyolite') || lith.includes('dacite') || lith.includes('gneiss') || lith.includes('schist')) {
    baseDensity = 2.69;
  }

  // Add sulfide/ore specific gravity contribution (chalcopyrite SG ~4.2, arsenopyrite SG ~6.1, spodumene SG ~3.18)
  const sulfideContribution = cu * 0.19 + (au > 1.0 ? Math.min(0.32, au * 0.055) : au * 0.02);
  const lithiumContribution = li * 0.08;
  const microVariation = ((index % 3) - 1) * 0.02;

  const finalDensity = Math.min(4.25, Math.max(2.05, baseDensity + sulfideContribution + lithiumContribution + microVariation));
  return Number(finalDensity.toFixed(2));
}

export const DrillLogVisualizationChart: React.FC<DrillLogVisualizationChartProps> = ({
  selectedHole,
}) => {
  const [chartMode, setChartMode] = useState<'combined' | 'multielement' | 'step_profile'>('combined');
  const [showCutoffLines, setShowCutoffLines] = useState<boolean>(true);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  // Determine dominant commodity unit for the selected drillhole
  const dominantCommodityInfo = useMemo(() => {
    const hasLi = selectedHole.intervals.some((i) => (i.assayLiPct ?? 0) > 0.1);
    const hasCu = selectedHole.intervals.some((i) => (i.assayCuPct ?? 0) > 0.2);
    const hasAu = selectedHole.intervals.some((i) => (i.assayAuGpt ?? 0) > 0.2);

    if (hasLi && !hasAu) {
      return { label: 'Li₂O Concentration (%)', unit: '% Li₂O', cutoff: 0.8 };
    }
    if (hasCu && !hasAu) {
      return { label: 'Cu Concentration (%)', unit: '% Cu', cutoff: 0.5 };
    }
    return { label: 'Au / Eq Concentration (g/t)', unit: 'g/t Au', cutoff: 1.5 };
  }, [selectedHole]);

  // Build downhole dataset for Recharts
  const chartData: DownholeDensityConcentrationPoint[] = useMemo(() => {
    return selectedHole.intervals.map((iv, idx) => {
      const fromM = iv.fromDepthM ?? iv.from ?? idx * 50;
      const toM = iv.toDepthM ?? iv.to ?? fromM + 50;
      const midDepthM = Math.round((fromM + toM) / 2);
      const thicknessM = Math.max(1, toM - fromM);

      const auGpt = Number((iv.assayAuGpt ?? 0).toFixed(2));
      const cuPct = Number((iv.assayCuPct ?? 0).toFixed(2));
      const liPct = Number((iv.assayLiPct ?? 0).toFixed(2));

      let primaryConcentration = auGpt;
      let primaryUnit = 'g/t Au';

      if (iv.primaryGradeValue !== undefined && iv.gradeUnit) {
        primaryConcentration = iv.primaryGradeValue;
        primaryUnit = iv.gradeUnit;
      } else if (liPct > 0 && auGpt === 0) {
        primaryConcentration = liPct;
        primaryUnit = '% Li₂O';
      } else if (cuPct > 0 && auGpt === 0) {
        primaryConcentration = cuPct;
        primaryUnit = '% Cu';
      } else if (auGpt > 0) {
        primaryConcentration = auGpt;
        primaryUnit = 'g/t Au';
      } else if (cuPct > 0) {
        primaryConcentration = cuPct;
        primaryUnit = '% Cu';
      }

      const coreDensityGcm3 = computeCoreSampleDensity(iv, idx);

      // Total modal mineral concentration (%) combining sulfide/oxide/spodumene enrichment
      const mineralConcentrationPct = Number(
        Math.min(
          38.0,
          Math.max(
            0.4,
            cuPct * 2.85 + liPct * 6.4 + auGpt * 1.65 + (coreDensityGcm3 - 2.6) * 4.2
          )
        ).toFixed(2)
      );

      const rockCompetencyRqd = Math.min(
        98,
        Math.max(52, Math.round(62 + (coreDensityGcm3 - 2.2) * 24))
      );

      return {
        intervalIndex: idx,
        depthLabel: `${fromM}–${toM}m`,
        midDepthM,
        fromM,
        toM,
        thicknessM,
        lithology: iv.lithology,
        mineralization: iv.mineralization || iv.alteration || 'Disseminated',
        color: iv.color || '#f59e0b',
        coreDensityGcm3,
        auGpt,
        cuPct,
        liPct,
        primaryConcentration,
        primaryUnit,
        mineralConcentrationPct,
        rockCompetencyRqd,
      };
    });
  }, [selectedHole]);

  // Summary Petrophysical & Assay KPIs
  const summaryMetrics = useMemo(() => {
    if (chartData.length === 0) {
      return {
        meanDensity: 2.75,
        peakDensity: 3.12,
        peakDensityInterval: '0–50m',
        peakConcentration: 0,
        peakConcentrationUnit: 'g/t',
        peakConcentrationInterval: '0–50m',
        meanMineralConcPct: 0,
      };
    }

    const totalLen = chartData.reduce((acc, d) => acc + d.thicknessM, 0) || 1;
    const weightedDensity =
      chartData.reduce((acc, d) => acc + d.coreDensityGcm3 * d.thicknessM, 0) / totalLen;

    const peakDensityPt = chartData.reduce(
      (max, d) => (d.coreDensityGcm3 > max.coreDensityGcm3 ? d : max),
      chartData[0]
    );
    const peakConcPt = chartData.reduce(
      (max, d) => (d.primaryConcentration > max.primaryConcentration ? d : max),
      chartData[0]
    );
    const meanMineralConcPct =
      chartData.reduce((acc, d) => acc + d.mineralConcentrationPct * d.thicknessM, 0) / totalLen;

    return {
      meanDensity: Number(weightedDensity.toFixed(2)),
      peakDensity: peakDensityPt.coreDensityGcm3,
      peakDensityInterval: peakDensityPt.depthLabel,
      peakConcentration: peakConcPt.primaryConcentration,
      peakConcentrationUnit: peakConcPt.primaryUnit,
      peakConcentrationInterval: peakConcPt.depthLabel,
      meanMineralConcPct: Number(meanMineralConcPct.toFixed(2)),
    };
  }, [chartData]);

  return (
    <div
      id="drill-log-density-concentration-chart"
      className="rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#1E110B] to-[#140B07] border border-amber-900/50 p-5 shadow-xl space-y-5"
    >
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Scale size={14} />
            <span>PETROPHYSICAL CORE LOGGING &amp; ASSAY CONCENTRATION TELEMETRY</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <BarChart3 size={20} className="text-amber-400" />
            <span>
              Downhole Core Sample Density &amp; Mineral Concentration — {selectedHole.holeId}
            </span>
          </h3>
          <p className="text-xs text-stone-400">
            Synchronized Recharts petrophysical bulk density (g/cm³) and downhole mineral concentration profile across {selectedHole.intervals.length} logged intervals (0 to {selectedHole.totalDepthM} m).
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-stone-950 border border-stone-800">
            <button
              type="button"
              id="btn-log-chart-combined"
              onClick={() => setChartMode('combined')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartMode === 'combined'
                  ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Density vs. Grade
            </button>
            <button
              type="button"
              id="btn-log-chart-multielement"
              onClick={() => setChartMode('multielement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartMode === 'multielement'
                  ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Multi-Mineral (Au/Cu/Li)
            </button>
            <button
              type="button"
              id="btn-log-chart-step"
              onClick={() => setChartMode('step_profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartMode === 'step_profile'
                  ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Modal Ore % &amp; SG
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-xs text-stone-300 bg-stone-900/90 border border-stone-800 px-3 py-1.5 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={showCutoffLines}
              onChange={(e) => setShowCutoffLines(e.target.checked)}
              className="rounded border-stone-700 bg-stone-950 text-amber-500"
            />
            <span>Cut-Off &amp; SG Baselines</span>
          </label>
        </div>
      </div>

      {/* 4-Card Petrophysical & Concentration KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800/90 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="uppercase tracking-wider font-semibold">Mean Core Bulk Density</span>
            <Scale size={14} className="text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white font-mono">
              {summaryMetrics.meanDensity}
            </span>
            <span className="text-xs text-cyan-400 font-mono">g/cm³ (SG)</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Length-weighted across {selectedHole.totalDepthM} m core
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800/90 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="uppercase tracking-wider font-semibold">Peak Sample Density</span>
            <Activity size={14} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              {summaryMetrics.peakDensity}
            </span>
            <span className="text-xs text-stone-400 font-mono">g/cm³</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Intercept: <strong className="text-stone-200">{summaryMetrics.peakDensityInterval}</strong>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800/90 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="uppercase tracking-wider font-semibold">Peak Mineral Concentration</span>
            <TrendingUp size={14} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-amber-400 font-mono">
              {summaryMetrics.peakConcentration}
            </span>
            <span className="text-xs text-amber-300 font-mono">
              {summaryMetrics.peakConcentrationUnit}
            </span>
          </div>
          <p className="text-[11px] text-stone-400">
            High-grade zone: <strong className="text-stone-200">{summaryMetrics.peakConcentrationInterval}</strong>
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-stone-950/80 border border-stone-800/90 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="uppercase tracking-wider font-semibold">Modal Mineral Enrichment</span>
            <Sparkles size={14} className="text-purple-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-purple-300 font-mono">
              {summaryMetrics.meanMineralConcPct}%
            </span>
            <span className="text-xs text-stone-400 font-mono">Avg Ore Modal</span>
          </div>
          <p className="text-[11px] text-stone-400">
            Positive density–concentration correlation
          </p>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="rounded-xl bg-stone-950/90 border border-stone-800 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <Layers size={14} className="text-amber-400" />
            <span className="font-bold text-white">
              {chartMode === 'combined'
                ? `Downhole Core Sample Bulk Density (g/cm³) vs. ${dominantCommodityInfo.label}`
                : chartMode === 'multielement'
                ? 'Multi-Element Mineral Concentration Profile (Au g/t · Cu % · Li₂O %) & Core Density'
                : 'Modal Mineral Concentration (%) & Step-Log Core Density Profile'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
              Core Sample Density (g/cm³)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
              Mineral Concentration
            </span>
          </div>
        </div>

        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 24, left: 8, bottom: 12 }}
            >
              <defs>
                <linearGradient id="coreDensityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="modalConcFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.04} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#292524" strokeDasharray="3 3" />

              <XAxis
                dataKey="depthLabel"
                tick={{ fill: '#d6d3d1', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: '#44403c' }}
                tickLine={{ stroke: '#44403c' }}
              />

              {/* Left Y-Axis: Core Sample Bulk Density (g/cm³) */}
              <YAxis
                yAxisId="density"
                orientation="left"
                domain={[2.0, 4.0]}
                tick={{ fill: '#22d3ee', fontSize: 11 }}
                axisLine={{ stroke: '#0891b2' }}
                label={{
                  value: 'Core Density (g/cm³)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#22d3ee',
                  fontSize: 11,
                }}
              />

              {/* Right Y-Axis: Mineral Concentration */}
              <YAxis
                yAxisId="concentration"
                orientation="right"
                tick={{ fill: '#f59e0b', fontSize: 11 }}
                axisLine={{ stroke: '#d97706' }}
                label={{
                  value:
                    chartMode === 'step_profile'
                      ? 'Modal Concentration (%)'
                      : dominantCommodityInfo.label,
                  angle: 90,
                  position: 'insideRight',
                  fill: '#f59e0b',
                  fontSize: 11,
                }}
              />

              {showCutoffLines && (
                <>
                  <ReferenceLine
                    yAxisId="density"
                    y={2.75}
                    stroke="#22d3ee"
                    strokeDasharray="4 4"
                    strokeOpacity={0.65}
                    label={{
                      value: 'Country Rock SG (2.75 g/cm³)',
                      position: 'insideTopLeft',
                      fill: '#67e8f9',
                      fontSize: 10,
                    }}
                  />
                  <ReferenceLine
                    yAxisId="concentration"
                    y={chartMode === 'step_profile' ? 8.0 : dominantCommodityInfo.cutoff}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeOpacity={0.75}
                    label={{
                      value:
                        chartMode === 'step_profile'
                          ? 'Economic Modal Cut-Off (8%)'
                          : `Economic Cut-Off (${dominantCommodityInfo.cutoff} ${dominantCommodityInfo.unit})`,
                      position: 'insideTopRight',
                      fill: '#fcd34d',
                      fontSize: 10,
                    }}
                  />
                </>
              )}

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const pt: DownholeDensityConcentrationPoint = payload[0].payload;
                  return (
                    <div className="rounded-xl bg-stone-950/95 border border-amber-500/50 p-3.5 text-xs shadow-2xl space-y-2 min-w-[250px]">
                      <div className="flex items-center justify-between border-b border-stone-800 pb-1.5">
                        <span className="font-extrabold text-amber-300 font-mono">
                          Depth: {pt.fromM}m – {pt.toM}m ({pt.thicknessM}m)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 text-stone-300">
                          Mid: {pt.midDepthM}m
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-white">{pt.lithology}</div>
                        <div className="text-[11px] text-purple-300">{pt.mineralization}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-800/80 font-mono text-[11px]">
                        <div>
                          <span className="text-stone-400 block text-[10px]">Core Sample Density</span>
                          <strong className="text-cyan-400 text-xs">{pt.coreDensityGcm3} g/cm³</strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Primary Concentration</span>
                          <strong className="text-amber-400 text-xs">
                            {pt.primaryConcentration} {pt.primaryUnit}
                          </strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Modal Ore Conc.</span>
                          <strong className="text-purple-300">{pt.mineralConcentrationPct}%</strong>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Est. Core RQD</span>
                          <strong className="text-emerald-400">{pt.rockCompetencyRqd}%</strong>
                        </div>
                      </div>

                      {(pt.auGpt > 0 || pt.cuPct > 0 || pt.liPct > 0) && (
                        <div className="pt-1 border-t border-stone-800/80 flex items-center gap-3 text-[10px] font-mono text-stone-300">
                          <span>Au: {pt.auGpt} g/t</span>
                          <span>·</span>
                          <span>Cu: {pt.cuPct}%</span>
                          <span>·</span>
                          <span>Li₂O: {pt.liPct}%</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              <Legend
                wrapperStyle={{
                  fontSize: '11px',
                  paddingTop: '8px',
                }}
              />

              {chartMode === 'combined' && (
                <>
                  <Bar
                    yAxisId="concentration"
                    dataKey="primaryConcentration"
                    name={`Mineral Concentration (${dominantCommodityInfo.unit})`}
                    barSize={38}
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={false}
                  >
                    {chartData.map((entry, idx) => {
                      const isHighlighted =
                        highlightedIndex === null || highlightedIndex === idx;
                      return (
                        <Cell
                          key={`cell-${idx}`}
                          fill={
                            entry.primaryConcentration >= dominantCommodityInfo.cutoff
                              ? '#f59e0b'
                              : '#78716c'
                          }
                          fillOpacity={isHighlighted ? 0.85 : 0.3}
                        />
                      );
                    })}
                  </Bar>
                  <Area
                    yAxisId="density"
                    type="monotone"
                    dataKey="coreDensityGcm3"
                    name="Core Sample Bulk Density (g/cm³)"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    fill="url(#coreDensityFill)"
                    dot={{ r: 4, fill: '#22d3ee', stroke: '#083344', strokeWidth: 1.5 }}
                    activeDot={{ r: 6, fill: '#ecfeff', stroke: '#22d3ee', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </>
              )}

              {chartMode === 'multielement' && (
                <>
                  <Bar
                    yAxisId="concentration"
                    dataKey="auGpt"
                    name="Gold Concentration (Au g/t)"
                    fill="#f59e0b"
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    yAxisId="concentration"
                    dataKey="cuPct"
                    name="Copper Concentration (Cu %)"
                    fill="#10b981"
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar
                    yAxisId="concentration"
                    dataKey="liPct"
                    name="Lithium Concentration (Li₂O %)"
                    fill="#ec4899"
                    barSize={20}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="density"
                    type="monotone"
                    dataKey="coreDensityGcm3"
                    name="Core Sample Bulk Density (g/cm³)"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#22d3ee' }}
                    isAnimationActive={false}
                  />
                </>
              )}

              {chartMode === 'step_profile' && (
                <>
                  <Area
                    yAxisId="concentration"
                    type="stepAfter"
                    dataKey="mineralConcentrationPct"
                    name="Modal Mineral Concentration (%)"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fill="url(#modalConcFill)"
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="density"
                    type="stepAfter"
                    dataKey="coreDensityGcm3"
                    name="Step-Log Core Sample Density (g/cm³)"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#22d3ee' }}
                    isAnimationActive={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Interval Filter Pills / Cards */}
        <div className="pt-2 border-t border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider">
              <Filter size={12} className="text-amber-400" />
              <span>Interactive Downhole Interval Inspector (Click to isolate interval)</span>
            </span>
            {highlightedIndex !== null && (
              <button
                type="button"
                onClick={() => setHighlightedIndex(null)}
                className="text-amber-400 hover:underline font-semibold"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {chartData.map((pt, idx) => {
              const isSelected = highlightedIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setHighlightedIndex((prev) => (prev === idx ? null : idx))
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-md'
                      : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-white">{pt.depthLabel}</span>
                    <span className="text-cyan-400 font-bold">{pt.coreDensityGcm3} g/cm³</span>
                  </div>
                  <div className="text-[11px] text-stone-300 truncate mt-0.5">
                    {pt.lithology}
                  </div>
                  <div className="text-[10px] font-mono text-amber-300 font-bold mt-1">
                    Conc: {pt.primaryConcentration} {pt.primaryUnit} ({pt.mineralConcentrationPct}% modal)
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
