import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  Thermometer,
  Activity,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Cpu,
  Gauge,
  Eye,
  Crosshair,
  Zap,
  Wrench,
  Radio,
} from 'lucide-react';

export interface DetectedMiningEquipment {
  id: string;
  name: string;
  category: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  statusLabel: string;
  temperatureC: number;
  maxSafeTempC: number;
  thermalTrend: string;
  vibrationRmsMmS: number;
  vibrationFreqHz: number;
  gForcePeak: number;
  vibrationSeverity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  iso10816Zone: string;
  confidencePct: number;
  maintenanceRecommendation: string;
}

interface EquipmentARHealthDashboardProps {
  wobLbs: number;
  torqueFtLbs: number;
  rpm: number;
  vibeFreqHz: number;
  currentMSE: number;
}

const INITIAL_EQUIPMENT_DETECTIONS: DetectedMiningEquipment[] = [
  {
    id: 'EQ-TD-01',
    name: 'Hydraulic Top-Drive & Rotary Head',
    category: 'Primary Rotary Drive',
    xPct: 33,
    yPct: 12,
    widthPct: 31,
    heightPct: 32,
    status: 'CRITICAL',
    statusLabel: 'CRITICAL VIBRATION OVERLOAD',
    temperatureC: 89.4,
    maxSafeTempC: 85.0,
    thermalTrend: '+2.4°C/min',
    vibrationRmsMmS: 9.8,
    vibrationFreqHz: 180,
    gForcePeak: 4.2,
    vibrationSeverity: 'CRITICAL',
    iso10816Zone: 'Zone D (Damage Risk)',
    confidencePct: 98,
    maintenanceRecommendation:
      'Throttle rotary RPM to 350; engage active torsional dampener and boost top-drive lube oil cooler flow by +30%.',
  },
  {
    id: 'EQ-DS-02',
    name: 'Downhole Chuck & Drill String Stabilizer',
    category: 'Drill String Assembly',
    xPct: 36,
    yPct: 50,
    widthPct: 26,
    heightPct: 35,
    status: 'WARNING',
    statusLabel: 'AXIAL CHATTER HARMONICS',
    temperatureC: 76.8,
    maxSafeTempC: 90.0,
    thermalTrend: '+0.8°C/min',
    vibrationRmsMmS: 6.4,
    vibrationFreqHz: 115,
    gForcePeak: 2.8,
    vibrationSeverity: 'HIGH',
    iso10816Zone: 'Zone C (Restricted Run)',
    confidencePct: 96,
    maintenanceRecommendation:
      'Monitor HQ rod coupling wear; apply dynamic WOB modulation to suppress stick-slip harmonic bounce.',
  },
  {
    id: 'EQ-MP-03',
    name: 'Triplex High-Pressure Mud Flush Pump',
    category: 'Fluid Circulation',
    xPct: 4,
    yPct: 48,
    widthPct: 27,
    heightPct: 36,
    status: 'OPTIMAL',
    statusLabel: 'NOMINAL FLUSH PRESSURE',
    temperatureC: 58.2,
    maxSafeTempC: 80.0,
    thermalTrend: 'Stable (±0.1°C)',
    vibrationRmsMmS: 2.1,
    vibrationFreqHz: 28,
    gForcePeak: 0.85,
    vibrationSeverity: 'LOW',
    iso10816Zone: 'Zone A (Optimal)',
    confidencePct: 95,
    maintenanceRecommendation:
      'Laminar fluid delivery verified at 1,850 PSI. Piston liner acoustics nominal.',
  },
  {
    id: 'EQ-VS-04',
    name: 'Vibrating Core Cuttings Shale Shaker',
    category: 'Solids Control',
    xPct: 66,
    yPct: 46,
    widthPct: 29,
    heightPct: 37,
    status: 'OPTIMAL',
    statusLabel: 'RESONANCE BALANCED',
    temperatureC: 62.5,
    maxSafeTempC: 85.0,
    thermalTrend: '+0.2°C/min',
    vibrationRmsMmS: 3.9,
    vibrationFreqHz: 50,
    gForcePeak: 1.65,
    vibrationSeverity: 'MODERATE',
    iso10816Zone: 'Zone B (Nominal)',
    confidencePct: 94,
    maintenanceRecommendation:
      'Screen deck isolator springs balanced; cuttings separation efficiency at 97.4%.',
  },
];

