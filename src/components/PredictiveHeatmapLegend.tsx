import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import { RealTimeGeochemSensorNode } from './ExplorationGISMap';

interface PredictiveHeatmapLegendProps {
  isLayerActive: boolean;
  onToggleLayer: () => void;
  sensorNodes: RealTimeGeochemSensorNode[];
  isStreaming: boolean;
  streamTick: number;
  selectedSensorNodeId?: string;
  onSelectSensorNode?: (nodeId: string) => void;
  className?: string;
}

export const PredictiveHeatmapLegend: React.FC<PredictiveHeatmapLegendProps> = ({
  isLayerActive,
  onToggleLayer,
  sensorNodes,
  isStreaming,
  streamTick,
  selectedSensorNodeId,
  onSelectSensorNode,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTierFilter, setActiveTierFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');

  // Dynamic statistics from real-time streaming nodes
  const surgeNodes = sensorNodes.filter((n) => n.intensityCategory === 'High Surge' || n.fluxIntensityPct >= 75);
  const moderateNodes = sensorNodes.filter(
    (n) => (n.intensityCategory === 'Moderate' || (n.fluxIntensityPct >= 45 && n.fluxIntensityPct < 75)) && !surgeNodes.includes(n)
  );
  const lowNodes = sensorNodes.filter((n) => !surgeNodes.includes(n) && !moderateNodes.includes(n));

  const avgFlux =
    sensorNodes.length > 0
      ? Math.round(sensorNodes.reduce((acc, curr) => acc + curr.fluxIntensityPct, 0) / sensorNodes.length)
      : 0;

  const maxNode = [...sensorNodes].sort((a, b) => b.fluxIntensityPct - a.fluxIntensityPct)[0];

  return (
    <div
      id="predictive-heatmap-retractable-legend"
      className={`transition-all duration-300 font-sans z-30 ${className}`}
    >
      {!isExpanded ? (
        /* Retracted Compact Pill State */
        <button
          type="button"
          id="btn-toggle-heatmap-legend"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-stone-950/90 hover:bg-stone-900 border border-cyan-500/50 backdrop-blur-md shadow-2xl text-xs text-stone-200 transition-all hover:scale-105 cursor-pointer ring-1 ring-cyan-500/20"
          title="Expand Predictive Anomaly Heatmap Dynamic Legend"
        >
          <div className="flex items-center -space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse ring-1 ring-stone-900" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-stone-900" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 ring-1 ring-stone-900" />
          </div>

          <div className="flex items-center gap-1.5 font-bold font-['Space_Grotesk'] text-[11px]">
            <span className="text-white">Heatmap Legend</span>
            <span className="text-[10px] font-mono text-cyan-300">
              ({surgeNodes.length} Surge &bull; {moderateNodes.length} Mod &bull; {lowNodes.length} Low)
            </span>
          </div>

          <ChevronUp size={14} className="text-stone-400 ml-0.5" />
        </button>
      ) : (
        /* Expanded Dynamic Informative Legend Panel */
        <div className="w-[320px] sm:w-[350px] rounded-2xl bg-[#090E14]/95 border-2 border-cyan-500/50 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col text-xs text-stone-300 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header Bar */}
          <div className="p-3 bg-gradient-to-r from-stone-900 to-[#0F1B23] border-b border-cyan-900/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Activity size={14} />
              </div>
              <div>
                <h4 className="font-extrabold text-white text-xs font-['Space_Grotesk'] flex items-center gap-1.5">
                  <span>Predictive Heatmap Legend</span>
                </h4>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-stone-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-emerald-400 animate-ping' : 'bg-stone-500'}`} />
                    <span>{isStreaming ? `Live Sensor Flux #${streamTick}` : 'Stream Paused'}</span>
                  </span>
                  <span>&bull;</span>
                  <span>{sensorNodes.length} Active Nodes</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                id="btn-toggle-heatmap-legend"
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
                title="Retract Legend"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* Layer Visibility & Summary Bar */}
          <div className="px-3 py-2 bg-black/50 border-b border-stone-800 flex items-center justify-between gap-2 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">Heatmap Layer:</span>
              <button
                type="button"
                onClick={onToggleLayer}
                className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                  isLayerActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-stone-800 text-stone-500 border border-stone-700'
                }`}
              >
                {isLayerActive ? <Eye size={10} /> : <EyeOff size={10} />}
                <span>{isLayerActive ? 'VISIBLE' : 'MUTED'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1 text-stone-400">
              <span>Avg Density:</span>
              <strong className="text-cyan-300 font-bold">{avgFlux}%</strong>
            </div>
          </div>

          {/* Continuous Gradient Density Scale Bar */}
          <div className="px-3 pt-2.5 pb-2 bg-stone-950/70 border-b border-stone-800/80 space-y-1">
            <div className="flex justify-between text-[9px] font-mono text-stone-400">
              <span className="text-cyan-400">0% Ambient Baseline</span>
              <span className="text-amber-400">45% Elevated</span>
              <span className="text-pink-400">75% High Surge</span>
              <span className="text-rose-400">100% Peak</span>
            </div>

            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#06B6D4] via-[#F59E0B] to-[#EC4899] shadow-inner relative">
              {/* Marker for current fleet average */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-3.5 bg-white border border-stone-950 rounded shadow-md pointer-events-none transition-all duration-300"
                style={{ left: `calc(${avgFlux}% - 4px)` }}
                title={`Average Anomaly Density: ${avgFlux}%`}
              />
            </div>
          </div>

          {/* Color Codes & Anomaly Density Threshold Explanations */}
          <div className="p-3 space-y-2 overflow-y-auto max-h-[300px]">
            {/* TIER 1: HIGH SURGE ANOMALY DENSITY */}
            <div
              className={`p-2.5 rounded-xl border transition-all space-y-1.5 cursor-pointer ${
                activeTierFilter === 'HIGH'
                  ? 'bg-pink-950/40 border-pink-500 ring-1 ring-pink-500/50 shadow-md'
                  : 'bg-gradient-to-br from-pink-950/20 to-stone-950/80 border-pink-500/40 hover:border-pink-500/70'
              }`}
              onClick={() => setActiveTierFilter(activeTierFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Color Swatch */}
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 border border-pink-300 shadow-md shadow-pink-500/40 flex-shrink-0 animate-pulse" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-white font-bold text-[11px] font-['Space_Grotesk']">
                        High Surge Anomaly Density
                      </strong>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black bg-pink-500/30 text-pink-300 border border-pink-500/50">
                        &ge; 75% FLUX
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-pink-300">
                      Magenta / Crimson Pulse Overlays (#EC4899)
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-800 flex-shrink-0 font-bold">
                  {surgeNodes.length} Nodes
                </span>
              </div>

              {/* Threshold Parameters */}
              <div className="p-1.5 rounded-lg bg-black/60 border border-pink-950 text-[10px] font-mono text-stone-300 grid grid-cols-2 gap-1">
                <div>
                  <span className="text-stone-400 block text-[9px]">Au / Li Cutoff:</span>
                  <strong className="text-pink-300">&gt; 3.5 ppm Au &bull; &gt; 2.5k ppm Li</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[9px]">Pathfinder Halo:</span>
                  <strong className="text-amber-300">&gt; 800 ppm As &bull; &gt; 1.8% Cu</strong>
                </div>
              </div>

              <p className="text-[10px] text-stone-300 leading-snug">
                <strong>Geological Sign:</strong> Hydrothermal dilational jog apex, rapid metal volatilization surge, and primary drill collar discovery focus.
              </p>
            </div>

            {/* TIER 2: MODERATE ANOMALY DENSITY */}
            <div
              className={`p-2.5 rounded-xl border transition-all space-y-1.5 cursor-pointer ${
                activeTierFilter === 'MODERATE'
                  ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/50 shadow-md'
                  : 'bg-gradient-to-br from-amber-950/20 to-stone-950/80 border-amber-500/40 hover:border-amber-500/70'
              }`}
              onClick={() => setActiveTierFilter(activeTierFilter === 'MODERATE' ? 'ALL' : 'MODERATE')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Color Swatch */}
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-cyan-400 border border-amber-300 shadow-md shadow-amber-500/30 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-white font-bold text-[11px] font-['Space_Grotesk']">
                        Moderate Anomaly Density
                      </strong>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black bg-amber-500/30 text-amber-300 border border-amber-500/50">
                        45% &ndash; 74% FLUX
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300">
                      Tangerine / Amber Rings (#F59E0B)
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex-shrink-0 font-bold">
                  {moderateNodes.length} Nodes
                </span>
              </div>

              {/* Threshold Parameters */}
              <div className="p-1.5 rounded-lg bg-black/60 border border-amber-950 text-[10px] font-mono text-stone-300 grid grid-cols-2 gap-1">
                <div>
                  <span className="text-stone-400 block text-[9px]">Au / Li Range:</span>
                  <strong className="text-amber-300">1.5 &ndash; 3.5 ppm Au &bull; 1k&ndash;2.5k Li</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[9px]">Pathfinder Halo:</span>
                  <strong className="text-amber-300">0.8% &ndash; 1.8% Cu &bull; As halo</strong>
                </div>
              </div>

              <p className="text-[10px] text-stone-300 leading-snug">
                <strong>Geological Sign:</strong> Secondary dispersion envelope, distal sericitic-potassic alteration halo, and step-out vector.
              </p>
            </div>

            {/* TIER 3: LOW / AMBIENT ANOMALY DENSITY */}
            <div
              className={`p-2.5 rounded-xl border transition-all space-y-1.5 cursor-pointer ${
                activeTierFilter === 'LOW'
                  ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50 shadow-md'
                  : 'bg-gradient-to-br from-cyan-950/20 to-stone-950/80 border-cyan-500/40 hover:border-cyan-500/70'
              }`}
              onClick={() => setActiveTierFilter(activeTierFilter === 'LOW' ? 'ALL' : 'LOW')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* Color Swatch */}
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 border border-cyan-300 shadow-md shadow-cyan-500/30 flex-shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-white font-bold text-[11px] font-['Space_Grotesk']">
                        Baseline / Low Anomaly
                      </strong>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-black bg-cyan-500/30 text-cyan-300 border border-cyan-500/50">
                        &lt; 45% FLUX
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300">
                      Cyan / Emerald Halos (#06B6D4)
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex-shrink-0 font-bold">
                  {lowNodes.length} Nodes
                </span>
              </div>

              {/* Threshold Parameters */}
              <div className="p-1.5 rounded-lg bg-black/60 border border-cyan-950 text-[10px] font-mono text-stone-300 grid grid-cols-2 gap-1">
                <div>
                  <span className="text-stone-400 block text-[9px]">Au / Li Background:</span>
                  <strong className="text-cyan-300">&lt; 1.5 ppm Au &bull; &lt; 1k ppm Li</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[9px]">Pathfinder Halo:</span>
                  <strong className="text-cyan-300">&lt; 0.8% Cu &bull; Ambient lithology</strong>
                </div>
              </div>

              <p className="text-[10px] text-stone-300 leading-snug">
                <strong>Geological Sign:</strong> Unmineralized country rock, regional background threshold, no immediate drilling vector.
              </p>
            </div>
          </div>

          {/* Highest Volatility Node Summary & Retract Button */}
          <div className="p-2.5 bg-stone-950 border-t border-cyan-900/30 flex items-center justify-between gap-2 text-[10px] font-mono">
            {maxNode && (
              <div className="truncate text-stone-400">
                <span>Peak Anomaly: </span>
                <strong className="text-pink-300">{maxNode.id}</strong>
                <span className="text-stone-500"> ({maxNode.fluxIntensityPct}% &bull; {maxNode.currentAuPpm} ppm Au)</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-2 py-1 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 text-[10px] font-bold border border-stone-700 flex items-center gap-1 transition-colors flex-shrink-0 cursor-pointer"
            >
              <span>Retract</span>
              <ChevronDown size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
