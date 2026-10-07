import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Compass,
  Layers,
  Sparkles,
  Zap,
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Radio,
  X,
  Crosshair,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface ARGeologicalFeature {
  id: string;
  name: string;
  mineralType: string;
  category: 'sulfide' | 'alteration' | 'vein' | 'structure' | 'pegmatite';
  screenX: number; // percentage 0-100
  screenY: number; // percentage 0-100
  confidence: number;
  gradeEstimate: string;
  spectralSignature: string;
  strikeDip?: string;
  description: string;
  color: string;
}

interface ARGeologicalLensProps {
  onCaptureFrame?: (base64Image: string, featureSummary: string) => void;
  onClose?: () => void;
}

const DEFAULT_SIMULATED_FEATURES: ARGeologicalFeature[] = [
  {
    id: 'ar-feat-1',
    name: 'Chalcopyrite-Pyrite Bleb Cluster',
    mineralType: 'CuFeS₂ + FeS₂ (Sulfide)',
    category: 'sulfide',
    screenX: 42,
    screenY: 38,
    confidence: 0.94,
    gradeEstimate: '2.8% Cu, 0.9 g/t Au (High-Grade)',
    spectralSignature: 'VNIR 860nm Fe-S absorption shoulder',
    description: 'Coarse disseminated brassy metallic sulfides in stockwork quartz selvage.',
    color: '#F59E0B',
  },
  {
    id: 'ar-feat-2',
    name: 'Hydrothermal Quartz Vein (Sheeted)',
    mineralType: 'SiO₂ (Silica Flood)',
    category: 'vein',
    screenX: 68,
    screenY: 28,
    confidence: 0.98,
    gradeEstimate: 'Vuggy silica matrix (Host rock)',
    spectralSignature: 'SWIR 2250nm quartz baseline',
    strikeDip: '045° / 68° NW',
    description: 'En echelon tensional vein array with fluid inclusion halos.',
    color: '#9333EA',
  },
  {
    id: 'ar-feat-3',
    name: 'Gossanous Goethite / Jarosite Cap',
    mineralType: 'FeO(OH) + KFe₃(SO₄)₂(OH)₆',
    category: 'alteration',
    screenX: 25,
    screenY: 65,
    confidence: 0.91,
    gradeEstimate: 'Supergene leached cap',
    spectralSignature: 'VNIR 430nm, 900nm Fe³⁺ crystal field split',
    description: 'Oxidized capping formed by acid weathering of massive sulfide outcrop.',
    color: '#EF4444',
  },
  {
    id: 'ar-feat-4',
    name: 'Sericite-Chlorite Shear Selvage',
    mineralType: 'Illite / Muscovite + Chlorite',
    category: 'structure',
    screenX: 78,
    screenY: 62,
    confidence: 0.89,
    gradeEstimate: 'Pervasive phyllic alteration',
    spectralSignature: 'SWIR 2206nm Al-OH diagnostic doublet',
    strikeDip: '032° / 74° SE',
    description: 'Ductile shear zone with slickensided foliation and mica enrichment.',
    color: '#10B981',
  },
  {
    id: 'ar-feat-5',
    name: 'Spodumene Lath Crystal',
    mineralType: 'LiAl(SiO₃)₂ (Lithium Pyroxene)',
    category: 'pegmatite',
    screenX: 35,
    screenY: 22,
    confidence: 0.95,
    gradeEstimate: '1.85% Li₂O (Spodumene ~24% vol)',
    spectralSignature: 'SWIR 2290nm Li-bearing pyroxene band',
    description: 'Elongated prismatic white-green lath in albite-quartz pegmatite groundmass.',
    color: '#EC4899',
  },
];

