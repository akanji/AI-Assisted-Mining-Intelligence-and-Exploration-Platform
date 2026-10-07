import React, { useState, useRef, useEffect } from 'react';
import {
  ScanEye,
  Upload,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  FileCode2,
  ChevronRight,
  Maximize2,
  Sliders,
  Camera,
  Info,
  Zap,
  Truck,
  ShieldAlert,
  Leaf,
  Activity,
  ArrowRight,
  Copy,
  Check,
  Radio,
  PenTool,
  Plus,
  Trash2,
  Tag,
  X,
} from 'lucide-react';
import { RockAnalysisResult, BoundingBox } from '../types';
import { ARGeologicalLens } from './ARGeologicalLens';

interface ComputerVisionCenterProps {
  onSendToAssistant?: (prompt: string) => void;
}

type VisionCategory = 'all' | 'geology' | 'equipment_safety' | 'ore_environmental';

interface VisionSpecimen {
  id: string;
  name: string;
  category: 'geology' | 'equipment_safety' | 'ore_environmental';
  categoryLabel: string;
  commodityOrType: string;
  image: string;
  description: string;
  boxes: BoundingBox[];
}

const VISION_CATALOG: VisionSpecimen[] = [
  // 1. Geological Formations
  {
    id: 'geo-1',
    name: 'Porphyry Chalcopyrite-Quartz Breccia',
    category: 'geology',
    categoryLabel: 'Geological Formation',
    commodityOrType: 'Copper-Gold Porphyry',
    image: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?auto=format&fit=crop&w=900&q=80',
    description: 'Hydrothermal quartz vein breccia with brassy chalcopyrite grains and supergene potassic/phyllic halo.',
    boxes: [
      { id: 'b1', label: 'Chalcopyrite (CuFeS₂)', mineral: 'Chalcopyrite', confidence: 0.94, x: 28, y: 35, width: 26, height: 24, description: 'Brassy yellow metallic cluster in quartz matrix (14.5% vol)', color: '#F59E0B' },
      { id: 'b2', label: 'Quartz Vein Matrix', mineral: 'Quartz', confidence: 0.98, x: 55, y: 20, width: 34, height: 45, description: 'Milky crystalline silica vein flood with fluid inclusion vugs', color: '#9333EA' },
      { id: 'b3', label: 'Phyllic Sericite Halo', mineral: 'Illite / Muscovite', confidence: 0.89, x: 12, y: 62, width: 38, height: 28, description: 'Hydrothermal alteration selvage exhibiting SWIR 2200nm Al-OH doublet', color: '#10B981' },
    ],
  },
  {
    id: 'geo-2',
    name: 'Spodumene Pegmatite LCT Drill Core',
    category: 'geology',
    categoryLabel: 'Geological Formation',
    commodityOrType: 'Lithium (Li) / Tantalum',
    image: 'https://images.unsplash.com/photo-1599707367072-cd6ada2bc375?auto=format&fit=crop&w=900&q=80',
    description: 'Coarse spodumene megacrysts intergrown with albite and quartz from the James Bay pegmatite swarm.',
    boxes: [
      { id: 'b4', label: 'Spodumene Crystal (32% vol)', mineral: 'Spodumene', confidence: 0.96, x: 22, y: 25, width: 48, height: 35, description: 'Elongated prismatic lath with diagnostic cleavage; assay 1.95% Li₂O', color: '#EC4899' },
      { id: 'b5', label: 'Albite-Quartz Groundmass', mineral: 'Albite / Feldspar', confidence: 0.93, x: 15, y: 60, width: 68, height: 30, description: 'Granitic LCT pegmatite matrix with low K/Rb fractionation ratio', color: '#6366F1' },
    ],
  },
  {
    id: 'geo-3',
    name: 'Banded Iron Formation (BIF)',
    category: 'geology',
    categoryLabel: 'Geological Formation',
    commodityOrType: 'Iron Ore (Fe)',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=900&q=80',
    description: 'Alternating micro-bands of dark specular hematite/magnetite and red microcrystalline jasper chert.',
    boxes: [
      { id: 'b6', label: 'Specular Hematite Micro-Band', mineral: 'Hematite', confidence: 0.97, x: 10, y: 20, width: 80, height: 28, description: 'Sub-metallic Fe-oxide band with intense VNIR 860nm absorption', color: '#EF4444' },
      { id: 'b7', label: 'Red Jasper Chert', mineral: 'Chert / Quartz', confidence: 0.95, x: 10, y: 55, width: 80, height: 32, description: 'Microcrystalline silica stained by sub-micron hematite dust', color: '#F97316' },
    ],
  },

  // 2. Mining Equipment & Safety Hazards
  {
    id: 'equip-1',
    name: 'Open-Pit Haulage Fleet & Excavator Face',
    category: 'equipment_safety',
    categoryLabel: 'Equipment & Safety',
    commodityOrType: 'Fleet Telemetry & Bench Clearance',
    image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=900&q=80',
    description: 'CAT 797F 400-ton haul truck and hydraulic excavator operating at high-production open-pit bench.',
    boxes: [
      { id: 'b8', label: 'CAT 797F Haul Truck [ID: HT-42]', mineral: 'Haul Truck', confidence: 0.98, x: 18, y: 38, width: 34, height: 44, description: 'Fully loaded haulage cycle; speed 22 km/h, tire temp 84°C within limits', color: '#F59E0B' },
      { id: 'b9', label: 'PC8000 Hydraulic Excavator', mineral: 'Excavator', confidence: 0.96, x: 56, y: 28, width: 38, height: 52, description: 'Loading shovel bucket; swing radius clear of unauthorized ground personnel', color: '#3B82F6' },
      { id: 'b10', label: 'Safety Berm [Compliant 2.8m]', mineral: 'Safety Berm', confidence: 0.92, x: 5, y: 78, width: 88, height: 18, description: 'Drop-edge axle-height safety berm exceeds MSHA compliance ratio', color: '#10B981' },
    ],
  },
  {
    id: 'equip-2',
    name: 'Highwall Tension Fracture & Rockfall Hazard',
    category: 'equipment_safety',
    categoryLabel: 'Equipment & Safety',
    commodityOrType: 'Geotechnical Slope Hazard',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    description: 'Sub-vertical tension crack detected on 15m bench crest with loose overhang and potential wedge slip.',
    boxes: [
      { id: 'b11', label: 'Active Tension Crack [CRITICAL]', mineral: 'Hazard: Wedge Slip', confidence: 0.95, x: 25, y: 15, width: 45, height: 22, description: 'Micro-radar confirms 3.8 mm/day shear displacement along joint plane', color: '#EF4444' },
      { id: 'b12', label: 'Talus Rockfall Debris Accumulation', mineral: 'Hazard: Falling Rock', confidence: 0.91, x: 12, y: 65, width: 72, height: 28, description: 'Unscaled boulder cluster blocking bench catchment drain', color: '#F97316' },
      { id: 'b13', label: 'Safe Exclusion Perimeter', mineral: 'Geotechnical Zone', confidence: 0.94, x: 5, y: 50, width: 90, height: 45, description: 'Recommended 25-meter exclusion radius from active crest toe', color: '#8B5CF6' },
    ],
  },
  {
    id: 'equip-3',
    name: 'Tailings Storage Facility (TSF) Embankment',
    category: 'equipment_safety',
    categoryLabel: 'Equipment & Safety',
    commodityOrType: 'Tailings Dam Integrity',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=900&q=80',
    description: 'Upstream raised tailings dam embankment monitored via multispectral and thermal piezometric imaging.',
    boxes: [
      { id: 'b14', label: 'Embankment Crest Freeboard (4.2m)', mineral: 'TSF Dam Crest', confidence: 0.97, x: 10, y: 25, width: 80, height: 25, description: 'Adequate freeboard exceeding 1-in-10,000 year storm flood requirements', color: '#10B981' },
      { id: 'b15', label: 'Piezometer Line Phreatic Surface', mineral: 'Seepage Monitor', confidence: 0.89, x: 30, y: 55, width: 40, height: 25, description: 'Thermal sensor confirms phreatic line is well below downstream toe slope', color: '#3B82F6' },
    ],
  },

  // 3. Ore Quality & Environmental Impact
  {
    id: 'ore-1',
    name: 'Run-of-Mine Flotation Ore Feed (Cu-Au)',
    category: 'ore_environmental',
    categoryLabel: 'Ore & Environment',
    commodityOrType: 'Ore Grade & Mineral Liberation',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    description: 'Crushed ore feed on overland conveyor with real-time copper sulphide visual grade prediction.',
    boxes: [
      { id: 'b16', label: 'High-Grade Chalcopyrite (1.8% Cu)', mineral: 'Primary Ore', confidence: 0.94, x: 25, y: 30, width: 30, height: 35, description: 'Optimal grain liberation index (86% liberated at 150 microns)', color: '#F59E0B' },
      { id: 'b17', label: 'Pyrite Gangue Mineral (12% vol)', mineral: 'Iron Sulphide', confidence: 0.92, x: 60, y: 40, width: 25, height: 30, description: 'Requires depressant lime dosing (pH 10.5) to prevent copper concentrate dilution', color: '#9333EA' },
      { id: 'b18', label: 'Oxide Waste Fragment (<0.1% Cu)', mineral: 'Barren Gangue', confidence: 0.88, x: 15, y: 65, width: 28, height: 25, description: 'Chlorite-rich wall rock fragment with negligible economic grade', color: '#6B7280' },
    ],
  },
  {
    id: 'ore-2',
    name: 'Acid Rock Drainage (AMD) & Effluent Neutralization',
    category: 'ore_environmental',
    categoryLabel: 'Ore & Environment',
    commodityOrType: 'Water Quality & ESG Impact',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80',
    description: 'Effluent catchment pond with orange ferric iron staining and high-density sludge neutralization treatment.',
    boxes: [
      { id: 'b19', label: 'Ferric Hydroxide Plume [pH 3.9]', mineral: 'AMD Runoff', confidence: 0.96, x: 20, y: 40, width: 45, height: 35, description: 'Acid generation from pyrite weathering; directs automated slaked lime addition', color: '#EF4444' },
      { id: 'b20', label: 'Neutralized Discharge Clarifier [pH 7.8]', mineral: 'Clean Discharge', confidence: 0.93, x: 60, y: 20, width: 35, height: 38, description: 'Treated water compliant with World Bank / IFC metals discharge standards', color: '#10B981' },
    ],
  },
];

