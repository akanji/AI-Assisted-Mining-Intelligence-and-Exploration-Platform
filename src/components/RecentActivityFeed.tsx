import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Sparkles,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Filter,
  Search,
  Download,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Layers,
  MapPin,
  Flame,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { ActiveTab, Region } from '../types';
import { downloadCSV } from '../utils/exportUtils';

export type ActivityCategory = 'all' | 'geological' | 'system' | 'safety';
export type ActivitySeverity = 'critical' | 'high' | 'info' | 'success';

export interface ActivityFeedItem {
  id: string;
  time: Date;
  category: 'geological' | 'system' | 'safety';
  severity: ActivitySeverity;
  title: string;
  description: string;
  region: Region;
  badge: string;
  actionTab?: ActiveTab;
  actionLabel?: string;
  metadata?: {
    holeId?: string;
    grade?: string;
    depthM?: number;
    sensor?: string;
    reading?: string;
  };
  isNew?: boolean;
}

const INITIAL_ACTIVITIES: ActivityFeedItem[] = [
  {
    id: 'act-geo-1',
    time: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
    category: 'geological',
    severity: 'critical',
    title: 'High-Grade Gold Intercept: 8.4 g/t Au in DH-AB-26-01',
    description:
      'Diamond core assays confirmed 4.8m @ 8.4 g/t Au from 312.4m to 317.2m in quartz-tourmaline breccia vein with visible electrum.',
    region: 'Canada',
    badge: '8.4 g/t Au (4.8m)',
    actionTab: 'drillholes',
    actionLabel: 'Inspect Drill Log',
    metadata: {
      holeId: 'DH-AB-26-01',
      grade: '8.4 g/t Au',
      depthM: 312.4,
    },
  },
  {
    id: 'act-sys-1',
    time: new Date(Date.now() - 6 * 60 * 1000), // 6 mins ago
    category: 'system',
    severity: 'success',
    title: 'Offline Field Storage Synchronized: 18 Logs Cached',
    description:
      'IndexedDB persistent cache updated. All diamond drillhole logs, GIS shapefile layers, and geological cross-sections are offline-ready.',
    region: 'Canada',
    badge: 'Offline Cache Ready',
    actionTab: 'drillholes',
    actionLabel: 'View Drillholes',
    metadata: {
      sensor: 'ServiceWorker-Sync',
      reading: '18 Collar Logs',
    },
  },
  {
    id: 'act-geo-2',
    time: new Date(Date.now() - 14 * 60 * 1000), // 14 mins ago
    category: 'geological',
    severity: 'high',
    title: 'Hyperspectral SWIR Alteration Envelope Detected',
    description:
      'Airborne hyperspectral sensor identified prominent Dickite / Alunite hydrothermal alteration index (0.84) along the Cadillac Fault boundary.',
    region: 'Canada',
    badge: 'Dickite / Alunite SWIR',
    actionTab: 'vision',
    actionLabel: 'View Spectral Scan',
    metadata: {
      sensor: 'AVIRIS-NG SWIR',
      reading: 'Index 0.84',
    },
  },
  {
    id: 'act-sys-2',
    time: new Date(Date.now() - 22 * 60 * 1000), // 22 mins ago
    category: 'system',
    severity: 'info',
    title: 'A2A Multi-Agent Judge: JORC Table 1 Audit Passed',
    description:
      'Dual-agent validation engine concluded QA/QC certification with 99.4% standard reference material pass rate for Q3 exploration disclosure.',
    region: 'Australia',
    badge: 'JORC / NI 43-101 Verified',
    actionTab: 'a2a_judge',
    actionLabel: 'Review Audit Logs',
    metadata: {
      sensor: 'A2A Judge v4.8',
      reading: 'Pass 99.4%',
    },
  },
  {
    id: 'act-safe-1',
    time: new Date(Date.now() - 35 * 60 * 1000), // 35 mins ago
    category: 'safety',
    severity: 'info',
    title: 'Atmospheric Gas Telemetry: Decline Ramp 1 Safe',
    description:
      'Underground optical gas telemetry confirms O₂ 20.9%, CO < 1 ppm, respirable silica 0.038 µg/m³ (well below 0.05 ppm statutory limit).',
    region: 'Canada',
    badge: 'Atmosphere Safe',
    actionTab: 'healthcare_esg',
    actionLabel: 'Safety Radar',
    metadata: {
      sensor: 'Telemetry Sensor #04',
      reading: 'O₂ 20.9% / CO <1ppm',
    },
  },
  {
    id: 'act-geo-3',
    time: new Date(Date.now() - 48 * 60 * 1000), // 48 mins ago
    category: 'geological',
    severity: 'high',
    title: 'Spodumene Pegmatite Intercept: 2.15% Li₂O in DH-KI-26-03',
    description:
      'Laboratory ICP-MS analysis verified 14.5m intersection of coarse spodumene crystals in albite-quartz pegmatite intrusive.',
    region: 'Europe',
    badge: '2.15% Li₂O (14.5m)',
    actionTab: 'drillholes',
    actionLabel: 'Inspect Core Log',
    metadata: {
      holeId: 'DH-KI-26-03',
      grade: '2.15% Li₂O',
      depthM: 185.0,
    },
  },
  {
    id: 'act-sys-3',
    time: new Date(Date.now() - 65 * 60 * 1000), // 1h ago
    category: 'system',
    severity: 'info',
    title: 'Computer Vision Model Inferred 42 Core Specimen Photos',
    description:
      'Multimodal geological vision model classified quartz-carbonate veining with 96.8% confidence; detected disseminated arsenopyrite pathfinder.',
    region: 'Canada',
    badge: 'Vision Inferred 96.8%',
    actionTab: 'vision',
    actionLabel: 'Review Core Vision',
    metadata: {
      sensor: 'ResNet-YOLOv8',
      reading: '42 Segments Classified',
    },
  },
  {
    id: 'act-geo-4',
    time: new Date(Date.now() - 85 * 60 * 1000), // 1.4h ago
    category: 'geological',
    severity: 'info',
    title: 'Aeromagnetic Survey: 420 nT Magnetic Dipole High',
    description:
      'Drone LiDAR and 3-axis fluxgate aeromagnetic survey delineated deep E-W trending magnetic high, indicating ultramafic intrusive source.',
    region: 'Australia',
    badge: 'Aeromag 420 nT',
    actionTab: 'gis_map',
    actionLabel: 'Open GIS Map',
    metadata: {
      sensor: 'UAV Aeromagnetic',
      reading: '420 nT Dipole',
    },
  },
];

