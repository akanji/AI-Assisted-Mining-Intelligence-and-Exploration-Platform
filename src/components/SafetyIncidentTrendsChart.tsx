import React, { useState } from 'react';
import {
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  Activity,
  BarChart3,
  Calendar,
  Layers,
  Info,
  Plus,
  CheckCircle2,
  ChevronRight,
  Flame,
  UserCheck,
} from 'lucide-react';

export interface QuarterlySafetyData {
  quarter: string;
  year: number;
  label: string;
  hoursWorked: number;
  nearMisses: number;
  firstAidInjuries: number;
  medicalTreatmentCases: number;
  lostTimeInjuries: number;
  heatStressEvents: number;
  trifr: number; // Total Recordable Injury Frequency Rate per million hours
  ltifr: number; // Lost Time Injury Frequency Rate per million hours
  keyInterventions: string[];
}

const INITIAL_QUARTERLY_DATA: QuarterlySafetyData[] = [
  {
    quarter: 'Q1',
    year: 2025,
    label: 'Q1 2025',
    hoursWorked: 420000,
    nearMisses: 24,
    firstAidInjuries: 6,
    medicalTreatmentCases: 2,
    lostTimeInjuries: 1,
    heatStressEvents: 4,
    trifr: 2.14,
    ltifr: 2.38,
    keyInterventions: [
      'Rollout of personal wearable gas monitors on Level 4',
      'Mandatory pre-shift rockfall hazard checks at Stope 12',
    ],
  },
  {
    quarter: 'Q2',
    year: 2025,
    label: 'Q2 2025',
    hoursWorked: 460000,
    nearMisses: 32,
    firstAidInjuries: 5,
    medicalTreatmentCases: 1,
    lostTimeInjuries: 0,
    heatStressEvents: 5,
    trifr: 1.30,
    ltifr: 0.00,
    keyInterventions: [
      'Installed active cooling stations at Sub-Level 2 South',
      'Hydration and core body temp telemetry protocol introduced',
    ],
  },
  {
    quarter: 'Q3',
    year: 2025,
    label: 'Q3 2025',
    hoursWorked: 485000,
    nearMisses: 41,
    firstAidInjuries: 4,
    medicalTreatmentCases: 1,
    lostTimeInjuries: 0,
    heatStressEvents: 2,
    trifr: 1.03,
    ltifr: 0.00,
    keyInterventions: [
      'AI-assisted haulage proximity radar on underground trucks',
      'Respirable silica mist suppression scrubbers deployed',
    ],
  },
  {
    quarter: 'Q4',
    year: 2025,
    label: 'Q4 2025',
    hoursWorked: 510000,
    nearMisses: 48,
    firstAidInjuries: 3,
    medicalTreatmentCases: 0,
    lostTimeInjuries: 0,
    heatStressEvents: 1,
    trifr: 0.59,
    ltifr: 0.00,
    keyInterventions: [
      'Autonomous drone geological roof bolting inspection',
      'Zero-Harm safety pledge achieved across both mining shifts',
    ],
  },
  {
    quarter: 'Q1',
    year: 2026,
    label: 'Q1 2026 (Current)',
    hoursWorked: 495000,
    nearMisses: 54,
    firstAidInjuries: 2,
    medicalTreatmentCases: 0,
    lostTimeInjuries: 0,
    heatStressEvents: 1,
    trifr: 0.40,
    ltifr: 0.00,
    keyInterventions: [
      'Real-time biometrics mesh network across all underground personnel',
      'Proactive near-miss reporting incentive program',
    ],
  },
];

type ChartViewType = 'incident_volume' | 'frequency_rates' | 'safety_pyramid';

