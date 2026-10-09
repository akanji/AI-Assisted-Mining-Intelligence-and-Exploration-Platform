import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { DrillHole, DrillInterval } from '../types';
import {
  RotateCcw,
  Layers,
  Eye,
  Camera,
  Compass,
  Maximize2,
  ZoomIn,
  Sliders,
  Sparkles,
  Info,
  CheckCircle,
  HelpCircle,
  Activity,
  Play,
  Pause,
  Box,
  MapPin,
  Flame,
  Download,
} from 'lucide-react';

// Lithology colors palette for 3D PBR materials
const LITHOLOGY_COLORS: Record<string, { color: string; emissive?: string; roughness: number; metalness: number }> = {
  'Glacial Till & Overburden': { color: '#92400e', roughness: 0.9, metalness: 0.1 },
  'Overburden': { color: '#92400e', roughness: 0.9, metalness: 0.1 },
  'Quartz-Feldspar Porphyry': { color: '#9333ea', emissive: '#3b0764', roughness: 0.4, metalness: 0.3 },
  'Quartz-Carbonate Vein Stockwork': { color: '#f59e0b', emissive: '#78350f', roughness: 0.3, metalness: 0.4 },
  'Mineralized Quartz Vein (Au)': { color: '#eab308', emissive: '#ca8a04', roughness: 0.2, metalness: 0.6 },
  'Sheared Timiskaming Conglomerate': { color: '#52525b', roughness: 0.8, metalness: 0.2 },
  'Pillowed Tholeiitic Basalt': { color: '#059669', roughness: 0.7, metalness: 0.2 },
  'Mafic Volcanics': { color: '#047857', roughness: 0.7, metalness: 0.2 },
  'Spodumene Pegmatite Dyke': { color: '#db2777', emissive: '#831843', roughness: 0.3, metalness: 0.4 },
  'Argillic Siltstone': { color: '#475569', roughness: 0.85, metalness: 0.1 },
  'Carbonaceous Shale': { color: '#1e293b', roughness: 0.9, metalness: 0.1 },
  'Decalcified Silty Limestone': { color: '#0284c7', roughness: 0.6, metalness: 0.2 },
  'Jasperoid Alteration Zone': { color: '#dc2626', emissive: '#7f1d1d', roughness: 0.4, metalness: 0.3 },
  'Biotite-Granite Footwall': { color: '#ea580c', roughness: 0.5, metalness: 0.3 },
};

const DEFAULT_LITHO_MATERIAL = { color: '#7c3aed', roughness: 0.5, metalness: 0.2 };

interface DrillHole3DVisualizerR3FProps {
  selectedHole: DrillHole;
  allDrillholes?: DrillHole[];
  onSelectHole?: (hole: DrillHole) => void;
  className?: string;
}

// Convert downhole depth and survey (Dip/Azimuth) to 3D Cartesian coordinates
function calculateTrajectoryPoint(
  depth: number,
  dipDeg: number,
  azimuthDeg: number,
  verticalExaggeration: number,
  collarOffset: [number, number, number] = [0, 0, 0]
): THREE.Vector3 {
  // Dip in mining is measured downwards from horizontal:
  // e.g. Dip = -60 deg (or 60 deg downwards).
  const dipAbs = Math.abs(dipDeg);
  const dipRad = (dipAbs * Math.PI) / 180;
  const azRad = (azimuthDeg * Math.PI) / 180;

  // Horizontal travel
  const horizontalDist = depth * Math.cos(dipRad);
  const dx = horizontalDist * Math.sin(azRad);
  const dz = horizontalDist * Math.cos(azRad);
  const dy = -depth * Math.sin(dipRad) * verticalExaggeration;

  return new THREE.Vector3(collarOffset[0] + dx, collarOffset[1] + dy, collarOffset[2] + dz);
}

// 3D Core Segment Mesh Component
interface CoreIntervalMeshProps {
  interval: DrillInterval;
  holeDip: number;
  holeAzimuth: number;
  coreRadius: number;
  verticalExaggeration: number;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (hover: boolean) => void;
  onSelect: () => void;
  collarOffset?: [number, number, number];
}

