import React from 'react';
import {
  BookOpen,
  X,
  Compass,
  CheckCircle2,
  ScanEye,
  Globe,
  Cpu,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface QuickStartDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export const QuickStartDocsModal: React.FC<QuickStartDocsModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#24130A] to-[#1C100B] border-2 border-amber-500/60 p-6 shadow-2xl text-white space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold shadow-md">
            <BookOpen size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Operator Manual & Tutorial
            </span>
            <h2 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Quick-Start Geological Guide
            </h2>
          </div>
        </div>

        {/* 4 Key Modules Walkthrough */}
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
            <h3 className="font-bold text-amber-300 text-sm flex items-center gap-2">
              <ScanEye size={16} />
              <span>1. Computer Vision & Hyperspectral Rock Analysis</span>
            </h3>
            <p className="text-stone-300 leading-relaxed">
              Upload core photographs or hand specimens. Use the spectral band selector to switch between true-color RGB, VNIR (iron oxide 860nm trough), SWIR (2200nm Al-OH clay alteration), and LWIR (silica quartz emission). Toggle interactive bounding boxes with confidence scores, and extract structured AI prompts automatically.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
            <h3 className="font-bold text-purple-300 text-sm flex items-center gap-2">
              <Globe size={16} />
              <span>2. Multi-Jurisdiction GIS Spatial Exploration</span>
            </h3>
            <p className="text-stone-300 leading-relaxed">
              Toggle among Canada, USA, Europe, Australia, and Africa. Overlay geological greenstone terranes, aeromagnetic shear zones, geochemical soil anomaly centroids, and active diamond drillhole collars. Tap any target marker to inspect its JORC Target Score and license data.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
            <h3 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
              <ShieldCheck size={16} />
              <span>3. Occupational Health, Zero-Harm & ESG Telemetry</span>
            </h3>
            <p className="text-stone-300 leading-relaxed">
              Track underground miner vitals (heart rate, SpO₂, core body temperature, heat stress) alongside atmospheric toxic gases (respirable silica &lt; 0.05 ppm, CO, methane, airflow). In case of biometric distress, initiate instantaneous emergency medical team dispatch with audible alerts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
            <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
              <Cpu size={16} />
              <span>4. A2A Judge Agent & Self-Maintenance Pipeline</span>
            </h3>
            <p className="text-stone-300 leading-relaxed">
              Experience the two-agent architecture: Worker Agent writes target generation scripts and mathematical continuum removal algorithms, while Judge Agent audits them against JORC 2012 and Canadian NI 43-101 standards, running autonomous self-repairs and error-removal cycles.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-800">
          <button
            onClick={() => {
              onClose();
              onStartTour();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-bold text-xs shadow-lg transition-all"
          >
            <Compass size={16} />
            <span>Launch Step-by-Step Tour</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