const SIMULATED_GEOLOGICAL_EVENTS: Omit<ActivityFeedItem, 'id' | 'time'>[] = [
  {
    category: 'geological',
    severity: 'critical',
    title: 'New High-Grade Discovery: 12.6 g/t Au in Step-Out Hole DH-AB-26-04',
    description:
      'Step-out drilling 250m east intercepted a quartz-sulphide breccia with abundant electrum and visible native gold over 6.2 meters.',
    region: 'Canada',
    badge: '12.6 g/t Au (6.2m)',
    actionTab: 'drillholes',
    actionLabel: 'Inspect Drill Log',
    metadata: { holeId: 'DH-AB-26-04', grade: '12.6 g/t Au', depthM: 284.5 },
  },
  {
    category: 'geological',
    severity: 'high',
    title: 'Copper-Cobalt Massive Sulphide Intercept: 3.4% Cu in Katanga Target',
    description:
      'Stratabound chalcocite-bornite lens intersected from 142m to 158m depth. Core exhibits semi-massive hydrothermal replacements.',
    region: 'Africa',
    badge: '3.4% Cu & 0.28% Co',
    actionTab: 'drillholes',
    actionLabel: 'Inspect Core Log',
    metadata: { holeId: 'DH-KT-26-01', grade: '3.4% Cu', depthM: 142.0 },
  },
  {
    category: 'geological',
    severity: 'high',
    title: 'Hyperspectral Fe-Oxide SWIR Anomaly Delineated',
    description:
      'Jarosite-Hematite spectral absorption ratio exceeded 1.42 across the eastern outcrop, pinpointing gossanous capping over unexposed sulphide body.',
    region: 'USA',
    badge: 'SWIR Fe-Oxide Gossan',
    actionTab: 'vision',
    actionLabel: 'Analyze Spectral Curve',
    metadata: { sensor: 'SWIR 2200nm', reading: 'Ratio 1.42' },
  },
  {
    category: 'geological',
    severity: 'info',
    title: 'Drone Magnetics Confirmed 3km Shear Corridor Extension',
    description:
      'High-resolution UAV aeromagnetic gridding confirmed structural continuity of the mineralized fault zone under 15m glacial overburden.',
    region: 'Canada',
    badge: 'Fault Ext 3.2 km',
    actionTab: 'gis_map',
    actionLabel: 'View on GIS Map',
    metadata: { sensor: 'Drone Mag Vektor', reading: '3.2 km continuous' },
  },
];

