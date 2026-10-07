import React, { useState } from 'react';
import {
  Activity,
  Flame,
  Search,
  Filter,
  TrendingUp,
  Download,
  Crosshair,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GEOCHEMICAL_ASSAYS } from '../data/miningData';
import { GeochemicalSample } from '../types';

export const GeochemistryGeophysics: React.FC = () => {
  const [samples, setSamples] = useState<GeochemicalSample[]>(GEOCHEMICAL_ASSAYS);
  const [selectedElement, setSelectedElement] = useState<'Au' | 'Cu' | 'Li' | 'As'>('Au');
  const [activeGeophysic, setActiveGeophysic] = useState<'magnetics' | 'radiometrics' | 'gravity'>(
    'magnetics'
  );
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiVectorData, setAiVectorData] = useState<any | null>(null);

  const handleRunAiGeochem = async () => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/gemini/geochem-vectoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetElement: selectedElement,
          region: 'Canada',
          samples: samples.map((s) => ({
            id: s.sampleId,
            type: s.sampleType,
            au: s.auPpb,
            cu: s.cuPpm,
            li: s.liPpm,
            as: s.asPpm,
          })),
        }),
      });
      const data = await res.json();
      if (data.success && data.vectorAnalysis) {
        setAiVectorData(data.vectorAnalysis);
      }
    } catch (err) {
      console.error('Failed to run AI geochem vectoring:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={24} className="text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Geochemistry Vectors & Airborne Geophysics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Pathfinder element halos (Au-As-Sb, Cu-Mo, Li-Cs-Ta) and Total Magnetic Intensity (TMI) anomaly inversion.
          </p>
        </div>

        {/* Element Selector & AI Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-400 font-semibold">Element:</span>
            {(['Au', 'Cu', 'Li', 'As'] as const).map((elem) => (
              <button
                key={elem}
                onClick={() => setSelectedElement(elem)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedElement === elem
                    ? 'bg-amber-500 text-stone-950 font-extrabold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {elem}
              </button>
            ))}
          </div>

          <button
            id="btn-run-ai-geochem-vectoring"
            disabled={isAnalyzingAi}
            onClick={handleRunAiGeochem}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isAnalyzingAi ? (
              <>
                <Activity size={13} className="animate-spin text-stone-950" />
                <span>Vectoring Halos...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Run AI Pathfinder Vectoring</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Vectoring Intelligence Panel (when generated) */}
      {aiVectorData && (
        <div className="rounded-2xl bg-gradient-to-br from-[#2D160E] to-[#1F100B] border border-amber-500/40 p-5 space-y-4 shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                  Gemini 3.8 Flash Geochemical Vectoring &amp; Alteration Halo
                </h3>
                <p className="text-xs text-amber-300/80">
                  Target: {aiVectorData.targetElement} &bull; Alteration Corridor: {aiVectorData.alterationZone}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold self-start sm:self-auto">
              {aiVectorData.pathfinderRatios?.vectorConfidencePct}% AI Confidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl bg-black/40 border border-stone-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400">Ishikawa Alteration Index (AI)</span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {aiVectorData.pathfinderRatios?.ishikawaAlterationIndex}
              </div>
              <p className="text-[11px] text-stone-300">
                Values &gt; 70 indicate intense sericite/chlorite replacement near hydrothermal vent center.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-stone-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400">Chlorite-Carbonate-Pyrite Index (CCPI)</span>
              <div className="text-2xl font-extrabold text-purple-400 font-mono">
                {aiVectorData.pathfinderRatios?.chloriteCarbonatePyriteIndex}
              </div>
              <p className="text-[11px] text-stone-300">
                Strong Fe-Mg chlorite alteration typical of proximal footwall shear zones.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-stone-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400">Distal to Proximal Pathfinder Halos</span>
              <div className="space-y-1 pt-1 text-[11px]">
                {aiVectorData.keyPathfinders?.map((pf: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-stone-200">
                    <span className="font-semibold text-amber-300">{pf.element}</span>
                    <span className="text-stone-400 text-[10px] truncate max-w-[160px]">{pf.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Prioritized AI Drill Targets */}
          {aiVectorData.prioritizedDrillTargets?.length > 0 && (
            <div className="space-y-2 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Crosshair size={14} />
                <span>AI-Prioritized Coincident Drill Targets:</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiVectorData.prioritizedDrillTargets.map((tgt: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-stone-900/90 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-amber-300 text-xs">{tgt.targetId}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                        {tgt.confidence}% Match
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white">{tgt.location}</div>
                    <div className="text-[11px] text-stone-400 font-mono">Planned Intercept Depth: {tgt.expectedDepthM}m</div>
                    <p className="text-[11px] text-stone-300 leading-relaxed italic">&ldquo;{tgt.rationale}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Executive Summary */}
          <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-xs text-stone-300 leading-relaxed">
            <strong className="text-amber-400 block mb-0.5">JORC / NI 43-101 Pathfinder Interpretation:</strong>
            {aiVectorData.executiveSummary}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pathfinder & Assay Correlation Table */}
        <div className="lg:col-span-2 rounded-2xl bg-[#2A1810]/80 border border-stone-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-['Space_Grotesk']">
                <Flame size={18} className="text-amber-400" />
                <span>ICP-MS Surface Soil & Rock-Chip Assays</span>
              </h2>
              <p className="text-xs text-stone-400">
                Sorted by {selectedElement} anomaly threshold (95th percentile cutoff)
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {samples.length} Samples Synced
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-stone-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-900/90 text-stone-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Sample ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Au (ppb)</th>
                  <th className="p-3">Cu (ppm)</th>
                  <th className="p-3">Li (ppm)</th>
                  <th className="p-3">As (ppm)</th>
                  <th className="p-3 text-right">Anomaly Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {samples.map((sample) => {
                  const isHigh = sample.anomalyRating === 'High-Priority';
                  return (
                    <tr
                      key={sample.sampleId}
                      className={`hover:bg-purple-950/40 transition-colors ${
                        isHigh ? 'bg-amber-500/10 font-bold' : ''
                      }`}
                    >
                      <td className="p-3 text-white">{sample.sampleId}</td>
                      <td className="p-3 text-stone-300 font-sans">{sample.sampleType}</td>
                      <td className="p-3 text-amber-300">{sample.auPpb ?? (sample.auPpm ? sample.auPpm * 1000 : 0)}</td>
                      <td className="p-3 text-sky-300">{sample.cuPpm ?? (sample.cuPct ? (sample.cuPct * 10000).toFixed(0) : 0)}</td>
                      <td className="p-3 text-purple-300">{sample.liPpm}</td>
                      <td className="p-3 text-rose-300">{sample.asPpm}</td>
                      <td className="p-3 text-right font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isHigh
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {sample.anomalyRating}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Geophysics Inversion Profile */}
        <div className="rounded-2xl bg-[#2A1810]/80 border border-stone-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[10px] uppercase font-bold text-purple-400">Airborne Surveys</span>
              <h3 className="text-base font-bold text-white mt-0.5 font-['Space_Grotesk']">
                Geophysical Grids & Radiometrics
              </h3>
              <p className="text-xs text-stone-400">Subsurface magnetic permeability & gravity contrasts</p>
            </div>

            {/* Geophysics switch */}
            <div className="flex rounded-xl bg-stone-900 p-1 border border-stone-800 text-xs">
              {(['magnetics', 'radiometrics', 'gravity'] as const).map((geo) => (
                <button
                  key={geo}
                  onClick={() => setActiveGeophysic(geo)}
                  className={`flex-1 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                    activeGeophysic === geo
                      ? 'bg-amber-500 text-stone-950 shadow'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {geo}
                </button>
              ))}
            </div>

            {/* Simulated Geophysics Profile Canvas */}
            <div className="p-4 rounded-xl bg-black/60 border border-amber-900/40 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-amber-300">
                  {activeGeophysic === 'magnetics'
                    ? 'Total Magnetic Intensity (TMI) 1VD'
                    : activeGeophysic === 'radiometrics'
                    ? 'Ternary Radiometrics (K-Th-U)'
                    : 'Residual Bouguer Gravity'}
                </span>
                <span className="font-mono text-stone-400">50m Line Spacing</span>
              </div>

              {/* Dynamic waveform visualization */}
              <div className="h-32 w-full flex items-end justify-between gap-1 pt-4">
                {[45, 60, 85, 110, 180, 240, 310, 260, 190, 140, 95, 70, 50, 65, 80].map(
                  (val, idx) => {
                    const heightPct = (val / 320) * 100;
                    const isSpike = val > 200;
                    return (
                      <div
                        key={idx}
                        className="flex-1 rounded-t transition-all hover:brightness-125"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: isSpike ? '#F59E0B' : '#7E22CE',
                        }}
                        title={`Survey Stn ${idx * 100}m: ${val} nT`}
                      />
                    );
                  }
                )}
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>0 km (West)</span>
                <span className="text-amber-400 font-bold">Hydrothermal Anomaly Center</span>
                <span>1.5 km (East)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs space-y-1">
              <span className="text-[10px] font-bold uppercase text-purple-300">AI Inversion Insight</span>
              <p className="text-[11px] text-stone-300">
                Magnetic destruction zone coincident with potassium radiometric high indicates pervasive phyllic/potassic alteration around a buried porphyry pipe at 240m depth.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
