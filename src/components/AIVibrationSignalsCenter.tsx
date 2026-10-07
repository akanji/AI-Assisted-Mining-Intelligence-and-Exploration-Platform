import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Radio,
  Activity,
  Layers,
  Cpu,
  ShieldAlert,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gauge,
  Zap,
  Globe2,
  Satellite,
  ChevronRight,
  Info,
  ExternalLink,
  Code,
  Terminal,
  ArrowRight,
  Sparkles,
  Camera,
} from 'lucide-react';
import { MineralVibrationProfile, TelemetryMetricPoint, Region } from '../types';
import { downloadCSV } from '../utils/exportUtils';
import { EquipmentARHealthDashboard } from './EquipmentARHealthDashboard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Canonical Mineral Detection & Vibration Signal Data Sheet
export const MINERAL_VIBRATION_DATA: MineralVibrationProfile[] = [
  {
    id: 'vib-cu',
    mineralName: 'Copper (Chalcopyrite)',
    primaryCompound: 'CuFeS₂',
    depthLevel: 'Shallow to Deep (200m – 1,500m)',
    diagnosticSignal: 'Low-frequency continuous shear wave attenuation (20–40 Hz)',
    sensorRange: 'Up to 2,000m',
    alarmThreshold: 'High density anomaly alert (>3.1 g/cm³)',
    passiveAntSignal:
      'Measures Low-Frequency Shear Waves (Vs velocity) at 0.5 – 5 Hz. Large copper porphyry deposits register as slow-velocity zones or high Vp/Vs ratio anomalies due to ductile, highly fractured host rock.',
    activeDrillTelemetry:
      'Induces heavy, rhythmic axial chatter and rotational dampening (40–90 Hz). The AI detects an immediate drop in torque variance combined with high ROP as the bit cuts into dense chalcopyrite veins.',
    systemAlarmType: 'Velocity Discontinuity Alert (>12% drop)',
    depositType: 'Porphyry & IOCG Sulfide',
    frequencyBand: '20–40 Hz (ANT: 0.5–5 Hz)',
    closedLoopAction: 'Active Dampening Mode; enforce strict torque-limit cap; 1/4-turn reverse on binding.',
  },
  {
    id: 'vib-li',
    mineralName: 'Lithium (Spodumene)',
    primaryCompound: 'LiAl(SiO₃)₂',
    depthLevel: 'Mid-Level (100m – 500m)',
    diagnosticSignal: 'High-frequency acoustic response during diamond-bit drilling (120–250 kHz)',
    sensorRange: 'Up to 800m',
    alarmThreshold: 'Phase-shift velocity variance >12%',
    passiveAntSignal:
      'High-velocity compressional wave structures (Vp) at 8 – 15 Hz. Spodumene pegmatites are highly rigid igneous bodies flagged as defined, structurally tight, high-velocity "walls".',
    activeDrillTelemetry:
      'Ultra-high frequency acoustic resonance (100–250 kHz). Bit encounters micro-shocks and torsional torque variance (>30%) as it hits rigid spodumene-quartz crystals.',
    systemAlarmType: 'Ground Hardness Profiling Trigger',
    depositType: 'LCT Granitic Pegmatite',
    frequencyBand: '100–250 kHz (ANT: 8–15 Hz)',
    closedLoopAction: 'Throttle RPM by 60% (350 RPM); boost Feed Force (WOB) by 40%; increase mud-pump flush +25%.',
  },
  {
    id: 'vib-au',
    mineralName: 'Gold (Native / Pyrite host)',
    primaryCompound: 'Au / FeS₂',
    depthLevel: 'Variable (50m – 2,500m)',
    diagnosticSignal: 'Sharp micro-seismic fracture velocity spikes (80–150 Hz)',
    sensorRange: 'Up to 3,000m',
    alarmThreshold: 'Distinct impedance boundary match',
    passiveAntSignal:
      'Mid-frequency wave scatter at 3 – 8 Hz. Fault lines, shear zones, and dense pyrite zones scatter ambient noise into chaotic, high-contrast velocity boundaries.',
    activeDrillTelemetry:
      'High-frequency erratic vibrational spikes (200–500 Hz). The drill bit rapidly cycles between brittle quartz fracturing and softer sulfide zones.',
    systemAlarmType: 'Impedance Contrast Match',
    depositType: 'Orogenic & Epithermal Veins',
    frequencyBand: '80–150 Hz (Active: 200–500 Hz)',
    closedLoopAction: 'Dynamic variable speed mode; monitor mechanical impedance shifts across fault walls.',
  },
  {
    id: 'vib-ni',
    mineralName: 'Nickel (Pentlandite)',
    primaryCompound: '(Fe,Ni)₉S₈',
    depthLevel: 'Deep Crustal (500m – 2,000m)',
    diagnosticSignal: 'Heavy compressional wave dampening (10–30 Hz)',
    sensorRange: 'Up to 2,500m',
    alarmThreshold: 'Subsurface velocity drop >15%',
    passiveAntSignal:
      'Massive sulfide lenses produce strong low-velocity compressional attenuation (Vp slow-zone) accompanied by gravitational high density anomalies.',
    activeDrillTelemetry:
      'Sustained low-frequency resonant hum with high drag resistance on diamond bit matrix during deep core penetration.',
    systemAlarmType: 'Subsurface Velocity Drop Alert (>15%)',
    depositType: 'Magmatic Sulfide Intrusion',
    frequencyBand: '10–30 Hz (ANT)',
    closedLoopAction: 'Apply steady high-torque pull-down; maintain laminar mud cooling against extreme downhole friction.',
  },
  {
    id: 'vib-pgm',
    mineralName: 'Palladium / Platinum',
    primaryCompound: 'Pd / Pt',
    depthLevel: 'Deep Layer (800m – 3,000m)',
    diagnosticSignal: 'Ultra-low frequency cosmic-ray paired seismic noise cross-correlation',
    sensorRange: 'Up to 4,000m',
    alarmThreshold: 'High-density structural pocket trigger',
    passiveAntSignal:
      'Sub-Hertz (0.1–1.0 Hz) ambient microseismic phase-shift correlated with muon tomography sensors to delineate dense stratiform reefs (e.g. Bushveld / Stillwater).',
    activeDrillTelemetry:
      'Harmonic acoustic feedback with high acoustic impedance in chromite-rich pyroxenite host layers.',
    systemAlarmType: 'High-Density Structural Pocket Trigger',
    depositType: 'Stratiform Chromitite Reef',
    frequencyBand: '0.1–1.0 Hz (Muon/ANT Coincident)',
    closedLoopAction: 'Ultra-fine diamond core rotation; minimize vibration harmonics to avoid core discing.',
  },
  {
    id: 'vib-u',
    mineralName: 'Uranium (Rutherfordine / Uraninite)',
    primaryCompound: 'UO₂CO₃ / UO₂',
    depthLevel: 'Shallow Crust (0m – 300m)',
    diagnosticSignal: 'Micro-fissure resonant acoustic feedback (300–400 kHz)',
    sensorRange: 'Up to 500m',
    alarmThreshold: 'Mineral association pattern match >85%',
    passiveAntSignal:
      'High-frequency ambient attenuation at 15 – 25 Hz. Unconsolidated sandstone channels hosting uranium deposits damp ambient seismic energy heavily.',
    activeDrillTelemetry:
      'Low-frequency harmonic hum (10–30 Hz). Drill string vibration drops to baseline with near zero torque resistance and rapid penetration.',
    systemAlarmType: 'Density Void & Soft Sandstone Indicator',
    depositType: 'Roll-Front & Unconformity',
    frequencyBand: '300–400 kHz Acoustic / 15–25 Hz ANT',
    closedLoopAction: 'Engage ROP Governor (≤ 2.0 m/min); reduce mud-flush pressure to prevent borehole collapse.',
  },
];

// Direct Sensor Comparison Dataset
export const SENSOR_COMPARISON_DATA = [
  {
    parameter: 'Sensor Mechanism',
    ant: 'Passive surface geophone arrays (e.g., Fleet Space Satellite Geodes)',
    drillBit: 'Active downhole accelerometers & mud-pulse / EM measurement tools',
    highlight: 'Passive vs. Active',
  },
  {
    parameter: 'Data Feed Type',
    ant: 'Continuous regional seismic stream (maps up to 3–4 km deep)',
    drillBit: 'Millisecond local telemetry (sampled every 10 ms at the drill bit)',
    highlight: 'Regional vs. Point Real-Time',
  },
  {
    parameter: 'AI Role',
    ant: 'Cross-correlates natural noise & velocity fields to output 3D geological models',
    drillBit: 'Processes mechanical feedback to calculate MSE and adapt rig control loops',
    highlight: 'Inversion vs. Closed-Loop Control',
  },
  {
    parameter: 'Primary Value',
    ant: 'Identifies high-probability drill targets without tearing up land or drilling blind',
    drillBit: 'Tells you exactly what the bit is touching right now; protects tools & preserves core',
    highlight: 'Targeting vs. Execution',
  },
];