const SIMULATED_SYSTEM_EVENTS: Omit<ActivityFeedItem, 'id' | 'time'>[] = [
  {
    category: 'system',
    severity: 'success',
    title: 'Drill Hole Database Export Completed (Offline CSV & PDF)',
    description:
      'Comprehensive JORC Table 1 collar & downhole intercept log generated. All georeferenced coordinates and RQD geotech metrics compiled.',
    region: 'Canada',
    badge: 'Offline Report Ready',
    actionTab: 'drillholes',
    actionLabel: 'Drillhole Manager',
    metadata: { sensor: 'ExportService', reading: '18 Holes Compiled' },
  },
  {
    category: 'system',
    severity: 'info',
    title: 'Predictive Maintenance: Main Ventilation Fan Vibration Normal',
    description:
      'Real-time accelerometer FFT telemetry across Fan-02 bearings recorded 2.4 mm/s RMS vibration, well within ISO 10816-3 Class II safe band.',
    region: 'Canada',
    badge: 'Vibration 2.4 mm/s OK',
    actionTab: 'healthcare_esg',
    actionLabel: 'Predictive Maint.',
    metadata: { sensor: 'Fan-02 Vibration', reading: '2.4 mm/s' },
  },
  {
    category: 'safety',
    severity: 'info',
    title: 'Underground Worker Biometric Vitals Sync Complete',
    description:
      'Smart helmet telemetry updated for 18 crew members in Decline 2. Core body temperatures (37.1°C avg) and heart rates are optimal.',
    region: 'Canada',
    badge: '18 Miners Normal',
    actionTab: 'healthcare_esg',
    actionLabel: 'Miner Vitals',
    metadata: { sensor: 'BioWear Helmet Net', reading: '18/18 Normal' },
  },
  {
    category: 'system',
    severity: 'info',
    title: 'Geochemical Vectoring Inversion Algorithm Updated',
    description:
      'Multi-element geochemical pathfinder model processed 156 portable XRF field rock-chip samples, refining copper-gold porphyry center coordinates.',
    region: 'Australia',
    badge: 'Pathfinders Vectors',
    actionTab: 'geochemistry',
    actionLabel: 'Geochem Vectoring',
    metadata: { sensor: 'pXRF Geochem', reading: '156 Samples' },
  },
];

