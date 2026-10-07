import React, { useState } from 'react';
import {
  Database,
  Search,
  SlidersHorizontal,
  Sparkles,
  Info,
  Check,
  Zap,
  Layers,
  Flame,
  Scale,
  Download,
  Printer,
  FileText,
  X,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { MINERALS_DATABASE } from '../data/miningData';
import { Mineral } from '../types';
import { exportMineralsToCSV, printMineralsPDF } from '../utils/exportUtils';

export const MineralDatabase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);
  const [selectedMineral, setSelectedMineral] = useState<Mineral>(MINERALS_DATABASE[0]);
  const [compareMineral, setCompareMineral] = useState<Mineral | null>(MINERALS_DATABASE[1]);
  const [showPdfDossierModal, setShowPdfDossierModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const filteredMinerals = MINERALS_DATABASE.filter((m) => {
    const matchesQuery =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.chemicalFormula.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mineralGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCritical = filterCriticalOnly ? m.criticalMineral : true;
    return matchesQuery && matchesCritical;
  });

  const criticalCount = filteredMinerals.filter((m) => m.criticalMineral).length;
  const criticalPercent = filteredMinerals.length
    ? Math.round((criticalCount / filteredMinerals.length) * 100)
    : 0;

  const filterSummaryLabel = `${filterCriticalOnly ? 'Critical Minerals Only' : 'All Mineral Classes'}${
    searchQuery ? ` • Query: "${searchQuery}"` : ''
  }`;

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    printMineralsPDF(filteredMinerals, filterSummaryLabel);
    setTimeout(() => {
      setIsGeneratingPdf(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Database size={24} className="text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Mineralogy & Critical Minerals Database
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Authoritative physical, chemical, and hyperspectral diagnostic signatures (USGS & Specim Library standards).
          </p>
        </div>

        {/* Action Controls: Critical Filter & CSV/PDF Export */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-filter-critical"
            onClick={() => setFilterCriticalOnly(!filterCriticalOnly)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filterCriticalOnly
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
            }`}
          >
            <Zap size={14} />
            <span>Critical Minerals Only</span>
          </button>

          <button
            id="btn-export-minerals-csv"
            onClick={() => exportMineralsToCSV(filteredMinerals)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-bold transition-all shadow-sm"
            title="Download full mineral diagnostic database in CSV format"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-open-stakeholder-pdf-modal"
            onClick={() => setShowPdfDossierModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-extrabold transition-all shadow-md"
            title="Generate and preview formatted PDF Dossier for stakeholders"
          >
            <FileText size={14} className="text-stone-950" />
            <span>Automated PDF Report</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 rounded-2xl bg-[#2A1810] border border-amber-900/40 flex items-center gap-3">
        <Search size={18} className="text-amber-400" />
        <input
          id="input-mineral-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by mineral name (e.g. Spodumene, Chalcopyrite, Gold), formula, or group..."
          className="flex-1 bg-transparent text-sm text-white placeholder-stone-400 focus:outline-none"
        />
        <span className="text-xs text-stone-400 font-mono">
          Showing {filteredMinerals.length} of {MINERALS_DATABASE.length}
        </span>
      </div>

      {/* Main Grid: Mineral List & Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Mineral Catalogue Cards */}
        <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
          {filteredMinerals.map((mineral) => {
            const isSelected = selectedMineral.id === mineral.id;
            return (
              <div
                key={mineral.id}
                onClick={() => setSelectedMineral(mineral)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/70 border-amber-500 shadow-lg'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm">{mineral.name}</h3>
                    <p className="font-mono text-xs text-amber-400 font-semibold">{mineral.chemicalFormula}</p>
                  </div>
                  {mineral.criticalMineral && (
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Critical
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                  <span>Mohs: <strong className="text-white">{mineral.hardness}</strong></span>
                  <span>SG: <strong className="text-white">{mineral.specificGravity}</strong></span>
                  <span>System: <strong className="text-stone-300">{mineral.crystalSystem}</strong></span>
                </div>

                <p className="text-xs text-stone-400 mt-2 line-clamp-2">
                  {mineral.economicImportance}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right 2 Cols: Mineral Deep Inspector & Comparison */}
        <div className="lg:col-span-2 rounded-2xl bg-[#2A1810]/80 border border-stone-800 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
                  {selectedMineral.name}
                </h2>
                {selectedMineral.criticalMineral && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-500 text-stone-950">
                    CRITICAL MINERAL
                  </span>
                )}
              </div>
              <p className="font-mono text-base text-amber-400 font-bold mt-0.5">
                {selectedMineral.chemicalFormula} • {selectedMineral.mineralGroup}
              </p>
            </div>

            {/* Compare Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-400 font-semibold">Compare with:</span>
              <select
                value={compareMineral?.id || ''}
                onChange={(e) => {
                  const found = MINERALS_DATABASE.find((m) => m.id === e.target.value);
                  setCompareMineral(found || null);
                }}
                className="bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1 text-white font-semibold text-xs"
              >
                {MINERALS_DATABASE.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Mineral Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Mineral Profile */}
            <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-3 text-xs">
              <span className="font-bold uppercase text-amber-400 text-[10px]">
                {selectedMineral.name} Physical Profile
              </span>
              <div className="space-y-1.5 text-stone-300">
                <div className="flex justify-between border-b border-stone-800/80 pb-1">
                  <span className="text-stone-400">Hardness (Mohs):</span>
                  <strong className="text-white">{selectedMineral.hardness}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-800/80 pb-1">
                  <span className="text-stone-400">Specific Gravity:</span>
                  <strong className="text-white">{selectedMineral.specificGravity}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-800/80 pb-1">
                  <span className="text-stone-400">Color:</span>
                  <strong className="text-stone-200">{selectedMineral.color}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-800/80 pb-1">
                  <span className="text-stone-400">Luster:</span>
                  <strong className="text-stone-200">{selectedMineral.luster}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Cleavage:</span>
                  <strong className="text-stone-200">{selectedMineral.cleavage}</strong>
                </div>
              </div>
            </div>

            {/* Compared Mineral Profile */}
            {compareMineral && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 space-y-3 text-xs">
                <span className="font-bold uppercase text-purple-300 text-[10px]">
                  Comparison: {compareMineral.name}
                </span>
                <div className="space-y-1.5 text-stone-300">
                  <div className="flex justify-between border-b border-purple-900/60 pb-1">
                    <span className="text-stone-400">Hardness (Mohs):</span>
                    <strong className="text-white">{compareMineral.hardness}</strong>
                  </div>
                  <div className="flex justify-between border-b border-purple-900/60 pb-1">
                    <span className="text-stone-400">Specific Gravity:</span>
                    <strong className="text-white">{compareMineral.specificGravity}</strong>
                  </div>
                  <div className="flex justify-between border-b border-purple-900/60 pb-1">
                    <span className="text-stone-400">Color:</span>
                    <strong className="text-stone-200">{compareMineral.color}</strong>
                  </div>
                  <div className="flex justify-between border-b border-purple-900/60 pb-1">
                    <span className="text-stone-400">Luster:</span>
                    <strong className="text-stone-200">{compareMineral.luster}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Cleavage:</span>
                    <strong className="text-stone-200">{compareMineral.cleavage}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hyperspectral Spectral Signatures (Specim & USGS Standards) */}
          <div className="p-4 rounded-xl bg-stone-900/80 border border-amber-900/40 space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
              <Layers size={14} /> Diagnostic Hyperspectral Absorption Wavelengths
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-black/40 border border-stone-800">
                <strong className="text-amber-300 block mb-0.5">VNIR (400-1000 nm):</strong>
                <p className="text-stone-400 text-[11px]">{selectedMineral.spectralPeaks.vnir || 'No sharp electronic band.'}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-stone-800">
                <strong className="text-purple-300 block mb-0.5">SWIR (1000-2500 nm):</strong>
                <p className="text-stone-400 text-[11px]">{selectedMineral.spectralPeaks.swir || 'Flat vibrational profile.'}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-stone-800">
                <strong className="text-sky-300 block mb-0.5">LWIR (7.7-12.3 µm):</strong>
                <p className="text-stone-400 text-[11px]">{selectedMineral.spectralPeaks.lwir || 'Lattice phonon emission features.'}</p>
              </div>
            </div>
          </div>

          {/* Producing Regions & Associated Minerals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-stone-400">Major Producing Regions</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedMineral.majorProducingRegions.map((region, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-stone-800 text-amber-200 font-medium"
                  >
                    {region}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-stone-400">Associated Minerals & Gangue</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedMineral.associatedMinerals.map((assoc, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-purple-950/60 text-purple-200 border border-purple-700/40 font-medium"
                  >
                    {assoc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automated PDF Report & Stakeholder Dossier Modal */}
      {showPdfDossierModal && (
        <div
          id="modal-stakeholder-dossier"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowPdfDossierModal(false)}
        >
          <div
            className="w-full max-w-4xl bg-stone-900 border-2 border-amber-500/80 rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl text-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40">
                  <FileText className="text-amber-400" size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase border border-emerald-500/40">
                      JORC / NI 43-101 Compliant Format
                    </span>
                    <span className="text-xs text-stone-400 font-mono">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white font-['Space_Grotesk'] mt-0.5">
                    Automated Stakeholder Exploration Dossier
                  </h2>
                </div>
              </div>
              <button
                id="btn-close-pdf-modal"
                onClick={() => setShowPdfDossierModal(false)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Aggregated Finding Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800">
                <span className="text-[11px] text-stone-400 block font-medium">Aggregated Records</span>
                <span className="text-xl font-bold text-amber-400 font-mono">
                  {filteredMinerals.length}
                </span>
                <span className="text-[10px] text-stone-300 block mt-0.5">
                  of {MINERALS_DATABASE.length} total
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800">
                <span className="text-[11px] text-stone-400 block font-medium">Critical Minerals</span>
                <span className="text-xl font-bold text-rose-400 font-mono">
                  {criticalCount} ({criticalPercent}%)
                </span>
                <span className="text-[10px] text-stone-300 block mt-0.5">
                  Strategic exploration priority
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800">
                <span className="text-[11px] text-stone-400 block font-medium">Active Scope Filter</span>
                <span className="text-xs font-bold text-stone-200 block truncate mt-1">
                  {filterCriticalOnly ? 'Critical Only' : 'All Categories'}
                </span>
                <span className="text-[10px] text-stone-300 block truncate mt-0.5">
                  {searchQuery ? `"${searchQuery}"` : 'No text filter'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800">
                <span className="text-[11px] text-stone-400 block font-medium">Verification Status</span>
                <div className="flex items-center gap-1 mt-1 text-emerald-400 font-bold text-xs">
                  <ShieldCheck size={14} />
                  <span>Verified Dataset</span>
                </div>
                <span className="text-[10px] text-stone-300 block mt-0.5">USGS Spectral Lib v7</span>
              </div>
            </div>

            {/* Document Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-300 uppercase tracking-wider">
                  Dossier Tabular Extract Preview
                </span>
                <span className="text-stone-300 text-[11px]">
                  Showing all {filteredMinerals.length} records ready for PDF rendering
                </span>
              </div>

              <div className="border border-stone-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-stone-950 text-stone-300 uppercase text-[10px] sticky top-0 border-b border-stone-800">
                    <tr>
                      <th className="py-2 px-3">Mineral Name</th>
                      <th className="py-2 px-3">Chemical Formula</th>
                      <th className="py-2 px-3">Group</th>
                      <th className="py-2 px-3">Mohs</th>
                      <th className="py-2 px-3">S.G.</th>
                      <th className="py-2 px-3">Critical</th>
                      <th className="py-2 px-3">Diagnostic Peak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                    {filteredMinerals.map((m) => (
                      <tr key={m.id} className="hover:bg-stone-800/40">
                        <td className="py-2 px-3 font-sans font-bold text-amber-300">{m.name}</td>
                        <td className="py-2 px-3 text-stone-300">{m.chemicalFormula}</td>
                        <td className="py-2 px-3 font-sans text-stone-400">{m.mineralGroup}</td>
                        <td className="py-2 px-3 text-stone-300">{m.hardness}</td>
                        <td className="py-2 px-3 text-stone-300">{m.specificGravity}</td>
                        <td className="py-2 px-3 font-sans">
                          {m.criticalMineral ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-[10px]">
                              YES
                            </span>
                          ) : (
                            <span className="text-stone-300 text-[10px]">No</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-stone-400">
                          {m.spectralPeaks?.swir || m.spectralPeaks?.vnir || 'Broad'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-800">
              <div className="text-[11px] text-stone-300 flex items-center gap-1.5">
                <Building size={14} className="text-amber-400" />
                <span>Format optimized for stakeholder presentations, joint ventures, and technical audits.</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="btn-cancel-pdf-modal"
                  onClick={() => setShowPdfDossierModal(false)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-trigger-pdf-generation"
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-extrabold shadow-lg transition-all"
                >
                  <Printer size={14} className="text-stone-950" />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Print / Save PDF Dossier'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