export const ARGeologicalLens: React.FC<ARGeologicalLensProps> = ({
  onCaptureFrame,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [usingSimulation, setUsingSimulation] = useState<boolean>(false);
  const [selectedFeature, setSelectedFeature] = useState<ARGeologicalFeature | null>(DEFAULT_SIMULATED_FEATURES[0]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState<number>(0.85);
  const [showInclinometer, setShowInclinometer] = useState<boolean>(true);
  const [showSpectraHUD, setShowSpectraHUD] = useState<boolean>(true);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [deviceTilt, setDeviceTilt] = useState<{ pitch: number; roll: number }>({ pitch: 48, roll: 12 });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [arFeatures, setArFeatures] = useState<ARGeologicalFeature[]>(DEFAULT_SIMULATED_FEATURES);

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported on this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setUsingSimulation(false);
      }
    } catch (err: any) {
      console.warn('Camera access could not be established:', err);
      setCameraError(err.message || 'Camera access not available or permission denied.');
      setUsingSimulation(true);
      setCameraActive(true);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Listen to device orientation if available for Geological Clinometer
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        setDeviceTilt({
          pitch: Math.round(e.beta),
          roll: Math.round(e.gamma),
        });
      }
    };
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, []);

  // Subtle real-time drift animation to simulate computer vision feature tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setArFeatures((prev) =>
        prev.map((f, i) => {
          const driftX = (Math.sin(Date.now() / 1500 + i) * 0.4);
          const driftY = (Math.cos(Date.now() / 1800 + i) * 0.4);
          return {
            ...f,
            screenX: Math.max(10, Math.min(90, f.screenX + driftX)),
            screenY: Math.max(10, Math.min(90, f.screenY + driftY)),
          };
        })
      );
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Filter features
  const visibleFeatures = arFeatures.filter((feat) => {
    if (feat.confidence < minConfidence) return false;
    if (activeCategory === 'all') return true;
    return feat.category === activeCategory;
  });

  // Capture Frame with AR Overlays
  const handleSnapshot = () => {
    setIsCapturing(true);
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsCapturing(false);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    canvas.width = 1280;
    canvas.height = 720;

    if (!usingSimulation && videoRef.current && videoRef.current.readyState >= 2) {
      ctx.drawImage(videoRef.current, 0, 0, 1280, 720);
    } else {
      // Draw simulated outcrop background
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#2D1B13');
      grad.addColorStop(0.5, '#402619');
      grad.addColorStop(1, '#1A0F0A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      // Draw rock strata textures
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, 200);
      ctx.bezierCurveTo(400, 280, 800, 140, 1200, 320);
      ctx.stroke();

      ctx.strokeStyle = '#9333EA';
      ctx.beginPath();
      ctx.moveTo(300, 500);
      ctx.bezierCurveTo(600, 420, 900, 580, 1200, 500);
      ctx.stroke();
    }

    // Draw AR annotations onto canvas
    visibleFeatures.forEach((feat) => {
      const px = (feat.screenX / 100) * 1280;
      const py = (feat.screenY / 100) * 720;

      // Reticle
      ctx.strokeStyle = feat.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 24, 0, Math.PI * 2);
      ctx.stroke();

      // Label background
      ctx.fillStyle = 'rgba(26, 15, 10, 0.85)';
      ctx.fillRect(px + 30, py - 20, 260, 50);
      ctx.strokeStyle = feat.color;
      ctx.strokeRect(px + 30, py - 20, 260, 50);

      // Label Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(feat.name, px + 40, py - 2);
      ctx.fillStyle = feat.color;
      ctx.font = '11px monospace';
      ctx.fillText(`${(feat.confidence * 100).toFixed(0)}% | ${feat.gradeEstimate}`, px + 40, py + 18);
    });

    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    const summary = `Tagged ${visibleFeatures.length} geological features in real-time AR: ` +
      visibleFeatures.map(f => `${f.name} (${(f.confidence * 100).toFixed(0)}%)`).join(', ');

    if (onCaptureFrame) {
      onCaptureFrame(base64, summary);
    }
    setTimeout(() => setIsCapturing(false), 500);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-stone-950 border-2 border-amber-500/60 shadow-2xl flex flex-col">
      {/* Top AR Status Bar */}
      <div className="bg-stone-900/90 border-b border-amber-900/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500/50 font-mono text-[10px] animate-pulse">
            <Radio size={12} className="text-red-400 animate-spin-slow" />
            <span>LIVE AR LENS</span>
          </div>
          <span className="font-bold text-white font-['Space_Grotesk'] text-sm hidden sm:inline">
            Geological Outcrop AI Surface Tagger
          </span>
        </div>

        {/* Feature Filters */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: 'all', label: 'All Tags' },
            { id: 'sulfide', label: 'Sulfides', color: 'text-amber-400' },
            { id: 'vein', label: 'Veins', color: 'text-purple-400' },
            { id: 'alteration', label: 'Alteration', color: 'text-rose-400' },
            { id: 'pegmatite', label: 'Pegmatite', color: 'text-pink-400' },
            { id: 'structure', label: 'Shear/Planes', color: 'text-emerald-400' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInclinometer(!showInclinometer)}
            className={`p-1.5 rounded-lg text-xs font-mono transition-all ${
              showInclinometer ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
            }`}
            title="Toggle Strike & Dip Inclinometer"
          >
            <Compass size={15} />
          </button>
          <button
            onClick={() => setShowSpectraHUD(!showSpectraHUD)}
            className={`p-1.5 rounded-lg text-xs font-mono transition-all ${
              showSpectraHUD ? 'bg-purple-600 text-white' : 'bg-stone-800 text-stone-400'
            }`}
            title="Toggle Hyperspectral HUD"
          >
            <Layers size={15} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
              title="Close AR Viewport"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Main AR Viewport Stage */}
      <div className="relative w-full h-[540px] bg-black overflow-hidden select-none flex items-center justify-center">
        {/* Hidden Canvas for High-Resolution Snapshot Capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Video Stream or Simulated Outcrop Backdrop */}
        {!usingSimulation ? (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          /* Simulated Rock Formation Outcrop with Geological Strata */
          <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_#3D2314,_#120B07)] flex items-center justify-center overflow-hidden">
            {/* Outcrop Photo Backdrop */}
            <img
              src="https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?auto=format&fit=crop&w=1200&q=80"
              alt="Geological Outcrop"
              className="absolute inset-0 w-full h-full object-cover opacity-80 filter contrast-125 saturate-110"
            />
            {/* Holographic scanning laser line */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#F59E0B] opacity-75 animate-bounce" />
          </div>
        )}

        {/* Optical Crosshair in Viewport Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <div className="w-16 h-16 border border-dashed border-amber-400/70 rounded-full flex items-center justify-center">
            <Crosshair size={22} className="text-amber-400" />
          </div>
        </div>

        {/* In-Camera Geological Compass & Inclinometer Widget */}
        {showInclinometer && (
          <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-black/80 border border-amber-500/40 text-amber-300 font-mono text-[11px] backdrop-blur-md space-y-1 shadow-lg pointer-events-none">
            <div className="flex items-center gap-1.5 font-bold text-white border-b border-stone-800 pb-1">
              <Compass size={14} className="text-amber-400" />
              <span>STRIKE &amp; DIP INCLINOMETER</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <span className="text-stone-400">Dip (Pitch):</span>{' '}
                <strong className="text-emerald-400">{deviceTilt.pitch}°</strong>
              </div>
              <div>
                <span className="text-stone-400">Plunge (Roll):</span>{' '}
                <strong className="text-emerald-400">{deviceTilt.roll}°</strong>
              </div>
            </div>
            <div className="text-[9px] text-stone-400 pt-0.5">
              Est. Bedding: <span className="text-amber-300 font-bold">N 042°E / 68° NW</span>
            </div>
          </div>
        )}

        {/* Hyperspectral SWIR/VNIR Miniature Waveband Diagnostic Box */}
        {showSpectraHUD && (
          <div className="absolute bottom-4 left-4 p-2.5 rounded-xl bg-stone-950/85 border border-purple-500/40 text-purple-200 font-mono text-[10px] backdrop-blur-md max-w-[240px] shadow-lg pointer-events-none">
            <div className="flex items-center justify-between gap-1 border-b border-stone-800 pb-1 text-white">
              <span className="font-bold flex items-center gap-1 text-purple-300">
                <Layers size={12} className="text-amber-400" /> SWIR SPECTRAL LENS
              </span>
              <span className="text-[9px] text-amber-300">2200nm Al-OH</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 h-6">
              {[60, 45, 85, 30, 95, 70, 40, 80, 65, 90, 50].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-purple-500/60 rounded-t-sm"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <span className="text-[9px] text-stone-400 block mt-1">
              Reflectance absorption matches illite-sericite &amp; chalcopyrite
            </span>
          </div>
        )}

        {/* Real-time Interactive AR Tags Overlay Layer */}
        <div className="absolute inset-0 pointer-events-auto">
          {visibleFeatures.map((feat) => {
            const isSelected = selectedFeature?.id === feat.id;
            return (
              <div
                key={feat.id}
                onClick={() => setSelectedFeature(feat)}
                style={{
                  left: `${feat.screenX}%`,
                  top: `${feat.screenY}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute cursor-pointer group transition-all duration-300 z-10"
              >
                {/* Holographic AR Target Marker */}
                <div className="relative flex items-center justify-center">
                  {/* Pulsing Target Ring */}
                  <div
                    className="absolute w-12 h-12 rounded-full border-2 border-dashed animate-spin-slow opacity-80"
                    style={{ borderColor: feat.color }}
                  />
                  {/* Outer Ripple */}
                  <div
                    className="absolute w-8 h-8 rounded-full animate-ping opacity-60"
                    style={{ backgroundColor: feat.color }}
                  />
                  {/* Center Node */}
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: feat.color }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Floating AR Data Pin & Label */}
                  <div
                    className={`absolute left-6 top-0 transform -translate-y-1/2 p-2 rounded-xl backdrop-blur-md border shadow-2xl transition-all min-w-[200px] ${
                      isSelected
                        ? 'bg-stone-950/95 border-amber-400 ring-2 ring-amber-400/40 z-30 scale-105'
                        : 'bg-stone-900/85 border-stone-700 hover:border-amber-400/80 z-20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-[11px] text-white tracking-wide truncate">
                        {feat.name}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1 rounded font-bold"
                        style={{ color: feat.color, backgroundColor: `${feat.color}20` }}
                      >
                        {(feat.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-[10px] text-stone-300 font-mono mt-0.5">
                      {feat.gradeEstimate}
                    </p>

                    {feat.strikeDip && (
                      <span className="text-[9px] text-amber-300 font-mono block mt-0.5">
                        Pln: {feat.strikeDip}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected AR Feature Detailed Petrographic Inspector Modal Card */}
        {selectedFeature && (
          <div className="absolute top-4 right-4 max-w-xs w-full p-4 rounded-2xl bg-stone-950/95 border-2 border-amber-500/70 backdrop-blur-md shadow-2xl z-30 text-xs space-y-2.5 animate-in fade-in slide-in-from-right-3 duration-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  AR Petrographic Target
                </span>
                <h4 className="text-sm font-extrabold text-white mt-0.5">
                  {selectedFeature.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1.5 text-stone-300">
              <div>
                <span className="text-stone-400 text-[10px] block">Mineral Classification:</span>
                <strong className="text-white font-mono">{selectedFeature.mineralType}</strong>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] block">Estimated Grade / Vector:</span>
                <span className="text-amber-400 font-bold font-mono">{selectedFeature.gradeEstimate}</span>
              </div>

              <div>
                <span className="text-stone-400 text-[10px] block">Hyperspectral Diagnostic:</span>
                <span className="text-purple-300 font-mono text-[11px]">{selectedFeature.spectralSignature}</span>
              </div>

              <p className="text-[11px] text-stone-300 italic pt-1 border-t border-stone-800">
                "{selectedFeature.description}"
              </p>
            </div>
          </div>
        )}

        {/* Bottom Viewport Floating Action Bar */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
          {/* Switch to live camera if using simulation */}
          {usingSimulation && (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold backdrop-blur-md transition-all"
            >
              <RefreshCw size={13} className="text-amber-400" />
              <span>Retry Web Camera</span>
            </button>
          )}

          {/* Freeze & Analyze Outcrop Frame */}
          <button
            id="btn-ar-capture-snapshot"
            onClick={handleSnapshot}
            disabled={isCapturing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-extrabold text-xs shadow-2xl transition-all disabled:opacity-50"
          >
            {isCapturing ? (
              <RefreshCw size={15} className="animate-spin text-stone-950" />
            ) : (
              <Camera size={15} className="text-stone-950" />
            )}
            <span>Freeze &amp; Tag Outcrop</span>
          </button>
        </div>
      </div>

      {/* AR Lens Confidence Threshold Slider Bar */}
      <div className="bg-[#2A1810] border-t border-amber-900/40 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-stone-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Sliders size={13} className="text-amber-400" /> Confidence Filter:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.7"
              max="0.98"
              step="0.02"
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              className="accent-amber-500 cursor-pointer w-28 sm:w-36"
            />
            <span className="font-mono text-amber-300 font-bold">
              {(minConfidence * 100).toFixed(0)}% Min
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-stone-400 font-mono">
          <span>Active AR Anchors: <strong className="text-emerald-400">{visibleFeatures.length}</strong></span>
          <span className="hidden sm:inline">Engine: <strong className="text-purple-300">YOLO-Geo &amp; Hyperspectral-Core</strong></span>
        </div>
      </div>
    </div>
  );
};