interface RecentActivityFeedProps {
  onNavigate: (tab: ActiveTab) => void;
  selectedRegion?: Region;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  onNavigate,
  selectedRegion,
}) => {
  const [activities, setActivities] = useState<ActivityFeedItem[]>(INITIAL_ACTIVITIES);
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>(new Date());
  const [nextSimIndex, setNextSimIndex] = useState<number>(0);

  // Format relative timestamp helper
  const getRelativeTime = (time: Date): string => {
    const now = Date.now();
    const diffSeconds = Math.floor((now - time.getTime()) / 1000);
    if (diffSeconds < 45) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Real-time ticking stream
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      // Alternate between geological findings and system updates
      const isGeological = nextSimIndex % 2 === 0;
      const pool = isGeological ? SIMULATED_GEOLOGICAL_EVENTS : SIMULATED_SYSTEM_EVENTS;
      const eventTemplate = pool[Math.floor(nextSimIndex / 2) % pool.length];

      const newActivity: ActivityFeedItem = {
        ...eventTemplate,
        id: `act-live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: new Date(),
        isNew: true,
        region: selectedRegion || eventTemplate.region,
      };

      setActivities((prev) => [newActivity, ...prev.slice(0, 24)]);
      setLastUpdatedTime(new Date());
      setNextSimIndex((prev) => prev + 1);
    }, 14000); // Trigger every 14 seconds

    return () => clearInterval(interval);
  }, [isLiveStreaming, nextSimIndex, selectedRegion]);

  // Trigger manual simulated finding
  const handleSimulateFinding = (type: 'geological' | 'system') => {
    const pool = type === 'geological' ? SIMULATED_GEOLOGICAL_EVENTS : SIMULATED_SYSTEM_EVENTS;
    const randomTemplate = pool[Math.floor(Math.random() * pool.length)];

    const newActivity: ActivityFeedItem = {
      ...randomTemplate,
      id: `act-manual-${Date.now()}`,
      time: new Date(),
      isNew: true,
      region: selectedRegion || randomTemplate.region,
    };

    setActivities((prev) => [newActivity, ...prev]);
    setLastUpdatedTime(new Date());
  };

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (categoryFilter !== 'all' && act.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchDesc = act.description.toLowerCase().includes(q);
        const matchBadge = act.badge.toLowerCase().includes(q);
        const matchHole = act.metadata?.holeId?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchBadge && !matchHole) {
          return false;
        }
      }
      return true;
    });
  }, [activities, categoryFilter, searchQuery]);

  // Export activity log to CSV
  const handleExportFeedCSV = () => {
    const headers = ['Timestamp', 'Category', 'Severity', 'Title', 'Badge_Metric', 'Region', 'Details'];
    const rows = [headers.join(',')];

    activities.forEach((act) => {
      const escape = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
      rows.push(
        [
          escape(act.time.toISOString()),
          escape(act.category.toUpperCase()),
          escape(act.severity.toUpperCase()),
          escape(act.title),
          escape(act.badge),
          escape(act.region),
          escape(act.description),
        ].join(',')
      );
    });

    const filename = `Executive_Activity_Feed_Log_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(filename, rows.join('\r\n'));
  };

  const geologicalCount = activities.filter((a) => a.category === 'geological').length;
  const systemCount = activities.filter((a) => a.category === 'system' || a.category === 'safety').length;

  return (
    <div
      id="executive-realtime-activity-feed"
      className="rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#1F120C] to-[#160C08] border border-amber-900/40 p-5 sm:p-6 shadow-xl space-y-5"
    >
      {/* Top Header Bar: Title, Live Status Indicator, Stream Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white font-['Space_Grotesk'] tracking-tight">
                  Real-Time Exploration Activity Feed
                </h2>
                {/* Live Stream Pulse Badge */}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                    isLiveStreaming
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLiveStreaming ? 'bg-emerald-400 animate-ping' : 'bg-stone-500'
                    }`}
                  />
                  <span>{isLiveStreaming ? 'LIVE STREAMING' : 'PAUSED'}</span>
                </div>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Streaming diamond core assay discoveries, SWIR hyperspectral anomalies, and telemetry system health across {selectedRegion || 'global'} operations.
              </p>
            </div>
          </div>
        </div>

        {/* Stream Actions & Simulation Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stream Play/Pause Toggle */}
          <button
            id="btn-toggle-activity-stream"
            onClick={() => setIsLiveStreaming((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              isLiveStreaming
                ? 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border-stone-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/40 shadow-sm'
            }`}
            title={isLiveStreaming ? 'Pause real-time updates' : 'Resume real-time updates'}
          >
            {isLiveStreaming ? <Pause size={13} /> : <Play size={13} />}
            <span>{isLiveStreaming ? 'Pause Feed' : 'Resume Live'}</span>
          </button>

          {/* Simulate Discovery Button */}
          <button
            id="btn-simulate-geological-finding"
            onClick={() => handleSimulateFinding('geological')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 text-xs font-bold transition-all shadow-sm"
            title="Simulate an immediate incoming drill intercept or hyperspectral discovery"
          >
            <Sparkles size={13} />
            <span>+ Simulate Finding</span>
          </button>

          {/* Export Feed to CSV */}
          <button
            id="btn-export-activity-feed-csv"
            onClick={handleExportFeedCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all shadow-sm"
            title="Download activity log to CSV for shift briefing"
          >
            <Download size={13} className="text-amber-400" />
            <span>Export Feed</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-stone-900/90 border border-stone-800 overflow-x-auto scrollbar-none">
          <button
            id="filter-act-all"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            All Activity ({activities.length})
          </button>

          <button
            id="filter-act-geological"
            onClick={() => setCategoryFilter('geological')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              categoryFilter === 'geological'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Layers size={12} className={categoryFilter === 'geological' ? 'text-stone-950' : 'text-amber-400'} />
            <span>Geological Findings ({geologicalCount})</span>
          </button>

          <button
            id="filter-act-system"
            onClick={() => setCategoryFilter('system')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              categoryFilter === 'system'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Cpu size={12} className={categoryFilter === 'system' ? 'text-stone-950' : 'text-purple-400'} />
            <span>System Updates ({systemCount})</span>
          </button>

          <button
            id="filter-act-safety"
            onClick={() => setCategoryFilter('safety')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              categoryFilter === 'safety'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <ShieldCheck size={12} className={categoryFilter === 'safety' ? 'text-stone-950' : 'text-emerald-400'} />
            <span>Safety &amp; Vitals</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            id="input-activity-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, holes, minerals..."
            className="w-full bg-stone-900 border border-stone-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Activity Stream Feed List */}
      <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-stone-800 bg-stone-900/40 text-stone-400 text-xs">
            <Activity size={28} className="mx-auto text-stone-600 mb-2" />
            <p className="font-semibold text-stone-300">No activity events matching query</p>
            <p className="text-stone-400 mt-1">Try broadening your search term or select another category filter.</p>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const isGeological = activity.category === 'geological';
            const isSafety = activity.category === 'safety';

            // Severity styling
            const badgeBg =
              activity.severity === 'critical'
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                : activity.severity === 'high'
                ? 'bg-purple-900/80 text-purple-200 border border-purple-600/40'
                : activity.severity === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-stone-800 text-stone-300 border border-stone-700';

            const iconContainer = isGeological ? (
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex-shrink-0 mt-0.5">
                <Layers size={16} />
              </div>
            ) : isSafety ? (
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex-shrink-0 mt-0.5">
                <ShieldCheck size={16} />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 flex-shrink-0 mt-0.5">
                <Cpu size={16} />
              </div>
            );

            return (
              <div
                key={activity.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                  activity.isNew
                    ? 'bg-gradient-to-r from-amber-500/15 via-[#2A1810] to-[#1C100B] border-amber-500/60 shadow-lg'
                    : 'bg-stone-900/60 hover:bg-stone-900/90 border-stone-800/80 hover:border-stone-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {iconContainer}
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                        {activity.title}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${badgeBg}`}>
                        {activity.badge}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800/80 text-stone-300 font-mono">
                        {activity.region}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed">{activity.description}</p>

                    {/* Metadata chips if present */}
                    {activity.metadata && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-stone-400 font-mono">
                        {activity.metadata.holeId && (
                          <span className="flex items-center gap-1 bg-stone-950/60 px-2 py-0.5 rounded border border-stone-800 text-amber-300 font-semibold">
                            Hole: {activity.metadata.holeId}
                          </span>
                        )}
                        {activity.metadata.grade && (
                          <span className="bg-stone-950/60 px-2 py-0.5 rounded border border-stone-800 text-emerald-400 font-semibold">
                            Grade: {activity.metadata.grade}
                          </span>
                        )}
                        {activity.metadata.depthM && (
                          <span className="bg-stone-950/60 px-2 py-0.5 rounded border border-stone-800 text-stone-300">
                            Depth: {activity.metadata.depthM} m
                          </span>
                        )}
                        {activity.metadata.sensor && (
                          <span className="bg-stone-950/60 px-2 py-0.5 rounded border border-stone-800 text-purple-300">
                            Sensor: {activity.metadata.sensor}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Timestamp & Action Link */}
                <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-800/60">
                  <span className="text-[11px] text-stone-400 font-mono flex items-center gap-1">
                    <Clock size={11} className="text-amber-400" />
                    <span>{getRelativeTime(activity.time)}</span>
                  </span>

                  {activity.actionTab && (
                    <button
                      onClick={() => onNavigate(activity.actionTab!)}
                      className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/30 hover:border-amber-500 transition-all shadow-sm"
                    >
                      <span>{activity.actionLabel || 'Inspect'}</span>
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Feed Summary Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 pt-3 border-t border-stone-800/80 gap-2">
        <div className="flex items-center gap-2">
          <Radio size={13} className="text-emerald-400 animate-pulse" />
          <span>
            Telemetry Engine active &bull; Auto-syncing diamond drill records, spectral cameras &amp; sensor nodes.
          </span>
        </div>
        <div className="font-mono text-amber-400/90 text-[11px]">
          Showing {filteredActivities.length} of {activities.length} logged events
        </div>
      </div>
    </div>
  );
};
