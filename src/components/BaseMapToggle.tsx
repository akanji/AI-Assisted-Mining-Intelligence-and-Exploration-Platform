import React, { useState } from 'react';
import {
  Layers,
  Globe,
  Mountain,
  Zap,
  Info,
  Sliders,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { BaseMapMode, BaseMapMetadata, gisMappingService } from '../services/gisMappingService';
import { Region } from '../types';

interface BaseMapToggleProps {
  currentMode: BaseMapMode;
  currentRegion: Region;
  onModeChange: (mode: BaseMapMode) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  showContours: boolean;
  onToggleContours: (show: boolean) => void;
  showOpticalLabels?: boolean;
  onToggleOpticalLabels?: (show: boolean) => void;
}

export const BaseMapToggle: React.FC<BaseMapToggleProps> = ({
  currentMode,
  currentRegion,
  onModeChange,
  opacity,
  onOpacityChange,
  showContours,
  onToggleContours,
  showOpticalLabels = true,
  onToggleOpticalLabels,
}) => {
  const [showMetadataModal, setShowMetadataModal] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [activeMetadata, setActiveMetadata] = useState<BaseMapMetadata>(
    gisMappingService.getBaseMapConfig(currentMode, currentRegion)
  );

  const handleSelectMode = async (mode: BaseMapMode) => {
    if (mode === currentMode) return;
    setIsSwitching(true);
    try {
      const result = await gisMappingService.switchBaseMap(mode, currentRegion);
      setActiveMetadata(result.config);
      onModeChange(mode);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      {/* Floating or Embedded Basemap View Toggle HUD */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-[#1C100B]/90 border border-amber-900/60 shadow-xl backdrop-blur-md text-xs">
        {/* Left: Prominent Segmented Toggle for Satellite vs Terrain */}
        <div className="flex items-center gap-1 bg-stone-950/80 p-1 rounded-xl border border-stone-800">
          {/* Satellite View Button */}
          <button
            id="btn-toggle-satellite-view"
            type="button"
            onClick={() => handleSelectMode('satellite')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all relative ${
              currentMode === 'satellite'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md font-extrabold ring-1 ring-amber-300'
                : 'text-stone-300 hover:text-white hover:bg-stone-850'
            }`}
            title="Switch to High-Resolution Optical Satellite Orthomosaic"
          >
            <Globe size={14} className={currentMode === 'satellite' ? 'text-stone-950' : 'text-blue-400'} />
            <span>Satellite</span>
            {currentMode === 'satellite' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
            )}
          </button>

          {/* Terrain View Button */}
          <button
            id="btn-toggle-terrain-view"
            type="button"
            onClick={() => handleSelectMode('terrain')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs transition-all relative ${
              currentMode === 'terrain'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md font-extrabold ring-1 ring-amber-300'
                : 'text-stone-300 hover:text-white hover:bg-stone-850'
            }`}
            title="Switch to Digital Elevation Model (DEM) with Topographic Contours"
          >
            <Mountain size={14} className={currentMode === 'terrain' ? 'text-stone-950' : 'text-amber-400'} />
            <span>Terrain</span>
            {currentMode === 'terrain' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
            )}
          </button>

          {/* AeroMag (Secondary Geophysics Option) */}
          <button
            id="btn-toggle-aeromag-view"
            type="button"
            onClick={() => handleSelectMode('aeromagnetic')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-all ${
              currentMode === 'aeromagnetic'
                ? 'bg-purple-600 text-white font-extrabold shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-stone-850'
            }`}
            title="Airborne Total Magnetic Intensity (TMI) Geophysics"
          >
            <Zap size={13} className={currentMode === 'aeromagnetic' ? 'text-amber-300' : 'text-purple-400'} />
            <span>AeroMag</span>
          </button>
        </div>

        {/* Right: API Service Status & Quick Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] font-mono">
          {/* Mapping API Status Indicator */}
          <div className="flex items-center gap-1.5 text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-stone-400 hidden md:inline">API Service:</span>
            <span className="text-white font-semibold truncate max-w-[170px]" title={activeMetadata.provider}>
              {currentMode === 'satellite' ? 'Esri World Imagery' : currentMode === 'terrain' ? 'USGS 3DEP Topo' : 'TMI RTP Grid'}
            </span>
            {isSwitching && <RefreshCw size={11} className="text-amber-400 animate-spin" />}
          </div>

          {/* Opacity slider */}
          <div className="flex items-center gap-1.5 text-stone-300">
            <span className="text-stone-400">Opacity:</span>
            <input
              type="range"
              min="20"
              max="100"
              value={opacity}
              onChange={(e) => onOpacityChange(Number(e.target.value))}
              className="w-16 accent-amber-500 cursor-pointer h-1.5"
            />
            <span className="text-[10px] w-7">{opacity}%</span>
          </div>

          {/* Metadata & Attribution Info Button */}
          <button
            type="button"
            onClick={() => setShowMetadataModal(true)}
            className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-700 transition-colors"
            title="View GIS mapping service metadata, resolution, and attribution"
          >
            <Info size={13} />
          </button>
        </div>
      </div>

      {/* GIS Mapping API Service Metadata Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-stone-950 border border-amber-500/40 p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm font-['Space_Grotesk']">
                    GIS Mapping API Service Interface
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    Active Base Map Provider &amp; Spatial Metadata
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMetadataModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                ✕
              </button>
            </div>

            {/* Current Active Mode Summary */}
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm flex items-center gap-2">
                  <span>{activeMetadata.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeMetadata.status.toUpperCase()}
                  </span>
                </span>
                <span className="text-amber-400 font-mono text-[11px]">{activeMetadata.category}</span>
              </div>
              <p className="text-stone-300 text-[11px] leading-relaxed">
                Interfacing with <strong>{activeMetadata.provider}</strong>. Delivers continuous georeferenced raster tiles seamlessly projected in real time.
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-stone-400 block">Spatial Resolution</span>
                <span className="text-white font-mono font-semibold">{activeMetadata.resolution}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-stone-400 block">Sensor / DEM Model</span>
                <span className="text-white font-mono font-semibold">{activeMetadata.sensorOrModel}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-stone-400 block">Coordinate System (CRS)</span>
                <span className="text-amber-300 font-mono font-semibold">{activeMetadata.crs}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 space-y-1">
                <span className="text-stone-400 block">Last Survey / Orbit Date</span>
                <span className="text-white font-mono font-semibold">{activeMetadata.lastAcquisitionDate}</span>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-1.5">
              <span className="font-semibold text-stone-300 block">Mapping API Capabilities:</span>
              <div className="space-y-1">
                {activeMetadata.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2 text-stone-300 text-[11px]">
                    <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attribution */}
            <div className="p-2.5 rounded-lg bg-black/60 border border-stone-800 text-[10px] text-stone-400">
              <span className="font-semibold text-stone-300">Data Attribution:</span> {activeMetadata.attribution}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowMetadataModal(false)}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