const CoreIntervalMesh: React.FC<CoreIntervalMeshProps> = ({
  interval,
  holeDip,
  holeAzimuth,
  coreRadius,
  verticalExaggeration,
  isSelected,
  isHovered,
  onHover,
  onSelect,
  collarOffset = [0, 0, 0],
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // Compute start, end and midpoint vectors
  const { pStart, pEnd, pMid, length, orientationQuaternion } = useMemo(() => {
    const start = calculateTrajectoryPoint(interval.fromDepth, holeDip, holeAzimuth, verticalExaggeration, collarOffset);
    const end = calculateTrajectoryPoint(interval.toDepth, holeDip, holeAzimuth, verticalExaggeration, collarOffset);

    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();

    // Orientation: Cylinder default orientation is along Y-axis (0, 1, 0)
    const normalizedDir = dir.clone().normalize();
    const upAxis = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(upAxis, normalizedDir);

    return {
      pStart: start,
      pEnd: end,
      pMid: mid,
      length: len,
      orientationQuaternion: quat,
    };
  }, [interval.fromDepth, interval.toDepth, holeDip, holeAzimuth, verticalExaggeration, collarOffset]);

  // Determine material properties
  const lithoMat = LITHOLOGY_COLORS[interval.lithology] || DEFAULT_LITHO_MATERIAL;

  // Grade boost for economic intercepts
  const isHighGrade = (interval.assayAuGpt && interval.assayAuGpt > 2) || (interval.assayLiPct && interval.assayLiPct > 1.2);

  const radius = coreRadius * (isSelected ? 1.45 : isHovered ? 1.25 : 1.0);

  return (
    <group position={pMid} quaternion={orientationQuaternion}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
        }}
        onPointerOut={() => onHover(false)}
      >
        <cylinderGeometry args={[radius, radius, Math.max(0.2, length), 24]} />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : isHovered ? '#fbbf24' : lithoMat.color}
          emissive={
            isSelected
              ? '#0284c7'
              : isHovered
              ? '#d97706'
              : isHighGrade
              ? lithoMat.emissive || '#ca8a04'
              : '#000000'
          }
          emissiveIntensity={isSelected ? 0.6 : isHovered ? 0.8 : isHighGrade ? 0.5 : 0.05}
          roughness={lithoMat.roughness}
          metalness={lithoMat.metalness}
        />
      </mesh>

      {/* Interval Callout Badge when selected or hovered */}
      {(isSelected || isHovered) && (
        <Html position={[radius * 2, 0, 0]} distanceFactor={35} center>
          <div className="bg-stone-900/95 border border-amber-400 text-stone-100 p-2 rounded-lg shadow-xl text-xs backdrop-blur-md pointer-events-none whitespace-nowrap min-w-[160px]">
            <div className="font-bold text-amber-400 flex items-center justify-between gap-2">
              <span>{interval.lithology}</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                {interval.fromDepth}m - {interval.toDepth}m
              </span>
            </div>
            {interval.assayAuGpt !== undefined && (
              <div className="text-[11px] text-yellow-300 mt-1">Au: {interval.assayAuGpt} g/t</div>
            )}
            {interval.assayLiPct !== undefined && (
              <div className="text-[11px] text-pink-300 mt-1">Li₂O: {interval.assayLiPct}%</div>
            )}
            {interval.rqdPercent !== undefined && (
              <div className="text-[10px] text-stone-400">RQD: {interval.rqdPercent}% | Rec: {interval.recoveryPercent || 95}%</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// 3D Borehole Full Assembly
interface BoreholeRigProps {
  drillhole: DrillHole;
  isSelectedHole: boolean;
  selectedInterval: DrillInterval | null;
  hoveredInterval: DrillInterval | null;
  onSelectInterval: (interval: DrillInterval) => void;
  onHoverInterval: (interval: DrillInterval | null) => void;
  onSelectHole?: (hole: DrillHole) => void;
  coreRadius: number;
  verticalExaggeration: number;
  showDepthMarkers: boolean;
  collarOffset?: [number, number, number];
}

const BoreholeRig: React.FC<BoreholeRigProps> = ({
  drillhole,
  isSelectedHole,
  selectedInterval,
  hoveredInterval,
  onSelectInterval,
  onHoverInterval,
  onSelectHole,
  coreRadius,
  verticalExaggeration,
  showDepthMarkers,
  collarOffset = [0, 0, 0],
}) => {
  const collarPos = useMemo(() => new THREE.Vector3(...collarOffset), [collarOffset]);
  const endPos = useMemo(
    () => calculateTrajectoryPoint(drillhole.totalDepthM, drillhole.dip, drillhole.azimuth, verticalExaggeration, collarOffset),
    [drillhole.totalDepthM, drillhole.dip, drillhole.azimuth, verticalExaggeration, collarOffset]
  );

  // Depth calipers every 50m
  const depthTicks = useMemo(() => {
    const ticks: number[] = [];
    const intervalM = 50;
    for (let d = intervalM; d <= drillhole.totalDepthM; d += intervalM) {
      ticks.push(d);
    }
    return ticks;
  }, [drillhole.totalDepthM]);

  return (
    <group>
      {/* Collar Beacon */}
      <group position={collarPos}>
        {/* Collar Survey Cone / Pin */}
        <mesh position={[0, 0.8, 0]}>
          <coneGeometry args={[0.7, 1.6, 16]} />
          <meshStandardMaterial
            color={isSelectedHole ? '#f59e0b' : '#38bdf8'}
            emissive={isSelectedHole ? '#d97706' : '#0284c7'}
            emissiveIntensity={0.6}
          />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.1, 24]} />
          <meshStandardMaterial color="#64748b" roughness={0.8} />
        </mesh>

        {/* Collar Label */}
        <Html position={[0, 2.4, 0]} distanceFactor={30} center>
          <div
            onClick={() => onSelectHole && onSelectHole(drillhole)}
            className={`cursor-pointer px-2.5 py-1 rounded-md text-[11px] font-bold border shadow-lg transition-transform hover:scale-110 ${
              isSelectedHole
                ? 'bg-amber-500 text-stone-950 border-amber-300 font-extrabold'
                : 'bg-stone-900/90 text-stone-200 border-stone-700'
            }`}
          >
            {drillhole.holeId} ({drillhole.totalDepthM}m)
          </div>
        </Html>
      </group>

      {/* Trajectory Guide Line */}
      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(geo) => {
            geo.setFromPoints([collarPos, endPos]);
          }}
        />
        <lineBasicMaterial
          attach="material"
          color={isSelectedHole ? '#fbbf24' : '#64748b'}
          linewidth={2}
          transparent
          opacity={0.6}
        />
      </line>

      {/* Core Lithology Intervals */}
      {drillhole.intervals.map((interval, idx) => (
        <CoreIntervalMesh
          key={`${drillhole.holeId}-int-${idx}`}
          interval={interval}
          holeDip={drillhole.dip}
          holeAzimuth={drillhole.azimuth}
          coreRadius={coreRadius}
          verticalExaggeration={verticalExaggeration}
          isSelected={selectedInterval?.fromDepth === interval.fromDepth && selectedInterval?.toDepth === interval.toDepth && isSelectedHole}
          isHovered={hoveredInterval?.fromDepth === interval.fromDepth && hoveredInterval?.toDepth === interval.toDepth}
          onHover={(hover) => onHoverInterval(hover ? interval : null)}
          onSelect={() => {
            if (onSelectHole && !isSelectedHole) onSelectHole(drillhole);
            onSelectInterval(interval);
          }}
          collarOffset={collarOffset}
        />
      ))}

      {/* End of Hole (EOH) Marker */}
      <group position={endPos}>
        <mesh>
          <sphereGeometry args={[coreRadius * 1.5, 16, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.6} />
        </mesh>
        <Html position={[0, -1.2, 0]} distanceFactor={35} center>
          <div className="bg-rose-950/90 border border-rose-500 text-rose-200 text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
            EOH: {drillhole.totalDepthM}m
          </div>
        </Html>
      </group>

      {/* Depth Calipers / Tick Marks along trajectory */}
      {showDepthMarkers &&
        depthTicks.map((d) => {
          const tickPos = calculateTrajectoryPoint(d, drillhole.dip, drillhole.azimuth, verticalExaggeration, collarOffset);
          return (
            <group key={`tick-${d}`} position={tickPos}>
              <mesh>
                <ringGeometry args={[coreRadius * 1.1, coreRadius * 1.6, 16]} />
                <meshBasicMaterial color="#e2e8f0" side={THREE.DoubleSide} transparent opacity={0.6} />
              </mesh>
              <Html position={[coreRadius * 2.2, 0, 0]} distanceFactor={40} center>
                <div className="text-[9px] font-mono font-bold bg-stone-900/80 text-stone-300 px-1 py-0.5 rounded border border-stone-700 pointer-events-none whitespace-nowrap">
                  {d}m
                </div>
              </Html>
            </group>
          );
        })}
    </group>
  );
};

// 3D Geological Strata Horizon Planes
interface StrataHorizonsProps {
  showHorizons: boolean;
  opacity: number;
  verticalExaggeration: number;
  boundsRadius: number;
}

const StrataHorizons: React.FC<StrataHorizonsProps> = ({
  showHorizons,
  opacity,
  verticalExaggeration,
  boundsRadius,
}) => {
  if (!showHorizons) return null;

  const width = Math.max(80, boundsRadius * 2.4);

  // Depth horizons typical in the mining camp:
  // 1. Overburden interface at -15m
  // 2. Main Mineralized shear zone contact at -90m
  // 3. Footwall contact at -180m
  const horizons = [
    { name: 'Overburden Base Contact', depth: 15, color: '#b45309', label: 'Overburden Contact (-15m)' },
    { name: 'Mineralized Shear Horizon', depth: 95, color: '#f59e0b', label: 'Au-Li Mineralized Horizon (-95m)' },
    { name: 'Footwall Bedrock Contact', depth: 190, color: '#047857', label: 'Footwall Mafic Contact (-190m)' },
  ];

  return (
    <group>
      {horizons.map((h, i) => {
        const y = -h.depth * verticalExaggeration;
        return (
          <group key={`horizon-${i}`} position={[0, y, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width, width, 12, 12]} />
              <meshStandardMaterial
                color={h.color}
                transparent
                opacity={opacity * 0.35}
                wireframe={false}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[width, width, 8, 8]} />
              <meshBasicMaterial
                color={h.color}
                wireframe
                transparent
                opacity={opacity * 0.25}
              />
            </mesh>
            {/* Horizon Label */}
            <Html position={[-width / 2 + 5, 0.5, -width / 2 + 5]} distanceFactor={45}>
              <div className="bg-stone-900/90 border border-stone-600 text-stone-300 text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                {h.label}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};

// Auto-rotator helper component
function AutoRotateController({ enabled, speed = 0.5 }: { enabled: boolean; speed?: number }) {
  useFrame((_, delta) => {
    // Rotation is typically handled smoothly via OrbitControls autoRotate property
  });
  return null;
}

export const DrillHole3DVisualizerR3F: React.FC<DrillHole3DVisualizerR3FProps> = ({
  selectedHole,
  allDrillholes = [selectedHole],
  onSelectHole,
  className = '',
}) => {
  // Visualizer settings state
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(1.0);
  const [coreRadius, setCoreRadius] = useState<number>(0.8);
  const [showDepthMarkers, setShowDepthMarkers] = useState<boolean>(true);
  const [showStrataHorizons, setShowStrataHorizons] = useState<boolean>(true);
  const [strataOpacity, setStrataOpacity] = useState<number>(0.65);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [selectedInterval, setSelectedInterval] = useState<DrillInterval | null>(
    selectedHole.intervals[0] || null
  );
  const [hoveredInterval, setHoveredInterval] = useState<DrillInterval | null>(null);

  const controlsRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Compute spatial bounds for multi-hole layout
  const holesWithCoordinates = useMemo(() => {
    // If holes have UTM or collar coordinates, calculate relative collar offsets
    const baseEasting = selectedHole.collarEasting || 0;
    const baseNorthing = selectedHole.collarNorthing || 0;
    const baseElev = selectedHole.collarElevationM || 0;

    return allDrillholes.map((hole, index) => {
      let x = 0;
      let z = 0;
      let y = 0;

      if (hole.collarEasting && baseEasting) {
        x = (hole.collarEasting - baseEasting) * 0.2; // scale for visualization viewport
        z = ((hole.collarNorthing || 0) - baseNorthing) * 0.2;
        y = ((hole.collarElevationM || 0) - baseElev) * 0.2;
      } else {
        // Space them in a grid if coordinates are not fully defined
        const col = index % 3;
        const row = Math.floor(index / 3);
        x = (col - 1) * 35;
        z = (row - 1) * 35;
      }

      return {
        hole,
        offset: [x, y, z] as [number, number, number],
      };
    });
  }, [allDrillholes, selectedHole]);

  // Camera presets
  const handleSetCameraPreset = (preset: 'iso' | 'sectionEW' | 'sectionNS' | 'plan' | 'collar') => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const target = new THREE.Vector3(0, -selectedHole.totalDepthM * 0.4 * verticalExaggeration, 0);

    controls.target.copy(target);

    switch (preset) {
      case 'iso':
        controls.object.position.set(60, 40, 80);
        break;
      case 'sectionEW':
        // Looking North: X vs Y
        controls.object.position.set(0, target.y, 110);
        break;
      case 'sectionNS':
        // Looking West: Z vs Y
        controls.object.position.set(110, target.y, 0);
        break;
      case 'plan':
        // Looking down from above
        controls.object.position.set(0, 130, 0);
        break;
      case 'collar':
        controls.target.set(0, 0, 0);
        controls.object.position.set(12, 10, 15);
        break;
    }
    controls.update();
  };

  // High-Resolution Snapshot Capture
  const handleCaptureSnapshot = () => {
    const canvas = document.querySelector('.r3f-canvas-container canvas') as HTMLCanvasElement;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `3D_Borehole_Visualizer_${selectedHole.holeId}_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (err) {
      console.warn('Unable to export snapshot canvas:', err);
    }
  };

  return (
    <div className={`relative flex flex-col bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden shadow-2xl ${className}`}>
      {/* Top Header & 3D Visualizer Control Bar */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-stone-900/90 border-b border-stone-800 gap-3 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400">
            <Box size={18} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                <span>3D Drill Path &amp; Geological Strata Visualizer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  React-Three-Fiber WebGL
                </span>
              </h3>
            </div>
            <p className="text-xs text-stone-400">
              Interactive 3D trajectory: Dip <span className="text-amber-400 font-mono">{selectedHole.dip}°</span> • Azimuth <span className="text-amber-400 font-mono">{selectedHole.azimuth}°</span> • EOH <span className="text-amber-400 font-mono">{selectedHole.totalDepthM}m</span>
            </p>
          </div>
        </div>

        {/* View mode toggle: Focus Borehole vs All Project Boreholes */}
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-700">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'single'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Focus: {selectedHole.holeId}
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>All Holes ({allDrillholes.length})</span>
            </button>
          </div>

          <button
            onClick={handleCaptureSnapshot}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-bold text-stone-200 transition-colors"
            title="Download high-resolution 3D PNG snapshot of geological strata"
          >
            <Download size={13} className="text-amber-400" />
            <span>3D PNG</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="relative w-full h-[620px] bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 r3f-canvas-container">
        <Canvas
          ref={canvasRef}
          camera={{ position: [60, 40, 80], fov: 45 }}
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* Lighting */}
          <ambientLight intensity={1.1} />
          <directionalLight position={[50, 80, 50]} intensity={1.8} castShadow />
          <directionalLight position={[-40, -50, -40]} intensity={0.6} color="#38bdf8" />
          <pointLight position={[0, 20, 0]} intensity={1.2} color="#fbbf24" distance={100} />

          {/* Subsurface Geological Grid */}
          {showGrid && (
            <Grid
              position={[0, 0, 0]}
              args={[120, 120]}
              cellSize={10}
              cellThickness={0.7}
              cellColor="#475569"
              sectionSize={50}
              sectionThickness={1.2}
              sectionColor="#f59e0b"
              fadeDistance={180}
              infiniteGrid={false}
            />
          )}

          {/* Geological Strata Horizon Planes */}
          <StrataHorizons
            showHorizons={showStrataHorizons}
            opacity={strataOpacity}
            verticalExaggeration={verticalExaggeration}
            boundsRadius={60}
          />

          {/* Borehole Rigs */}
          {viewMode === 'single' ? (
            <BoreholeRig
              drillhole={selectedHole}
              isSelectedHole={true}
              selectedInterval={selectedInterval}
              hoveredInterval={hoveredInterval}
              onSelectInterval={(inv) => setSelectedInterval(inv)}
              onHoverInterval={(inv) => setHoveredInterval(inv)}
              coreRadius={coreRadius}
              verticalExaggeration={verticalExaggeration}
              showDepthMarkers={showDepthMarkers}
            />
          ) : (
            holesWithCoordinates.map(({ hole, offset }) => (
              <BoreholeRig
                key={hole.holeId}
                drillhole={hole}
                isSelectedHole={hole.holeId === selectedHole.holeId}
                selectedInterval={selectedInterval}
                hoveredInterval={hoveredInterval}
                onSelectInterval={(inv) => setSelectedInterval(inv)}
                onHoverInterval={(inv) => setHoveredInterval(inv)}
                onSelectHole={onSelectHole}
                coreRadius={coreRadius}
                verticalExaggeration={verticalExaggeration}
                showDepthMarkers={showDepthMarkers}
                collarOffset={offset}
              />
            ))
          )}

          {/* Interactive Controls & Orientation Compass */}
          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate}
            autoRotateSpeed={0.8}
            enableDamping
            dampingFactor={0.06}
            minDistance={8}
            maxDistance={260}
          />

          <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
            <GizmoViewport axisColors={['#ef4444', '#10b981', '#3b82f6']} labelColor="#ffffff" />
          </GizmoHelper>
        </Canvas>

        {/* Floating Camera Presets Toolbar */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 bg-stone-900/90 p-2 rounded-xl border border-stone-800 shadow-xl backdrop-blur-md z-10">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-1">
            Camera Views
          </span>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => handleSetCameraPreset('iso')}
              className="px-2 py-1 text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 transition"
            >
              Isometric 3D
            </button>
            <button
              onClick={() => handleSetCameraPreset('sectionEW')}
              className="px-2 py-1 text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 transition"
            >
              Section E-W
            </button>
            <button
              onClick={() => handleSetCameraPreset('sectionNS')}
              className="px-2 py-1 text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 transition"
            >
              Section N-S
            </button>
            <button
              onClick={() => handleSetCameraPreset('plan')}
              className="px-2 py-1 text-[11px] font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 transition"
            >
              Plan (Top)
            </button>
          </div>
          <button
            onClick={() => handleSetCameraPreset('collar')}
            className="w-full mt-0.5 px-2 py-1 text-[11px] font-medium bg-stone-800/80 hover:bg-stone-700 text-amber-300 rounded border border-amber-500/30 transition flex items-center justify-center gap-1"
          >
            <MapPin size={11} /> Collar View
          </button>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`w-full mt-1 px-2 py-1 text-[11px] font-bold rounded border transition flex items-center justify-center gap-1 ${
              autoRotate
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
          >
            {autoRotate ? <Pause size={11} /> : <Play size={11} />}
            <span>{autoRotate ? 'Pause Orbit' : 'Auto Orbit'}</span>
          </button>
        </div>

        {/* 3D Geometry Sliders & Overlays Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 bg-stone-900/90 p-3 rounded-xl border border-stone-800 shadow-xl backdrop-blur-md z-10 w-64">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
            <span>3D Controls</span>
            <Sliders size={12} />
          </span>

          {/* Vertical Exaggeration */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-300">
              <span>Vertical Exaggeration</span>
              <span className="font-mono text-amber-400 font-bold">{verticalExaggeration.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.25"
              value={verticalExaggeration}
              onChange={(e) => setVerticalExaggeration(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Core Diameter */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-stone-300">
              <span>Core Diameter</span>
              <span className="font-mono text-amber-400 font-bold">{coreRadius.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.0"
              step="0.2"
              value={coreRadius}
              onChange={(e) => setCoreRadius(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-stone-800 space-y-1.5 text-xs">
            <label className="flex items-center justify-between text-stone-300 cursor-pointer">
              <span>Strata Horizons</span>
              <input
                type="checkbox"
                checked={showStrataHorizons}
                onChange={(e) => setShowStrataHorizons(e.target.checked)}
                className="rounded accent-amber-500 cursor-pointer"
              />
            </label>

            {showStrataHorizons && (
              <div className="pl-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>Horizons Opacity</span>
                  <span className="font-mono">{Math.round(strataOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={strataOpacity}
                  onChange={(e) => setStrataOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-stone-700 rounded appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            )}

            <label className="flex items-center justify-between text-stone-300 cursor-pointer">
              <span>Depth Calipers (50m)</span>
              <input
                type="checkbox"
                checked={showDepthMarkers}
                onChange={(e) => setShowDepthMarkers(e.target.checked)}
                className="rounded accent-amber-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-stone-300 cursor-pointer">
              <span>Surface Grid Plane</span>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded accent-amber-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Selected 3D Core Interval Inspector Card */}
        {selectedInterval && (
          <div className="absolute bottom-4 left-4 max-w-sm bg-stone-900/95 border border-amber-500/50 p-3.5 rounded-xl shadow-2xl backdrop-blur-md z-10 text-stone-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      LITHOLOGY_COLORS[selectedInterval.lithology]?.color || '#8b5cf6',
                  }}
                />
                <span className="font-bold text-xs text-stone-100">{selectedInterval.lithology}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {selectedInterval.fromDepth}m – {selectedInterval.toDepth}m ({(selectedInterval.toDepth - selectedInterval.fromDepth).toFixed(1)}m length)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-stone-950/60 p-2 rounded border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Primary Assay</span>
                <span className="font-mono font-bold text-amber-400">
                  {selectedInterval.assayAuGpt !== undefined
                    ? `${selectedInterval.assayAuGpt} g/t Au`
                    : selectedInterval.assayLiPct !== undefined
                    ? `${selectedInterval.assayLiPct}% Li₂O`
                    : `${selectedInterval.primaryGradeValue || 'N/A'} ${selectedInterval.gradeUnit || ''}`}
                </span>
              </div>
              <div className="bg-stone-950/60 p-2 rounded border border-stone-800">
                <span className="text-[10px] text-stone-400 block">Rock Quality (RQD)</span>
                <span className="font-mono font-bold text-cyan-400">
                  {selectedInterval.rqdPercent || 85}% (Rec: {selectedInterval.recoveryPercent || 96}%)
                </span>
              </div>
            </div>

            {selectedInterval.mineralization && (
              <div className="mt-2 text-[11px] text-stone-300 bg-stone-950/40 p-1.5 rounded border border-stone-800/80">
                <span className="text-stone-400 font-medium">Mineralization:</span>{' '}
                {selectedInterval.mineralization}
              </div>
            )}
            {selectedInterval.alteration && (
              <div className="mt-1 text-[11px] text-stone-400">
                <span className="text-stone-500 font-medium">Alteration:</span> {selectedInterval.alteration}
              </div>
            )}
          </div>
        )}

        {/* 3D Navigation Guide Tip */}
        <div className="absolute bottom-4 right-4 bg-stone-950/80 border border-stone-800 px-3 py-1.5 rounded-lg text-[10px] text-stone-400 backdrop-blur-sm pointer-events-none flex items-center gap-2">
          <span>Rotate: <strong className="text-stone-200">Left Click + Drag</strong></span>
          <span>•</span>
          <span>Pan: <strong className="text-stone-200">Right Click + Drag</strong></span>
          <span>•</span>
          <span>Zoom: <strong className="text-stone-200">Scroll</strong></span>
        </div>
      </div>

      {/* Geological Lithology Legend Bar */}
      <div className="p-3 bg-stone-900 border-t border-stone-800 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-stone-400 text-[11px] uppercase tracking-wider flex items-center gap-1">
          <Layers size={13} className="text-amber-400" />
          <span>Lithology 3D Legend:</span>
        </span>
        {Object.entries(LITHOLOGY_COLORS).slice(0, 7).map(([litho, props]) => (
          <div key={litho} className="flex items-center gap-1.5 bg-stone-950 px-2 py-1 rounded border border-stone-800">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: props.color }} />
            <span className="text-[11px] text-stone-300 truncate max-w-[140px]">{litho}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