export const ComputerVisionCenter: React.FC<ComputerVisionCenterProps> = ({ onSendToAssistant }) => {
  const [selectedSpecimen, setSelectedSpecimen] = useState<VisionSpecimen>(VISION_CATALOG[0]);
  const [activeCategory, setActiveCategory] = useState<VisionCategory>('all');
  const [activeBand, setActiveBand] = useState<'RGB' | 'VNIR' | 'SWIR' | 'LWIR'>('RGB');
  const [showBoxes, setShowBoxes] = useState(true);
  const [hoveredBox, setHoveredBox] = useState<BoundingBox | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<RockAnalysisResult | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [isARMode, setIsARMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Device Camera Capture Modal state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Drawing & Annotation Tool state
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [userAnnotations, setUserAnnotations] = useState<BoundingBox[]>([]);
  const [isAutoAnnotating, setIsAutoAnnotating] = useState<boolean>(false);
  const [autoAnnotateSummary, setAutoAnnotateSummary] = useState<string | null>(null);
  const [autoAnnotateSpectralNote, setAutoAnnotateSpectralNote] = useState<string | null>(null);
  const [showAnnotationModal, setShowAnnotationModal] = useState<boolean>(false);
  const [pendingBoxCoords, setPendingBoxCoords] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Annotation Form inputs
  const [annotationLabel, setAnnotationLabel] = useState<string>('Chalcopyrite Grain');
  const [annotationMineral, setAnnotationMineral] = useState<string>('Chalcopyrite');
  const [annotationConfidence, setAnnotationConfidence] = useState<number>(0.92);
  const [annotationDescription, setAnnotationDescription] = useState<string>('Metallic brassy cluster in quartz matrix');
  const [annotationColor, setAnnotationColor] = useState<string>('#F59E0B');

  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Start Device Camera
  const startCamera = async () => {
    setIsCameraModalOpen(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setCameraError('Device camera access blocked or unavailable. You can use standard upload or simulated specimen capture.');
    }
  };

  // Stop Device Camera
  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraModalOpen(false);
  };

  // Capture Photo from Camera Stream
  const captureCameraPhoto = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCustomImage(dataUrl);
        stopCamera();
        setIsDrawingMode(true); // Automatically enable drawing annotations on captured sample
      }
    } else {
      // Fallback synthetic high-res mineral specimen if video hardware stream is not active
      const fallbackUrl = 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?auto=format&fit=crop&w=1200&q=80';
      setCustomImage(fallbackUrl);
      stopCamera();
      setIsDrawingMode(true);
    }
  };

  // Filtered specimens
  const filteredCatalog = VISION_CATALOG.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleARCapture = (base64Image: string) => {
    setCustomImage(base64Image);
    setIsARMode(false);
    setIsDrawingMode(true);
    triggerAnalysis(base64Image);
  };

  // Handle custom image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setCustomImage(base64);
        setIsDrawingMode(true);
        triggerAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Interactive Bounding Box Drawing handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setIsDrawing(true);
    setDrawStart({ x, y });
    setDrawCurrent({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setDrawCurrent({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawStart || !drawCurrent) return;
    setIsDrawing(false);

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    // Only open annotation modal if box is reasonably sized (> 2% in width and height)
    if (width > 2 && height > 2) {
      setPendingBoxCoords({
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        width: Number(width.toFixed(1)),
        height: Number(height.toFixed(1)),
      });
      setShowAnnotationModal(true);
    }
    setDrawStart(null);
    setDrawCurrent(null);
  };

  const saveUserAnnotation = () => {
    if (!pendingBoxCoords) return;
    const newBox: BoundingBox = {
      id: `usr-${Date.now()}`,
      label: annotationLabel,
      mineral: annotationMineral,
      confidence: annotationConfidence,
      x: pendingBoxCoords.x,
      y: pendingBoxCoords.y,
      width: pendingBoxCoords.width,
      height: pendingBoxCoords.height,
      description: annotationDescription,
      color: annotationColor,
    };
    setUserAnnotations((prev) => [...prev, newBox]);
    setShowAnnotationModal(false);
    setPendingBoxCoords(null);
  };

  const deleteUserAnnotation = (boxId: string) => {
    setUserAnnotations((prev) => prev.filter((b) => b.id !== boxId));
  };

  // Gemini Auto-Annotate Core Mineral Features in uploaded high-resolution imagery
  const handleAutoAnnotateCore = async (overrideImageBase64?: string) => {
    setIsAutoAnnotating(true);
    setShowBoxes(true);
    try {
      const targetImg = overrideImageBase64 || customImage || undefined;
      const response = await fetch('/api/gemini/auto-annotate-core', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: targetImg,
          mineralContext: customImage
            ? 'Uploaded High-Resolution Drill Core & Mineral Specimen Imagery'
            : `${selectedSpecimen.name} (${selectedSpecimen.commodityOrType}) - ${selectedSpecimen.description}`,
          spectralBand: activeBand,
          isUploadedCustomImage: Boolean(targetImg),
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.annotations)) {
        // Replace previous auto-generated annotations while keeping manual user-drawn ones
        setUserAnnotations((prev) => {
          const manualOnly = prev.filter((b) => !b.id.startsWith('gem-auto-'));
          return [...data.annotations, ...manualOnly];
        });
        setAutoAnnotateSummary(
          data.specimenSummary ||
            `Gemini detected and labeled ${data.annotations.length} core mineral features.`
        );
        setAutoAnnotateSpectralNote(data.spectralDiagnosticNote || null);
        if (data.annotations.length > 0) {
          setHoveredBox(data.annotations[0]);
        }
      }
    } catch (err) {
      console.error('Auto-Annotate error:', err);
    } finally {
      setIsAutoAnnotating(false);
    }
  };

  // Trigger multimodal vision analysis
  const triggerAnalysis = async (imgBase64?: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze-rock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgBase64 || (customImage ? customImage : undefined),
          mineralContext: selectedSpecimen.name + ' - ' + selectedSpecimen.description,
          analysisMode: selectedSpecimen.category,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSpecimen = (specimen: VisionSpecimen) => {
    setSelectedSpecimen(specimen);
    setCustomImage(null);
    setAnalysisResult(null);
  };

  const handleCopyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2000);
  };

  // Current display image & bounding boxes
  const currentImage = customImage || selectedSpecimen.image;
  const baseBoxes = customImage ? (analysisResult?.boxes || []) : selectedSpecimen.boxes;
  const currentBoxes = [...baseBoxes, ...userAnnotations];

  // Filter effect based on selected spectral band
  const getSpectralFilterStyle = () => {
    switch (activeBand) {
      case 'VNIR':
        return 'contrast-150 saturate-200 hue-rotate-15 sepia';
      case 'SWIR':
        return 'contrast-125 invert-25 hue-rotate-90 brightness-110';
      case 'LWIR':
        return 'contrast-200 hue-rotate-180 brightness-95';
      default:
        return 'contrast-100 saturate-100';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Operational Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ScanEye size={24} className="text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Computer Vision &amp; Multimodal Inspection Center
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Real-world geological formations, camera sample capture, interactive bounding box annotation, and ore quality assessment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          {/* Device Camera Modal Button */}
          <button
            id="btn-open-camera-modal"
            onClick={startCamera}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors shadow-md"
            title="Open device camera to snap mineral rock sample"
          >
            <Camera size={15} className="text-stone-950" />
            <span>Camera Capture</span>
          </button>

          {/* Draw & Annotate Toggle Button */}
          <button
            id="btn-toggle-drawing-mode"
            onClick={() => setIsDrawingMode(!isDrawingMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isDrawingMode
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-extrabold shadow-lg ring-2 ring-amber-400'
                : 'bg-stone-900 hover:bg-stone-850 text-amber-300 border border-amber-500/40'
            }`}
            title="Draw bounding boxes to annotate mineral samples"
          >
            <PenTool size={15} className={isDrawingMode ? 'text-stone-950' : 'text-amber-400'} />
            <span>{isDrawingMode ? 'Drawing Mode Active' : 'Draw & Annotate'}</span>
          </button>

          <button
            id="btn-toggle-ar-lens"
            onClick={() => setIsARMode(!isARMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isARMode
                ? 'bg-purple-600 text-white font-extrabold shadow-lg'
                : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800'
            }`}
          >
            <Radio size={15} className={isARMode ? 'text-white' : 'text-purple-400'} />
            <span>{isARMode ? 'Exit AR Lens' : 'AR Lens'}</span>
          </button>
          <button
            id="btn-upload-specimen"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-bold transition-colors"
          >
            <Upload size={15} className="text-amber-400" />
            <span>Upload High-Res Core</span>
          </button>
          <button
            id="btn-auto-annotate-core"
            onClick={() => handleAutoAnnotateCore()}
            disabled={isAutoAnnotating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 text-xs font-extrabold shadow-lg transition-all disabled:opacity-50"
            title="Use Gemini Vision AI to automatically detect and label core mineral features in imagery"
          >
            {isAutoAnnotating ? (
              <RefreshCw size={15} className="animate-spin text-stone-950" />
            ) : (
              <Tag size={15} className="text-stone-950" />
            )}
            <span>{isAutoAnnotating ? 'Auto-Annotating...' : 'Auto-Annotate'}</span>
          </button>
          <button
            id="btn-run-gemini-vision"
            onClick={() => triggerAnalysis()}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-extrabold shadow-lg transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <RefreshCw size={15} className="animate-spin text-stone-950" />
            ) : (
              <Sparkles size={15} className="text-stone-950" />
            )}
            <span>Run Vision AI</span>
          </button>
        </div>
      </div>

      {/* Module Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone-400 mr-2 uppercase tracking-wider">
            Inspection Mode:
          </span>
          <button
            onClick={() => {
              setIsARMode(false);
              setActiveCategory('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'all' && !isARMode
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            All Modules ({VISION_CATALOG.length})
          </button>
          <button
            onClick={() => {
              setIsARMode(false);
              setActiveCategory('geology');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'geology' && !isARMode
                ? 'bg-purple-900 text-white border border-purple-500 shadow-md'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            <Layers size={13} className="text-amber-400" />
            <span>Geological Formations</span>
          </button>
          <button
            onClick={() => {
              setIsARMode(false);
              setActiveCategory('equipment_safety');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'equipment_safety' && !isARMode
                ? 'bg-rose-900 text-white border border-rose-500 shadow-md'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            <ShieldAlert size={13} className="text-rose-400" />
            <span>Equipment & Safety Hazards</span>
          </button>
          <button
            onClick={() => {
              setIsARMode(false);
              setActiveCategory('ore_environmental');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'ore_environmental' && !isARMode
                ? 'bg-emerald-900 text-white border border-emerald-500 shadow-md'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
            }`}
          >
            <Leaf size={13} className="text-emerald-400" />
            <span>Ore Quality & ESG Impact</span>
          </button>
        </div>

        {/* Live AR Camera Fast Access Pill */}
        <button
          id="btn-live-ar-outcrop-tagger"
          onClick={() => setIsARMode(!isARMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
            isARMode
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md'
              : 'bg-stone-900 hover:bg-stone-850 text-amber-300 border border-amber-500/40 shadow-sm'
          }`}
        >
          <Radio size={14} className="text-amber-400 animate-pulse" />
          <span>Live AR Rock Outcrop Lens</span>
        </button>
      </div>

      {/* Conditional AR Viewport or Standard Catalog Grid */}
      {isARMode ? (
        <div className="space-y-4">
          <ARGeologicalLens
            onCaptureFrame={handleARCapture}
            onClose={() => setIsARMode(false)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Specimen Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Select Sample or Scene ({filteredCatalog.length})
            </span>
            <span className="text-[11px] text-stone-400">Click to switch</span>
          </div>

          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredCatalog.map((specimen) => {
              const isSelected = selectedSpecimen.id === specimen.id && !customImage;
              return (
                <div
                  key={specimen.id}
                  onClick={() => handleSelectSpecimen(specimen)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-purple-950/80 border-amber-500 shadow-lg'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <img
                    src={specimen.image}
                    alt={specimen.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-stone-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-black/40 text-amber-300 uppercase tracking-wider">
                        {specimen.commodityOrType}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {specimen.boxes.length} targets
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-xs mt-1 truncate">
                      {specimen.name}
                    </h4>
                    <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5">
                      {specimen.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Vision Canvas with Bounding Boxes & Hyperspectral Layers */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-stone-800 shadow-2xl group">
            {/* Visual Stream Canvas */}
            <div
              ref={imageContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className={`relative w-full aspect-video flex items-center justify-center overflow-hidden bg-black/90 select-none ${
                isDrawingMode ? 'cursor-crosshair' : 'cursor-default'
              }`}
            >
              <img
                src={currentImage}
                alt="Inspection View"
                referrerPolicy="no-referrer"
                draggable={false}
                className={`w-full h-full object-cover transition-all duration-500 pointer-events-none select-none ${getSpectralFilterStyle()}`}
              />

              {/* Drawing Active Notification Badge */}
              {isDrawingMode && (
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-amber-500/90 text-stone-950 font-extrabold text-xs flex items-center gap-1.5 shadow-xl animate-pulse pointer-events-none z-30">
                  <PenTool size={13} />
                  <span>Click &amp; Drag on image to annotate mineral</span>
                </div>
              )}

              {/* Live Drawing Ghost Box */}
              {isDrawing && drawStart && drawCurrent && (
                <div
                  className="absolute border-2 border-dashed border-amber-400 bg-amber-500/25 z-40 pointer-events-none"
                  style={{
                    left: `${Math.min(drawStart.x, drawCurrent.x)}%`,
                    top: `${Math.min(drawStart.y, drawCurrent.y)}%`,
                    width: `${Math.abs(drawCurrent.x - drawStart.x)}%`,
                    height: `${Math.abs(drawCurrent.y - drawStart.y)}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 font-bold text-[10px] font-mono whitespace-nowrap shadow-md">
                    Target: {Math.round(Math.abs(drawCurrent.x - drawStart.x))}% × {Math.round(Math.abs(drawCurrent.y - drawStart.y))}%
                  </div>
                </div>
              )}

              {/* Bounding Box Overlays */}
              {showBoxes &&
                currentBoxes.map((box) => {
                  const isHovered = hoveredBox?.id === box.id;
                  const isUserBox = box.id.startsWith('usr-');
                  const isGeminiAutoBox = box.id.startsWith('gem-auto-');
                  const isRemovableBox = isUserBox || isGeminiAutoBox;
                  return (
                    <div
                      key={box.id}
                      onMouseEnter={() => setHoveredBox(box)}
                      onMouseLeave={() => setHoveredBox(null)}
                      className={`absolute border-2 transition-all cursor-pointer ${
                        isHovered ? 'border-amber-400 z-30 scale-105 shadow-2xl' : 'z-10'
                      }`}
                      style={{
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                        borderColor: isHovered ? '#F59E0B' : box.color || '#F59E0B',
                        backgroundColor: isHovered ? 'rgba(245, 158, 11, 0.25)' : 'rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      {/* Box Label Tag */}
                      <div
                        className="absolute -top-7 left-0 px-2 py-0.5 rounded text-[11px] font-bold whitespace-nowrap shadow-md flex items-center gap-1.5"
                        style={{
                          backgroundColor: box.color || '#F59E0B',
                          color: '#000000',
                        }}
                      >
                        {isGeminiAutoBox && (
                          <span className="bg-black/80 text-emerald-300 text-[9px] px-1 py-0.2 rounded font-mono">
                            AI AUTO
                          </span>
                        )}
                        {isUserBox && (
                          <span className="bg-black/75 text-white text-[9px] px-1 py-0.2 rounded font-mono">
                            USER
                          </span>
                        )}
                        <span>{box.label}</span>
                        <span className="text-[9px] font-mono opacity-80">
                          {Math.round(box.confidence * 100)}%
                        </span>
                        {isRemovableBox && (
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              deleteUserAnnotation(box.id);
                            }}
                            className="ml-1 p-0.5 rounded hover:bg-black/20 text-stone-900"
                            title="Delete annotation"
                          >
                            <X size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

              {/* Floating Active Band Watermark */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-stone-700 text-xs font-mono text-amber-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>BAND: {activeBand}</span>
                <span className="text-stone-400">|</span>
                <span className="text-stone-300 capitalize">{selectedSpecimen.category.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Bottom Floating Bar on Canvas: Spectral Bands & Box Toggle */}
            <div className="p-3 bg-[#2A1810]/95 backdrop-blur-md border-t border-amber-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 font-bold mr-1">Spectral Band:</span>
                {(['RGB', 'VNIR', 'SWIR', 'LWIR'] as const).map((band) => (
                  <button
                    key={band}
                    onClick={() => setActiveBand(band)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                      activeBand === band
                        ? 'bg-amber-500 text-stone-950 shadow-md'
                        : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    {band}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  id="btn-canvas-auto-annotate"
                  onClick={() => handleAutoAnnotateCore()}
                  disabled={isAutoAnnotating}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-extrabold bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-md transition-all disabled:opacity-50"
                >
                  {isAutoAnnotating ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  <span>{isAutoAnnotating ? 'Auto-Annotating...' : 'Auto-Annotate (Gemini)'}</span>
                </button>
                <button
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-colors ${
                    isDrawingMode
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                      : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-700'
                  }`}
                >
                  <PenTool size={13} />
                  <span>{isDrawingMode ? 'Drawing On' : 'Draw Box'}</span>
                </button>
                <button
                  onClick={() => setShowBoxes(!showBoxes)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-colors ${
                    showBoxes
                      ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {showBoxes ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>Bounding Boxes ({currentBoxes.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Gemini Auto-Annotation Diagnostic Summary Banner */}
          {autoAnnotateSummary && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  <span>Gemini High-Resolution Core Auto-Annotation Complete</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAutoAnnotateSummary(null)}
                  className="text-stone-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              </div>
              <p className="text-stone-200">{autoAnnotateSummary}</p>
              {autoAnnotateSpectralNote && (
                <p className="text-[11px] font-mono text-amber-300">{autoAnnotateSpectralNote}</p>
              )}
            </div>
          )}

          {/* User Annotations Manager Panel */}
          {userAnnotations.length > 0 && (
            <div className="p-4 rounded-xl bg-stone-900/90 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag size={15} className="text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Custom Sample Annotations ({userAnnotations.length})
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {onSendToAssistant && (
                    <button
                      onClick={() =>
                        onSendToAssistant(
                          `Here are my annotated mineral targets on the captured rock sample:\n` +
                            userAnnotations
                              .map(
                                (b, idx) =>
                                  `${idx + 1}. ${b.label} (${b.mineral}) - ${b.description} [Confidence: ${(
                                    b.confidence * 100
                                  ).toFixed(0)}%, Pos: ${b.x}%,${b.y}%]`
                              )
                              .join('\n') +
                            `\nPlease provide a petrographic and economic analysis of these mineral phases.`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold flex items-center gap-1 shadow-sm transition-all"
                    >
                      <Sparkles size={12} />
                      <span>Analyze Annotations with MineAI</span>
                    </button>
                  )}
                  <button
                    onClick={() => setUserAnnotations([])}
                    className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 text-[11px] transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {userAnnotations.map((anno) => (
                  <div
                    key={anno.id}
                    className="p-2.5 rounded-lg bg-stone-950/70 border border-stone-800 flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: anno.color || '#F59E0B' }}
                        />
                        <span className="font-bold text-white text-xs truncate">{anno.label}</span>
                      </div>
                      <p className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                        {anno.description || anno.mineral}
                      </p>
                      <span className="text-[10px] font-mono text-amber-400/90">
                        Conf: {(anno.confidence * 100).toFixed(0)}% • Box: {anno.width}×{anno.height}%
                      </span>
                    </div>
                    <button
                      onClick={() => deleteUserAnnotation(anno.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete annotation"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hovered Target Detail Card */}
          {hoveredBox && (
            <div className="p-4 rounded-xl bg-purple-950/60 border border-amber-500/50 text-white flex items-center justify-between gap-4 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Inspected Target Feature
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-bold">
                    Confidence: {(hoveredBox.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white mt-0.5">{hoveredBox.label}</h4>
                <p className="text-xs text-stone-300 mt-1">{hoveredBox.description}</p>
              </div>

              {onSendToAssistant && (
                <button
                  onClick={() =>
                    onSendToAssistant(
                      `Analyze this detected target: ${hoveredBox.label} (${hoveredBox.description}) with confidence ${(
                        hoveredBox.confidence * 100
                      ).toFixed(1)}%. What are the operational, geological, and safety implications?`
                    )
                  }
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md transition-all"
                >
                  <span>Ask MineAI</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Multimodal AI Vision Results: Mineralogy, Alteration, Safety, and Extracted Prompts */}
      {analysisResult && (
        <div className="rounded-2xl bg-[#2A1810]/80 border-2 border-amber-500/60 p-6 space-y-6 shadow-2xl animate-fadeIn">
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                  Vision Intelligence Engine
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  Prospectivity: {analysisResult.economicProspectivity.rating}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white font-['Space_Grotesk'] mt-1">
                {analysisResult.rockClassification}
              </h2>
              <p className="text-xs text-stone-300 mt-0.5">
                {analysisResult.alterationType}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30 text-right">
              <span className="text-[11px] text-stone-400 block">AI Confidence Score</span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {analysisResult.economicProspectivity.confidenceScore}%
              </span>
            </div>
          </div>

          {/* Breakdown Grid: Detected Objects / Minerals + Hyperspectral Bands */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Identified Objects & Mineral Components */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} />
                <span>Identified Components & Segmented Percentages</span>
              </h3>
              <div className="space-y-2">
                {analysisResult.primaryMinerals.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-white">{item.name}</span>
                      <span className="text-amber-400 font-mono">{item.percentage}% vol</span>
                    </div>
                    <p className="text-[11px] text-stone-300">{item.description}</p>
                    <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-purple-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hyperspectral Band Analysis */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={14} />
                <span>Hyperspectral & Telemetric Sensor Telemetry</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800">
                  <span className="font-bold text-rose-400 block">VNIR (400 - 1000 nm):</span>
                  <p className="text-stone-300 mt-0.5">{analysisResult.spectralBands.vnir}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800">
                  <span className="font-bold text-purple-300 block">SWIR (1000 - 2500 nm):</span>
                  <p className="text-stone-300 mt-0.5">{analysisResult.spectralBands.swir}</p>
                </div>
                <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800">
                  <span className="font-bold text-sky-300 block">LWIR (7.7 - 12.3 µm):</span>
                  <p className="text-stone-300 mt-0.5">{analysisResult.spectralBands.lwir}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Insights & Derived AI Prompts */}
          <div className="space-y-3 pt-4 border-t border-stone-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} />
              <span>Extracted AI Prompts & Actionable Decision Triggers</span>
            </h3>
            <p className="text-xs text-stone-300">
              The vision system has transformed this visual scene into structured algorithmic triggers ready for immediate dispatch to MineAI, the A2A Judge Agent, or GIS modeling.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {analysisResult.extractedPrompts.map((prompt, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-700/40 flex flex-col justify-between gap-3 text-xs text-stone-200"
                >
                  <p className="font-mono text-purple-200">{prompt}</p>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-purple-800/40">
                    <button
                      onClick={() => handleCopyPrompt(prompt, pIdx)}
                      className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-white"
                    >
                      {copiedPromptIndex === pIdx ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {onSendToAssistant && (
                      <button
                        onClick={() => onSendToAssistant(prompt)}
                        className="flex items-center gap-1 text-[11px] text-amber-400 font-bold hover:underline"
                      >
                        <span>Dispatch to MineAI</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-900/20 to-black/40 border border-amber-500/40 flex items-start gap-3">
            <Info size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-amber-300 block mb-0.5">
                Principal Engineer Recommendation:
              </strong>
              <p className="text-stone-200 leading-relaxed">{analysisResult.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Device Camera Capture Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera size={20} className="text-amber-400" />
                <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                  Device Camera Mineral Capture
                </h3>
              </div>
              <button
                onClick={stopCamera}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Align your hand sample or drill core specimen in the viewfinder. Snap the image to immediately enable interactive bounding box annotation and AI petrographic analysis.
            </p>

            {cameraError ? (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold">
                  <AlertTriangle size={16} />
                  <span>Camera Stream Notice</span>
                </div>
                <p>{cameraError}</p>
                <button
                  onClick={captureCameraPhoto}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all"
                >
                  Load High-Res Drill Core Specimen for Annotation
                </button>
              </div>
            ) : (
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-stone-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-dashed border-amber-400/40 pointer-events-none m-4 rounded-lg flex items-center justify-center">
                  <span className="text-[11px] font-mono text-amber-400/70 bg-black/60 px-2 py-1 rounded">
                    Frame Rock Sample Here
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={captureCameraPhoto}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-extrabold shadow-lg flex items-center gap-2 transition-all"
              >
                <Camera size={15} />
                <span>Snap Sample &amp; Start Annotating</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mineral Sample Bounding Box Annotation Modal */}
      {showAnnotationModal && pendingBoxCoords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-amber-400" />
                <h3 className="text-base font-bold text-white font-['Space_Grotesk']">
                  Annotate Mineral Sample Target
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAnnotationModal(false);
                  setPendingBoxCoords(null);
                }}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-black/50 border border-stone-800 text-[11px] font-mono text-amber-400 flex items-center justify-between">
              <span>Bounding Box: {pendingBoxCoords.width}% × {pendingBoxCoords.height}%</span>
              <span className="text-stone-400">Position: ({pendingBoxCoords.x}%, {pendingBoxCoords.y}%)</span>
            </div>

            {/* Quick Mineral Suggestions */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300">
                Quick Mineral Selection:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Chalcopyrite (CuFeS₂)', mineral: 'Chalcopyrite', color: '#F59E0B' },
                  { name: 'Spodumene Megacryst', mineral: 'Spodumene', color: '#EC4899' },
                  { name: 'Pyrite Cube (FeS₂)', mineral: 'Pyrite', color: '#EAB308' },
                  { name: 'Native Gold Grain (Au)', mineral: 'Gold', color: '#FBBF24' },
                  { name: 'Malachite Coating', mineral: 'Malachite', color: '#10B981' },
                  { name: 'Quartz Alteration Vein', mineral: 'Quartz', color: '#9333EA' },
                  { name: 'Specular Hematite', mineral: 'Hematite', color: '#EF4444' },
                  { name: 'Bornite (Peacock Ore)', mineral: 'Bornite', color: '#3B82F6' },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setAnnotationLabel(item.name);
                      setAnnotationMineral(item.mineral);
                      setAnnotationColor(item.color);
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                      annotationMineral === item.mineral
                        ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                        : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Sample Target Label:
                </label>
                <input
                  type="text"
                  value={annotationLabel}
                  onChange={(e) => setAnnotationLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-500"
                  placeholder="e.g., Chalcopyrite Grain Cluster"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Primary Mineral / Phase:
                  </label>
                  <input
                    type="text"
                    value={annotationMineral}
                    onChange={(e) => setAnnotationMineral(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g., Chalcopyrite"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Confidence: {Math.round(annotationConfidence * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={annotationConfidence}
                    onChange={(e) => setAnnotationConfidence(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Geological / Petrographic Description:
                </label>
                <textarea
                  value={annotationDescription}
                  onChange={(e) => setAnnotationDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs focus:outline-none focus:border-amber-500 resize-none"
                  placeholder="Notes on crystal habit, color, cleavage, alteration selvage..."
                />
              </div>

              {/* Color Outline Picker */}
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1.5">
                  Annotation Box Color:
                </label>
                <div className="flex items-center gap-2">
                  {['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#9333EA', '#EF4444', '#06B6D4'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAnnotationColor(col)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        annotationColor === col ? 'ring-2 ring-white scale-125' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                onClick={() => {
                  setShowAnnotationModal(false);
                  setPendingBoxCoords(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveUserAnnotation}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold shadow-lg transition-all"
              >
                Save Annotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