export const EquipmentARHealthDashboard: React.FC<EquipmentARHealthDashboardProps> = ({
  wobLbs,
  torqueFtLbs,
  rpm,
  vibeFreqHz,
  currentMSE,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraModeNote, setCameraModeNote] = useState<string>(
    'Optical Rig Telemetry Camera Stream Active (WebRTC + Simulated Rig Feed)'
  );
  const [visionThermalMode, setVisionThermalMode] = useState<'optical_ar' | 'flir_thermal'>('optical_ar');
  const [overlayLayers, setOverlayLayers] = useState({
    statusMarkers: true,
    temperatureMarkers: true,
    vibrationSeverityMarkers: true,
    boundingBoxes: true,
  });

  const [equipmentList, setEquipmentList] = useState<DetectedMiningEquipment[]>(INITIAL_EQUIPMENT_DETECTIONS);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('EQ-TD-01');
  const [overallHealthScore, setOverallHealthScore] = useState<number>(82);
  const [aiDiagnosticSummary, setAiDiagnosticSummary] = useState<string>(
    'Real-time AR optical & acoustic computer vision tracking 4 active rig assemblies. High-frequency torsional vibration and 89.4°C thermal spike detected on Hydraulic Top-Drive rotary bearing housing.'
  );
  const [isScanningAi, setIsScanningAi] = useState<boolean>(false);
  const [liveTick, setLiveTick] = useState<number>(0);

  // Start WebRTC Camera or fallback cleanly to simulated rig video feed
  const startCameraFeed = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
        setCameraModeNote('Live Hardware Camera Stream Connected • Real-Time AR Equipment Detection');
      } else {
        setIsCameraActive(false);
        setCameraModeNote('Optical Rig Camera Feed Active (Simulated Live Rig Video Stream)');
      }
    } catch (_err) {
      setIsCameraActive(false);
      setCameraModeNote('Optical Rig Camera Feed Active (Simulated Live Rig Video Stream)');
    }
  };

  const stopCameraFeed = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraModeNote('Optical Rig Camera Feed Active (Simulated Live Rig Video Stream)');
  };

  // Attempt camera initialization on mount and clean up on unmount
  useEffect(() => {
    startCameraFeed();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Synchronize equipment status, temperature, and vibration severity markers with live rig telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTick((t) => t + 1);
      setEquipmentList((prev) =>
        prev.map((eq) => {
          const tempJitter = Number(((Math.random() - 0.48) * 0.4).toFixed(1));
          const vibeJitter = Number(((Math.random() - 0.48) * 0.25).toFixed(2));
          if (eq.id === 'EQ-TD-01') {
            const isOverload = currentMSE > 400 || vibeFreqHz > 130;
            const newTemp = Math.min(108, Math.max(68, Number(((isOverload ? 89.2 : 74.5) + tempJitter).toFixed(1))));
            const newRms = Math.max(2.5, Number(((isOverload ? 9.8 : 4.6) + vibeJitter).toFixed(1)));
            return {
              ...eq,
              status: isOverload ? 'CRITICAL' : 'WARNING',
              statusLabel: isOverload ? 'CRITICAL VIBRATION OVERLOAD' : 'ELEVATED TORQUE LOAD',
              temperatureC: newTemp,
              vibrationRmsMmS: newRms,
              vibrationFreqHz: vibeFreqHz,
              gForcePeak: Number((newRms * 0.43).toFixed(2)),
              vibrationSeverity: isOverload ? 'CRITICAL' : 'MODERATE',
              iso10816Zone: isOverload ? 'Zone D (Damage Risk)' : 'Zone B (Acceptable)',
            };
          }
          if (eq.id === 'EQ-DS-02') {
            const isChatter = vibeFreqHz > 75;
            const newTemp = Math.min(96, Math.max(62, Number((76.5 + tempJitter).toFixed(1))));
            const newRms = Math.max(2.0, Number(((isChatter ? 6.4 : 3.5) + vibeJitter).toFixed(1)));
            return {
              ...eq,
              status: isChatter ? 'WARNING' : 'OPTIMAL',
              statusLabel: isChatter ? 'AXIAL CHATTER HARMONICS' : 'STRING STABILIZED',
              temperatureC: newTemp,
              vibrationRmsMmS: newRms,
              vibrationFreqHz: Math.max(35, Math.round(vibeFreqHz * 0.65)),
              gForcePeak: Number((newRms * 0.44).toFixed(2)),
              vibrationSeverity: isChatter ? 'HIGH' : 'MODERATE',
            };
          }
          return {
            ...eq,
            temperatureC: Number((eq.temperatureC + tempJitter * 0.5).toFixed(1)),
            vibrationRmsMmS: Math.max(1.2, Number((eq.vibrationRmsMmS + vibeJitter * 0.4).toFixed(1))),
          };
        })
      );
    }, 1100);

    return () => clearInterval(interval);
  }, [currentMSE, vibeFreqHz]);

  // Animated Rig Video Feed Canvas for continuous optical equipment rendering
  useEffect(() => {
    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const renderRigVideoFrame = () => {
      frame += 1;
      const w = canvas.width;
      const h = canvas.height;

      // Background mine bench & sky/subsurface ambiance
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (visionThermalMode === 'flir_thermal') {
        bgGrad.addColorStop(0, '#120524');
        bgGrad.addColorStop(0.5, '#260838');
        bgGrad.addColorStop(1, '#090214');
      } else {
        bgGrad.addColorStop(0, '#16110E');
        bgGrad.addColorStop(0.55, '#231914');
        bgGrad.addColorStop(1, '#120C09');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle optical scanlines
      ctx.strokeStyle = visionThermalMode === 'flir_thermal' ? 'rgba(168,85,247,0.08)' : 'rgba(245,158,11,0.06)';
      ctx.lineWidth = 1;
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const vibeShake = Math.sin(frame * 0.45) * (vibeFreqHz > 120 ? 2.6 : 1.1);

      // 1. Draw Triplex Mud Pump Assembly (Left)
      ctx.save();
      ctx.translate(w * 0.06, h * 0.52);
      ctx.fillStyle = visionThermalMode === 'flir_thermal' ? '#3B0764' : '#292524';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.fillRect(0, 0, w * 0.22, h * 0.28);
      ctx.strokeRect(0, 0, w * 0.22, h * 0.28);
      // Piston reciprocation
      for (let p = 0; p < 3; p++) {
        const pistonOffset = Math.sin(frame * 0.15 + p * 2.1) * 8;
        ctx.fillStyle = visionThermalMode === 'flir_thermal' ? '#F59E0B' : '#0284C7';
        ctx.fillRect(18 + p * 48, 22 + pistonOffset, 32, 46);
      }
      ctx.restore();

      // 2. Draw Diamond Drill Mast & Hydraulic Top-Drive (Center-Top)
      ctx.save();
      ctx.translate(w * 0.36 + vibeShake, h * 0.1);
      // Mast lattice
      ctx.strokeStyle = visionThermalMode === 'flir_thermal' ? '#7E22CE' : '#57534E';
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 0, w * 0.24, h * 0.78);
      // Top-Drive Rotary Head Housing
      const tdGrad = ctx.createRadialGradient(w * 0.12, h * 0.14, 8, w * 0.12, h * 0.14, 95);
      if (visionThermalMode === 'flir_thermal') {
        tdGrad.addColorStop(0, '#FFFBEB');
        tdGrad.addColorStop(0.4, '#EF4444');
        tdGrad.addColorStop(1, '#7C2D12');
      } else {
        tdGrad.addColorStop(0, '#F59E0B');
        tdGrad.addColorStop(0.5, '#B45309');
        tdGrad.addColorStop(1, '#451A03');
      }
      ctx.fillStyle = tdGrad;
      ctx.fillRect(22, 18, w * 0.2, h * 0.24);
      ctx.restore();

      // 3. Draw Downhole Chuck & Rotating Drill String (Center-Bottom)
      ctx.save();
      ctx.translate(w * 0.44 + vibeShake * 1.2, h * 0.48);
      ctx.fillStyle = visionThermalMode === 'flir_thermal' ? '#F97316' : '#78716C';
      ctx.fillRect(12, 0, w * 0.09, h * 0.36);
      // Helical rotation stripes on drill rod
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      const stripeOffset = (frame * 3) % 28;
      for (let sy = stripeOffset; sy < h * 0.34; sy += 28) {
        ctx.beginPath();
        ctx.moveTo(12, sy);
        ctx.lineTo(12 + w * 0.09, sy + 12);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Draw Vibrating Shale Shaker Deck (Right)
      ctx.save();
      const shakerShake = Math.cos(frame * 0.6) * 1.8;
      ctx.translate(w * 0.68 + shakerShake, h * 0.5);
      ctx.fillStyle = visionThermalMode === 'flir_thermal' ? '#581C87' : '#1C1917';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 2;
      ctx.fillRect(0, 0, w * 0.24, h * 0.3);
      ctx.strokeRect(0, 0, w * 0.24, h * 0.3);
      ctx.restore();

      animId = requestAnimationFrame(renderRigVideoFrame);
    };

    renderRigVideoFrame();
    return () => cancelAnimationFrame(animId);
  }, [visionThermalMode, vibeFreqHz]);

  // Run Gemini Vision AI Equipment Detection & Health Overlay
  const handleRunGeminiEquipmentDetect = async () => {
    setIsScanningAi(true);
    try {
      let frameBase64: string | undefined;
      if (simCanvasRef.current) {
        frameBase64 = simCanvasRef.current.toDataURL('image/jpeg', 0.7);
      }

      const res = await fetch('/api/gemini/equipment-ar-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frameBase64,
          telemetry: {
            wobLbs,
            torqueFtLbs,
            rpm,
            vibeFreqHz,
            mseMpa: currentMSE,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.arHealth) {
        setEquipmentList(data.arHealth.detectedEquipment || INITIAL_EQUIPMENT_DETECTIONS);
        setOverallHealthScore(data.arHealth.overallFleetHealthScore ?? 82);
        setAiDiagnosticSummary(data.arHealth.aiDiagnosticSummary || aiDiagnosticSummary);
      }
    } catch (_err) {
      // fallback already populated
    } finally {
      setIsScanningAi(false);
    }
  };

  const selectedEquipment =
    equipmentList.find((e) => e.id === selectedEquipmentId) || equipmentList[0];

  return (
    <div
      id="equipment-ar-health-dashboard"
      className="rounded-2xl bg-gradient-to-br from-[#1E110B] via-[#160C08] to-[#0E0806] border-2 border-amber-500/40 p-5 shadow-2xl space-y-5"
    >
      {/* Top Header & Camera / Gemini Vision Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-extrabold uppercase tracking-wider">
              <Camera size={12} /> Equipment AR Health Dashboard
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE AR VIDEO OVERLAY
            </span>
            <span className="text-[11px] font-mono text-stone-400">
              Fleet Health Index: <strong className="text-amber-300">{overallHealthScore}/100</strong>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white font-['Space_Grotesk']">
            Camera-Guided Mining Equipment AR Health, Thermal &amp; Vibration Severity HUD
          </h2>
          <p className="text-xs text-stone-300">
            Detects active drilling &amp; mud-circulation equipment via optical camera feed and overlays real-time operational status, surface temperature (°C), and ISO 10816 vibration severity markers directly on the video stream.
          </p>
        </div>

        {/* Camera & Gemini Vision Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <button
            id="btn-toggle-ar-equipment-camera"
            onClick={() => (isCameraActive ? stopCameraFeed() : startCameraFeed())}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isCameraActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
            }`}
          >
            {isCameraActive ? <CameraOff size={14} /> : <Camera size={14} className="text-amber-400" />}
            <span>{isCameraActive ? 'Hardware Camera Live' : 'Connect Hardware Camera'}</span>
          </button>

          <button
            id="btn-toggle-ar-thermal-mode"
            onClick={() =>
              setVisionThermalMode((m) => (m === 'optical_ar' ? 'flir_thermal' : 'optical_ar'))
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              visionThermalMode === 'flir_thermal'
                ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-700'
            }`}
          >
            <Thermometer size={14} className="text-rose-400" />
            <span>{visionThermalMode === 'flir_thermal' ? 'FLIR Thermal IR' : 'Optical + Thermal HUD'}</span>
          </button>

          <button
            id="btn-gemini-detect-equipment"
            onClick={handleRunGeminiEquipmentDetect}
            disabled={isScanningAi}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-extrabold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-60"
          >
            {isScanningAi ? (
              <>
                <RefreshCw size={14} className="animate-spin text-stone-950" />
                <span>Scanning Equipment Feed...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>AI Detect Equipment (Gemini)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AR Layer Marker Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs">
        <div className="flex items-center gap-2 text-stone-300 font-mono text-[11px]">
          <Eye size={14} className="text-amber-400" />
          <span>{cameraModeNote}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-stone-400">AR Video Overlays:</span>
          {[
            { key: 'statusMarkers' as const, label: 'Real-Time Status' },
            { key: 'temperatureMarkers' as const, label: 'Temperature (°C)' },
            { key: 'vibrationSeverityMarkers' as const, label: 'Vibration Severity (mm/s • Hz)' },
            { key: 'boundingBoxes' as const, label: 'Equipment Reticles' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() =>
                setOverlayLayers((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
              }
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                overlayLayers[item.key]
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-stone-950 text-stone-500 border border-stone-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Left 8 Cols Live Video Feed with Overlaid AR Markers | Right 4 Cols Equipment Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Columns: Live Video Feed + Direct AR Status, Temperature & Vibration Severity Overlays */}
        <div className="lg:col-span-8 space-y-3">
          <div
            id="equipment-ar-video-viewport"
            className="relative rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-black h-[460px] shadow-2xl select-none"
          >
            {/* Simulated Rig Optical/Thermal Canvas Stream (Always active underneath or alongside hardware camera) */}
            <canvas
              ref={simCanvasRef}
              width={960}
              height={540}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Hardware WebRTC Camera Video Element */}
            <video
              ref={videoRef}
              id="equipment-ar-camera-video"
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isCameraActive ? 'opacity-90' : 'opacity-0 pointer-events-none'
              }`}
              style={{
                filter:
                  visionThermalMode === 'flir_thermal'
                    ? 'hue-rotate(240deg) saturate(2.4) contrast(1.35)'
                    : 'contrast(1.08)',
              }}
            />

            {/* Top-Left HUD Telemetry Banner on Video */}
            <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
              <div className="px-2.5 py-1 rounded-lg bg-black/80 border border-amber-500/40 text-[10px] font-mono text-amber-300 flex items-center gap-1.5 backdrop-blur-md">
                <Crosshair size={12} className="text-amber-400 animate-spin-slow" />
                <span>AR VISION HUD • {equipmentList.length} ASSEMBLIES TRACKED</span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-black/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 backdrop-blur-md">
                RIG MSE: {currentMSE} MPa | FREQ: {vibeFreqHz} Hz | RPM: {rpm}
              </div>
            </div>

            {/* DIRECT AR EQUIPMENT MARKERS OVERLAID ON THE VIDEO FEED */}
            <div className="absolute inset-0 z-10">
              {equipmentList.map((eq) => {
                const isSelected = selectedEquipment.id === eq.id;
                const isCrit = eq.status === 'CRITICAL';
                const isWarn = eq.status === 'WARNING';

                const borderColor = isCrit
                  ? 'border-red-500'
                  : isWarn
                  ? 'border-amber-400'
                  : 'border-emerald-400';

                const badgeBg = isCrit
                  ? 'bg-red-600/90 text-white border-red-300'
                  : isWarn
                  ? 'bg-amber-500/90 text-stone-950 border-amber-200'
                  : 'bg-emerald-600/90 text-white border-emerald-300';

                return (
                  <div
                    key={eq.id}
                    id={`ar-marker-${eq.id.toLowerCase()}`}
                    onClick={() => setSelectedEquipmentId(eq.id)}
                    style={{
                      left: `${eq.xPct}%`,
                      top: `${eq.yPct}%`,
                      width: `${eq.widthPct}%`,
                      height: `${eq.heightPct}%`,
                    }}
                    className={`absolute transition-all duration-300 cursor-pointer group ${
                      overlayLayers.boundingBoxes
                        ? `border-2 ${borderColor} rounded-xl bg-black/25 hover:bg-black/40`
                        : ''
                    } ${isSelected ? 'ring-2 ring-white shadow-[0_0_25px_rgba(245,158,11,0.5)]' : ''}`}
                  >
                    {/* Top Header Pill: Equipment ID + Real-Time Status Marker */}
                    {overlayLayers.statusMarkers && (
                      <div
                        className={`-mt-3 ml-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold border shadow-md ${badgeBg}`}
                      >
                        {isCrit ? (
                          <ShieldAlert size={11} className="animate-bounce" />
                        ) : isWarn ? (
                          <AlertTriangle size={11} />
                        ) : (
                          <CheckCircle2 size={11} />
                        )}
                        <span>
                          {eq.id}: {eq.status}
                        </span>
                      </div>
                    )}

                    {/* Equipment Name Label inside AR Box */}
                    <div className="px-2.5 pt-1">
                      <div className="text-[11px] font-extrabold text-white drop-shadow font-['Space_Grotesk'] truncate">
                        {eq.name}
                      </div>
                      {overlayLayers.statusMarkers && (
                        <div className="text-[9px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                          {eq.statusLabel} ({eq.confidencePct}% AI)
                        </div>
                      )}
                    </div>

                    {/* Real-Time Temperature & Vibration Severity Markers Overlay Strip */}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex flex-col gap-1">
                      {/* Temperature Marker */}
                      {overlayLayers.temperatureMarkers && (
                        <div className="flex items-center justify-between px-2 py-1 rounded bg-stone-950/90 border border-stone-700/80 text-[10px] font-mono backdrop-blur-sm">
                          <span className="flex items-center gap-1 text-stone-300">
                            <Thermometer
                              size={11}
                              className={
                                eq.temperatureC >= eq.maxSafeTempC
                                  ? 'text-red-400'
                                  : 'text-amber-400'
                              }
                            />
                            <span>TEMP:</span>
                          </span>
                          <span
                            className={`font-extrabold ${
                              eq.temperatureC >= eq.maxSafeTempC
                                ? 'text-red-400'
                                : 'text-amber-300'
                            }`}
                          >
                            {eq.temperatureC}°C ({eq.thermalTrend})
                          </span>
                        </div>
                      )}

                      {/* Vibration Severity Marker */}
                      {overlayLayers.vibrationSeverityMarkers && (
                        <div className="flex items-center justify-between px-2 py-1 rounded bg-stone-950/90 border border-cyan-500/40 text-[10px] font-mono backdrop-blur-sm">
                          <span className="flex items-center gap-1 text-cyan-300 font-bold">
                            <Activity size={11} className="text-cyan-400" />
                            <span>{eq.vibrationRmsMmS} mm/s</span>
                          </span>
                          <span className="text-stone-300">{eq.vibrationFreqHz} Hz</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                              eq.vibrationSeverity === 'CRITICAL'
                                ? 'bg-red-500/30 text-red-300'
                                : eq.vibrationSeverity === 'HIGH'
                                ? 'bg-amber-500/30 text-amber-300'
                                : 'bg-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            {eq.vibrationSeverity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom-Left ISO 10816 Vibration Severity Legend on Video */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/85 border border-stone-800 text-[10px] font-mono text-stone-300 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Optimal (&lt;2.8 mm/s)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Warning (4.5–7.1 mm/s)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Critical (&gt;7.1 mm/s)
                </span>
              </div>
              <span className="text-amber-300">
                ISO 10816-3 Real-Time Vibration &amp; Thermography Overlay (Frame #{liveTick})
              </span>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Selected Equipment AR Diagnostic & Closed-Loop Health Inspector */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl bg-stone-900/90 border border-stone-800 p-4 space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                  Selected AR Assembly • {selectedEquipment.id}
                </span>
                <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                  {selectedEquipment.name}
                </h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold ${
                  selectedEquipment.status === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : selectedEquipment.status === 'WARNING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {selectedEquipment.status}
              </span>
            </div>

            {/* Real-Time Status, Temperature & Vibration Severity Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-0.5">
                <span className="text-[10px] text-stone-400 uppercase block">Surface Temp</span>
                <div
                  className={`text-lg font-extrabold ${
                    selectedEquipment.temperatureC >= selectedEquipment.maxSafeTempC
                      ? 'text-red-400'
                      : 'text-amber-300'
                  }`}
                >
                  {selectedEquipment.temperatureC}°C
                </div>
                <span className="text-[10px] text-stone-400">
                  Max Safe: {selectedEquipment.maxSafeTempC}°C ({selectedEquipment.thermalTrend})
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-0.5">
                <span className="text-[10px] text-stone-400 uppercase block">Vibration RMS</span>
                <div className="text-lg font-extrabold text-cyan-300">
                  {selectedEquipment.vibrationRmsMmS} mm/s
                </div>
                <span className="text-[10px] text-stone-400">
                  Peak: {selectedEquipment.gForcePeak}g @ {selectedEquipment.vibrationFreqHz} Hz
                </span>
              </div>
            </div>

            {/* ISO 10816 Severity Bar */}
            <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-stone-400">ISO 10816-3 Classification:</span>
                <strong className="text-amber-300">{selectedEquipment.iso10816Zone}</strong>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-900 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    selectedEquipment.vibrationSeverity === 'CRITICAL'
                      ? 'bg-red-500'
                      : selectedEquipment.vibrationSeverity === 'HIGH'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (selectedEquipment.vibrationRmsMmS / 12) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Quick Equipment Selector List */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Detected Rig Assemblies ({equipmentList.length}):
              </span>
              <div className="space-y-1.5">
                {equipmentList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEquipmentId(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      selectedEquipment.id === item.id
                        ? 'bg-amber-500/20 border-amber-400 text-white'
                        : 'bg-stone-950/80 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono font-bold text-amber-300 mr-1.5">{item.id}</span>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] flex-shrink-0">
                      <span className="text-amber-300">{item.temperatureC}°C</span>
                      <span className="text-cyan-300">{item.vibrationRmsMmS} mm/s</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Maintenance & Closed-Loop Action */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-xs">
              <span className="text-[10px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1">
                <Wrench size={12} /> AI Predictive Maintenance &amp; Mitigation:
              </span>
              <p className="text-stone-200 leading-relaxed text-[11px]">
                {selectedEquipment.maintenanceRecommendation}
              </p>
            </div>
          </div>

          {/* Gemini AI Overall Fleet Diagnostic Note */}
          <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] text-stone-300 leading-relaxed">
            <strong className="text-amber-400 font-mono uppercase text-[10px] block mb-0.5">
              Gemini AR Vision Synthesis:
            </strong>
            {aiDiagnosticSummary}
          </div>
        </div>
      </div>
    </div>
  );
};