// Real-Time Telemetry Closed-Loop Metrics Matrix
export const CLOSED_LOOP_METRICS = [
  {
    zone: 'Overburden / Waste Rock',
    vibrationSpectrum: 'Baseline (Uniform, low amplitude)',
    wobAdjustment: 'Standard (Moderate, 12,000 lbs)',
    rpmAdjustment: 'High (900 – 1,200 RPM)',
    fluidFlush: 'Standard Low',
    statusBadge: 'NORMAL RUN',
    color: 'emerald',
  },
  {
    zone: 'Hard Lithium Pegmatite',
    vibrationSpectrum: 'High Frequency Micro-shocks (100–250 kHz)',
    wobAdjustment: 'Increased by +40% (18,000 lbs)',
    rpmAdjustment: 'Reduced by -60% (350–450 RPM)',
    fluidFlush: 'Maximized (+25% flow)',
    statusBadge: 'HARDNESS ALARM',
    color: 'amber',
  },
  {
    zone: 'Fractured Copper Shear',
    vibrationSpectrum: 'Chaotic, Low Frequency Spikes (40–90 Hz)',
    wobAdjustment: 'Reduced by -30% (Active Dampening)',
    rpmAdjustment: 'Dynamic Variable Mode',
    fluidFlush: 'Medium-High',
    statusBadge: 'TORQUE CAP LIMIT',
    color: 'purple',
  },
  {
    zone: 'Soft Porous Sandstone / Uranium',
    vibrationSpectrum: 'Near Zero Resistance / Soft Hum (10–30 Hz)',
    wobAdjustment: 'Reduced to Minimum (4,000 lbs)',
    rpmAdjustment: 'Governed / Capped',
    fluidFlush: 'Minimized (Prevent Wall Washout)',
    statusBadge: 'ROP GOVERNOR',
    color: 'cyan',
  },
];

// 5-ms Python Telemetry Mock Data (from user prompt)
const MOCK_5MS_TELEMETRY = [
  { timestampMs: 0, wobLbs: 12000, torqueFtLbs: 850, rpm: 110, ropFtHr: 25.0, vibeFreqHz: 25 },
  { timestampMs: 5, wobLbs: 12500, torqueFtLbs: 920, rpm: 110, ropFtHr: 22.0, vibeFreqHz: 32 },
  { timestampMs: 10, wobLbs: 18000, torqueFtLbs: 1450, rpm: 45, ropFtHr: 4.5, vibeFreqHz: 180 },
  { timestampMs: 15, wobLbs: 9500, torqueFtLbs: 780, rpm: 80, ropFtHr: 18.0, vibeFreqHz: 45 },
  { timestampMs: 20, wobLbs: 4000, torqueFtLbs: 220, rpm: 120, ropFtHr: 65.0, vibeFreqHz: 15 },
];

