import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { DrillHole, DrillInterval } from '../types';
import {
  RotateCcw,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Flame,
  Activity,
  Play,
  Pause,
  HelpCircle
} from 'lucide-react';

interface DrillHole3DVisualizerR3FProps {
  drillhole: DrillHole;
  allDrillholes?: DrillHole[];
  onSelectInterval?: (interval: DrillInterval, index: number) => void;
  selectedIntervalIndex?: number | null;
}

// Convert lithology name to color
const getLithologyColor = (lithology: string): string => {
  const lower = (lithology || '').toLowerCase();
  if (lower.includes('quartz') || lower.includes('breccia') || lower.includes('pegmatite')) return '#f59e0b'; // Gold / amber
  if (lower.includes('basalt') || lower.includes('gabbro')) return '#334155'; // Dark slate
  if (lower.includes('andesite') || lower.includes('diorite')) return '#059669'; // Emerald
  if (lower.includes('granite') || lower.includes('rhyolite')) return '#ec4899'; // Pinkish
  if (lower.includes('sulfide') || lower.includes('chalcopyrite')) return '#e11d48'; // High grade red
  if (lower.includes('sediment') || lower.includes('shale')) return '#854d0e'; // Brown
  if (lower.includes('skarn') || lower.includes('limestone')) return '#0284c7'; // Cyan blue
  return '#64748b'; // default slate
};

// Helper for depths and grades across DrillInterval shape
const getFromDepth = (interval: DrillInterval): number => {
  return interval.fromDepthM !== undefined ? interval.fromDepthM : interval.from;
};

const getToDepth = (interval: DrillInterval): number => {
  return interval.toDepthM !== undefined ? interval.toDepthM : interval.to;
};

const getGoldGrade = (interval: DrillInterval): number | undefined => {
  if (interval.assayAuGpt !== undefined) return interval.assayAuGpt;
  if (interval.primaryGradeValue !== undefined && interval.gradeUnit?.toLowerCase().includes('g/t')) {
    return interval.primaryGradeValue;
  }
  return undefined;
};

const getCopperGrade = (interval: DrillInterval): number | undefined => {
  if (interval.assayCuPct !== undefined) return interval.assayCuPct;
  if (interval.primaryGradeValue !== undefined && interval.gradeUnit?.includes('%')) {
    return interval.primaryGradeValue;
  }
  return undefined;
};

