import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Trash2,
  Download,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Search,
  ChevronRight,
  Database,
} from 'lucide-react';
import { DrillLogSessionHistoryEntry, Region } from '../types';

export const DRILL_LOG_HISTORY_STORAGE_KEY = 'mineai_drill_log_sessions_v1';

export const DEFAULT_SEEDED_SESSIONS: DrillLogSessionHistoryEntry[] = [
  {
    sessionId: 'sess-seed-abitibi-01',
    savedAt: '2026-09-27T18:15:00.000Z',
    holeId: 'DDH-HYP-AB-2026',
    projectName: 'Cadillac-Larder Deep Splay Target',
    region: 'Canada',
    totalDepthM: 420,
    rawLogText: `from_m,to_m,lithology,mineralization_alteration,au_gpt,cu_pct,li_pct
0,45,Glacial Till & Saprolite Overburden,Unmineralized unconsolidated cover,0.02,0.01,0.00
45,118,Mafic Pillowed Basalt,Outer propylitic chlorite-epidote-calcite halo with 1% pyrite,0.18,0.04,0.01
118,165,Silicified Shear Zone & Ribbon Quartz Vein,Intense sericite-ankerite (SWIR 2205nm) + 7% acicular arsenopyrite & visible gold,5.42,0.12,0.01
165,212,Quartz-Feldspar Porphyry (QFP) Dyke,Moderate phyllic-albite alteration with tourmaline needle stockwork,1.35,0.08,0.02
212,278,Potassic-Altered Quartz Diorite,Hypogene chalcopyrite-bornite-magnetite B-vein stockwork,0.68,1.84,0.01
278,325,Intermediate Volcaniclastic Tuff,Weak chlorite-sericite foliation with trace pyrrhotite,0.11,0.09,0.02
325,368,Zoned LCT Spodumene Pegmatite Dyke,24% coarse green spodumene megacrysts + cleavelandite albite + tantalite,0.04,0.01,1.94
368,420,Ultramafic Komatiite Footwall,Talc-carbonate-magnetite alteration marking structural footwall contact,0.05,0.03,0.01`,
    intervalsCount: 8,
    analysisResult: {
      holeId: 'DDH-HYP-AB-2026',
      projectName: 'Cadillac-Larder Deep Splay Target',
      region: 'Canada',
      overallProspectivityScore: 95,
      depositModelClassification:
        'Zoned LCT Spodumene Pegmatite & Archean Orogenic Au-Quartz-Tourmaline Hybrid',
      executiveSummary:
        'Gemini AI core-log inversion of DDH-HYP-AB-2026 (420m depth) identifies 3 high-priority prospective mineral signatures across sheared mafic metavolcanics, potassic-altered quartz diorite, and zoned LCT spodumene pegmatite dykes.',
      mineralSignatures: [
        {
          id: 'sig-seed-1',
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
          id: 'sig-seed-2',
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
          id: 'sig-seed-3',
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
      ],
    },
    drillHoleSnapshot: {
      holeId: 'DDH-HYP-AB-2026',
      projectName: 'Cadillac-Larder Deep Splay Target',
      primaryCommodity: 'Gold (Au) / Lithium (Li)',
      collarLat: 48.1842,
      collarLng: -77.9412,
      elevationM: 340,
      azimuthDeg: 145,
      dipDeg: -65,
      totalDepthM: 420,
      drillDate: '2026-09-27',
      contractor: 'Hypothetical Core Upload (Gemini Verified)',
      status: 'Completed',
      intervals: [
        { from: 0, to: 45, lithology: 'Glacial Till & Saprolite Overburden', mineralization: 'Unmineralized cover', color: '#78716C', assayAuGpt: 0.02 },
        { from: 45, to: 118, lithology: 'Mafic Pillowed Basalt', mineralization: 'Outer propylitic halo', color: '#4C1D95', assayAuGpt: 0.18, assayCuPct: 0.04 },
        { from: 118, to: 165, lithology: 'Silicified Shear Zone & Ribbon Quartz Vein', mineralization: '7% Arsenopyrite + Visible Gold', color: '#F59E0B', assayAuGpt: 5.42, assayCuPct: 0.12 },
        { from: 165, to: 212, lithology: 'Quartz-Feldspar Porphyry Dyke', mineralization: 'Tourmaline stockwork', color: '#9333EA', assayAuGpt: 1.35 },
        { from: 212, to: 278, lithology: 'Potassic-Altered Quartz Diorite', mineralization: 'Chalcopyrite-Bornite B-veins', color: '#059669', assayAuGpt: 0.68, assayCuPct: 1.84 },
        { from: 278, to: 325, lithology: 'Intermediate Volcaniclastic Tuff', mineralization: 'Weak chlorite-sericite', color: '#D97706', assayAuGpt: 0.11, assayCuPct: 0.09 },
        { from: 325, to: 368, lithology: 'Zoned LCT Spodumene Pegmatite Dyke', mineralization: '24% Coarse Spodumene + Tantalite', color: '#10B981', assayLiPct: 1.94 },
        { from: 368, to: 420, lithology: 'Ultramafic Komatiite Footwall', mineralization: 'Talc-carbonate footwall', color: '#3B82F6', assayAuGpt: 0.05 },
      ],
    },
  },
  {
    sessionId: 'sess-seed-pilbara-02',
    savedAt: '2026-09-26T14:40:00.000Z',
    holeId: 'DDH-HYP-PIL-08',
    projectName: 'Wodgina North Blind Pegmatite Extension',
    region: 'Australia',
    totalDepthM: 350,
    rawLogText: `from_m,to_m,lithology,mineralization_alteration,au_gpt,cu_pct,li_pct
0,32,Weathering Laterite & Ferruginous Duricrust,Hematite-goethite-kaolinite regolith profile,0.01,0.01,0.04
32,96,Archean Metabasalt Country Rock,Biotite-actinolite metasomatic exocontact halo (elevated Rb-Cs),0.03,0.02,0.18
96,154,Upper Spodumene-Albite-Quartz Pegmatite,Coarse elongated spodumene laths (28% modal) with columbite-tantalite,0.01,0.01,2.26
154,198,Amphibolite Inter-Reef Septum,Holmquistite (Li-amphibole) metasomatic selvage at pegmatite contact,0.02,0.03,0.34
198,272,Lower Feeder LCT Pegmatite Intrusion,Very coarse spodumene + lepidolite + pollucite core zone (K/Rb < 14),0.01,0.01,2.68
272,350,Two-Mica Fertile Source Granite,Muscovite-tourmaline-garnet leucogranite basement,0.01,0.01,0.12`,
    intervalsCount: 6,
    analysisResult: {
      holeId: 'DDH-HYP-PIL-08',
      projectName: 'Wodgina North Blind Pegmatite Extension',
      region: 'Australia',
      overallProspectivityScore: 97,
      depositModelClassification: 'Stacked Archean LCT Spodumene-Tantalite-Pollucite Pegmatite Swarm',
      executiveSummary:
        'Gemini AI core-log analysis of DDH-HYP-PIL-08 (350m depth) confirms two thick, high-grade spodumene pegmatite horizons separated by a holmquistite-altered amphibolite septum.',
      mineralSignatures: [
        {
          id: 'sig-pil-1',
          signatureName: 'Upper Spodumene-Cleavelandite Pegmatite Sill',
          depthIntervalM: '96.0m – 154.0m (58.0m width)',
          targetMinerals: ['Spodumene (LiAlSi₂O₆)', 'Columbite-Tantalite', 'Albite'],
          diagnosticIndicators:
            '28% modal coarse spodumene laths with sharp SWIR 2205nm Al-OH absorption and zero ferric iron contamination.',
          estimatedCompositeGrade: '2.26% Li₂O & 215 ppm Ta₂O₅',
          confidenceScore: 97,
          prospectivityRating: 'Exceptional',
          geochemicalVector: 'Holmquistite exocontact halo extends 25m laterally into metabasalt',
        },
        {
          id: 'sig-pil-2',
          signatureName: 'Lower Feeder Spodumene-Lepidolite-Pollucite Core Zone',
          depthIntervalM: '198.0m – 272.0m (74.0m width)',
          targetMinerals: ['Spodumene', 'Lepidolite', 'Pollucite (Cs)', 'Muscovite'],
          diagnosticIndicators:
            'Extreme fractionation (K/Rb < 14) with decimeter-scale spodumene megacrysts and cesium-bearing pollucite pods.',
          estimatedCompositeGrade: '2.68% Li₂O & 0.42% Cs₂O',
          confidenceScore: 98,
          prospectivityRating: 'Exceptional',
          geochemicalVector: 'Rooted directly above fertile two-mica leucogranite cupola at 272m',
        },
      ],
      alterationHaloProfile: [
        {
          zone: 'Exocontact Metasomatic Selvage (32m – 96m & 154m – 198m)',
          assemblage: 'Holmquistite (Li-Amphibole) + Biotite + Tourmaline',
          vectorStatus: 'Proximal Pegmatite Contact Indicator',
        },
      ],
      structuralAndRqdSummary: {
        estimatedAverageRqdPct: 89.2,
        structuralControls: 'Dilational brittle shear step-overs within Archean greenstone amphibolite.',
        geotechnicalNote: 'Massive crystalline pegmatite exhibits RQD > 92%, optimal for underground long-hole open stoping.',
      },
      recommendedFollowUpActions: [
        'Drill 100m grid infill pattern along N35°W strike to convert upper and lower pegmatite sills to Indicated Resource status.',
        'Conduct Heavy Liquid Separation (HLS) metallurgical testwork on 198m–272m composite.',
      ],
    },
    drillHoleSnapshot: {
      holeId: 'DDH-HYP-PIL-08',
      projectName: 'Wodgina North Blind Pegmatite Extension',
      primaryCommodity: 'Lithium (Li₂O) / Tantalum',
      collarLat: -21.18,
      collarLng: 118.67,
      elevationM: 225,
      azimuthDeg: 90,
      dipDeg: -60,
      totalDepthM: 350,
      drillDate: '2026-09-26',
      contractor: 'Hypothetical Core Upload (Gemini Verified)',
      status: 'Completed',
      intervals: [
        { from: 0, to: 32, lithology: 'Weathering Laterite & Duricrust', mineralization: 'Regolith profile', color: '#78716C', assayLiPct: 0.04 },
        { from: 32, to: 96, lithology: 'Archean Metabasalt Country Rock', mineralization: 'Biotite-actinolite halo', color: '#4C1D95', assayLiPct: 0.18 },
        { from: 96, to: 154, lithology: 'Upper Spodumene-Albite Pegmatite', mineralization: '28% Coarse Spodumene Laths', color: '#EC4899', assayLiPct: 2.26 },
        { from: 154, to: 198, lithology: 'Amphibolite Inter-Reef Septum', mineralization: 'Holmquistite Li-amphibole selvage', color: '#9333EA', assayLiPct: 0.34 },
        { from: 198, to: 272, lithology: 'Lower Feeder LCT Pegmatite Intrusion', mineralization: 'Very coarse Spodumene + Pollucite', color: '#10B981', assayLiPct: 2.68 },
        { from: 272, to: 350, lithology: 'Two-Mica Fertile Source Granite', mineralization: 'Muscovite-tourmaline leucogranite', color: '#3B82F6', assayLiPct: 0.12 },
      ],
    },
  },
];

export function loadDrillLogSessionsFromStorage(): DrillLogSessionHistoryEntry[] {
  try {
    const raw = localStorage.getItem(DRILL_LOG_HISTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DRILL_LOG_HISTORY_STORAGE_KEY, JSON.stringify(DEFAULT_SEEDED_SESSIONS));
      return DEFAULT_SEEDED_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SEEDED_SESSIONS;
  } catch {
    return DEFAULT_SEEDED_SESSIONS;
  }
}

export function saveDrillLogSessionToStorage(
  entry: DrillLogSessionHistoryEntry
): DrillLogSessionHistoryEntry[] {
  try {
    const existing = loadDrillLogSessionsFromStorage();
    const filtered = existing.filter((s) => s.sessionId !== entry.sessionId);
    const updated = [entry, ...filtered].slice(0, 25);
    localStorage.setItem(DRILL_LOG_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [entry];
  }
}

export function deleteDrillLogSessionFromStorage(
  sessionId: string
): DrillLogSessionHistoryEntry[] {
  try {
    const existing = loadDrillLogSessionsFromStorage();
    const updated = existing.filter((s) => s.sessionId !== sessionId);
    localStorage.setItem(DRILL_LOG_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

interface DrillLogSessionHistoryViewProps {
  sessions: DrillLogSessionHistoryEntry[];
  activeSessionId?: string | null;
  onRestoreSession: (session: DrillLogSessionHistoryEntry) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAllSessions: () => void;
  onResetDefaultSessions: () => void;
}

export const DrillLogSessionHistoryView: React.FC<DrillLogSessionHistoryViewProps> = ({
  sessions,
  activeSessionId,
  onRestoreSession,
  onDeleteSession,
  onClearAllSessions,
  onResetDefaultSessions,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [restoredBanner, setRestoredBanner] = useState<string | null>(null);

  const filteredSessions = sessions.filter((s) => {
    const matchesRegion = regionFilter === 'all' || s.region === regionFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesRegion;
    return (
      matchesRegion &&
      (s.holeId.toLowerCase().includes(q) ||
        s.projectName.toLowerCase().includes(q) ||
        s.analysisResult.depositModelClassification.toLowerCase().includes(q))
    );
  });

  const handleRestoreClick = (session: DrillLogSessionHistoryEntry) => {
    onRestoreSession(session);
    setRestoredBanner(
      `Restored session "${session.holeId}" (${session.projectName}) from localStorage into active DrillHoleManager & Analyzer.`
    );
    setTimeout(() => setRestoredBanner(null), 4500);
  };

  const handleExportSessionJson = (session: DrillLogSessionHistoryEntry) => {
    const blob = new Blob([JSON.stringify(session, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.holeId}_Analyzed_Session.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="drill-log-session-history-view"
      className="rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#1E110B] to-[#140B07] border border-amber-900/50 p-5 shadow-xl space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Database size={14} />
            <span>LOCAL STORAGE PERSISTENCE · ANALYZED DRILL LOG ARCHIVE</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2">
            <History size={20} className="text-amber-400" />
            <span>
              Analyzed Drill Log Session History ({sessions.length} Saved in Local Storage)
            </span>
          </h3>
          <p className="text-xs text-stone-400">
            Retrieve previously analyzed drill core sessions from browser <code className="text-amber-300 font-mono">localStorage</code> to restore their lithology intervals, 3D strata collar, and Gemini mineral signature reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onResetDefaultSessions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold transition-all"
          >
            <RotateCcw size={13} className="text-amber-400" />
            <span>Restore Reference Sessions</span>
          </button>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={onClearAllSessions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-500/40 text-xs font-semibold transition-all"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {restoredBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2 font-bold">
          <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
          <span>{restoredBanner}</span>
        </div>
      )}

      {/* Search & Region Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved sessions by Hole ID, project name, or deposit model..."
            className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'Canada', 'USA', 'Europe', 'Australia', 'Africa'] as const).map((reg) => (
            <button
              key={reg}
              type="button"
              onClick={() => setRegionFilter(reg)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                regionFilter === reg
                  ? 'bg-amber-500 text-stone-950 font-extrabold'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
              }`}
            >
              {reg === 'all' ? 'All Regions' : reg}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <div className="p-8 rounded-xl bg-stone-950/70 border border-stone-800 text-center space-y-2">
          <History size={28} className="text-stone-500 mx-auto" />
          <p className="text-sm font-bold text-stone-300">
            No analyzed drill log sessions match the current filter
          </p>
          <p className="text-xs text-stone-400">
            Run the Gemini Drill Log Analyzer or click &ldquo;Restore Reference Sessions&rdquo; to populate localStorage history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const isActive = activeSessionId === session.sessionId;
            const formattedDate = new Date(session.savedAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={session.sessionId}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3.5 ${
                  isActive
                    ? 'bg-gradient-to-br from-amber-500/15 via-stone-900 to-stone-950 border-amber-400 shadow-lg'
                    : 'bg-stone-950/85 border-stone-800 hover:border-amber-500/40'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-amber-400">
                          {session.holeId}
                        </span>
                        <span className="text-xs text-stone-400">·</span>
                        <span className="text-xs font-bold text-white">
                          {session.projectName}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-400 mt-0.5 font-mono">
                        <span className="flex items-center gap-1 text-stone-300">
                          <MapPin size={11} className="text-amber-400" />
                          {session.region}
                        </span>
                        <span>·</span>
                        <span>Depth: {session.totalDepthM}m</span>
                        <span>·</span>
                        <span>{session.intervalsCount} Intervals</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono flex-shrink-0">
                      <span className="text-lg font-extrabold text-emerald-400">
                        {session.analysisResult.overallProspectivityScore}
                      </span>
                      <span className="text-[10px] text-stone-400 block">Score / 100</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-900/90 border border-stone-800/90 space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-semibold">
                      {session.analysisResult.depositModelClassification}
                    </div>
                    <p className="text-xs text-stone-300 line-clamp-2">
                      {session.analysisResult.executiveSummary}
                    </p>
                  </div>

                  {/* Top Identified Signatures Preview */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Identified Mineral Signatures ({session.analysisResult.mineralSignatures.length}):
                    </span>
                    <div className="space-y-1">
                      {session.analysisResult.mineralSignatures.slice(0, 2).map((sig) => (
                        <div
                          key={sig.id}
                          className="flex items-center justify-between text-[11px] bg-stone-900/60 px-2.5 py-1 rounded border border-stone-800/70"
                        >
                          <span className="text-stone-200 font-medium truncate pr-2">
                            {sig.signatureName} ({sig.depthIntervalM})
                          </span>
                          <span className="font-mono text-amber-300 font-bold flex-shrink-0">
                            {sig.estimatedCompositeGrade}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-2.5 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`btn-restore-session-${session.holeId.toLowerCase()}`}
                      onClick={() => handleRestoreClick(session)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs shadow-md transition-all"
                    >
                      <RotateCcw size={13} />
                      <span>Retrieve &amp; Load Session</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportSessionJson(session)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-semibold transition-colors"
                      title="Export session JSON"
                    >
                      <Download size={12} />
                      <span>JSON</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.sessionId)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Delete session from localStorage"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
