import React, { useState, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle2,
  Layers,
  Sparkles,
  Database,
  Globe,
  Activity,
  DollarSign,
  ShieldCheck,
  Cpu,
  Flame,
} from 'lucide-react';
import { ActiveTab, Region, DrillHole } from '../types';
import {
  exportActiveViewAsCSV,
  exportActiveViewAsPDF,
  getViewMetadata,
} from '../utils/activeViewExporter';

interface GlobalExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  selectedRegion: Region;
  drillholes?: DrillHole[];
}

export const GlobalExportDataModal: React.FC<GlobalExportDataModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  selectedRegion,
  drillholes,
}) => {
  const [selectedView, setSelectedView] = useState<ActiveTab>(activeTab);
  const [exportNotice, setExportNotice] = useState<{
    message: string;
    filename: string;
    format: 'csv' | 'pdf';
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedView(activeTab);
      setExportNotice(null);
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const currentMeta = getViewMetadata(selectedView, selectedRegion);

  const handleExport = (format: 'csv' | 'pdf') => {
    let result;
    if (format === 'csv') {
      result = exportActiveViewAsCSV(selectedView, selectedRegion, drillholes);
    } else {
      result = exportActiveViewAsPDF(selectedView, selectedRegion, drillholes);
    }

    if (result.success) {
      setExportNotice({
        message: `Successfully generated and downloaded ${format.toUpperCase()} export!`,
        filename: result.filename,
        format,
      });
      setTimeout(() => {
        setExportNotice(null);
      }, 5000);
    }
  };

  const viewOptions: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'drillholes', label: 'Drill Hole Logs & 3D Models', icon: <Flame size={14} className="text-amber-400" /> },
    { id: 'minerals', label: 'Mineral Database & Spectra', icon: <Database size={14} className="text-cyan-400" /> },
    { id: 'dashboard', label: 'Executive Dashboard', icon: <Layers size={14} className="text-emerald-400" /> },
    { id: 'gis_map', label: 'Exploration GIS Targets', icon: <Globe size={14} className="text-purple-400" /> },
    { id: 'geochemistry', label: 'Geochemistry Assays', icon: <Sparkles size={14} className="text-rose-400" /> },
    { id: 'vibration_signals', label: 'SCADA Vibration Signals', icon: <Activity size={14} className="text-yellow-400" /> },
    { id: 'economics', label: 'Mining Economics (NPV/IRR)', icon: <DollarSign size={14} className="text-emerald-400" /> },
    { id: 'healthcare_esg', label: 'Miner Health & ESG Sites', icon: <ShieldCheck size={14} className="text-cyan-400" /> },
    { id: 'a2a_judge', label: 'A2A Agent Audit Logs', icon: <Cpu size={14} className="text-blue-400" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#1C100B] border-2 border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2A1810] to-[#1C100B] border-b border-amber-900/50 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <Download size={20} />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-lg font-extrabold text-white font-['Space_Grotesk']">
                Global Data Export &amp; Field Reporting
              </h2>
              <p className="text-xs text-stone-400">
                Download raw numerical datasets (CSV) or technical dossiers (PDF) for offline field analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
            aria-label="Close export modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Success Toast */}
          {exportNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-bold">{exportNotice.message}</span>
                  <span className="block text-[11px] font-mono text-emerald-300/80 mt-0.5">
                    Saved as: {exportNotice.filename}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setExportNotice(null)}
                className="text-stone-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active View Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                Select View / Domain to Export:
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                Active Tab: {activeTab.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {viewOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedView(opt.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-left transition-all border ${
                    selectedView === opt.id
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500 shadow-sm'
                      : 'bg-stone-900/60 text-stone-300 border-stone-800 hover:bg-stone-800/80'
                  }`}
                >
                  <span className="flex-shrink-0">{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Data Scope Information Box */}
          <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {currentMeta.title}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                Sector: {selectedRegion}
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              {currentMeta.description}
            </p>
          </div>

          {/* Export Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CSV Option Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Download CSV (.csv)</h3>
                    <span className="text-[11px] text-stone-400">Raw Numerical Tabular Data</span>
                  </div>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed pt-1">
                  Exports uncompressed, UTF-8 numerical series ready for external processing in Excel, Python, Pandas, Leapfrog Geo, or Vulcan.
                </p>
                <div className="pt-2 text-[11px] text-emerald-300/80 font-mono space-y-0.5">
                  <div>&bull; Includes all GPS &amp; collar georeferencing</div>
                  <div>&bull; Petrophysical bulk density &amp; concentrations</div>
                  <div>&bull; Persistent depth annotations included</div>
                </div>
              </div>

              <button
                id="btn-global-download-csv"
                onClick={() => handleExport('csv')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>Download CSV Dataset</span>
              </button>
            </div>

            {/* PDF Report Option Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Download PDF Report (.pdf)</h3>
                    <span className="text-[11px] text-stone-400">Technical Field Dossier</span>
                  </div>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed pt-1">
                  Generates a formatted, high-resolution technical field report aligned with JORC / NI 43-101 reporting standards.
                </p>
                <div className="pt-2 text-[11px] text-amber-300/80 font-mono space-y-0.5">
                  <div>&bull; Official executive summary &amp; metadata</div>
                  <div>&bull; Formatted tabular intervals &amp; statistics</div>
                  <div>&bull; 100% offline client-side generation</div>
                </div>
              </div>

              <button
                id="btn-global-download-pdf"
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs shadow-md shadow-amber-950 transition-all cursor-pointer"
              >
                <FileText size={15} />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#2A1810]/60 border-t border-amber-900/40 p-4 px-6 flex items-center justify-between text-xs text-stone-400">
          <span className="font-mono text-[11px]">
            Format: JORC Code 2012 / NI 43-101 Qualified Field Dossiers
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