// Visualized single borehole cylinder segment
const StrataIntervalMesh: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  interval: DrillInterval;
  index: number;
  isSelected: boolean;
  coreRadius: number;
  onSelect?: () => void;
  showGradeGlow: boolean;
}> = ({ start, end, interval, index, isSelected, coreRadius, onSelect, showGradeGlow }) => {
  const [hovered, setHovered] = useState(false);

  const { position, quaternion, height } = useMemo(() => {
    const vStart = new THREE.Vector3(...start);
    const vEnd = new THREE.Vector3(...end);
    const dir = new THREE.Vector3().subVectors(vEnd, vStart);
    const len = dir.length();
    const midpoint = new THREE.Vector3().addVectors(vStart, vEnd).multiplyScalar(0.5);

    // Orientation: Cylinder default orientation is along Y-axis
    const yAxis = new THREE.Vector3(0, 1, 0);
    const normDir = dir.clone().normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(yAxis, normDir);

    return {
      position: [midpoint.x, midpoint.y, midpoint.z] as [number, number, number],
      quaternion: quat,
      height: Math.max(len, 0.2)
    };
  }, [start, end]);

  const fromM = getFromDepth(interval);
  const toM = getToDepth(interval);
  const auGrade = getGoldGrade(interval);
  const cuGrade = getCopperGrade(interval);
  const baseColor = useMemo(() => interval.color || getLithologyColor(interval.lithology), [interval]);
  const hasHighGrade = (auGrade || 0) > 1.5 || (cuGrade || 0) > 1.0 || (interval.assayLiPct || 0) > 1.2;

  return (
    <group position={position} quaternion={quaternion}>
      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelect) onSelect();
        }}
      >
        <cylinderGeometry
          args={[
            coreRadius * (isSelected ? 1.4 : hovered ? 1.25 : 1),
            coreRadius * (isSelected ? 1.4 : hovered ? 1.25 : 1),
            height,
            24
          ]}
        />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : hovered ? '#fbbf24' : baseColor}
          roughness={0.35}
          metalness={hasHighGrade ? 0.6 : 0.2}
          emissive={isSelected ? '#0284c7' : showGradeGlow && hasHighGrade ? '#b45309' : '#000000'}
          emissiveIntensity={isSelected ? 0.7 : showGradeGlow && hasHighGrade ? 0.5 : 0}
        />
      </mesh>

      {/* Hover or Selected HTML Tooltip floating in 3D */}
      {(hovered || isSelected) && (
        <Html distanceFactor={25} position={[coreRadius + 0.5, 0, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/95 border border-cyan-500/40 backdrop-blur-md px-3 py-2 rounded-lg shadow-2xl text-xs min-w-[160px] text-white pointer-events-none">
            <div className="flex items-center justify-between font-bold text-cyan-400 mb-1 border-b border-slate-700/60 pb-1">
              <span>{interval.lithology}</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded">
                #{index + 1}
              </span>
            </div>
            <div className="space-y-0.5 text-slate-300 text-[11px]">
              <div>Depth: {fromM}m – {toM}m ({(toM - fromM).toFixed(1)}m)</div>
              {auGrade !== undefined && (
                <div className="text-amber-400 font-semibold">Au Grade: {auGrade} g/t</div>
              )}
              {cuGrade !== undefined && (
                <div className="text-emerald-400 font-semibold">Cu Grade: {cuGrade} %</div>
              )}
              {interval.assayLiPct !== undefined && (
                <div className="text-purple-400 font-semibold">Li2O Grade: {interval.assayLiPct} %</div>
              )}
              {interval.rqdPercent !== undefined && (
                <div className="text-slate-400">RQD: {interval.rqdPercent}%</div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Collar beacon component at surface
const CollarBeacon: React.FC<{
  position: [number, number, number];
  holeId: string;
  isMain: boolean;
}> = ({ position, holeId, isMain }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Surface marker ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.7, 32]} />
        <meshBasicMaterial color={isMain ? '#38bdf8' : '#94a3b8'} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      {/* Beacon vertical pin */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 1.6, 12]} />
        <meshStandardMaterial color={isMain ? '#0284c7' : '#64748b'} emissive={isMain ? '#0284c7' : '#000'} emissiveIntensity={0.5} />
      </mesh>
      {/* Collar top sphere */}
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={isMain ? '#38bdf8' : '#cbd5e1'} emissive={isMain ? '#38bdf8' : '#64748b'} emissiveIntensity={0.8} />
      </mesh>
      {/* 3D collar label */}
      <Html position={[0, 2.2, 0]} center distanceFactor={30}>
        <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap shadow-lg border ${
          isMain ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200' : 'bg-slate-900/80 border-slate-700 text-slate-300'
        }`}>
          {holeId}
        </div>
      </Html>
    </group>
  );
};

// 3D Geological Strata Horizons
const GeologicalStrataHorizon: React.FC<{
  depth: number;
  color: string;
  label: string;
  radius: number;
}> = ({ depth, color, label, radius }) => {
  return (
    <group position={[0, -depth, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[radius * 2, radius * 2, 1, 1]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Boundary ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.2, radius, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <Html position={[radius, 0, 0]} distanceFactor={35}>
        <div className="bg-slate-900/80 border border-slate-700 text-[9px] text-slate-300 font-mono px-1.5 py-0.5 rounded">
          {label} (-{depth.toFixed(0)}m)
        </div>
      </Html>
    </group>
  );
};

// Full Hole 3D Model
const DrillHole3DMesh: React.FC<{
  hole: DrillHole;
  isMain: boolean;
  vertExaggeration: number;
  coreRadius: number;
  selectedIntervalIndex?: number | null;
  onSelectInterval?: (interval: DrillInterval, index: number) => void;
  showGradeGlow: boolean;
}> = ({ hole, isMain, vertExaggeration, coreRadius, selectedIntervalIndex, onSelectInterval, showGradeGlow }) => {
  // Compute 3D points along path based on dip & azimuth
  const segments = useMemo(() => {
    const dip = hole.dipDeg !== undefined ? hole.dipDeg : -90;
    const azimuth = hole.azimuthDeg !== undefined ? hole.azimuthDeg : 0;
    const dipRad = (dip * Math.PI) / 180;
    const azRad = (azimuth * Math.PI) / 180;

    const cosDip = Math.cos(dipRad);
    const sinDip = Math.sin(dipRad);
    const dxMeter = Math.cos(azRad) * cosDip;
    const dzMeter = Math.sin(azRad) * cosDip;
    const dyMeter = sinDip * vertExaggeration;

    // Collar positioning offset from Easting/Northing or lat/lng
    const collarX = hole.collarEasting ? (hole.collarEasting % 1000) * 0.1 : 0;
    const collarZ = hole.collarNorthing ? (hole.collarNorthing % 1000) * 0.1 : 0;
    const collarY = 0;

    const intervals = hole.intervals || [];
    return intervals.map((interval, idx) => {
      const startDepth = getFromDepth(interval);
      const endDepth = getToDepth(interval);

      const startPos: [number, number, number] = [
        collarX + dxMeter * startDepth,
        collarY + dyMeter * startDepth,
        collarZ + dzMeter * startDepth
      ];

      const endPos: [number, number, number] = [
        collarX + dxMeter * endDepth,
        collarY + dyMeter * endDepth,
        collarZ + dzMeter * endDepth
      ];

      return {
        interval,
        index: idx,
        startPos,
        endPos
      };
    });
  }, [hole, vertExaggeration]);

  const collarPos: [number, number, number] = useMemo(() => {
    return [
      hole.collarEasting ? (hole.collarEasting % 1000) * 0.1 : 0,
      0,
      hole.collarNorthing ? (hole.collarNorthing % 1000) * 0.1 : 0
    ];
  }, [hole]);

  return (
    <group>
      <CollarBeacon position={collarPos} holeId={hole.holeId} isMain={isMain} />

      {segments.map((seg) => (
        <StrataIntervalMesh
          key={`${hole.id || hole.holeId}-${seg.index}`}
          start={seg.startPos}
          end={seg.endPos}
          interval={seg.interval}
          index={seg.index}
          isSelected={isMain && selectedIntervalIndex === seg.index}
          coreRadius={coreRadius}
          showGradeGlow={showGradeGlow}
          onSelect={() => {
            if (onSelectInterval) {
              onSelectInterval(seg.interval, seg.index);
            }
          }}
        />
      ))}
    </group>
  );
};

// Scene Auto-Rotation Controller
const AutoRotatingScene: React.FC<{ isRotating: boolean; speed: number; children: React.ReactNode }> = ({
  isRotating,
  speed,
  children
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (isRotating && groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

export const DrillHole3DVisualizerR3F: React.FC<DrillHole3DVisualizerR3FProps> = ({
  drillhole,
  allDrillholes = [],
  onSelectInterval,
  selectedIntervalIndex
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [rotationSpeed] = useState(0.3);
  const [vertExaggeration, setVertExaggeration] = useState(1.2);
  const [coreRadius, setCoreRadius] = useState(0.4);
  const [showAllHoles, setShowAllHoles] = useState(true);
  const [showStrataHorizons, setShowStrataHorizons] = useState(true);
  const [showGrid] = useState(true);
  const [showGradeGlow, setShowGradeGlow] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'top' | 'cross-section'>('perspective');
  const [infoOpen, setInfoOpen] = useState(false);

  const controlsRef = useRef<any>(null);

  // Switch camera views
  const applyCameraPreset = (preset: 'perspective' | 'top' | 'cross-section') => {
    setCameraPreset(preset);
    if (!controlsRef.current) return;

    if (preset === 'top') {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(0, 80, 0);
      controlsRef.current.target.set(0, -30, 0);
    } else if (preset === 'cross-section') {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(0, -25, 75);
      controlsRef.current.target.set(0, -25, 0);
    } else {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(35, 25, 45);
      controlsRef.current.target.set(0, -20, 0);
    }
    controlsRef.current.update();
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(35, 25, 45);
      controlsRef.current.target.set(0, -20, 0);
      controlsRef.current.update();
    }
  };

  // Derive unique horizon depths for the strata layer surfaces
  const strataHorizons = useMemo(() => {
    if (!drillhole.intervals || drillhole.intervals.length === 0) return [];
    return drillhole.intervals.slice(0, 4).map((interval) => ({
      depth: getToDepth(interval) * (vertExaggeration || 1),
      color: interval.color || getLithologyColor(interval.lithology),
      label: interval.lithology
    }));
  }, [drillhole, vertExaggeration]);

  const activeInterval = selectedIntervalIndex !== null && selectedIntervalIndex !== undefined && drillhole.intervals
    ? drillhole.intervals[selectedIntervalIndex]
    : null;

  return (
    <div
      className={`relative rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[620px] w-full'
      }`}
    >
      {/* Top HUD Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between p-3 bg-gradient-to-b from-slate-950/90 via-slate-950/70 to-transparent backdrop-blur-sm pointer-events-auto">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-lg text-cyan-300 font-mono text-xs shadow-md">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="font-bold">{drillhole.holeId}</span>
            <span className="text-slate-400">|</span>
            <span className="text-[11px] text-cyan-200">Depth: {drillhole.totalDepthM}m</span>
            <span className="text-slate-400">|</span>
            <span className="text-[11px] text-amber-300">Dip: {drillhole.dipDeg}°</span>
          </div>

          <div className="hidden md:flex items-center bg-slate-900/80 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => applyCameraPreset('perspective')}
              className={`px-2.5 py-1 rounded transition-colors ${
                cameraPreset === 'perspective' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Orbit
            </button>
            <button
              onClick={() => applyCameraPreset('top')}
              className={`px-2.5 py-1 rounded transition-colors ${
                cameraPreset === 'top' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Plan (Top)
            </button>
            <button
              onClick={() => applyCameraPreset('cross-section')}
              className={`px-2.5 py-1 rounded transition-colors ${
                cameraPreset === 'cross-section' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cross-Section
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Auto Rotation Toggle */}
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-all ${
              isAutoRotating
                ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title={isAutoRotating ? 'Pause Orbit' : 'Auto Rotate Orbit'}
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline text-[11px]">{isAutoRotating ? 'Pause' : 'Auto-Orbit'}</span>
          </button>

          {/* Strata Horizons Toggle */}
          <button
            onClick={() => setShowStrataHorizons(!showStrataHorizons)}
            className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-all ${
              showStrataHorizons
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Strata Horizon Planes"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Strata Planes</span>
          </button>

          {/* Multi-borehole Toggle */}
          {allDrillholes.length > 1 && (
            <button
              onClick={() => setShowAllHoles(!showAllHoles)}
              className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-all ${
                showAllHoles
                  ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Show adjacent borehole field"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Field ({allDrillholes.length})</span>
            </button>
          )}

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Quick Help */}
          <button
            onClick={() => setInfoOpen(!infoOpen)}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
            title="Visualizer instructions"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ position: [35, 25, 45], fov: 45, near: 0.1, far: 1000 }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[30, 50, 30]} intensity={1.5} castShadow />
          <pointLight position={[-20, 20, -20]} intensity={0.6} color="#38bdf8" />
          <pointLight position={[0, -50, 0]} intensity={0.4} color="#f59e0b" />

          {/* Auto-rotating scene wrapper */}
          <AutoRotatingScene isRotating={isAutoRotating} speed={rotationSpeed}>
            {/* Surface Reference Grid */}
            {showGrid && (
              <Grid
                args={[120, 120]}
                cellSize={5}
                cellThickness={0.7}
                cellColor="#334155"
                sectionSize={25}
                sectionThickness={1.2}
                sectionColor="#0284c7"
                fadeDistance={100}
                fadeStrength={1}
                position={[0, 0, 0]}
              />
            )}

            {/* Geological Strata Horizons */}
            {showStrataHorizons &&
              strataHorizons.map((sh, idx) => (
                <GeologicalStrataHorizon
                  key={`horizon-${idx}`}
                  depth={sh.depth}
                  color={sh.color}
                  label={sh.label}
                  radius={28}
                />
              ))}

            {/* Target Borehole 3D Path */}
            <DrillHole3DMesh
              hole={drillhole}
              isMain={true}
              vertExaggeration={vertExaggeration}
              coreRadius={coreRadius}
              selectedIntervalIndex={selectedIntervalIndex}
              onSelectInterval={onSelectInterval}
              showGradeGlow={showGradeGlow}
            />

            {/* Adjacent Boreholes in exploration field */}
            {showAllHoles &&
              allDrillholes
                .filter((h) => (h.id || h.holeId) !== (drillhole.id || drillhole.holeId))
                .map((adjHole) => (
                  <DrillHole3DMesh
                    key={adjHole.id || adjHole.holeId}
                    hole={adjHole}
                    isMain={false}
                    vertExaggeration={vertExaggeration}
                    coreRadius={coreRadius * 0.75}
                    showGradeGlow={showGradeGlow}
                  />
                ))}
          </AutoRotatingScene>

          {/* Interactive Controls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            minDistance={5}
            maxDistance={250}
            maxPolarAngle={Math.PI / 2 + 0.3}
          />

          {/* Orientation Gizmo */}
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ef4444', '#10b981', '#3b82f6']} labelColor="#ffffff" />
          </GizmoHelper>
        </Canvas>
      </div>

      {/* Floating Bottom Sliders & Settings Drawer */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3 py-2 rounded-xl text-xs text-slate-300 shadow-xl">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-mono">Vert Exaggeration:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={vertExaggeration}
              onChange={(e) => setVertExaggeration(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="font-mono text-cyan-300 text-[11px] w-6">{vertExaggeration}x</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-400 font-mono">Core Diameter:</span>
            <input
              type="range"
              min="0.15"
              max="1.2"
              step="0.05"
              value={coreRadius}
              onChange={(e) => setCoreRadius(parseFloat(e.target.value))}
              className="w-16 accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          <button
            onClick={() => setShowGradeGlow(!showGradeGlow)}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
              showGradeGlow
                ? 'bg-amber-950/80 border-amber-600/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>Assay Glow</span>
          </button>
        </div>

        {/* Selected Interval Callout Details Card */}
        {activeInterval && (
          <div className="bg-slate-900/95 border border-cyan-500/50 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-2xl text-xs text-white max-w-sm flex items-center space-x-3">
            <div
              className="w-3.5 h-10 rounded-full border border-white/20 shrink-0"
              style={{ backgroundColor: activeInterval.color || getLithologyColor(activeInterval.lithology) }}
            />
            <div className="min-w-0">
              <div className="font-bold text-cyan-300 truncate">
                {activeInterval.lithology}
                <span className="font-normal text-slate-400 ml-1.5 text-[11px]">
                  ({getFromDepth(activeInterval)}m – {getToDepth(activeInterval)}m)
                </span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center space-x-3 mt-0.5">
                {getGoldGrade(activeInterval) !== undefined && (
                  <span className="text-amber-400 font-mono font-medium">Au: {getGoldGrade(activeInterval)} g/t</span>
                )}
                {getCopperGrade(activeInterval) !== undefined && (
                  <span className="text-emerald-400 font-mono font-medium">Cu: {getCopperGrade(activeInterval)}%</span>
                )}
                {activeInterval.assayLiPct !== undefined && (
                  <span className="text-purple-400 font-mono font-medium">Li2O: {activeInterval.assayLiPct}%</span>
                )}
                {activeInterval.alteration && (
                  <span className="text-slate-400 truncate">{activeInterval.alteration}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info / Navigation Help Modal */}
      {infoOpen && (
        <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-5 max-w-md w-full shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <h4 className="font-bold text-cyan-300 text-sm flex items-center space-x-2">
                <Compass className="w-4 h-4" />
                <span>3D Drill Path Visualizer Guide</span>
              </h4>
              <button
                onClick={() => setInfoOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
              >
                Close
              </button>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Rotate Scene:</strong> Click and drag with primary mouse button or single-touch drag.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Pan Camera:</strong> Right-click and drag or two-finger drag.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Zoom:</strong> Scroll wheel or pinch-to-zoom gesture.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Inspect Strata:</strong> Click any interval cylinder on the 3D core to select it and view assays.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Auto-Orbit:</strong> Enables continuous turntable rotation around borehole azimuth.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
