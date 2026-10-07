import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Compass,
  PlusCircle,
  Download,
  RefreshCw,
  ShieldCheck,
  Target,
  Activity,
  ChevronRight,
  History,
} from 'lucide-react';
import {
  DrillHole,
  DrillInterval,
  DrillLogAnalysisResult,
  DrillLogSessionHistoryEntry,
  Region,
} from '../types';
import { HYPOTHETICAL_DRILL_CORE_PRESETS } from '../data/miningData';

interface DrillLogAnalyzerProps {
  selectedHole: DrillHole;
  onAddHypotheticalHole: (newHole: DrillHole) => void;
  onSaveSessionToHistory?: (entry: DrillLogSessionHistoryEntry) => void;
  restoredSession?: DrillLogSessionHistoryEntry | null;
}

export const DrillLogAnalyzer: React.FC<DrillLogAnalyzerProps> = ({
  selectedHole,
  onAddHypotheticalHole,
  onSaveSessionToHistory,
  restoredSession,
}) => {
  const defaultPreset = HYPOTHETICAL_DRILL_CORE_PRESETS[0];
  const [holeId, setHoleId] = useState<string>(defaultPreset.holeId);
  const [projectName, setProjectName] = useState<string>(defaultPreset.projectName);
  const [region, setRegion] = useState<Region>(defaultPreset.region);
  const [totalDepthM, setTotalDepthM] = useState<number>(defaultPreset.totalDepthM);
  const [rawLogText, setRawLogText] = useState<string>(defaultPreset.csvContent);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DrillLogAnalysisResult | null>({
    holeId: defaultPreset.holeId,
    projectName: defaultPreset.projectName,
    region: defaultPreset.region,
    overallProspectivityScore: 95,
    depositModelClassification:
      'Zoned LCT Spodumene Pegmatite & Archean Orogenic Au-Quartz-Tourmaline Hybrid',
    executiveSummary:
      'Gemini AI core-log inversion of DDH-HYP-AB-2026 (420m depth) identifies 3 high-priority prospective mineral signatures across sheared mafic metavolcanics, potassic-altered quartz diorite, and zoned LCT spodumene pegmatite dykes.',
    mineralSignatures: [
      {
        id: 'sig-init-1',
        signatureName: 'High-Grade Orogenic Au-Arsenopyrite-Tourmaline Shear Lode',
        depthIntervalM: '118.0m – 165.0m (47.0m width)',
        targetMinerals: ['Native Gold (Au)', 'Arsenopyrite (FeAsS)', 'Tourmaline', 'Sericite'],
        diagnosticIndicators:
          'Intense sericite-ankerite alteration (SWIR 2205nm Al-OH peak) with 7% acicular arsenopyrite and visible gold along ribbon-quartz laminations.',
        estimatedCompositeGrade: '5.42 g/t Au & 0.12% Cu',
        confidenceScore: 96,
        prospectivityRating: 'Exceptional',
        geochemicalVector: 'Proximal shear conduit; elevated Au-As-Bi-Te pathfinder association',
      },
      {
        id: 'sig-init-2',
        signatureName: 'Hypogene Chalcopyrite-Bornite Potassic B-Vein Stockwork',
        depthIntervalM: '212.0m – 278.0m (66.0m width)',
        targetMinerals: ['Chalcopyrite (CuFeS₂)', 'Bornite (Cu₅FeS₄)', 'Magnetite', 'Biotite'],
        diagnosticIndicators:
          'Center-line quartz-sulfide B-veins cutting potassic-altered quartz diorite with strong magnetic susceptibility response.',
        estimatedCompositeGrade: '1.84% Cu & 0.68 g/t Au',
        confidenceScore: 92,
        prospectivityRating: 'High',
        geochemicalVector: 'Vectors 65m down-plunge toward bornite-rich intrusive core',
      },
      {
        id: 'sig-init-3',
        signatureName: 'Zoned LCT Spodumene-Tantalite Pegmatite Intrusion',
        depthIntervalM: '325.0m – 368.0m (43.0m width)',
        targetMinerals: ['Spodumene (LiAlSi₂O₆)', 'Cleavelandite Albite', 'Columbite-Tantalite'],
        diagnosticIndicators:
          '24% coarse apple-green spodumene megacrysts within cleavelandite-quartz-muscovite matrix; extreme K/Rb fractionation.',
        estimatedCompositeGrade: '1.94% Li₂O & 190 ppm Ta₂O₅',
        confidenceScore: 95,
        prospectivityRating: 'Exceptional',
        geochemicalVector: 'Strike extension open N60°E along ultramafic komatiite contact',
      },
    ],
    alterationHaloProfile: [
      {
        zone: 'Outer Propylitic Hangingwall (45m – 118m)',
        assemblage: 'Chlorite + Epidote + Calcite + 1% Disseminated Pyrite',
        vectorStatus: 'Distal Hangingwall Marker',
      },
      {
        zone: 'Phyllic-Silicic Shear Conduit (118m – 212m)',
        assemblage: 'Quartz + Sericite (2205nm) + Ankerite + Tourmaline + Arsenopyrite',
        vectorStatus: 'Primary Orogenic Au Target Zone',
      },
      {
        zone: 'Potassic & Pegmatite Root (212m – 368m)',
        assemblage: 'Secondary Biotite + Magnetite + Cleavelandite + Spodumene',
        vectorStatus: 'Proximal Cu-Au & LCT Pegmatite Feeder',
      },
    ],
    structuralAndRqdSummary: {
      estimatedAverageRqdPct: 85.4,
      structuralControls:
        'Sub-vertical brittle-ductile shear fabric at 45° to core axis (TCA); late extensional pegmatite dyke emplacement along komatiite contact.',
      geotechnicalNote:
        'High rock mass competency across silicified and pegmatitic horizons; standard rock-bolting recommended at talc-carbonate footwall (368m).',
    },
    recommendedFollowUpActions: [
      'Collar step-out diamond hole 90m down-dip (Azimuth 150°, Dip -65°) to test downdip continuity of both the 5.42 g/t Au shear and 1.94% Li₂O pegmatite.',
      'Execute metallic screen fire assay on 118m–165m half-core splits to account for coarse visible gold nugget effect.',
      'Perform borehole televiewer and downhole 3-component电磁 (BHEM) survey to delineate off-hole sulfide lenses.',
    ],
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when a saved session is retrieved from localStorage History View
  useEffect(() => {
    if (restoredSession) {
      setHoleId(restoredSession.holeId);
      setProjectName(restoredSession.projectName);
      setRegion(restoredSession.region);
      setTotalDepthM(restoredSession.totalDepthM);
      setRawLogText(restoredSession.rawLogText);
      setAnalysisResult(restoredSession.analysisResult);
      setAddedSuccess(`Loaded saved session "${restoredSession.holeId}" from Local Storage History!`);
      setTimeout(() => setAddedSuccess(null), 4000);
    }
  }, [restoredSession]);

  // Parse CSV or JSON text into structured DrillInterval[]
  const parseIntervalsFromText = (text: string): DrillInterval[] => {
    const trimmed = text.trim();
    if (!trimmed) return [];

    // Try JSON first
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const arr = Array.isArray(parsed) ? parsed : parsed.intervals || [];
        if (Array.isArray(arr) && arr.length > 0) {
          return arr.map((item: any, idx: number) => ({
            from: Number(item.from ?? item.from_m ?? item.fromDepthM ?? idx * 50),
            to: Number(item.to ?? item.to_m ?? item.toDepthM ?? (idx + 1) * 50),
            lithology: String(item.lithology || 'Mineralized Horizon'),
            mineralization: String(
              item.mineralization || item.mineralization_alteration || item.alteration || 'Disseminated'
            ),
            color: item.color || (idx % 2 === 0 ? '#D97706' : '#7C3AED'),
            assayAuGpt: item.au_gpt !== undefined ? Number(item.au_gpt) : item.assayAuGpt,
            assayCuPct: item.cu_pct !== undefined ? Number(item.cu_pct) : item.assayCuPct,
            assayLiPct: item.li_pct !== undefined ? Number(item.li_pct) : item.assayLiPct,
          }));
        }
      } catch {
        // Fallback to line parser
      }
    }

    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const dataLines =
      lines[0].toLowerCase().includes('from') || lines[0].toLowerCase().includes('lithology')
        ? lines.slice(1)
        : lines;

    const palette = ['#78716C', '#4C1D95', '#F59E0B', '#9333EA', '#059669', '#D97706', '#10B981', '#3B82F6'];

    return dataLines
      .map((line, idx) => {
        const parts = line.split(',').map((s) => s.trim());
        if (parts.length < 3) return null;
        const from = parseFloat(parts[0]) || idx * 40;
        const to = parseFloat(parts[1]) || from + 40;
        const lithology = parts[2] || 'Altered Host Rock';
        const mineralization = parts[3] || 'Quartz-Sulfide Veining';
        const au = parts[4] !== undefined ? parseFloat(parts[4]) : 0;
        const cu = parts[5] !== undefined ? parseFloat(parts[5]) : 0;
        const li = parts[6] !== undefined ? parseFloat(parts[6]) : 0;

        return {
          from,
          to,
          fromDepthM: from,
          toDepthM: to,
          lithology,
          mineralization,
          alteration: mineralization,
          color: palette[idx % palette.length],
          assayAuGpt: !isNaN(au) && au > 0 ? au : undefined,
          assayCuPct: !isNaN(cu) && cu > 0 ? cu : undefined,
          assayLiPct: !isNaN(li) && li > 0 ? li : undefined,
        } as DrillInterval;
      })
      .filter((iv): iv is DrillInterval => iv !== null);
  };

  const parsedIntervals = parseIntervalsFromText(rawLogText);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setRawLogText(content);
      const baseName = file.name.replace(/\.[^/.]+$/, '').toUpperCase();
      setHoleId(`DDH-${baseName.slice(0, 14)}`);
      const intervals = parseIntervalsFromText(content);
      if (intervals.length > 0) {
        const maxTo = Math.max(...intervals.map((i) => i.to));
        if (maxTo > 0) setTotalDepthM(maxTo);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadPreset = (presetId: string) => {
    const found = HYPOTHETICAL_DRILL_CORE_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setHoleId(found.holeId);
    setProjectName(found.projectName);
    setRegion(found.region);
    setTotalDepthM(found.totalDepthM);
    setRawLogText(found.csvContent);
    setUploadedFileName(null);
    setError(null);
  };

  const handleLoadCurrentSelectedHole = () => {
    setHoleId(`${selectedHole.holeId}-HYP`);
    setProjectName(selectedHole.projectName);
    setTotalDepthM(selectedHole.totalDepthM);
    const header = 'from_m,to_m,lithology,mineralization_alteration,au_gpt,cu_pct,li_pct';
    const rows = selectedHole.intervals.map(
      (iv) =>
        `${iv.fromDepthM ?? iv.from},${iv.toDepthM ?? iv.to},${iv.lithology.replace(/,/g, ';')},${(
          iv.mineralization ||
          iv.alteration ||
          'Disseminated'
        ).replace(/,/g, ';')},${iv.assayAuGpt ?? 0},${iv.assayCuPct ?? 0},${iv.assayLiPct ?? 0}`
    );
    setRawLogText([header, ...rows].join('\n'));
    setUploadedFileName(`${selectedHole.holeId}.csv`);
  };

  const handleDownloadSampleCSV = () => {
    const blob = new Blob([rawLogText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${holeId}_Hypothetical_Core_Log.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildSessionEntry = (resultToSave: DrillLogAnalysisResult): DrillLogSessionHistoryEntry => {
    const intervalsToUse: DrillInterval[] =
      parsedIntervals.length > 0
        ? parsedIntervals
        : [
            {
              from: 0,
              to: totalDepthM,
              lithology: 'Hypothetical Mineralized Core',
              mineralization: 'AI Identified Signature Zone',
              color: '#F59E0B',
              assayAuGpt: 4.25,
            },
          ];

    const snapshotHole: DrillHole = {
      holeId,
      projectName,
      primaryCommodity: 'Multi-Element (AI Analyzed)',
      collarLat: 48.1842,
      collarLng: -77.9412,
      elevationM: 340,
      azimuthDeg: 145,
      dipDeg: -65,
      totalDepthM,
      drillDate: new Date().toISOString().split('T')[0],
      contractor: 'Hypothetical Core Upload (Gemini Verified)',
      status: 'Completed',
      intervals: intervalsToUse,
    };

    return {
      sessionId: `sess-${holeId.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
      savedAt: new Date().toISOString(),
      holeId,
      projectName,
      region,
      totalDepthM,
      rawLogText,
      intervalsCount: intervalsToUse.length,
      analysisResult: resultToSave,
      drillHoleSnapshot: snapshotHole,
    };
  };

  const handleRunGeminiAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/analyze-drill-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holeId,
          projectName,
          region,
          totalDepthM,
          rawLogText,
          intervals: parsedIntervals,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze hypothetical drill log');
      }
      setAnalysisResult(data.analysis);
      if (onSaveSessionToHistory) {
        const entry = buildSessionEntry(data.analysis);
        onSaveSessionToHistory(entry);
      }
      setAddedSuccess(`Analyzed ${holeId} and saved session to Local Storage History!`);
      setTimeout(() => setAddedSuccess(null), 4500);
    } catch (err: any) {
      setError(err.message || 'Error communicating with Gemini Drill Log Analyzer service');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualSaveToHistory = () => {
    if (!analysisResult || !onSaveSessionToHistory) return;
    const entry = buildSessionEntry(analysisResult);
    onSaveSessionToHistory(entry);
    setAddedSuccess(`Saved session "${holeId}" to Local Storage History!`);
    setTimeout(() => setAddedSuccess(null), 4000);
  };

  const handleAddHoleToManager = () => {
    const intervalsToUse: DrillInterval[] =
      parsedIntervals.length > 0
        ? parsedIntervals
        : [
            {
              from: 0,
              to: totalDepthM,
              lithology: 'Hypothetical Mineralized Core',
              mineralization: 'AI Identified Signature Zone',
              color: '#F59E0B',
              assayAuGpt: 4.25,
            },
          ];

    const newHole: DrillHole = {
      holeId,
      projectName,
      primaryCommodity: 'Multi-Element (AI Analyzed)',
      collarLat: 48.1842,
      collarLng: -77.9412,
      elevationM: 340,
      azimuthDeg: 145,
      dipDeg: -65,
      totalDepthM,
      drillDate: new Date().toISOString().split('T')[0],
      contractor: 'Hypothetical Core Upload (Gemini Verified)',
      status: 'Completed',
      intervals: intervalsToUse,
    };

    onAddHypotheticalHole(newHole);
    setAddedSuccess(`Added ${holeId} (${intervalsToUse.length} intervals) to Active Collars!`);
    setTimeout(() => setAddedSuccess(null), 5000);
  };

  return (
    <div id="drill-log-analyzer-panel" className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#2A1810] via-[#341A12] to-purple-950/80 border border-amber-500/40 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              <Sparkles size={14} className="text-amber-400" />
              <span>GEMINI AI HYPOTHETICAL CORE LOG INVERSION &amp; MINERAL VECTORING</span>
            </div>
            <h3 className="text-xl font-extrabold text-white font-['Space_Grotesk']">
              Drill Log Analyzer — Prospective Mineral Signature Detection
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 max-w-3xl">
              Upload hypothetical drill core interval logs (CSV, JSON, or LAS text) or load a regional deposit preset. The Gemini API evaluates lithological contacts, hydrothermal alteration halos, and multi-element assays to pinpoint prospective mineral signatures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt,.las"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              id="btn-upload-drill-core-file"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md"
            >
              <Upload size={15} />
              <span>Upload Core Data (.CSV / .JSON)</span>
            </button>

            <button
              type="button"
              id="btn-save-drill-session-history"
              onClick={handleManualSaveToHistory}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-md"
              title="Store current analyzed drill log session in browser localStorage"
            >
              <History size={15} />
              <span>Save Session to History</span>
            </button>

            <button
              type="button"
              id="btn-run-gemini-drill-analyzer"
              onClick={handleRunGeminiAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-stone-950 font-extrabold text-xs shadow-lg transition-all"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Identifying Signatures...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>Identify Mineral Signatures (Gemini AI)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {addedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{addedSuccess}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input & Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Hypothetical Core Data Upload & Interval Editor */}
        <div className="lg:col-span-5 rounded-2xl bg-stone-950/80 border border-stone-800 p-4 sm:p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 font-['Space_Grotesk']">
                  <FileSpreadsheet size={16} className="text-amber-400" />
                  <span>Hypothetical Drill Core Input</span>
                </h4>
                <p className="text-[11px] text-stone-400">
                  {uploadedFileName
                    ? `Loaded file: ${uploadedFileName}`
                    : 'Choose a preset, upload CSV/JSON, or edit intervals below'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadSampleCSV}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                title="Download current hypothetical core data as CSV"
              >
                <Download size={12} />
                <span>Template CSV</span>
              </button>
            </div>

            {/* Preset Selector Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                Quick-Load Hypothetical Core Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {HYPOTHETICAL_DRILL_CORE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleLoadPreset(preset.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border text-left ${
                      holeId === preset.holeId
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    {preset.holeId} ({preset.region})
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleLoadCurrentSelectedHole}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 border border-purple-500/30 transition-all"
                >
                  Clone Active ({selectedHole.holeId})
                </button>
              </div>
            </div>

            {/* Collar Metadata Inputs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div>
                <label className="text-[10px] uppercase text-stone-400 font-semibold block mb-1">
                  Hole ID
                </label>
                <input
                  type="text"
                  value={holeId}
                  onChange={(e) => setHoleId(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase text-stone-400 font-semibold block mb-1">
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-white text-xs font-semibold"
                >
                  <option value="Canada">Canada</option>
                  <option value="USA">USA</option>
                  <option value="Europe">Europe</option>
                  <option value="Australia">Australia</option>
                  <option value="Africa">Africa</option>
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] uppercase text-stone-400 font-semibold block mb-1">
                  Total Depth (m)
                </label>
                <input
                  type="number"
                  value={totalDepthM}
                  onChange={(e) => setTotalDepthM(Number(e.target.value) || 100)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Raw CSV / Interval Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label className="font-semibold text-stone-300">
                  Downhole Core Log Data (CSV / JSON):
                </label>
                <span className="font-mono text-amber-400">
                  {parsedIntervals.length} Intervals Parsed
                </span>
              </div>
              <textarea
                value={rawLogText}
                onChange={(e) => setRawLogText(e.target.value)}
                rows={8}
                className="w-full bg-stone-900/90 border border-stone-700 rounded-xl p-3 text-[11px] font-mono text-stone-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                placeholder="from_m,to_m,lithology,mineralization_alteration,au_gpt,cu_pct,li_pct"
              />
            </div>

            {/* Visual Preview Strip of Parsed Hypothetical Core */}
            {parsedIntervals.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  <span>Parsed Core Lithology Strip (0 – {totalDepthM}m)</span>
                  <span>Hover interval</span>
                </div>
                <div className="h-6 w-full rounded-lg overflow-hidden flex border border-stone-700 bg-stone-900">
                  {parsedIntervals.map((iv, idx) => {
                    const span = Math.max(1, iv.to - iv.from);
                    const widthPct = Math.min(100, (span / Math.max(1, totalDepthM)) * 100);
                    return (
                      <div
                        key={idx}
                        style={{ width: `${widthPct}%`, backgroundColor: iv.color }}
                        title={`${iv.from}m–${iv.to}m: ${iv.lithology} (${iv.mineralization})`}
                        className="h-full border-r border-black/40 transition-opacity hover:opacity-80"
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              id="btn-add-hypothetical-hole"
              onClick={handleAddHoleToManager}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-colors"
            >
              <PlusCircle size={14} className="text-emerald-400" />
              <span>Add to Active Collars</span>
            </button>

            <button
              type="button"
              onClick={handleRunGeminiAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-all shadow-md"
            >
              <Sparkles size={14} />
              <span>{isAnalyzing ? 'Analyzing Core...' : 'Analyze with Gemini'}</span>
            </button>
          </div>
        </div>

        {/* Right 7 Cols: Gemini Prospective Mineral Signatures Output */}
        <div className="lg:col-span-7 rounded-2xl bg-stone-950/80 border border-stone-800 p-4 sm:p-5 space-y-5">
          {analysisResult ? (
            <>
              {/* Summary Header Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#2A1810] to-stone-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-amber-300 font-mono">
                    <Target size={14} className="text-amber-400" />
                    <span>DEPOSIT MODEL CLASSIFICATION</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-extrabold text-white font-['Space_Grotesk']">
                    {analysisResult.depositModelClassification}
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {analysisResult.executiveSummary}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center justify-between sm:justify-center px-4 py-3 rounded-xl bg-stone-950/90 border border-amber-500/40 flex-shrink-0 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                    Prospectivity Score
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-['Space_Grotesk']">
                    {analysisResult.overallProspectivityScore}
                    <span className="text-xs text-stone-400 font-normal">/100</span>
                  </span>
                </div>
              </div>

              {/* Identified Prospective Mineral Signatures */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Layers size={14} />
                    <span>
                      Identified Prospective Mineral Signatures ({analysisResult.mineralSignatures.length})
                    </span>
                  </h5>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Hole: {analysisResult.holeId}
                  </span>
                </div>

                <div className="space-y-3">
                  {analysisResult.mineralSignatures.map((sig) => (
                    <div
                      key={sig.id}
                      className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/40 transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-['Space_Grotesk']">
                              {sig.signatureName}
                            </span>
                            <span className="text-xs font-mono text-amber-300 font-bold">
                              · {sig.depthIntervalM}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400 mt-1">
                            <span className="text-stone-300 font-semibold">Target Minerals:</span>
                            {sig.targetMinerals.map((min, mIdx) => (
                              <React.Fragment key={mIdx}>
                                {mIdx > 0 && <span aria-hidden="true">·</span>}
                                <span className="text-amber-200/90">{min}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="text-xs font-extrabold text-emerald-400">
                            {sig.estimatedCompositeGrade}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {sig.prospectivityRating} Prospectivity · {sig.confidenceScore}% Conf.
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-stone-300 leading-relaxed">
                        {sig.diagnosticIndicators}
                      </p>

                      <div className="pt-1.5 border-t border-stone-800/80 flex items-center gap-2 text-[11px] text-purple-300">
                        <Compass size={13} className="text-purple-400 flex-shrink-0" />
                        <span>
                          <strong>Geochemical / Spectral Vector:</strong> {sig.geochemicalVector}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alteration Halo Zoning & Structural RQD Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-2">
                  <h6 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Activity size={13} className="text-amber-400" />
                    <span>Hydrothermal Alteration Zoning</span>
                  </h6>
                  <div className="space-y-2 text-xs">
                    {analysisResult.alterationHaloProfile.map((alt, idx) => (
                      <div key={idx} className="border-l-2 border-amber-500/60 pl-2.5 py-0.5">
                        <div className="font-bold text-stone-200 text-[11px]">{alt.zone}</div>
                        <div className="text-[11px] text-stone-400">{alt.assemblage}</div>
                        <div className="text-[10px] font-mono text-amber-300 mt-0.5">
                          Vector: {alt.vectorStatus}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800 space-y-2 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h6 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        <span>Geotechnical &amp; Follow-Up Plan</span>
                      </h6>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        RQD: {analysisResult.structuralAndRqdSummary.estimatedAverageRqdPct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-300">
                      {analysisResult.structuralAndRqdSummary.structuralControls}
                    </p>
                    <div className="space-y-1 pt-1">
                      {analysisResult.recommendedFollowUpActions.map((act, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-stone-300">
                          <ChevronRight size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