export const SafetyIncidentTrendsChart: React.FC = () => {
  const [data, setData] = useState<QuarterlySafetyData[]>(INITIAL_QUARTERLY_DATA);
  const [activeView, setActiveView] = useState<ChartViewType>('incident_volume');
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterlySafetyData>(
    INITIAL_QUARTERLY_DATA[INITIAL_QUARTERLY_DATA.length - 1]
  );
  const [hoveredQuarter, setHoveredQuarter] = useState<QuarterlySafetyData | null>(null);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // New incident form state
  const [newIncidentType, setNewIncidentType] = useState<
    'nearMiss' | 'firstAid' | 'medicalTreatment' | 'heatStress'
  >('nearMiss');
  const [incidentNotes, setIncidentNotes] = useState<string>('');

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    setData((prev) =>
      prev.map((q) => {
        if (q.label === selectedQuarter.label) {
          const updated = { ...q };
          if (newIncidentType === 'nearMiss') updated.nearMisses += 1;
          if (newIncidentType === 'firstAid') updated.firstAidInjuries += 1;
          if (newIncidentType === 'medicalTreatment') updated.medicalTreatmentCases += 1;
          if (newIncidentType === 'heatStress') updated.heatStressEvents += 1;

          // Recalculate TRIFR: (First Aid + Medical Treatment + Lost Time) * 1,000,000 / hoursWorked
          const recordables =
            updated.firstAidInjuries + updated.medicalTreatmentCases + updated.lostTimeInjuries;
          updated.trifr = Number(((recordables * 1000000) / updated.hoursWorked).toFixed(2));
          if (incidentNotes.trim()) {
            updated.keyInterventions = [
              incidentNotes.trim(),
              ...updated.keyInterventions.slice(0, 2),
            ];
          }
          setSelectedQuarter(updated);
          return updated;
        }
        return q;
      })
    );
    setShowLogModal(false);
    setIncidentNotes('');
  };

  // Dimensions for SVG rendering
  const svgWidth = 720;
  const svgHeight = 280;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Maximum values for scaling
  const maxIncidents = Math.max(
    ...data.map(
      (d) =>
        d.nearMisses +
        d.firstAidInjuries +
        d.medicalTreatmentCases +
        d.lostTimeInjuries +
        d.heatStressEvents
    ),
    60
  );
  const maxTrifr = Math.max(...data.map((d) => Math.max(d.trifr, d.ltifr)), 3.0);

  // Overall KPI metrics
  const latestQuarter = data[data.length - 1];
  const firstQuarter = data[0];
  const trifrImprovementPct = Math.round(
    ((firstQuarter.trifr - latestQuarter.trifr) / firstQuarter.trifr) * 100
  );
  const totalNearMisses = data.reduce((acc, q) => acc + q.nearMisses, 0);
  const totalHoursWorked = data.reduce((acc, q) => acc + q.hoursWorked, 0);

  return (
    <div className="rounded-2xl bg-[#2A1810]/75 border border-stone-800 p-5 space-y-5 shadow-xl">
      {/* Title & View Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown size={20} className="text-emerald-400" />
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
              Quarterly Health &amp; Safety Incident Trends
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
              1-Year Rolling
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-0.5">
            Total Recordable Injury Frequency Rate (TRIFR), Lost Time Injuries (LTIs), heat stress, and proactive hazard reporting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-stone-900/90 rounded-xl p-1 border border-stone-800 text-xs">
            <button
              onClick={() => setActiveView('incident_volume')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === 'incident_volume'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Stacked Incidents
            </button>
            <button
              onClick={() => setActiveView('frequency_rates')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === 'frequency_rates'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              TRIFR &amp; LTIFR Rates
            </button>
            <button
              onClick={() => setActiveView('safety_pyramid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === 'safety_pyramid'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Safety Pyramid
            </button>
          </div>

          {/* Quick Log Button */}
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-bold transition-colors"
            title="Log safety incident or near miss"
          >
            <Plus size={14} className="text-amber-400" />
            <span>Log Event</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800">
          <span className="text-[11px] text-stone-400 block font-medium">Current TRIFR Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              {latestQuarter.trifr.toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">-{trifrImprovementPct}% YoY</span>
          </div>
          <span className="text-[10px] text-stone-400">Target &lt; 1.0 per million hrs</span>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800">
          <span className="text-[11px] text-stone-400 block font-medium">Lost Time Injuries (LTI)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-white font-mono">0</span>
            <span className="text-[11px] text-emerald-400 font-bold">348 Days LTI-Free</span>
          </div>
          <span className="text-[10px] text-stone-400">Zero-Harm compliance</span>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800">
          <span className="text-[11px] text-stone-400 block font-medium">Proactive Near Misses</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-400 font-mono">
              {totalNearMisses}
            </span>
            <span className="text-[11px] text-amber-400/90 font-bold">+125% Reporting</span>
          </div>
          <span className="text-[10px] text-stone-400">Healthy reporting culture</span>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800">
          <span className="text-[11px] text-stone-400 block font-medium">Underground Man-Hours</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-purple-300 font-mono">
              {(totalHoursWorked / 1000000).toFixed(2)}M
            </span>
            <span className="text-[11px] text-stone-400">Hours</span>
          </div>
          <span className="text-[10px] text-stone-400">Audited shift telemetry</span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative p-4 rounded-xl bg-stone-950/80 border border-stone-800/80">
        {activeView === 'incident_volume' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-semibold text-stone-300">
                Quarterly Incidents by Category (Stacked Columns)
              </span>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span className="text-stone-300">Near Miss (Proactive)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  <span className="text-stone-300">Heat Stress &amp; Fatigue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
                  <span className="text-stone-300">First Aid Injury</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                  <span className="text-stone-300">Medical Treatment</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-600" />
                  <span className="text-stone-300">Lost Time Injury</span>
                </div>
              </div>
            </div>

            {/* SVG Stacked Bar Chart */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto min-w-[580px]"
              >
                {/* Horizontal Grid lines */}
                {[0, 15, 30, 45, 60].map((val) => {
                  const y = padding.top + chartHeight - (val / maxIncidents) * chartHeight;
                  return (
                    <g key={val}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + chartWidth}
                        y2={y}
                        stroke="#33241C"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 4}
                        fill="#78716C"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Bars for Each Quarter */}
                {data.map((q, idx) => {
                  const barWidth = 56;
                  const groupSpacing = chartWidth / data.length;
                  const x = padding.left + idx * groupSpacing + (groupSpacing - barWidth) / 2;

                  // Height calculations
                  const nearMissH = (q.nearMisses / maxIncidents) * chartHeight;
                  const heatH = (q.heatStressEvents / maxIncidents) * chartHeight;
                  const faiH = (q.firstAidInjuries / maxIncidents) * chartHeight;
                  const mtcH = (q.medicalTreatmentCases / maxIncidents) * chartHeight;
                  const ltiH = (q.lostTimeInjuries / maxIncidents) * chartHeight;

                  const totalY = padding.top + chartHeight;
                  const isSelected = selectedQuarter.label === q.label;
                  const isHovered = hoveredQuarter?.label === q.label;

                  return (
                    <g
                      key={q.label}
                      className="cursor-pointer transition-opacity"
                      onClick={() => setSelectedQuarter(q)}
                      onMouseEnter={() => setHoveredQuarter(q)}
                      onMouseLeave={() => setHoveredQuarter(null)}
                    >
                      {/* Background selection highlight pillar */}
                      {(isSelected || isHovered) && (
                        <rect
                          x={x - 8}
                          y={padding.top}
                          width={barWidth + 16}
                          height={chartHeight + 10}
                          fill="rgba(245, 158, 11, 0.08)"
                          rx="6"
                        />
                      )}

                      {/* Near Misses (Base of Stack - Amber) */}
                      <rect
                        x={x}
                        y={totalY - nearMissH}
                        width={barWidth}
                        height={nearMissH}
                        fill="#F59E0B"
                        rx="2"
                      />

                      {/* Heat Stress (Rose) */}
                      {heatH > 0 && (
                        <rect
                          x={x}
                          y={totalY - nearMissH - heatH}
                          width={barWidth}
                          height={heatH}
                          fill="#F43F5E"
                          rx="1"
                        />
                      )}

                      {/* First Aid (Sky) */}
                      {faiH > 0 && (
                        <rect
                          x={x}
                          y={totalY - nearMissH - heatH - faiH}
                          width={barWidth}
                          height={faiH}
                          fill="#0284C7"
                          rx="1"
                        />
                      )}

                      {/* Medical Treatment (Purple) */}
                      {mtcH > 0 && (
                        <rect
                          x={x}
                          y={totalY - nearMissH - heatH - faiH - mtcH}
                          width={barWidth}
                          height={mtcH}
                          fill="#9333EA"
                          rx="1"
                        />
                      )}

                      {/* Lost Time Injury (Red) */}
                      {ltiH > 0 && (
                        <rect
                          x={x}
                          y={totalY - nearMissH - heatH - faiH - mtcH - ltiH}
                          width={barWidth}
                          height={ltiH}
                          fill="#DC2626"
                          rx="2"
                        />
                      )}

                      {/* Total Count Label Above Bar */}
                      <text
                        x={x + barWidth / 2}
                        y={totalY - nearMissH - heatH - faiH - mtcH - ltiH - 8}
                        fill={isSelected ? '#F59E0B' : '#E7E5E4'}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {q.nearMisses +
                          q.heatStressEvents +
                          q.firstAidInjuries +
                          q.medicalTreatmentCases +
                          q.lostTimeInjuries}
                      </text>

                      {/* X-Axis Quarter Label */}
                      <text
                        x={x + barWidth / 2}
                        y={padding.top + chartHeight + 22}
                        fill={isSelected ? '#F59E0B' : '#A8A29E'}
                        fontSize="11"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        textAnchor="middle"
                      >
                        {q.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {activeView === 'frequency_rates' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-semibold text-stone-300">
                TRIFR &amp; LTIFR Injury Rates per Million Hours Worked
              </span>
              <div className="flex items-center gap-4 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-400" />
                  <span className="text-emerald-300 font-bold">TRIFR (Total Recordable)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-400" />
                  <span className="text-rose-300 font-bold">LTIFR (Lost Time)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-amber-400" />
                  <span className="text-amber-400 font-bold">MSHA Target (1.00)</span>
                </div>
              </div>
            </div>

            {/* SVG Line / Area Chart */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto min-w-[580px]"
              >
                {/* Horizontal Grid */}
                {[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((val) => {
                  const y = padding.top + chartHeight - (val / maxTrifr) * chartHeight;
                  const isBenchmark = val === 1.0;
                  return (
                    <g key={val}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + chartWidth}
                        y2={y}
                        stroke={isBenchmark ? '#F59E0B' : '#33241C'}
                        strokeWidth={isBenchmark ? 1.5 : 1}
                        strokeDasharray={isBenchmark ? '6 4' : '4 4'}
                        opacity={isBenchmark ? 0.8 : 1}
                      />
                      <text
                        x={padding.left - 10}
                        y={y + 4}
                        fill={isBenchmark ? '#F59E0B' : '#78716C'}
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {val.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* Benchmark Tag */}
                <text
                  x={padding.left + chartWidth - 10}
                  y={padding.top + chartHeight - (1.0 / maxTrifr) * chartHeight - 6}
                  fill="#F59E0B"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  ICMM Benchmark Target (1.00)
                </text>

                {/* Generate Line Coordinates */}
                {(() => {
                  const points = data.map((d, i) => {
                    const groupSpacing = chartWidth / data.length;
                    const x = padding.left + i * groupSpacing + groupSpacing / 2;
                    const y = padding.top + chartHeight - (d.trifr / maxTrifr) * chartHeight;
                    return { x, y, data: d };
                  });

                  const ltiPoints = data.map((d, i) => {
                    const groupSpacing = chartWidth / data.length;
                    const x = padding.left + i * groupSpacing + groupSpacing / 2;
                    const y = padding.top + chartHeight - (d.ltifr / maxTrifr) * chartHeight;
                    return { x, y, data: d };
                  });

                  const pathD = points.reduce(
                    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                    ''
                  );

                  const areaD = `${pathD} L ${points[points.length - 1].x} ${
                    padding.top + chartHeight
                  } L ${points[0].x} ${padding.top + chartHeight} Z`;

                  const ltiPathD = ltiPoints.reduce(
                    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
                    ''
                  );

                  return (
                    <g>
                      {/* Gradient Fill under TRIFR curve */}
                      <defs>
                        <linearGradient id="trifrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d={areaD} fill="url(#trifrGrad)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* LTIFR line */}
                      <path
                        d={ltiPathD}
                        fill="none"
                        stroke="#F43F5E"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />

                      {/* Circles for Points */}
                      {points.map((p, idx) => {
                        const isSelected = selectedQuarter.label === p.data.label;
                        return (
                          <g
                            key={idx}
                            className="cursor-pointer"
                            onClick={() => setSelectedQuarter(p.data)}
                          >
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isSelected ? 6 : 4.5}
                              fill={isSelected ? '#F59E0B' : '#10B981'}
                              stroke="#0C0A09"
                              strokeWidth="2"
                            />
                            {/* Value label */}
                            <text
                              x={p.x}
                              y={p.y - 10}
                              fill="#10B981"
                              fontSize="11"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {p.data.trifr.toFixed(2)}
                            </text>

                            {/* X-axis label */}
                            <text
                              x={p.x}
                              y={padding.top + chartHeight + 22}
                              fill={isSelected ? '#F59E0B' : '#A8A29E'}
                              fontSize="11"
                              fontWeight={isSelected ? 'bold' : 'normal'}
                              textAnchor="middle"
                            >
                              {p.data.label}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>
        )}

        {activeView === 'safety_pyramid' && (
          <div className="py-2 space-y-4">
            <div className="text-xs text-stone-300 flex items-center justify-between">
              <span>Heinrich / Bird Mining Safety Ratio Hierarchy (Trailing 12-Months)</span>
              <span className="text-[11px] text-emerald-400 font-mono">
                Ratio: 1 Fatality : 10 Major : 30 Minor : 600 Near Misses
              </span>
            </div>

            <div className="max-w-md mx-auto space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-red-900/60 border border-red-500/60 text-center font-bold text-red-200">
                0 Fatalities (Target Sustained)
              </div>
              <div className="p-2.5 rounded-lg bg-purple-900/60 border border-purple-500/60 text-center font-bold text-purple-200">
                1 Lost Time Injury (LTIFR: 0.21 / million hrs)
              </div>
              <div className="p-2.5 rounded-lg bg-sky-900/60 border border-sky-500/60 text-center font-bold text-sky-200">
                20 First Aid &amp; Minor Medical Treatment Incidents
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500 text-stone-950 text-center font-extrabold shadow-lg">
                {totalNearMisses} Proactive Near-Miss &amp; Hazard Identifications
              </div>
            </div>
            <p className="text-center text-[11px] text-stone-400">
              High near-miss reporting indicates strong underground hazard awareness, successfully pre-empting lost-time events.
            </p>
          </div>
        )}
      </div>

      {/* Selected Quarter Detailed Inspection Card */}
      <div className="p-4 rounded-xl bg-purple-950/40 border border-amber-500/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/50 pb-2">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-amber-400" />
            <h4 className="font-bold text-sm text-white font-['Space_Grotesk']">
              Audit Breakdown: {selectedQuarter.label}
            </h4>
            <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
              TRIFR: {selectedQuarter.trifr.toFixed(2)}
            </span>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {selectedQuarter.hoursWorked.toLocaleString()} Exposure Hours
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-2 rounded bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 block">Near Misses</span>
            <strong className="text-amber-400 font-mono text-sm">
              {selectedQuarter.nearMisses}
            </strong>
          </div>
          <div className="p-2 rounded bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 block">First Aid Injuries</span>
            <strong className="text-sky-300 font-mono text-sm">
              {selectedQuarter.firstAidInjuries}
            </strong>
          </div>
          <div className="p-2 rounded bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 block">Medical Treatment</span>
            <strong className="text-purple-300 font-mono text-sm">
              {selectedQuarter.medicalTreatmentCases}
            </strong>
          </div>
          <div className="p-2 rounded bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 block">Lost Time Injuries</span>
            <strong className="text-rose-400 font-mono text-sm">
              {selectedQuarter.lostTimeInjuries}
            </strong>
          </div>
          <div className="p-2 rounded bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 block">Heat Stress Cases</span>
            <strong className="text-rose-300 font-mono text-sm">
              {selectedQuarter.heatStressEvents}
            </strong>
          </div>
        </div>

        {/* Key Interventions Deployed in this Quarter */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
            Engineering &amp; Telemetry Interventions Deployed:
          </span>
          <div className="space-y-1">
            {selectedQuarter.keyInterventions.map((action, aIdx) => (
              <div key={aIdx} className="flex items-center gap-2 text-xs text-stone-200">
                <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Log Incident / Near Miss Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                <h4 className="text-base font-bold text-white font-['Space_Grotesk']">
                  Log Safety Event ({selectedQuarter.label})
                </h4>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddIncident} className="space-y-3.5 text-xs">
              <div>
                <label className="text-stone-300 font-semibold block mb-1">
                  Incident Classification:
                </label>
                <select
                  value={newIncidentType}
                  onChange={(e) => setNewIncidentType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="nearMiss">Near Miss (Proactive Hazard Report)</option>
                  <option value="firstAid">First Aid Injury (Minor Cut / Bruise)</option>
                  <option value="medicalTreatment">Medical Treatment Case (Stitches / Splint)</option>
                  <option value="heatStress">Heat Stress / Dehydration Fatigue</option>
                </select>
              </div>

              <div>
                <label className="text-stone-300 font-semibold block mb-1">
                  Description / Corrective Engineering Action:
                </label>
                <textarea
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="e.g., Unbolted mesh loose rock identified; barring down conducted immediately."
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200">
                Saving this event will dynamically update the {selectedQuarter.label} bar heights, recalculate the TRIFR, and refresh the compliance trendline.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold shadow-md transition-all"
                >
                  Record &amp; Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