export const AIVibrationSignalsCenter: React.FC = () => {
  // Navigation & Filter States
  const [activeSubTab, setActiveSubTab] = useState<
    'datasheet' | 'blueprint' | 'comparison' | 'control_room' | 'closed_loop' | 'satellite' | 'ar_equipment_health'
  >('control_room');
  const [selectedMineralId, setSelectedMineralId] = useState<string>('vib-cu');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClosedLoopScenario, setSelectedClosedLoopScenario] = useState<'lithium' | 'copper' | 'uranium'>('lithium');

  // Interactive Control Room Live Parameters
  const [wobLbs, setWobLbs] = useState<number>(18000);
  const [torqueFtLbs, setTorqueFtLbs] = useState<number>(1450);
  const [rpm, setRpm] = useState<number>(45);
  const [ropFtHr, setRopFtHr] = useState<number>(4.5);
  const [bitDiameterInches, setBitDiameterInches] = useState<number>(6.5);
  const [vibeFreqHz, setVibeFreqHz] = useState<number>(180);

  // Live Telemetry Streaming Simulator
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryMetricPoint[]>([]);
  const [activeLithologyTag, setActiveLithologyTag] = useState<string>('Hard Lithium Pegmatite');
  const [automationOverrideState, setAutomationOverrideState] = useState<string>('RPM THROTTLED 60% • WOB +40%');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunningScript, setIsRunningScript] = useState<boolean>(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [aiAnalysisData, setAiAnalysisData] = useState<any | null>(null);

  const handleRunGeminiVibrationAI = async () => {
    setIsAnalyzingAi(true);
    try {
      const selectedMineral = MINERAL_VIBRATION_DATA.find((m) => m.id === selectedMineralId);
      const res = await fetch('/api/gemini/analyze-vibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequencyHz: vibeFreqHz,
          shearWaveVelocity: 2850,
          mseMpa: currentMSE,
          torqueVariance: 14,
          ropMPerHour: Math.round(ropFtHr * 0.3048 * 10) / 10,
          depthM: 480,
          targetMineral: selectedMineral ? selectedMineral.mineralName : 'Copper (Chalcopyrite)',
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysisData(data.analysis);
      }
    } catch (err) {
      console.error('Failed to run AI vibration analysis:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // Teale's Mechanical Specific Energy (MSE) Formula:
  // MSE = (WOB / A_b) + ( (120 * pi * RPM * Torque) / (A_b * (ROP / 60)) )
  // Result in psi, converted to MPa (1 psi = 0.00689476 MPa)
  const currentMSE = useMemo(() => {
    const bitArea = Math.PI * Math.pow(bitDiameterInches / 2, 2);
    if (bitArea <= 0 || ropFtHr <= 0) return 0;
    const axialComponent = wobLbs / bitArea;
    const rotationalComponent = (120 * Math.PI * rpm * torqueFtLbs) / (bitArea * (ropFtHr / 60));
    const totalPsi = axialComponent + rotationalComponent;
    const totalMpa = totalPsi * 0.00689476;
    return Math.round(totalMpa * 100) / 100;
  }, [wobLbs, torqueFtLbs, rpm, ropFtHr, bitDiameterInches]);

  // Lithology Classifier Function
  const classifyLithology = (mse: number, freq: number) => {
    if (mse > 450 && freq >= 100 && freq <= 250) {
      return {
        tag: '🔥 ALARM: Lithium Pegmatite (Hard/Brittle)',
        action: 'Reducing RPM to 350, WOB boosted 40%, Flush +25%',
        override: 'RPM THROTTLED 60% • ACTIVE HARDNESS GOVERNOR',
        severity: 'CRITICAL' as const,
      };
    } else if (mse >= 250 && mse <= 450 && freq >= 30 && freq <= 90) {
      return {
        tag: '⚡ ALERT: Copper Sulfide Zone (Fractured)',
        action: 'Engaging Active Dampening & Torque-Limit Safety Cap',
        override: 'TORQUE SAFETY CAP ENFORCED • 1/4 REV READY',
        severity: 'WARNING' as const,
      };
    } else if (mse < 100) {
      return {
        tag: '💧 NOTICE: High Porosity Sandstone / Mud Overburden',
        action: 'Engaging ROP Governor (Max 2m/min); Restricting Flush Pressure',
        override: 'ROP GOVERNOR ACTIVE • PRESSURE RESTRICTED',
        severity: 'NORMAL' as const,
      };
    } else {
      return {
        tag: 'Baseline Host / Waste Rock',
        action: 'Standard rotary drilling parameters maintained',
        override: 'AUTONOMOUS CRUISE • NO OVERRIDE',
        severity: 'NORMAL' as const,
      };
    }
  };

  // Run Python Telemetry Pipeline Simulation
  const handleRunPythonScript = () => {
    setIsRunningScript(true);
    setTerminalOutput(['$ python3 ai_lithology_classifier.py', '--- AI DOWNHOLE TELEMETRY PROCESSOR ---']);

    const outputs: string[] = ['$ python3 ai_lithology_classifier.py', '--- AI DOWNHOLE TELEMETRY PROCESSOR ---'];

    MOCK_5MS_TELEMETRY.forEach((row, i) => {
      setTimeout(() => {
        const bitArea = Math.PI * Math.pow(6.5 / 2, 2);
        const axial = row.wobLbs / bitArea;
        const rotational = (120 * Math.PI * row.rpm * row.torqueFtLbs) / (bitArea * (row.ropFtHr / 60));
        const mse = Math.round((axial + rotational) * 0.00689476 * 100) / 100;
        const classification = classifyLithology(mse, row.vibeFreqHz);

        outputs.push(
          `Time: ${row.timestampMs}ms | MSE: ${mse} MPa | Vibe: ${row.vibeFreqHz}Hz`,
          `AI System Action -> ${classification.tag}`,
          `[Control Loop] ${classification.action}\n`
        );
        setTerminalOutput([...outputs]);

        if (i === MOCK_5MS_TELEMETRY.length - 1) {
          outputs.push('✓ Telemetry batch processed in 1.4ms. Closed-loop commands sent to rig PLC.');
          setTerminalOutput([...outputs]);
          setIsRunningScript(false);
        }
      }, (i + 1) * 350);
    });
  };

  // Real-time ticking stream for Control Room Telemetry
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Add small natural jitter to active telemetry
      const jitterWob = wobLbs + Math.floor((Math.random() - 0.5) * 400);
      const jitterTorque = torqueFtLbs + Math.floor((Math.random() - 0.5) * 30);
      const jitterFreq = Math.max(10, vibeFreqHz + Math.floor((Math.random() - 0.5) * 8));

      const bitArea = Math.PI * Math.pow(bitDiameterInches / 2, 2);
      const axial = jitterWob / bitArea;
      const rotational = (120 * Math.PI * rpm * jitterTorque) / (bitArea * (ropFtHr / 60));
      const simulatedMse = Math.round((axial + rotational) * 0.00689476 * 100) / 100;

      const classification = classifyLithology(simulatedMse, jitterFreq);
      setActiveLithologyTag(classification.tag);
      setAutomationOverrideState(classification.override);

      setTelemetryHistory((prev) => {
        const next: TelemetryMetricPoint = {
          timestampMs: now,
          wobLbs: jitterWob,
          torqueFtLbs: jitterTorque,
          rpm,
          ropFtHr,
          vibeFreqHz: jitterFreq,
          mseMpa: simulatedMse,
          lithologyTag: classification.tag,
          alarmStatus: classification.severity,
        };
        return [...prev.slice(-19), next];
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating, wobLbs, torqueFtLbs, rpm, ropFtHr, bitDiameterInches, vibeFreqHz]);

  // Presets for quick switching
  const applyPreset = (preset: 'lithium' | 'copper' | 'sandstone' | 'baseline') => {
    if (preset === 'lithium') {
      setWobLbs(18000);
      setTorqueFtLbs(1450);
      setRpm(45);
      setRopFtHr(4.5);
      setVibeFreqHz(180);
    } else if (preset === 'copper') {
      setWobLbs(11500);
      setTorqueFtLbs(1100);
      setRpm(85);
      setRopFtHr(14.0);
      setVibeFreqHz(55);
    } else if (preset === 'sandstone') {
      setWobLbs(4000);
      setTorqueFtLbs(220);
      setRpm(120);
      setRopFtHr(65.0);
      setVibeFreqHz(18);
    } else {
      setWobLbs(12000);
      setTorqueFtLbs(850);
      setRpm(110);
      setRopFtHr(25.0);
      setVibeFreqHz(25);
    }
  };

  // Export Data Sheet to CSV
  const handleExportDataSheetCSV = () => {
    const headers = [
      'Mineral_Name',
      'Primary_Chemical_Compound',
      'Subsurface_Depth_Level',
      'Diagnostic_Vibration_Signal',
      'Effective_Sensor_Range',
      'AI_System_Alarm_Threshold',
      'Deposit_Type',
    ];
    const rows = [headers.join(',')];

    MINERAL_VIBRATION_DATA.forEach((item) => {
      const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
      rows.push(
        [
          escape(item.mineralName),
          escape(item.primaryCompound),
          escape(item.depthLevel),
          escape(item.diagnosticSignal),
          escape(item.sensorRange),
          escape(item.alarmThreshold),
          escape(item.depositType),
        ].join(',')
      );
    });

    downloadCSV(
      `Mineral_Detection_Vibration_Signal_Data_Sheet_${new Date().toISOString().split('T')[0]}.csv`,
      rows.join('\r\n')
    );
  };

  // Export Data Sheet to PDF
  const handleExportDataSheetPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setFillColor(42, 24, 16);
    doc.rect(0, 0, pageWidth, 22, 'F');
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 22, pageWidth, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('MINERAL DETECTION & VIBRATION SIGNAL DATA SHEET', margin, 12);
    doc.setFontSize(8);
    doc.setTextColor(251, 191, 36);
    doc.text('Ambient Noise Tomography (ANT) & Active Drill-Bit Telemetry AI Acoustic Blueprint', margin, 18);

    const head = [
      ['Mineral Name', 'Compound', 'Subsurface Depth', 'Diagnostic Vibration Signal', 'Effective Range', 'AI System Alarm Threshold'],
    ];

    const body = MINERAL_VIBRATION_DATA.map((item) => [
      item.mineralName,
      item.primaryCompound,
      item.depthLevel,
      item.diagnosticSignal,
      item.sensorRange,
      item.alarmThreshold,
    ]);

    autoTable(doc, {
      startY: 28,
      head,
      body,
      theme: 'striped',
      headStyles: { fillColor: [42, 24, 16], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 42 },
        1: { cellWidth: 32 },
        2: { cellWidth: 38 },
        3: { cellWidth: 70 },
        4: { cellWidth: 28 },
        5: { fontStyle: 'bold', textColor: [180, 83, 9] },
      },
      margin: { left: margin, right: margin },
    });

    doc.save(`Mineral_Vibration_Signal_Blueprint_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Filtered mineral list
  const filteredMinerals = useMemo(() => {
    return MINERAL_VIBRATION_DATA.filter((m) => {
      const q = searchTerm.toLowerCase();
      return (
        m.mineralName.toLowerCase().includes(q) ||
        m.primaryCompound.toLowerCase().includes(q) ||
        m.diagnosticSignal.toLowerCase().includes(q) ||
        m.alarmThreshold.toLowerCase().includes(q)
      );
    });
  }, [searchTerm]);

  const activeMineral = MINERAL_VIBRATION_DATA.find((m) => m.id === selectedMineralId) || MINERAL_VIBRATION_DATA[0];

  return (
    <div id="ai-vibration-signals-center" className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#1F120C] to-[#160C08] border border-amber-900/40 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
          <Radio size={280} className="text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Radio size={16} />
              </span>
              <span className="text-xs font-mono font-bold tracking-widest uppercase text-amber-400">
                Acoustic &amp; Ambient Seismic Intelligence
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                ANT &bull; IoT Drill Telemetry
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              AI-Driven Mineral Exploration &amp; Vibration Telemetry
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              In autonomous mineral exploration and drilling systems, <strong className="text-white">&ldquo;vibrating signals&rdquo;</strong> refer to the interpretation of ambient seismic noise via <strong className="text-amber-300">Ambient Noise Tomography (ANT)</strong> and micro-frequency acoustic feedback during drilling. Machine learning engines continuously decode wave propagation and Mechanical Specific Energy (MSE) to map hidden orebodies and adjust rig hydraulics in real time.
            </p>
          </div>

          {/* Quick Stats / Action Bar */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 flex-shrink-0">
            <button
              id="btn-export-vibe-datasheet-csv"
              onClick={handleExportDataSheetCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all shadow-sm"
            >
              <FileSpreadsheet size={14} className="text-amber-400" />
              <span>Export Data Sheet (CSV)</span>
            </button>

            <button
              id="btn-export-vibe-datasheet-pdf"
              onClick={handleExportDataSheetPDF}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs shadow-md transition-all"
            >
              <FileText size={14} />
              <span>Download Blueprint PDF</span>
            </button>
          </div>
        </div>

        {/* 3 Core Principles Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-stone-800/80">
          <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-['Space_Grotesk']">
              <Globe2 size={15} />
              <span>The &ldquo;Detective&rdquo; Vibrating Signal</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Real-world systems like Fleet Space&apos;s Geode collect ambient seismic earth hum. AI algorithms decode wave speed differentials into 3D subsurface velocity models.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs font-['Space_Grotesk']">
              <Activity size={15} />
              <span>Drilling Vibration Analysis (0–400 kHz)</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Automated rigs measure acoustic resonance as the diamond bit cuts rock. Harder crystalline lattices shift the frequency spectrum, instantly flagging lithology transitions.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-['Space_Grotesk']">
              <ShieldAlert size={15} />
              <span>Subsurface Alarms &amp; Automation</span>
            </div>
            <p className="text-[11px] text-stone-300 leading-relaxed">
              Autonomous platforms trigger automatic threshold alerts when acoustic and geophysical fingerprints match deposit blueprints, commanding closed-loop rig adjustments.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3 overflow-x-auto scrollbar-none">
        <button
          id="btn-tab-control-room"
          onClick={() => setActiveSubTab('control_room')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'control_room'
              ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
              : 'bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Sliders size={14} />
          <span>Interactive AI Control Room &amp; MSE</span>
        </button>

        <button
          id="btn-tab-equipment-ar-health"
          onClick={() => setActiveSubTab('ar_equipment_health')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'ar_equipment_health'
              ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
              : 'bg-stone-900/80 text-amber-300 hover:text-white border border-amber-500/40'
          }`}
        >
          <Camera size={14} />
          <span>Equipment AR Health Dashboard</span>
        </button>

        <button
          onClick={() => setActiveSubTab('datasheet')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'datasheet'
              ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
              : 'bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <FileSpreadsheet size={14} />
          <span>Mineral Detection &amp; Signal Data Sheet</span>
        </button>

        <button
          onClick={() => setActiveSubTab('blueprint')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'blueprint'
              ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
              : 'bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Radio size={14} />
          <span>Technical Blueprint (Cu, Li, Au, U)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('comparison')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'comparison'
              ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
              : 'bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Activity size={14} />
          <span>Direct Sensor Comparison (ANT vs. Bit)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('closed_loop')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'closed_loop'
              ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
              : 'bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Cpu size={14} />
          <span>Closed-Loop Rig Control Loops</span>
        </button>

        <button
          onClick={() => setActiveSubTab('satellite')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'satellite'
              ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
              : 'bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800'
          }`}
        >
          <Satellite size={14} />
          <span>Satellite Fleet Orchestration</span>
        </button>
      </div>

      {/* EQUIPMENT AR HEALTH DASHBOARD (Visible in Dedicated Sub-Tab & Control Room) */}
      {(activeSubTab === 'ar_equipment_health' || activeSubTab === 'control_room') && (
        <EquipmentARHealthDashboard
          wobLbs={wobLbs}
          torqueFtLbs={torqueFtLbs}
          rpm={rpm}
          vibeFreqHz={vibeFreqHz}
          currentMSE={currentMSE}
        />
      )}

      {/* SUBTAB 1: INTERACTIVE AI-MINING CONTROL ROOM & MSE CALCULATOR */}
      {activeSubTab === 'control_room' && (
        <div className="space-y-6">
          {/* Top Control Bar with Presets & Live Streaming Toggle */}
          <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm font-['Space_Grotesk']">
                  Interactive Drill Telemetry Screen &amp; MSE Calculator
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  10ms Real-Time Sampling
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Simulate downhole weight-on-bit, torque, RPM, and ROP to calculate Mechanical Specific Energy (MSE) and observe autonomous control loop overrides.
              </p>
            </div>

            {/* Geological Formation Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">Presets:</span>
              <button
                onClick={() => applyPreset('lithium')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 border border-amber-500/40 transition-all"
              >
                Lithium Pegmatite
              </button>
              <button
                onClick={() => applyPreset('copper')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/40 transition-all"
              >
                Copper Shear
              </button>
              <button
                onClick={() => applyPreset('sandstone')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-stone-950 border border-cyan-500/40 transition-all"
              >
                Soft Sandstone
              </button>
              <button
                onClick={() => applyPreset('baseline')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-all"
              >
                Baseline Waste
              </button>

              <button
                onClick={() => setIsSimulating((prev) => !prev)}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-all ml-2 ${
                  isSimulating
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
                title={isSimulating ? 'Pause streaming simulation' : 'Resume streaming simulation'}
              >
                {isSimulating ? <Pause size={14} /> : <Play size={14} />}
              </button>
            </div>
          </div>

          {/* Interactive Parameters Sliders & Live Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Interactive Telemetry Sliders & Teale's Formula */}
            <div className="lg:col-span-7 space-y-5 rounded-2xl bg-[#1C100B] border border-stone-800 p-5 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <Gauge size={18} className="text-amber-400" />
                  <h3 className="font-bold text-white text-sm font-['Space_Grotesk']">
                    Rig Physical Telemetry Inputs
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-stone-400">
                  Bit Area: {(Math.PI * Math.pow(bitDiameterInches / 2, 2)).toFixed(2)} in² ({bitDiameterInches}&quot; Bit)
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WOB */}
                <div className="space-y-1.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300 font-bold">Weight on Bit (WOB)</span>
                    <span className="font-mono text-amber-400 font-bold">{wobLbs.toLocaleString()} lbs</span>
                  </div>
                  <input
                    type="range"
                    min={2000}
                    max={25000}
                    step={250}
                    value={wobLbs}
                    onChange={(e) => setWobLbs(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                    <span>2k lbs (Soft)</span>
                    <span>18k lbs (Pegmatite)</span>
                    <span>25k lbs (Max)</span>
                  </div>
                </div>

                {/* Torque */}
                <div className="space-y-1.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300 font-bold">Drill-String Torque (&tau;)</span>
                    <span className="font-mono text-amber-400 font-bold">{torqueFtLbs.toLocaleString()} ft-lbs</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={2500}
                    step={25}
                    value={torqueFtLbs}
                    onChange={(e) => setTorqueFtLbs(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                    <span>100 (Free)</span>
                    <span>1,450 (Crystalline)</span>
                    <span>2,500 (Bind risk)</span>
                  </div>
                </div>

                {/* RPM */}
                <div className="space-y-1.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300 font-bold">Rotational Speed (RPM)</span>
                    <span className="font-mono text-amber-400 font-bold">{rpm} RPM</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={1200}
                    step={10}
                    value={rpm}
                    onChange={(e) => setRpm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                    <span>45 (Slow bite)</span>
                    <span>350 (Governed)</span>
                    <span>1,200 (Overburden)</span>
                  </div>
                </div>

                {/* ROP */}
                <div className="space-y-1.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300 font-bold">Rate of Penetration (ROP)</span>
                    <span className="font-mono text-amber-400 font-bold">{ropFtHr.toFixed(1)} ft/hr</span>
                  </div>
                  <input
                    type="range"
                    min={1.0}
                    max={90.0}
                    step={0.5}
                    value={ropFtHr}
                    onChange={(e) => setRopFtHr(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                    <span>4.5 ft/hr (Rigid)</span>
                    <span>25 ft/hr (Normal)</span>
                    <span>90 ft/hr (Void/Soft)</span>
                  </div>
                </div>

                {/* Vibration Frequency */}
                <div className="space-y-1.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300 font-bold">Acoustic Vibration Frequency</span>
                    <span className="font-mono text-cyan-400 font-bold">{vibeFreqHz} Hz (or kHz)</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={250}
                    step={5}
                    value={vibeFreqHz}
                    onChange={(e) => setVibeFreqHz(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                    <span>15 Hz (Sandstone)</span>
                    <span>60 Hz (Cu shear)</span>
                    <span>180–250 (Pegmatite)</span>
                  </div>
                </div>

                {/* Bit Diameter */}
                <div className="space-y-1.5 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-300 font-bold">Drill Bit Diameter</span>
                    <span className="font-mono text-stone-300 font-bold">{bitDiameterInches}&quot;</span>
                  </div>
                  <select
                    value={bitDiameterInches}
                    onChange={(e) => setBitDiameterInches(Number(e.target.value))}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value={4.75}>4.75&quot; (HQ Diamond Core / 121mm)</option>
                    <option value={6.5}>6.50&quot; (Standard RC / Blast-hole)</option>
                    <option value={7.875}>7.875&quot; (Heavy Rotary Infill)</option>
                    <option value={9.0}>9.00&quot; (Deep Exploration Pilot)</option>
                  </select>
                </div>
              </div>

              {/* The Teale's MSE Equation Box */}
              <div className="p-3.5 rounded-xl bg-stone-950/80 border border-amber-900/40 text-xs space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>Teale&apos;s Mechanical Specific Energy (MSE) Mathematical Model:</span>
                  <span className="text-[10px] font-mono text-stone-400">1965 Petroleum &amp; Geotech Standard</span>
                </div>
                <div className="p-2.5 rounded-lg bg-stone-900 font-mono text-amber-200 text-center text-xs sm:text-sm border border-stone-800">
                  MSE = (WOB / A_B) + [ (120 &times; &pi; &times; RPM &times; &tau;) / (A_B &times; ROP) ]
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-stone-400 font-mono pt-1">
                  <div>WOB: {wobLbs} lbs</div>
                  <div>Torque: {torqueFtLbs} ft-lbs</div>
                  <div>RPM: {rpm}</div>
                  <div>ROP: {ropFtHr} ft/hr</div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Real-Time Output, Lithology Classifier & Override Status */}
            <div className="lg:col-span-5 space-y-5">
              {/* Calculated MSE Gauge Box */}
              <div className="p-5 rounded-2xl bg-[#1C100B] border border-amber-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-stone-400">Calculated MSE Index</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      currentMSE > 450
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : currentMSE >= 250
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : currentMSE < 100
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {currentMSE > 450 ? 'SURGE ANOMALY' : currentMSE < 100 ? 'VOID/POROUS' : 'BALANCED'}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <div className="text-4xl font-extrabold text-white font-mono tracking-tight">
                    {currentMSE}
                  </div>
                  <div className="text-sm font-bold text-amber-400">MPa</div>
                  <div className="text-xs text-stone-400 font-mono ml-auto">
                    ({Math.round(currentMSE / 0.00689476).toLocaleString()} psi)
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1">
                  <div className="h-2.5 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        currentMSE > 450
                          ? 'bg-gradient-to-r from-amber-500 to-red-500'
                          : currentMSE >= 250
                          ? 'bg-amber-500'
                          : currentMSE < 100
                          ? 'bg-cyan-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (currentMSE / 600) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-stone-400">
                    <span>0 MPa (Soft)</span>
                    <span>250 MPa (Cu Shear)</span>
                    <span>450+ MPa (Rigid Pegmatite)</span>
                  </div>
                </div>

                {/* Inferred Lithology Output */}
                <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                    AI Inferred Subsurface Lithology
                  </span>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Flame size={16} className={currentMSE > 450 ? 'text-amber-400' : 'text-stone-500'} />
                    <span>{classifyLithology(currentMSE, vibeFreqHz).tag}</span>
                  </div>
                  <p className="text-xs text-stone-300 pt-0.5">
                    {classifyLithology(currentMSE, vibeFreqHz).action}
                  </p>
                </div>

                {/* Automation Override State Card */}
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <Zap size={15} />
                    <span>Automation Override State</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-white">
                    {automationOverrideState}
                  </div>
                  <p className="text-[10px] text-purple-300/80 leading-relaxed">
                    Closed-loop safety algorithm prevents diamond cutter destruction, bit binding, or borehole hydraulic washouts.
                  </p>
                </div>

                {/* Gemini AI Live Seismic & Acoustic Signal Interpretation Trigger */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#2D160E] to-[#1F100B] border border-amber-500/40 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <Sparkles size={16} />
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white font-['Space_Grotesk']">
                          Gemini 3.8 Flash Seismic AI Diagnostic
                        </h4>
                        <p className="text-[10px] text-amber-300/80">
                          Ambient Noise Tomography &amp; Bit Acoustic Inversion
                        </p>
                      </div>
                    </div>

                    <button
                      id="btn-run-ai-vibe-analysis"
                      disabled={isAnalyzingAi}
                      onClick={handleRunGeminiVibrationAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      {isAnalyzingAi ? (
                        <>
                          <Activity size={13} className="animate-spin text-stone-950" />
                          <span>Inverting Signals...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>Run AI Diagnostic</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiAnalysisData && (
                    <div className="pt-2 border-t border-amber-900/40 space-y-2.5 text-xs animate-in fade-in duration-300">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-stone-800">
                        <span className="text-stone-300 font-medium">Ore Deposit Likelihood:</span>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {aiAnalysisData.confidenceScore}% Confidence
                        </span>
                      </div>

                      {/* Mineral Likelihood Bars */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-stone-400">
                          Diagnostic Resonance Matches:
                        </span>
                        {aiAnalysisData.mineralLikelihoods?.map((item: any, idx: number) => (
                          <div key={idx} className="space-y-0.5 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-stone-200">{item.mineral}</span>
                              <span className="font-mono font-bold text-amber-300">{item.probability}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full"
                                style={{ width: `${item.probability}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Closed-loop overrides */}
                      {aiAnalysisData.drillingDynamics?.closedLoopOverrides?.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/30 text-[11px] space-y-1">
                          <span className="font-bold text-purple-300 flex items-center gap-1">
                            <Cpu size={12} />
                            <span>AI Closed-Loop Rig Overrides:</span>
                          </span>
                          <ul className="list-disc list-inside text-stone-300 space-y-0.5">
                            {aiAnalysisData.drillingDynamics.closedLoopOverrides.map((action: string, i: number) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendation */}
                      <p className="text-[11px] text-stone-300 bg-black/30 p-2 rounded-lg border border-stone-800/80 leading-relaxed italic">
                        &ldquo;{aiAnalysisData.recommendation}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Crossover Indicators Guide */}
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2 text-xs text-stone-300">
                <span className="font-bold text-white block">Key AI Crossover Indicators:</span>
                <ul className="space-y-1.5 text-[11px] list-disc list-inside">
                  <li>
                    <strong className="text-amber-300">MSE Curve vs. ROP:</strong> When ROP plummets while MSE skyrockets, the system flags a hard mineral boundary (e.g. spodumene pegmatite).
                  </li>
                  <li>
                    <strong className="text-cyan-300">Vibration Spectrogram:</strong> High frequency acoustic bands (100–250 kHz) highlight brittle quartz and spodumene crystal lattices.
                  </li>
                  <li>
                    <strong className="text-purple-300">Baseline Drift:</strong> Spiking MSE without lithology change logs a Bit Wear Alarm (cutters dull, energy wasted as heat).
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Real-Time Telemetry Stream Table & Spectrogram Simulator */}
          <div className="rounded-2xl bg-[#1C100B] border border-stone-800 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm font-['Space_Grotesk'] flex items-center gap-2">
                  <span>Downhole Live Telemetry Feed (10ms Samples &bull; Rolling Buffer)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    ONLINE
                  </span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Real-time mechanical sensor stream feeding the edge classifier on rig PLC.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-stone-400">
                  Buffer size: {telemetryHistory.length} readings
                </span>
                <button
                  onClick={() => setTelemetryHistory([])}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
                >
                  Clear Buffer
                </button>
              </div>
            </div>

            {/* Rolling Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/90 text-stone-400 uppercase text-[10px] font-mono border-b border-stone-800">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">WOB (lbs)</th>
                    <th className="py-2.5 px-3">Torque (ft-lbs)</th>
                    <th className="py-2.5 px-3">RPM</th>
                    <th className="py-2.5 px-3">ROP (ft/hr)</th>
                    <th className="py-2.5 px-3">Vibe Freq (Hz)</th>
                    <th className="py-2.5 px-3">MSE (MPa)</th>
                    <th className="py-2.5 px-3">Classification &bull; Alarm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                  {telemetryHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-stone-500 italic">
                        Awaiting incoming downhole telemetry stream...
                      </td>
                    </tr>
                  ) : (
                    telemetryHistory
                      .slice()
                      .reverse()
                      .map((pt, i) => (
                        <tr
                          key={pt.timestampMs + '-' + i}
                          className={
                            pt.alarmStatus === 'CRITICAL'
                              ? 'bg-amber-500/10 hover:bg-amber-500/15'
                              : pt.alarmStatus === 'WARNING'
                              ? 'bg-purple-900/20 hover:bg-purple-900/30'
                              : 'hover:bg-stone-900/40'
                          }
                        >
                          <td className="py-2 px-3 text-stone-400">
                            {new Date(pt.timestampMs).toLocaleTimeString()}
                          </td>
                          <td className="py-2 px-3 text-white font-bold">{pt.wobLbs.toLocaleString()}</td>
                          <td className="py-2 px-3 text-stone-200">{pt.torqueFtLbs}</td>
                          <td className="py-2 px-3 text-stone-200">{pt.rpm}</td>
                          <td className="py-2 px-3 text-amber-300 font-bold">{pt.ropFtHr.toFixed(1)}</td>
                          <td className="py-2 px-3 text-cyan-300">{pt.vibeFreqHz} Hz</td>
                          <td className="py-2 px-3 font-bold text-white">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                pt.mseMpa > 450
                                  ? 'bg-red-500/20 text-red-300'
                                  : pt.mseMpa > 250
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'text-stone-300'
                              }`}
                            >
                              {pt.mseMpa}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[11px] text-stone-200 font-sans font-medium">
                              {pt.lithologyTag}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Production-Grade Python Lithology Classifier Script & Interactive Runner */}
          <div className="rounded-2xl bg-[#1C100B] border border-amber-900/40 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Code size={18} className="text-amber-400" />
                  <h3 className="font-bold text-white text-sm font-['Space_Grotesk']">
                    Automated Lithology Classifier (Python Pipeline)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                    Edge Model v2.4
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  Production-grade algorithm processing raw downhole telemetry (WOB, Torque, RPM, ROP, Vibration Frequency) to calculate MSE and trigger closed-loop alerts.
                </p>
              </div>

              <button
                id="btn-execute-python-classifier"
                onClick={handleRunPythonScript}
                disabled={isRunningScript}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isRunningScript ? (
                  <>
                    <RotateCcw size={14} className="animate-spin" />
                    <span>Processing Telemetry...</span>
                  </>
                ) : (
                  <>
                    <Terminal size={14} />
                    <span>Run Live Telemetry Test</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Python Script Code Viewer */}
              <div className="rounded-xl bg-stone-950 border border-stone-800 p-4 font-mono text-[11px] text-stone-300 overflow-x-auto max-h-[300px] scrollbar-thin">
                <div className="flex justify-between items-center text-stone-500 text-[10px] pb-2 border-b border-stone-800 mb-2">
                  <span>ai_lithology_classifier.py</span>
                  <span>Python 3.11 &bull; NumPy/Pandas</span>
                </div>
                <pre className="text-stone-300 leading-relaxed">
{`import numpy as np
import pandas as pd

def calculate_mse(wob, torque, rpm, rop, bit_diameter_inches=6.5):
    """Calculates Mechanical Specific Energy (MSE) in MPa."""
    bit_area = np.pi * (bit_diameter_inches / 2) ** 2
    axial_component = wob / bit_area
    rotational_component = (120 * np.pi * rpm * torque) / (bit_area * (rop / 60))
    mse_mpa = (axial_component + rotational_component) * 0.00689476
    return round(mse_mpa, 2)

def ai_lithology_classifier(mse, freq_hz):
    if mse > 450 and 100 <= freq_hz <= 250:
        return "🔥 ALARM: Lithium Pegmatite (Hard/Brittle) - Reducing RPM"
    elif 250 <= mse <= 450 and 30 <= freq_hz <= 90:
        return "⚡ ALERT: Copper Sulfide Zone (Fractured) - Engaging Active Dampening"
    elif mse < 100:
        return "💧 NOTICE: High Porosity Sandstone / Mud Overburden"
    else:
        return "Baseline Waste Rock"`}
                </pre>
              </div>

              {/* Simulated Terminal Execution Output */}
              <div className="rounded-xl bg-stone-950 border border-stone-800 p-4 font-mono text-[11px] text-emerald-400 overflow-y-auto max-h-[300px] scrollbar-thin flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center text-stone-500 text-[10px] pb-2 border-b border-stone-800 mb-2">
                    <span>Edge Terminal Output</span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Ready</span>
                    </span>
                  </div>

                  {terminalOutput.length === 0 ? (
                    <div className="text-stone-500 italic py-8 text-center">
                      Click &ldquo;Run Live Telemetry Test&rdquo; to simulate execution across the 5ms dataset.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {terminalOutput.map((line, idx) => (
                        <div
                          key={idx}
                          className={
                            line.startsWith('$')
                              ? 'text-stone-400 font-bold'
                              : line.includes('ALARM')
                              ? 'text-amber-400 font-bold'
                              : line.includes('ALERT')
                              ? 'text-purple-400 font-bold'
                              : line.includes('✓')
                              ? 'text-emerald-400 font-bold'
                              : 'text-stone-300'
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 text-[10px] text-stone-500 border-t border-stone-800/80 mt-2">
                  Dataset: [25Hz, 32Hz, 180Hz, 45Hz, 15Hz] &bull; Sampling rate: 200 Hz
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MINERAL DETECTION & VIBRATION SIGNAL DATA SHEET */}
      {activeSubTab === 'datasheet' && (
        <div className="space-y-5">
          {/* Search & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative sm:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search mineral, compound, vibration signal..."
                className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDataSheetCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold transition-all"
              >
                <FileSpreadsheet size={13} className="text-amber-400" />
                <span>CSV Sheet</span>
              </button>
              <button
                onClick={handleExportDataSheetPDF}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-sm"
              >
                <Download size={13} />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Master Data Sheet Table */}
          <div className="rounded-2xl bg-[#1C100B] border border-amber-900/40 overflow-hidden shadow-xl">
            <div className="p-4 bg-gradient-to-r from-[#2A1810] to-[#1C100B] border-b border-amber-900/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm font-['Space_Grotesk']">
                  Mineral Detection &amp; Vibration Signal Data Sheet
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Processed by automated geo-AI platforms for passive ANT and active diamond-bit acoustic systems.
                </p>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {filteredMinerals.length} Target Minerals Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/90 text-stone-400 uppercase text-[10px] font-mono border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Mineral Name</th>
                    <th className="py-3 px-4">Primary Compound</th>
                    <th className="py-3 px-4">Subsurface Depth</th>
                    <th className="py-3 px-4">Diagnostic Vibration / Resonant Signal</th>
                    <th className="py-3 px-4">Effective Range</th>
                    <th className="py-3 px-4">AI Alarm Threshold</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {filteredMinerals.map((mineral) => (
                    <tr
                      key={mineral.id}
                      onClick={() => {
                        setSelectedMineralId(mineral.id);
                        setActiveSubTab('blueprint');
                      }}
                      className="hover:bg-stone-900/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white group-hover:text-amber-300 transition-colors">
                          {mineral.mineralName}
                        </div>
                        <div className="text-[10px] text-stone-400">{mineral.depositType}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {mineral.primaryCompound}
                      </td>

                      <td className="py-3.5 px-4 text-stone-300 text-[11px]">
                        {mineral.depthLevel}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-stone-200 text-xs font-medium max-w-md">
                          {mineral.diagnosticSignal}
                        </div>
                        <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-stone-950 text-cyan-300 border border-stone-800">
                          {mineral.frequencyBand}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold whitespace-nowrap">
                        {mineral.sensorRange}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                          {mineral.alarmThreshold}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 group-hover:translate-x-1 transition-transform">
                          <span>Blueprint</span>
                          <ChevronRight size={13} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TECHNICAL BLUEPRINT (Cu, Li, Au, U) */}
      {activeSubTab === 'blueprint' && (
        <div className="space-y-6">
          {/* Target Mineral Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {MINERAL_VIBRATION_DATA.map((min) => (
              <button
                key={min.id}
                onClick={() => setSelectedMineralId(min.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedMineralId === min.id
                    ? 'bg-amber-500 text-stone-950 font-extrabold shadow-md'
                    : 'bg-stone-900/80 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                <span>{min.mineralName}</span>
                <span className="text-[10px] font-mono opacity-80">({min.primaryCompound})</span>
              </button>
            ))}
          </div>

          {/* Active Mineral Detail Dossier Card */}
          <div className="rounded-2xl bg-[#1C100B] border border-amber-900/50 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white font-['Space_Grotesk']">
                    {activeMineral.mineralName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {activeMineral.primaryCompound}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  Deposit Type: {activeMineral.depositType} &bull; Target Depth: {activeMineral.depthLevel}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] text-stone-400 uppercase font-mono">Max Sensor Range</div>
                  <div className="text-sm font-bold font-mono text-emerald-400">{activeMineral.sensorRange}</div>
                </div>
                <div className="text-right border-l border-stone-800 pl-3">
                  <div className="text-[10px] text-stone-400 uppercase font-mono">Frequency Band</div>
                  <div className="text-sm font-bold font-mono text-cyan-300">{activeMineral.frequencyBand}</div>
                </div>
              </div>
            </div>

            {/* Passive ANT vs Active Telemetry Deep-Dive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Passive ANT Signal Card */}
              <div className="p-5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm font-['Space_Grotesk']">
                    <Globe2 size={18} />
                    <span>Passive ANT Signal Response</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                    ExoSphere / Geodes
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {activeMineral.passiveAntSignal}
                </p>

                <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
                  <span>Wavefield Processing:</span>
                  <span className="font-mono text-cyan-300">Ambient Noise Cross-Correlation</span>
                </div>
              </div>

              {/* Active Drill Telemetry Card */}
              <div className="p-5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-['Space_Grotesk']">
                    <Activity size={18} />
                    <span>Active Drill Telemetry Signal</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                    Smartdrill / Hexagon AI
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {activeMineral.activeDrillTelemetry}
                </p>

                <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
                  <span>Downhole Measurement:</span>
                  <span className="font-mono text-amber-300">Torque &bull; WOB &bull; Axial Chatter</span>
                </div>
              </div>
            </div>

            {/* System Alarm & Closed-Loop Command Trigger */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#2A1810] to-[#1C100B] border border-amber-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <ShieldAlert size={18} className="text-amber-400" />
                  <span>AI Automated System Alarm: {activeMineral.systemAlarmType}</span>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500 text-stone-950 shadow-sm">
                  Threshold: {activeMineral.alarmThreshold}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-stone-950/80 border border-stone-800 text-xs text-stone-300 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Closed-Loop Physical Rig Adjustment:
                </span>
                <p className="leading-relaxed text-white font-medium">
                  {activeMineral.closedLoopAction}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: DIRECT SENSOR COMPARISON (ANT vs. BIT TELEMETRY) */}
      {activeSubTab === 'comparison' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#1C100B] border border-stone-800 p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
                Direct Sensor Comparison: Passive ANT vs. Active Drill-Bit Telemetry
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Understanding the two primary sensor paradigms powering autonomous mineral exploration and precision diamond core extraction.
              </p>
            </div>

            {/* Comparison Cards / Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ANT Card */}
              <div className="p-5 rounded-2xl bg-stone-900/90 border border-cyan-800/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Globe2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base font-['Space_Grotesk']">
                      Ambient Noise Tomography (ANT)
                    </h3>
                    <p className="text-xs text-cyan-300 font-mono">Passive &bull; Non-Invasive &bull; Regional</p>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  A passive seismic system (such as Fleet Space Technologies&apos; ExoSphere / Geodes). It measures how natural ground vibrations and the earth&apos;s &ldquo;hum&rdquo; travel through different rock densities to generate 3D subsurface velocity maps without drilling.
                </p>

                <div className="space-y-2 pt-2 text-xs border-t border-stone-800">
                  <div className="flex justify-between py-1 border-b border-stone-800/60">
                    <span className="text-stone-400">Sensor Hardware:</span>
                    <span className="font-bold text-white">Surface Geophone Arrays</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/60">
                    <span className="text-stone-400">Depth Penetration:</span>
                    <span className="font-bold text-cyan-300">Up to 3,000m – 4,000m</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/60">
                    <span className="text-stone-400">Environmental Impact:</span>
                    <span className="font-bold text-emerald-400">Zero surface scarring</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-400">Primary Value:</span>
                    <span className="font-bold text-white text-right">Tells you WHERE to drill</span>
                  </div>
                </div>
              </div>

              {/* Active Drill-Bit Telemetry Card */}
              <div className="p-5 rounded-2xl bg-stone-900/90 border border-amber-800/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base font-['Space_Grotesk']">
                      Active Drill-Bit Telemetry
                    </h3>
                    <p className="text-xs text-amber-300 font-mono">Active &bull; Millisecond &bull; Local Bit Level</p>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  An active sensor suite built into automated rigs (such as Hexagon&apos;s Drill Assist AI or Cortex Smartdrill). It tracks mechanical vibration data (torque, pull-down force, RPM adaptations) every 10 milliseconds to profile ground hardness and lithology on the fly.
                </p>

                <div className="space-y-2 pt-2 text-xs border-t border-stone-800">
                  <div className="flex justify-between py-1 border-b border-stone-800/60">
                    <span className="text-stone-400">Sensor Hardware:</span>
                    <span className="font-bold text-white">Downhole Accelerometers &amp; EM Tools</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/60">
                    <span className="text-stone-400">Sampling Interval:</span>
                    <span className="font-bold text-amber-300">10 milliseconds (100 Hz)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800/60">
                    <span className="text-stone-400">AI Closed Loop:</span>
                    <span className="font-bold text-purple-300">Direct Rig Hydraulics Control</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-400">Primary Value:</span>
                    <span className="font-bold text-white text-right">Tells you WHAT bit touches NOW</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabular Direct Comparison */}
            <div className="rounded-xl border border-stone-800 overflow-hidden">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900 text-stone-400 uppercase text-[10px] font-mono border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Parameter</th>
                    <th className="py-3 px-4 text-cyan-300">Ambient Noise Tomography (ANT)</th>
                    <th className="py-3 px-4 text-amber-300">Active Drill-Bit Telemetry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/70">
                  {SENSOR_COMPARISON_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-900/40">
                      <td className="py-3 px-4 font-bold text-white">{row.parameter}</td>
                      <td className="py-3 px-4 text-stone-300">{row.ant}</td>
                      <td className="py-3 px-4 text-stone-300">{row.drillBit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: CLOSED-LOOP RIG CONTROL LOOPS */}
      {activeSubTab === 'closed_loop' && (
        <div className="space-y-6">
          {/* Architecture Flow Diagram Box */}
          <div className="rounded-2xl bg-[#1C100B] border border-amber-900/40 p-6 shadow-xl space-y-5">
            <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
              How AI Control Algorithms Respond to Subsurface Alarms
            </h2>
            <p className="text-xs text-stone-400">
              Autonomous execution pipeline: from millisecond vibration telemetry to active physical rig modulation.
            </p>

            {/* ASCII/Visual Architecture Flow */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 font-mono text-xs overflow-x-auto text-stone-300">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center">
                <div className="p-3 rounded-lg bg-stone-900 border border-stone-800 text-cyan-300 font-bold w-full md:w-auto">
                  [Downhole Sensors / Telemetry]
                  <div className="text-[10px] text-stone-400 font-normal">Vibe, Torque, RPM (10ms)</div>
                </div>

                <ArrowRight size={18} className="text-amber-400 rotate-90 md:rotate-0 flex-shrink-0" />

                <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold w-full md:w-auto">
                  [AI Control Engine]
                  <div className="text-[10px] text-amber-200 font-normal">Fingerprint Matching &amp; MSE</div>
                </div>

                <ArrowRight size={18} className="text-amber-400 rotate-90 md:rotate-0 flex-shrink-0" />

                <div className="p-3 rounded-lg bg-purple-900/40 border border-purple-600/40 text-purple-300 font-bold w-full md:w-auto">
                  [Triggers Anomaly Alarm]
                  <div className="text-[10px] text-purple-200 font-normal">Lithology Discontinuity</div>
                </div>

                <ArrowRight size={18} className="text-amber-400 rotate-90 md:rotate-0 flex-shrink-0" />

                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 font-bold w-full md:w-auto">
                  [Active Physical Rig Adjustments]
                  <div className="text-[10px] text-emerald-200 font-normal">WOB &bull; RPM &bull; Mud Flush</div>
                </div>
              </div>
            </div>

            {/* 3 Detailed Scenarios Walkthrough */}
            <div className="space-y-4 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Select Field Scenario:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedClosedLoopScenario('lithium')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedClosedLoopScenario === 'lithium'
                        ? 'bg-amber-500 text-stone-950 shadow-sm font-extrabold'
                        : 'bg-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    1. Lithium Pegmatite Alert
                  </button>
                  <button
                    onClick={() => setSelectedClosedLoopScenario('copper')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedClosedLoopScenario === 'copper'
                        ? 'bg-amber-500 text-stone-950 shadow-sm font-extrabold'
                        : 'bg-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    2. Copper/Gold Sulfide Alert
                  </button>
                  <button
                    onClick={() => setSelectedClosedLoopScenario('uranium')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedClosedLoopScenario === 'uranium'
                        ? 'bg-amber-500 text-stone-950 shadow-sm font-extrabold'
                        : 'bg-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    3. Soft Sandstone / Uranium Alert
                  </button>
                </div>
              </div>

              {/* Scenario Detail Cards */}
              {selectedClosedLoopScenario === 'lithium' && (
                <div className="p-5 rounded-xl bg-stone-900/90 border border-amber-500/40 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base font-['Space_Grotesk'] text-amber-300">
                      1. The Lithium Pegmatite Alert: High Hardness &amp; Thermal Mitigation
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Spodumene Pegmatite
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-stone-950 text-stone-300">
                      <strong className="text-white block mb-1">The Scenario:</strong>
                      A drill string drops from soft overburden directly into a rigid Spodumene-bearing pegmatite intrusive.
                    </div>
                    <div className="p-3 rounded-lg bg-stone-950 text-stone-300">
                      <strong className="text-red-400 block mb-1">The Risk:</strong>
                      Shifting into rigid rock at high rotational speeds causes bit bounce, destroys diamond cutters via macro-fracturing, or melts matrix due to frictional heat.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">
                      The AI Closed-Loop Algorithm:
                    </span>
                    <ol className="space-y-2 text-xs text-stone-300">
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-amber-400">Step 1:</span>
                        <span>Rotational vibration sensors detect a sharp spike in Torsional Energy Variance (&gt;30% variance in 20 milliseconds).</span>
                      </li>
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-amber-400">Step 2:</span>
                        <span>The AI instantly throttles down RPM (from 900 RPM to 350 RPM) to stop the bit from skating or bouncing.</span>
                      </li>
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-amber-400">Step 3:</span>
                        <span>Simultaneously increases Feed Force (Weight on Bit / WOB by +40%) to force cutters to bite deeply rather than rubbing.</span>
                      </li>
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-amber-400">Step 4:</span>
                        <span>Boosts mud-pump flow rate by +25% to cool bit face and flush dense, abrasive pegmatite cuttings out of the hole.</span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {selectedClosedLoopScenario === 'copper' && (
                <div className="p-5 rounded-xl bg-stone-900/90 border border-purple-500/40 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base font-['Space_Grotesk'] text-purple-300">
                      2. The Copper/Gold Sulfide Alert: Alternating Fractures &amp; Core Protection
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Chalcopyrite / Pyrite Shear
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-stone-950 text-stone-300">
                      <strong className="text-white block mb-1">The Scenario:</strong>
                      Bit crosses an impedance boundary into a chaotic, highly fractured Chalcopyrite / Pyrite shear zone.
                    </div>
                    <div className="p-3 rounded-lg bg-stone-950 text-stone-300">
                      <strong className="text-red-400 block mb-1">The Risk:</strong>
                      Alternating hard quartz and soft sulfide pockets. Dropping into a soft void can over-torque, bind, and snap the drill pipe downhole.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-purple-400 block uppercase tracking-wider">
                      The AI Closed-Loop Algorithm:
                    </span>
                    <ol className="space-y-2 text-xs text-stone-300">
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-purple-400">Step 1:</span>
                        <span>Telemetry array detects erratic, high-frequency Axial Vibration Spikes (rhythmic clatter).</span>
                      </li>
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-purple-400">Step 2:</span>
                        <span>AI switches to &ldquo;Active Dampening&rdquo; mode; drops WOB to near-zero for microseconds to allow drill string to stabilize.</span>
                      </li>
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-purple-400">Step 3:</span>
                        <span>Enforces strict torque-limit cap. If torque spikes, rig reverses rotation by a quarter-turn to free bit before getting wedged.</span>
                      </li>
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-purple-400">Step 4:</span>
                        <span>Flags precise depth matrix coordinates for exploration geologists, indicating high-grade structural intercept.</span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {selectedClosedLoopScenario === 'uranium' && (
                <div className="p-5 rounded-xl bg-stone-900/90 border border-cyan-500/40 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base font-['Space_Grotesk'] text-cyan-300">
                      3. The Soft Sandstone / Uranium Roll-Front Alert: Over-Excavation Prevention
                    </h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Porous Roll-Front Sandstone
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-stone-950 text-stone-300">
                      <strong className="text-white block mb-1">The Scenario:</strong>
                      Drill hits highly porous, un-cemented, mineralized sandstone channel.
                    </div>
                    <div className="p-3 rounded-lg bg-stone-950 text-stone-300">
                      <strong className="text-red-400 block mb-1">The Risk:</strong>
                      Bit plummets through soft matrix. High fluid pressure erodes borehole walls, triggering collapse that buries the drill string.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-cyan-400 block uppercase tracking-wider">
                      The AI Closed-Loop Algorithm:
                    </span>
                    <ol className="space-y-2 text-xs text-stone-300">
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-cyan-400">Step 1:</span>
                        <span>Rate of Penetration (ROP) surges exponentially while mechanical torque drops to baseline hum (10–30 Hz).</span>
                      </li>
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-cyan-400">Step 2:</span>
                        <span>AI activates &ldquo;ROP Governor&rdquo;, restricting physical downward travel to pre-set safety maximum (≤ 2.0 m/min).</span>
                      </li>
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-cyan-400">Step 3:</span>
                        <span>Controller reduces mud-flush pressure to minimum fluid-dynamic velocity, preventing washout of delicate, unconsolidated borehole walls.</span>
                      </li>
                      <li className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
                        <span className="font-mono font-bold text-cyan-400">Step 4:</span>
                        <span>Integrates downhole gamma-logging telemetry to map the exact mineralization boundaries without borehole degradation.</span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Real-Time Telemetry Closed-Loop Metrics Table */}
            <div className="pt-4 border-t border-stone-800 space-y-3">
              <h3 className="font-bold text-white text-sm font-['Space_Grotesk'] flex items-center gap-2">
                <span>⏱️ Real-Time Telemetry Closed-Loop Metrics Matrix</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-stone-800">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-stone-900 text-stone-400 uppercase text-[10px] font-mono border-b border-stone-800">
                    <tr>
                      <th className="py-2.5 px-3">Geological Zone</th>
                      <th className="py-2.5 px-3">Detected Vibration Spectrum</th>
                      <th className="py-2.5 px-3">Auto-Adjusted WOB</th>
                      <th className="py-2.5 px-3">Auto-Adjusted RPM</th>
                      <th className="py-2.5 px-3">Fluid Flush Volume</th>
                      <th className="py-2.5 px-3">System Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono text-[11px]">
                    {CLOSED_LOOP_METRICS.map((metric, i) => (
                      <tr key={i} className="hover:bg-stone-900/40">
                        <td className="py-2.5 px-3 font-bold text-white font-sans">{metric.zone}</td>
                        <td className="py-2.5 px-3 text-cyan-300">{metric.vibrationSpectrum}</td>
                        <td className="py-2.5 px-3 text-stone-200">{metric.wobAdjustment}</td>
                        <td className="py-2.5 px-3 text-stone-200">{metric.rpmAdjustment}</td>
                        <td className="py-2.5 px-3 text-stone-200">{metric.fluidFlush}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              metric.color === 'amber'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : metric.color === 'purple'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : metric.color === 'cyan'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {metric.statusBadge}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: SATELLITE-LINKED AUTONOMOUS FLEET ORCHESTRATION */}
      {activeSubTab === 'satellite' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#1C100B] border border-amber-900/40 p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Satellite size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
                  🛰️ Satellite-Linked Autonomous Fleet Orchestration
                </h2>
                <p className="text-xs text-stone-400">
                  Global pattern matching: linking field edge computing via Low Earth Orbit (LEO) satellite constellations.
                </p>
              </div>
            </div>

            {/* Architecture Flow Box */}
            <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 font-mono text-xs text-stone-300 overflow-x-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center text-center">
                {/* 3 Rigs */}
                <div className="lg:col-span-3 space-y-2">
                  <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200">
                    <strong>Rig Alpha (Chile)</strong>
                    <div className="text-[10px] text-amber-400">Edge ANT Data</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200">
                    <strong>Rig Beta (Australia)</strong>
                    <div className="text-[10px] text-amber-400">Edge ANT Data</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800 text-stone-200">
                    <strong>Rig Gamma (Canada)</strong>
                    <div className="text-[10px] text-amber-400">Edge ANT Data</div>
                  </div>
                </div>

                <div className="lg:col-span-1 flex justify-center text-amber-400">
                  <ArrowRight size={22} className="rotate-90 lg:rotate-0" />
                </div>

                {/* Satellite Constellation */}
                <div className="lg:col-span-4 p-4 rounded-xl bg-purple-950/50 border border-purple-600/50 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-purple-300 font-bold text-sm">
                    <Satellite size={18} />
                    <span>LEO Satellite Constellation</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Fleet Space Centauri nanosatellites transmitting compressed edge lithology tags &amp; 3D MSE vectors
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700">
                    Low-Latency S-Band / Ka-Band Uplink
                  </span>
                </div>

                <div className="lg:col-span-1 flex justify-center text-amber-400">
                  <ArrowRight size={22} className="rotate-90 lg:rotate-0" />
                </div>

                {/* Cloud AI Core */}
                <div className="lg:col-span-3 p-4 rounded-xl bg-emerald-950/50 border border-emerald-600/50 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm">
                    <Cpu size={18} />
                    <span>Centralized Cloud AI Core</span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Global structural ML models update automatically. Downlinks real-time deposit profiles to all fleet rigs.
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                    Global Pattern Matching
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Core Architecture Tenets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block">
                  1. Edge AI Deployed to the Field
                </span>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Because raw seismic ambient noise (ANT) or high-frequency drilling telemetry generates gigabytes per second, uploading raw feeds via satellite is impossible. On-site rugged edge servers calculate MSE, compress lithology vectors, and upload only key structural changes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
                <span className="text-purple-400 font-bold text-xs uppercase tracking-wider block">
                  2. Satellite Constellation Relay
                </span>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Compressed telemetry is beamed up to Low Earth Orbit (LEO) nanosatellites via short, low-latency bursts. This completely bypasses the need for remote cellular coverage or costly fiber optic infrastructure in the Australian outback or the High Andes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2">
                <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block">
                  3. Global Structural Learning
                </span>
                <p className="text-xs text-stone-300 leading-relaxed">
                  If Rig Alpha in Chile maps a rare acoustic vibration fingerprint right before encountering an enriched copper porphyry blanket, that discovery immediately updates the global ML model. Within hours, Rig Beta in Zambia receives the updated profile, flagging identical deposits on first contact.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
