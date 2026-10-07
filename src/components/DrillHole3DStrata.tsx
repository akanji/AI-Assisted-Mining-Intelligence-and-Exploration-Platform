import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { DrillHole, DrillInterval } from '../types';
import {
  Flame,
  Layers,
  Sliders,
  Sparkles,
  Target,
  Activity,
  Compass,
  Eye,
} from 'lucide-react';

interface DrillHole3DStrataProps {
  drillholes: DrillHole[];
  selectedHole: DrillHole;
  onSelectHole: (hole: DrillHole) => void;
  initialShowHeatmap?: boolean;
}

export type HeatmapMetricMode = 'mineral_concentration' | 'bulk_density' | 'ore_density_tensor';
export type HeatmapColorPalette = 'inferno' | 'turbo' | 'viridis';

interface Voxel3DNode {
  id: string;
  worldX: number;
  depthM: number;
  worldY: number;
  worldZ: number;
  voxelWidth: number;
  voxelHeight: number;
  voxelDepth: number;
  bulkDensityGcm3: number;
  mineralConcentrationPct: number;
  tensorScore: number;
  normalizedValue: number;
  nearestHoleId: string;
  dominantLithology: string;
  dominantMineral: string;
}

// Color mapper for standard geological lithologies
const LITHOLOGY_COLORS: Record<string, { top: string; front: string; side: string; stroke: string }> = {
  'Glacial Till & Overburden': { top: '#b45309', front: '#92400e', side: '#78350f', stroke: '#d97706' },
  'Overburden': { top: '#b45309', front: '#92400e', side: '#78350f', stroke: '#d97706' },
  'Quartz-Feldspar Porphyry': { top: '#a855f7', front: '#9333ea', side: '#7e22ce', stroke: '#c084fc' },
  'Quartz-Carbonate Vein Stockwork': { top: '#fbbf24', front: '#f59e0b', side: '#d97706', stroke: '#fef08a' },
  'Mineralized Quartz Vein (Au)': { top: '#facc15', front: '#eab308', side: '#ca8a04', stroke: '#fef08a' },
  'Sheared Timiskaming Conglomerate': { top: '#71717a', front: '#52525b', side: '#3f3f46', stroke: '#a1a1aa' },
  'Pillowed Tholeiitic Basalt': { top: '#10b981', front: '#059669', side: '#047857', stroke: '#34d399' },
  'Mafic Volcanics': { top: '#059669', front: '#047857', side: '#065f46', stroke: '#10b981' },
  'Spodumene Pegmatite Dyke': { top: '#ec4899', front: '#db2777', side: '#be185d', stroke: '#f472b6' },
  'Argillic Siltstone': { top: '#64748b', front: '#475569', side: '#334155', stroke: '#94a3b8' },
  'Carbonaceous Shale': { top: '#334155', front: '#1e293b', side: '#0f172a', stroke: '#475569' },
  'Decalcified Silty Limestone': { top: '#38bdf8', front: '#0284c7', side: '#0369a1', stroke: '#7dd3fc' },
  'Jasperoid Alteration Zone': { top: '#ef4444', front: '#dc2626', side: '#b91c1c', stroke: '#f87171' },
  'Biotite-Granite Footwall': { top: '#f97316', front: '#ea580c', side: '#c2410c', stroke: '#fb923c' },
};

const DEFAULT_LITHO_COLOR = { top: '#8b5cf6', front: '#7c3aed', side: '#6d28d9', stroke: '#a78bfa' };

// Derive realistic petrophysical bulk density (g/cm³) and mineral concentration index (0-100%) from a drill core interval
function computeIntervalPetrophysics(interval: DrillInterval): {
  bulkDensityGcm3: number;
  mineralConcentrationPct: number;
  dominantMineral: string;
} {
  const lithoLower = (interval.lithology || '').toLowerCase();
  const minLower = ((interval.mineralization || '') + ' ' + (interval.alteration || '')).toLowerCase();

  let baseDensity = 2.72;
  if (lithoLower.includes('till') || lithoLower.includes('overburden')) baseDensity = 1.98;
  else if (lithoLower.includes('pegmatite') || lithoLower.includes('spodumene')) baseDensity = 2.78;
  else if (lithoLower.includes('basalt') || lithoLower.includes('mafic') || lithoLower.includes('gabbro')) baseDensity = 2.96;
  else if (lithoLower.includes('porphyry') || lithoLower.includes('granite')) baseDensity = 2.68;
  else if (lithoLower.includes('vein') || lithoLower.includes('jasperoid')) baseDensity = 2.84;
  else if (lithoLower.includes('limestone') || lithoLower.includes('shale')) baseDensity = 2.64;

  const auGpt = interval.assayAuGpt ?? (interval.gradeUnit?.includes('g/t') ? interval.primaryGradeValue ?? 0 : 0);
  const cuPct = interval.assayCuPct ?? (interval.gradeUnit?.includes('Cu') ? interval.primaryGradeValue ?? 0 : 0);
  const liPct = interval.assayLiPct ?? (interval.gradeUnit?.includes('Li') ? interval.primaryGradeValue ?? 0 : 0);
  const rawPrimary = interval.primaryGradeValue ?? 0;

  // Sulfide / Heavy mineral density boost
  let sulfideDensityBoost = 0;
  if (minLower.includes('massive') || minLower.includes('arsenopyrite') || minLower.includes('chalcopyrite')) {
    sulfideDensityBoost += 0.42;
  } else if (minLower.includes('pyrite') || minLower.includes('pyrrhotite') || minLower.includes('magnetite')) {
    sulfideDensityBoost += 0.28;
  } else if (minLower.includes('spodumene')) {
    sulfideDensityBoost += 0.22;
  }

  const gradeDensityBoost = Math.min(0.85, auGpt * 0.065 + cuPct * 0.24 + liPct * 0.16 + rawPrimary * 0.04);
  const bulkDensityGcm3 = Number(Math.min(4.48, baseDensity + sulfideDensityBoost + gradeDensityBoost).toFixed(2));

  // Spatial mineral concentration percentage (0 - 100 scale)
  const rawConc =
    auGpt * 9.5 +
    cuPct * 26.0 +
    liPct * 28.0 +
    rawPrimary * 6.5 +
    (sulfideDensityBoost > 0.3 ? 22 : sulfideDensityBoost > 0 ? 12 : 4);
  const mineralConcentrationPct = Number(Math.min(98.5, Math.max(4.5, rawConc)).toFixed(1));

  let dominantMineral = 'Silicate Host Matrix (Quartz-Feldspar)';
  if (auGpt >= 1.5 || minLower.includes('gold') || minLower.includes('arsenopyrite')) {
    dominantMineral = `Native Au + Arsenopyrite (${auGpt > 0 ? auGpt + ' g/t Au' : 'Auriferous'})`;
  } else if (liPct >= 0.8 || lithoLower.includes('spodumene') || lithoLower.includes('pegmatite')) {
    dominantMineral = `Spodumene LiAlSi₂O₆ (${liPct > 0 ? liPct + '% Li₂O' : 'LCT Pegmatite'})`;
  } else if (cuPct >= 0.4 || minLower.includes('chalcopyrite')) {
    dominantMineral = `Chalcopyrite CuFeS₂ (${cuPct > 0 ? cuPct + '% Cu' : 'Porphyry Sulfide'})`;
  } else if (sulfideDensityBoost > 0) {
    dominantMineral = 'Disseminated Pyrite-Pyrrhotite Halo';
  }

  return { bulkDensityGcm3, mineralConcentrationPct, dominantMineral };
}

export const DrillHole3DStrata: React.FC<DrillHole3DStrataProps> = ({
  drillholes,
  selectedHole,
  onSelectHole,
  initialShowHeatmap = true,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // 3D Isometric / Cross-section Transformation Controls
  const [tiltAngle, setTiltAngle] = useState<number>(28); // 0 to 45 deg
  const [rotationAngle, setRotationAngle] = useState<number>(-18); // -45 to 45 deg
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(1.35);
  const [viewMode, setViewMode] = useState<'fence' | 'single'>('fence');
  const [showFaultPlanes, setShowFaultPlanes] = useState<boolean>(true);
  const [showAssayGrades, setShowAssayGrades] = useState<boolean>(true);
  const [showStrataBands, setShowStrataBands] = useState<boolean>(true);

  // D3 3D Density Heat-Map Overlay Controls
  const [showDensityHeatmap, setShowDensityHeatmap] = useState<boolean>(initialShowHeatmap);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetricMode>('mineral_concentration');
  const [heatmapPalette, setHeatmapPalette] = useState<HeatmapColorPalette>('inferno');
  const [heatmapOpacity, setHeatmapOpacity] = useState<number>(0.72);
  const [heatmapCutoffPct, setHeatmapCutoffPct] = useState<number>(22);

  const [hoveredInterval, setHoveredInterval] = useState<{
    holeId: string;
    interval: DrillInterval;
    bulkDensityGcm3: number;
    mineralConcentrationPct: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [hoveredVoxel, setHoveredVoxel] = useState<{
    voxel: Voxel3DNode;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Compute summary statistics for the 3D heat-map telemetry strip
  const heatmapStats = useMemo(() => {
    const activeHoles = viewMode === 'fence' ? drillholes : [selectedHole];
    let peakDensity = 2.65;
    let peakConc = 0;
    let peakHoleId = selectedHole.holeId;
    let peakDepthLabel = '140m – 195m';
    let highConcentrationZones = 0;

    activeHoles.forEach((dh) => {
      (dh.intervals || []).forEach((iv) => {
        const petro = computeIntervalPetrophysics(iv);
        if (petro.bulkDensityGcm3 > peakDensity) {
          peakDensity = petro.bulkDensityGcm3;
        }
        if (petro.mineralConcentrationPct > peakConc) {
          peakConc = petro.mineralConcentrationPct;
          peakHoleId = dh.holeId;
          peakDepthLabel = `${iv.fromDepthM ?? iv.from}m – ${iv.toDepthM ?? iv.to}m`;
        }
        if (petro.mineralConcentrationPct >= 45) {
          highConcentrationZones += 1;
        }
      });
    });

    return {
      peakDensity,
      peakConc,
      peakHoleId,
      peakDepthLabel,
      highConcentrationZones,
    };
  }, [drillholes, selectedHole, viewMode]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 880;
    const height = 490;
    const margin = { top: 58, right: 88, bottom: 58, left: 88 };

    const activeHoles = viewMode === 'fence' ? drillholes : [selectedHole];
    const maxDepth = d3.max(activeHoles, (d) => d.totalDepthM) || 350;

    // D3 Scales
    const xScale = d3
      .scalePoint<string>()
      .domain(activeHoles.map((d) => d.holeId))
      .range([margin.left + 55, width - margin.right - 55])
      .padding(0.55);

    const yScale = d3
      .scaleLinear()
      .domain([0, maxDepth * 1.08])
      .range([margin.top, height - margin.bottom]);

    // Color scale for D3 3D Density Heat-Map
    const colorInterpolator =
      heatmapPalette === 'inferno'
        ? d3.interpolateInferno
        : heatmapPalette === 'turbo'
        ? d3.interpolateTurbo
        : d3.interpolateViridis;

    const heatColorScale = d3.scaleSequential(colorInterpolator).domain([0, 100]);

    // Perspective Projection offsets based on tilt and rotation
    const radTilt = (tiltAngle * Math.PI) / 180;
    const radRot = (rotationAngle * Math.PI) / 180;

    const project3D = (x: number, y: number, z: number) => {
      const rotX = x * Math.cos(radRot) - z * Math.sin(radRot);
      const rotZ = x * Math.sin(radRot) + z * Math.cos(radRot);

      const projX = rotX + (width / 2) * (1 - Math.cos(radRot));
      const projY = y * verticalExaggeration - rotZ * Math.sin(radTilt);

      return [projX, projY] as const;
    };

    const g = svg.append('g').attr('class', 'strata-scene');
    const defs = svg.append('defs');

    // Blur filter for D3 3D Density Heat-Map Plumes
    const heatBlur = defs
      .append('filter')
      .attr('id', 'd3-heatmap-blur')
      .attr('x', '-40%')
      .attr('y', '-40%')
      .attr('width', '180%')
      .attr('height', '180%');
    heatBlur.append('feGaussianBlur').attr('stdDeviation', 12).attr('result', 'blurOut');

    const voxelGlow = defs.append('filter').attr('id', 'd3-voxel-glow');
    voxelGlow.append('feGaussianBlur').attr('stdDeviation', 3.5).attr('result', 'coloredBlur');
    const vgMerge = voxelGlow.append('feMerge');
    vgMerge.append('feMergeNode').attr('in', 'coloredBlur');
    vgMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Fault line glow filter
    const glow = defs.append('filter').attr('id', 'fault-glow');
    glow.append('feGaussianBlur').attr('stdDeviation', 2).attr('result', 'coloredBlur');
    const glowMerge = glow.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // 1. Render 3D Background Grid & Depth Contours
    const depthTicks = yScale.ticks(6);
    const zOffset = 64;

    const gridGroup = g.append('g').attr('class', 'depth-grid').attr('opacity', 0.45);

    depthTicks.forEach((depth) => {
      const yPos = yScale(depth);
      const [p1x, p1y] = project3D(margin.left, yPos, -zOffset);
      const [p2x, p2y] = project3D(width - margin.right, yPos, -zOffset);
      const [p3x, p3y] = project3D(width - margin.right, yPos, zOffset);
      const [p4x, p4y] = project3D(margin.left, yPos, zOffset);

      gridGroup
        .append('polygon')
        .attr('points', `${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`)
        .attr('fill', depth % 100 === 0 ? 'rgba(245, 158, 11, 0.04)' : 'rgba(255, 255, 255, 0.02)')
        .attr('stroke', 'rgba(255, 255, 255, 0.12)')
        .attr('stroke-width', depth % 100 === 0 ? 1 : 0.5)
        .attr('stroke-dasharray', '4,4');

      const [lblX, lblY] = project3D(margin.left - 18, yPos, 0);
      gridGroup
        .append('text')
        .attr('x', lblX)
        .attr('y', lblY + 4)
        .attr('fill', '#d6d3d1')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('text-anchor', 'end')
        .text(`-${depth}m`);
    });

    // 2. Render Stratigraphic Cross-Section Envelopes (when fence mode is active)
    if (showStrataBands && activeHoles.length > 1) {
      const strataGroup = g.append('g').attr('class', 'continuous-strata-bands').attr('opacity', 0.22);

      const keyLithos = [
        'Glacial Till & Overburden',
        'Quartz-Feldspar Porphyry',
        'Quartz-Carbonate Vein Stockwork',
        'Pillowed Tholeiitic Basalt',
        'Spodumene Pegmatite Dyke',
      ];

      keyLithos.forEach((lithoKey) => {
        const colors = LITHOLOGY_COLORS[lithoKey] || DEFAULT_LITHO_COLOR;
        const upperPoints: [number, number][] = [];
        const lowerPoints: [number, number][] = [];

        activeHoles.forEach((dh) => {
          const xCenter = xScale(dh.holeId) || 0;
          const matchingInts = dh.intervals.filter((i) =>
            i.lithology.toLowerCase().includes(lithoKey.toLowerCase().split(' ')[0])
          );

          if (matchingInts.length > 0) {
            const first = matchingInts[0];
            const fromD = first.fromDepthM ?? first.from;
            const toD = first.toDepthM ?? first.to;
            const [ux, uy] = project3D(xCenter, yScale(fromD), 0);
            const [lx, ly] = project3D(xCenter, yScale(toD), 0);
            upperPoints.push([ux, uy]);
            lowerPoints.push([lx, ly]);
          }
        });

        if (upperPoints.length >= 2) {
          const polygonPts = [
            ...upperPoints.map((p) => `${p[0]},${p[1]}`),
            ...lowerPoints.reverse().map((p) => `${p[0]},${p[1]}`),
          ].join(' ');

          strataGroup
            .append('polygon')
            .attr('points', polygonPts)
            .attr('fill', colors.front)
            .attr('stroke', colors.stroke)
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '5,3');
        }
      });
    }

    // =========================================================================
    // 3. INTERACTIVE 3D DENSITY HEAT-MAP OVERLAY (D3 Volumetric Voxel & Kernel Field)
    // =========================================================================
    if (showDensityHeatmap) {
      const heatmapLayer = g.append('g').attr('class', 'd3-3d-density-heatmap-layer');

      // Gather 3D sample control points from all active drillhole intervals
      interface ControlSample3D {
        holeId: string;
        x: number;
        y: number;
        z: number;
        depthM: number;
        bulkDensityGcm3: number;
        mineralConcentrationPct: number;
        tensorScore: number;
        lithology: string;
        dominantMineral: string;
      }

      const controlSamples: ControlSample3D[] = [];

      activeHoles.forEach((dh) => {
        const xCollar = xScale(dh.holeId) || width / 2;
        const dipRad = (dh.dipDeg * Math.PI) / 180;
        const azRad = (dh.azimuthDeg * Math.PI) / 180;

        (dh.intervals || []).forEach((iv) => {
          const fromD = iv.fromDepthM ?? iv.from;
          const toD = iv.toDepthM ?? iv.to;
          const midDepth = (fromD + toD) / 2;
          const yMid = yScale(midDepth);

          const horizDrift = Math.cos(dipRad) * midDepth * 0.12;
          const driftX = Math.sin(azRad) * horizDrift;
          const driftZ = Math.cos(azRad) * horizDrift;

          const petro = computeIntervalPetrophysics(iv);
          const densityNorm = Math.min(100, Math.max(0, ((petro.bulkDensityGcm3 - 2.2) / 1.9) * 100));
          const tensorScore = Number((petro.mineralConcentrationPct * 0.62 + densityNorm * 0.38).toFixed(1));

          controlSamples.push({
            holeId: dh.holeId,
            x: xCollar + driftX,
            y: yMid,
            z: driftZ,
            depthM: midDepth,
            bulkDensityGcm3: petro.bulkDensityGcm3,
            mineralConcentrationPct: petro.mineralConcentrationPct,
            tensorScore,
            lithology: iv.lithology,
            dominantMineral: petro.dominantMineral,
          });
        });
      });

      // 3A. Render D3 Continuous Kernel Density Plumes behind and around high-concentration zones
      const plumeGroup = heatmapLayer
        .append('g')
        .attr('class', 'd3-heatmap-plumes')
        .attr('filter', 'url(#d3-heatmap-blur)')
        .attr('opacity', Math.min(0.9, heatmapOpacity * 0.85));

      controlSamples.forEach((sample) => {
        const metricVal =
          heatmapMetric === 'mineral_concentration'
            ? sample.mineralConcentrationPct
            : heatmapMetric === 'bulk_density'
            ? Math.min(100, Math.max(5, ((sample.bulkDensityGcm3 - 2.3) / 1.8) * 100))
            : sample.tensorScore;

        if (metricVal >= heatmapCutoffPct) {
          const [px, py] = project3D(sample.x, sample.y, sample.z);
          const rx = 26 + (metricVal / 100) * 48;
          const ry = 16 + (metricVal / 100) * 28;

          plumeGroup
            .append('ellipse')
            .attr('cx', px)
            .attr('cy', py)
            .attr('rx', rx)
            .attr('ry', ry)
            .attr('fill', heatColorScale(metricVal));
        }
      });

      // 3B. Build 3D Volumetric Voxel Grid interpolated via Inverse-Distance Weighting (IDW)
      const xMin = margin.left + 30;
      const xMax = width - margin.right - 30;
      const cols = activeHoles.length > 1 ? 13 : 7;
      const rows = 9;
      const zPlanes = [-26, 0, 26]; // 3D Back, Center, and Front depth slices

      const stepX = (xMax - xMin) / cols;
      const stepDepth = maxDepth / rows;
      const voxels: Voxel3DNode[] = [];

      for (let c = 0; c < cols; c++) {
        const vx = xMin + (c + 0.5) * stepX;
        for (let r = 0; r < rows; r++) {
          const depthM = (r + 0.5) * stepDepth;
          const vy = yScale(depthM);

          zPlanes.forEach((vz, zIdx) => {
            // IDW Interpolation from controlSamples
            let weightSum = 0;
            let densitySum = 0;
            let concSum = 0;
            let tensorSum = 0;
            let nearestDist = Infinity;
            let nearestSample = controlSamples[0];

            controlSamples.forEach((s) => {
              const dx = (vx - s.x) / 55;
              const dy = (vy - s.y) / 32;
              const dz = (vz - s.z) / 38;
              const distSq = dx * dx + dy * dy + dz * dz + 0.18;
              const w = 1 / (distSq * distSq);
              weightSum += w;
              densitySum += w * s.bulkDensityGcm3;
              concSum += w * s.mineralConcentrationPct;
              tensorSum += w * s.tensorScore;

              if (distSq < nearestDist) {
                nearestDist = distSq;
                nearestSample = s;
              }
            });

            if (weightSum > 0 && nearestSample) {
              // Attenuate slightly with distance from nearest drillhole so heat-map wraps organically around core corridors
              const spatialAttenuation = Math.exp(-nearestDist * 0.14);
              const interpDensity = Number(
                (2.55 + (densitySum / weightSum - 2.55) * spatialAttenuation).toFixed(2)
              );
              const interpConc = Number(
                ((concSum / weightSum) * (0.45 + 0.55 * spatialAttenuation)).toFixed(1)
              );
              const interpTensor = Number(
                ((tensorSum / weightSum) * (0.45 + 0.55 * spatialAttenuation)).toFixed(1)
              );

              const normalizedValue =
                heatmapMetric === 'mineral_concentration'
                  ? interpConc
                  : heatmapMetric === 'bulk_density'
                  ? Math.min(100, Math.max(0, ((interpDensity - 2.4) / 1.75) * 100))
                  : interpTensor;

              if (normalizedValue >= heatmapCutoffPct) {
                voxels.push({
                  id: `voxel-${c}-${r}-${zIdx}`,
                  worldX: vx,
                  depthM: Math.round(depthM),
                  worldY: vy,
                  worldZ: vz,
                  voxelWidth: stepX * 0.76,
                  voxelHeight: ((height - margin.top - margin.bottom) / rows) * 0.74,
                  voxelDepth: 16,
                  bulkDensityGcm3: interpDensity,
                  mineralConcentrationPct: interpConc,
                  tensorScore: interpTensor,
                  normalizedValue,
                  nearestHoleId: nearestSample.holeId,
                  dominantLithology: nearestSample.lithology,
                  dominantMineral: nearestSample.dominantMineral,
                });
              }
            }
          });
        }
      }

      // Sort voxels back-to-front in 3D space (painter's algorithm)
      voxels.sort((a, b) => a.worldZ - b.worldZ || a.worldY - b.worldY);

      const voxelGroup = heatmapLayer.append('g').attr('class', 'd3-3d-voxels');

      voxels.forEach((v) => {
        const hw = v.voxelWidth / 2;
        const hh = v.voxelHeight / 2;
        const hd = v.voxelDepth / 2;

        // 3D Isometric Voxel Box Faces
        const [fTL_x, fTL_y] = project3D(v.worldX - hw, v.worldY - hh, v.worldZ + hd);
        const [fTR_x, fTR_y] = project3D(v.worldX + hw, v.worldY - hh, v.worldZ + hd);
        const [fBR_x, fBR_y] = project3D(v.worldX + hw, v.worldY + hh, v.worldZ + hd);
        const [fBL_x, fBL_y] = project3D(v.worldX - hw, v.worldY + hh, v.worldZ + hd);

        const [bTL_x, bTL_y] = project3D(v.worldX - hw, v.worldY - hh, v.worldZ - hd);
        const [bTR_x, bTR_y] = project3D(v.worldX + hw, v.worldY - hh, v.worldZ - hd);
        const [bBR_x, bBR_y] = project3D(v.worldX + hw, v.worldY + hh, v.worldZ - hd);

        const baseColor = heatColorScale(v.normalizedValue);
        const isHotspot = v.normalizedValue >= 68;
        const cellAlpha =
          (0.18 + (v.normalizedValue / 100) * 0.56) *
          heatmapOpacity *
          (v.worldZ === 0 ? 1.0 : 0.72);

        const vCell = voxelGroup
          .append('g')
          .attr('class', 'd3-voxel-node')
          .style('cursor', 'crosshair')
          .on('mouseenter', (event) => {
            const rect = svgRef.current?.getBoundingClientRect();
            setHoveredVoxel({
              voxel: v,
              screenX: event.clientX - (rect?.left || 0),
              screenY: event.clientY - (rect?.top || 0),
            });
          })
          .on('mouseleave', () => setHoveredVoxel(null));

        // Front Voxel Face
        vCell
          .append('polygon')
          .attr('points', `${fTL_x},${fTL_y} ${fTR_x},${fTR_y} ${fBR_x},${fBR_y} ${fBL_x},${fBL_y}`)
          .attr('fill', baseColor)
          .attr('fill-opacity', cellAlpha)
          .attr('stroke', isHotspot ? '#fde047' : baseColor)
          .attr('stroke-width', isHotspot ? 1.1 : 0.45)
          .attr('stroke-opacity', Math.min(0.95, cellAlpha + 0.25));

        // Top Voxel Face
        vCell
          .append('polygon')
          .attr('points', `${fTL_x},${fTL_y} ${fTR_x},${fTR_y} ${bTR_x},${bTR_y} ${bTL_x},${bTL_y}`)
          .attr('fill', d3.color(baseColor)?.brighter(0.45)?.formatHex() || baseColor)
          .attr('fill-opacity', cellAlpha * 0.85)
          .attr('stroke', baseColor)
          .attr('stroke-width', 0.35)
          .attr('stroke-opacity', cellAlpha);

        // Right Side Voxel Face
        vCell
          .append('polygon')
          .attr('points', `${fTR_x},${fTR_y} ${bTR_x},${bTR_y} ${bBR_x},${bBR_y} ${fBR_x},${fBR_y}`)
          .attr('fill', d3.color(baseColor)?.darker(0.45)?.formatHex() || baseColor)
          .attr('fill-opacity', cellAlpha * 0.8)
          .attr('stroke', baseColor)
          .attr('stroke-width', 0.35)
          .attr('stroke-opacity', cellAlpha);

        // Iso-Density Core Node Marker for high-concentration anomalies
        if (isHotspot && v.worldZ === 0) {
          const [cx, cy] = project3D(v.worldX, v.worldY, v.worldZ + hd);
          vCell
            .append('circle')
            .attr('cx', cx)
            .attr('cy', cy)
            .attr('r', 3.2)
            .attr('fill', '#fef08a')
            .attr('stroke', '#dc2626')
            .attr('stroke-width', 1)
            .attr('filter', 'url(#d3-voxel-glow)');
        }
      });

      // 3C. Render 3D Iso-Density Contour Rings around the highest mineral concentration intervals on each drillhole
      const isoRingGroup = heatmapLayer.append('g').attr('class', 'd3-iso-density-rings');
      controlSamples
        .filter((s) => s.mineralConcentrationPct >= 52)
        .forEach((s) => {
          const [cx, cy] = project3D(s.x, s.y, s.z);
          const ringColor = heatColorScale(s.mineralConcentrationPct);

          [24, 38].forEach((rad, idx) => {
            isoRingGroup
              .append('ellipse')
              .attr('cx', cx)
              .attr('cy', cy)
              .attr('rx', rad)
              .attr('ry', rad * 0.48)
              .attr('fill', 'none')
              .attr('stroke', idx === 0 ? '#fde047' : ringColor)
              .attr('stroke-width', idx === 0 ? 1.4 : 1.0)
              .attr('stroke-dasharray', idx === 0 ? '3,2' : '5,3')
              .attr('opacity', heatmapOpacity * 0.9);
          });

          // Spatial density & concentration badge callout
          isoRingGroup
            .append('text')
            .attr('x', cx - 30)
            .attr('y', cy - 14)
            .attr('fill', '#fef08a')
            .attr('font-size', '8.5px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .text(`SG ${s.bulkDensityGcm3} g/cm³ • ${s.mineralConcentrationPct}%`);
        });
    }

    // 4. Render Fault Structures & Shear Zones
    if (showFaultPlanes) {
      const faultGroup = g.append('g').attr('class', 'fault-planes');
      const [f1x, f1y] = project3D(width * 0.15, yScale(20), -40);
      const [f2x, f2y] = project3D(width * 0.82, yScale(260), -40);
      const [f3x, f3y] = project3D(width * 0.86, yScale(310), 40);
      const [f4x, f4y] = project3D(width * 0.19, yScale(70), 40);

      faultGroup
        .append('polygon')
        .attr('points', `${f1x},${f1y} ${f2x},${f2y} ${f3x},${f3y} ${f4x},${f4y}`)
        .attr('fill', 'rgba(239, 68, 68, 0.10)')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 1.8)
        .attr('stroke-dasharray', '6,4')
        .attr('filter', 'url(#fault-glow)');

      faultGroup
        .append('text')
        .attr('x', (f1x + f2x) / 2 + 10)
        .attr('y', (f1y + f2y) / 2 - 10)
        .attr('fill', '#fca5a5')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('transform', `rotate(12, ${(f1x + f2x) / 2}, ${(f1y + f2y) / 2})`)
        .text('CADILLAC-LARDER SHEAR FAULT (DIP 65°S)');
    }

    // 5. Render Each Drillhole as an Isometric 3D Cylinder / Strata Column
    activeHoles.forEach((dh) => {
      const isSelected = dh.holeId === selectedHole.holeId;
      const xCollar = xScale(dh.holeId) || 0;
      const holeGroup = g
        .append('g')
        .attr('class', `dh-column-${dh.holeId}`)
        .attr('cursor', 'pointer')
        .on('click', () => onSelectHole(dh));

      // Collar Marker at Surface
      const [cTopX, cTopY] = project3D(xCollar, yScale(0), 0);

      holeGroup
        .append('line')
        .attr('x1', cTopX)
        .attr('y1', cTopY - 26)
        .attr('x2', cTopX)
        .attr('y2', cTopY)
        .attr('stroke', isSelected ? '#f59e0b' : '#38bdf8')
        .attr('stroke-width', 2);

      holeGroup
        .append('circle')
        .attr('cx', cTopX)
        .attr('cy', cTopY - 26)
        .attr('r', 4)
        .attr('fill', isSelected ? '#f59e0b' : '#38bdf8');

      holeGroup
        .append('text')
        .attr('x', cTopX)
        .attr('y', cTopY - 32)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', isSelected ? '#fbbf24' : '#ffffff')
        .text(dh.holeId);

      holeGroup
        .append('text')
        .attr('x', cTopX)
        .attr('y', cTopY - 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', '#94a3b8')
        .text(`Az:${dh.azimuthDeg}° Dip:${dh.dipDeg}°`);

      const colRadius = isSelected ? 18 : 14;
      const colZ = colRadius * 0.8;

      const intervals = dh.intervals || [];

      intervals.forEach((interval) => {
        const fromD = interval.fromDepthM ?? interval.from;
        const toD = interval.toDepthM ?? interval.to;
        const yTop = yScale(fromD);
        const yBot = yScale(toD);

        const dipRad = (dh.dipDeg * Math.PI) / 180;
        const azRad = (dh.azimuthDeg * Math.PI) / 180;
        const horizDrift = Math.cos(dipRad) * (toD - fromD) * 0.15;
        const driftX = Math.sin(azRad) * horizDrift;
        const driftZ = Math.cos(azRad) * horizDrift;

        const colors = LITHOLOGY_COLORS[interval.lithology] || DEFAULT_LITHO_COLOR;
        const petro = computeIntervalPetrophysics(interval);

        const [frontTL_x, frontTL_y] = project3D(xCollar - colRadius, yTop, colZ);
        const [frontTR_x, frontTR_y] = project3D(xCollar + colRadius, yTop, colZ);
        const [frontBR_x, frontBR_y] = project3D(xCollar + colRadius + driftX, yBot, colZ + driftZ);
        const [frontBL_x, frontBL_y] = project3D(xCollar - colRadius + driftX, yBot, colZ + driftZ);

        const [backTR_x, backTR_y] = project3D(xCollar + colRadius, yTop, -colZ);
        const [backBR_x, backBR_y] = project3D(xCollar + colRadius + driftX, yBot, -colZ + driftZ);
        const [backTL_x, backTL_y] = project3D(xCollar - colRadius, yTop, -colZ);

        const blockGroup = holeGroup
          .append('g')
          .attr('class', 'interval-block')
          .on('mouseenter', (event) => {
            const rect = svgRef.current?.getBoundingClientRect();
            const mouseX = event.clientX - (rect?.left || 0);
            const mouseY = event.clientY - (rect?.top || 0);
            setHoveredInterval({
              holeId: dh.holeId,
              interval,
              bulkDensityGcm3: petro.bulkDensityGcm3,
              mineralConcentrationPct: petro.mineralConcentrationPct,
              screenX: mouseX,
              screenY: mouseY,
            });
          })
          .on('mouseleave', () => setHoveredInterval(null));

        // Front Face
        blockGroup
          .append('polygon')
          .attr(
            'points',
            `${frontTL_x},${frontTL_y} ${frontTR_x},${frontTR_y} ${frontBR_x},${frontBR_y} ${frontBL_x},${frontBL_y}`
          )
          .attr('fill', colors.front)
          .attr('stroke', isSelected ? '#fbbf24' : colors.stroke)
          .attr('stroke-width', isSelected ? 1.5 : 0.8)
          .attr('opacity', 0.92);

        // Heatmap Visualization Layer: Mineral Density Concentration Gradient Overlay on Existing Borehole Models
        if (showDensityHeatmap) {
          const metricVal =
            heatmapMetric === 'mineral_concentration'
              ? petro.mineralConcentrationPct
              : heatmapMetric === 'bulk_density'
              ? Math.min(100, Math.max(5, ((petro.bulkDensityGcm3 - 2.3) / 1.8) * 100))
              : Number(
                  (
                    petro.mineralConcentrationPct * 0.62 +
                    Math.min(100, Math.max(0, ((petro.bulkDensityGcm3 - 2.2) / 1.9) * 100)) * 0.38
                  ).toFixed(1)
                );

          const gradId = `borehole-heat-grad-${dh.holeId}-${Math.round(fromD * 10)}-${Math.round(toD * 10)}`.replace(
            /[^a-zA-Z0-9_-]/g,
            '_'
          );
          const heatGrad = defs
            .append('linearGradient')
            .attr('id', gradId)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%');

          const topColor = heatColorScale(Math.min(100, metricVal + 8));
          const midColor = heatColorScale(metricVal);
          const botColor = heatColorScale(Math.max(0, metricVal - 8));

          heatGrad.append('stop').attr('offset', '0%').attr('stop-color', topColor).attr('stop-opacity', heatmapOpacity * 0.90);
          heatGrad.append('stop').attr('offset', '50%').attr('stop-color', midColor).attr('stop-opacity', heatmapOpacity * 0.84);
          heatGrad.append('stop').attr('offset', '100%').attr('stop-color', botColor).attr('stop-opacity', heatmapOpacity * 0.76);

          blockGroup
            .append('polygon')
            .attr('class', 'borehole-model-heatmap-gradient-overlay')
            .attr(
              'points',
              `${frontTL_x},${frontTL_y} ${frontTR_x},${frontTR_y} ${frontBR_x},${frontBR_y} ${frontBL_x},${frontBL_y}`
            )
            .attr('fill', `url(#${gradId})`)
            .attr('stroke', isSelected ? '#fbbf24' : midColor)
            .attr('stroke-width', metricVal >= 45 ? 1.5 : 0.8)
            .attr('pointer-events', 'none');
        }

        // Side Right Face
        if (rotationAngle < 15) {
          blockGroup
            .append('polygon')
            .attr(
              'points',
              `${frontTR_x},${frontTR_y} ${backTR_x},${backTR_y} ${backBR_x},${backBR_y} ${frontBR_x},${frontBR_y}`
            )
            .attr('fill', colors.side)
            .attr('stroke', colors.stroke)
            .attr('stroke-width', 0.6)
            .attr('opacity', 0.85);

          if (showDensityHeatmap) {
            const metricVal =
              heatmapMetric === 'mineral_concentration'
                ? petro.mineralConcentrationPct
                : heatmapMetric === 'bulk_density'
                ? Math.min(100, Math.max(5, ((petro.bulkDensityGcm3 - 2.3) / 1.8) * 100))
                : Number(
                    (
                      petro.mineralConcentrationPct * 0.62 +
                      Math.min(100, Math.max(0, ((petro.bulkDensityGcm3 - 2.2) / 1.9) * 100)) * 0.38
                    ).toFixed(1)
                  );

            const midColor = heatColorScale(metricVal);
            blockGroup
              .append('polygon')
              .attr('class', 'borehole-model-side-heatmap-overlay')
              .attr(
                'points',
                `${frontTR_x},${frontTR_y} ${backTR_x},${backTR_y} ${backBR_x},${backBR_y} ${frontBR_x},${frontBR_y}`
              )
              .attr('fill', d3.color(midColor)?.darker(0.35)?.formatHex() || midColor)
              .attr('fill-opacity', heatmapOpacity * 0.78)
              .attr('stroke', midColor)
              .attr('stroke-width', 0.6)
              .attr('pointer-events', 'none');
          }
        }

        // Top Face
        blockGroup
          .append('polygon')
          .attr(
            'points',
            `${frontTL_x},${frontTL_y} ${frontTR_x},${frontTR_y} ${backTR_x},${backTR_y} ${backTL_x},${backTL_y}`
          )
          .attr('fill', colors.top)
          .attr('stroke', colors.stroke)
          .attr('stroke-width', 0.6);

        if (showDensityHeatmap) {
          const metricVal =
            heatmapMetric === 'mineral_concentration'
              ? petro.mineralConcentrationPct
              : heatmapMetric === 'bulk_density'
              ? Math.min(100, Math.max(5, ((petro.bulkDensityGcm3 - 2.3) / 1.8) * 100))
              : Number(
                  (
                    petro.mineralConcentrationPct * 0.62 +
                    Math.min(100, Math.max(0, ((petro.bulkDensityGcm3 - 2.2) / 1.9) * 100)) * 0.38
                  ).toFixed(1)
                );

          const midColor = heatColorScale(metricVal);
          blockGroup
            .append('polygon')
            .attr('class', 'borehole-model-top-heatmap-overlay')
            .attr(
              'points',
              `${frontTL_x},${frontTL_y} ${frontTR_x},${frontTR_y} ${backTR_x},${backTR_y} ${backTL_x},${backTL_y}`
            )
            .attr('fill', d3.color(midColor)?.brighter(0.4)?.formatHex() || midColor)
            .attr('fill-opacity', heatmapOpacity * 0.82)
            .attr('stroke', midColor)
            .attr('stroke-width', 0.6)
            .attr('pointer-events', 'none');
        }

        // Assay Grade Heat Ribbon on side of column
        if (showAssayGrades) {
          const gradeVal =
            interval.primaryGradeValue ??
            interval.assayAuGpt ??
            interval.assayLiPct ??
            interval.assayCuPct ??
            0;

          if (gradeVal > 0) {
            const ribbonWidth = Math.min(16, gradeVal * 4);
            const isGold = interval.assayAuGpt !== undefined;
            const isLithium = interval.assayLiPct !== undefined;
            const gradeColor = isGold
              ? gradeVal > 4
                ? '#ef4444'
                : gradeVal > 1.5
                ? '#f59e0b'
                : '#34d399'
              : isLithium
              ? gradeVal > 1.5
                ? '#ec4899'
                : '#8b5cf6'
              : '#38bdf8';

            const [rbTL_x, rbTL_y] = project3D(xCollar + colRadius + 4, yTop, 0);
            const [rbBL_x, rbBL_y] = project3D(xCollar + colRadius + 4 + driftX, yBot, 0);

            blockGroup
              .append('line')
              .attr('x1', rbTL_x)
              .attr('y1', rbTL_y)
              .attr('x2', rbBL_x)
              .attr('y2', rbBL_y)
              .attr('stroke', gradeColor)
              .attr('stroke-width', Math.max(3, ribbonWidth))
              .attr('stroke-linecap', 'round');

            if (gradeVal > 2.0) {
              blockGroup
                .append('text')
                .attr('x', rbTL_x + 12)
                .attr('y', (rbTL_y + rbBL_y) / 2 + 3)
                .attr('fill', '#fef08a')
                .attr('font-size', '9px')
                .attr('font-weight', 'bold')
                .text(`${gradeVal} ${interval.gradeUnit || (isGold ? 'g/t' : '%')}`);
            }
          }
        }
      });

      // Total Depth EOH Label
      const [eohX, eohY] = project3D(xCollar, yScale(dh.totalDepthM), 0);
      holeGroup
        .append('text')
        .attr('x', eohX)
        .attr('y', eohY + 16)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', '#a8a29e')
        .text(`EOH: ${dh.totalDepthM}m`);
    });

    // 6. 3D Compass Cube in Top Right
    const compassGroup = g.append('g').attr('transform', `translate(${width - 65}, 55)`);
    compassGroup.append('circle').attr('r', 24).attr('fill', 'rgba(0,0,0,0.6)').attr('stroke', '#f59e0b');
    compassGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#f59e0b')
      .text('3D N');
  }, [
    drillholes,
    selectedHole,
    tiltAngle,
    rotationAngle,
    verticalExaggeration,
    viewMode,
    showFaultPlanes,
    showAssayGrades,
    showStrataBands,
    showDensityHeatmap,
    heatmapMetric,
    heatmapPalette,
    heatmapOpacity,
    heatmapCutoffPct,
  ]);

  return (
    <div className="space-y-4">
      {/* Row 1: 3D Projection & Camera Controls */}
      <div className="p-3 rounded-xl bg-stone-900/90 border border-amber-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-stone-400 font-bold uppercase tracking-wider">Projection:</span>
          <button
            onClick={() => setViewMode('fence')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              viewMode === 'fence'
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Multi-Hole Fence Section ({drillholes.length})
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              viewMode === 'single'
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            Hole {selectedHole.holeId} Focus
          </button>
        </div>

        {/* 3D Sliders */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-300">
          <div className="flex items-center gap-2">
            <span>3D Tilt ({tiltAngle}°):</span>
            <input
              type="range"
              min="0"
              max="45"
              value={tiltAngle}
              onChange={(e) => setTiltAngle(Number(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>Rotation ({rotationAngle}°):</span>
            <input
              type="range"
              min="-45"
              max="45"
              value={rotationAngle}
              onChange={(e) => setRotationAngle(Number(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <span>V-Exaggeration ({verticalExaggeration}x):</span>
            <input
              type="range"
              min="0.8"
              max="2.5"
              step="0.05"
              value={verticalExaggeration}
              onChange={(e) => setVerticalExaggeration(Number(e.target.value))}
              className="w-16 accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Structural Layer Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStrataBands(!showStrataBands)}
            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
              showStrataBands
                ? 'bg-purple-950 text-purple-200 border-purple-500/60'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
          >
            Strata Bands
          </button>
          <button
            onClick={() => setShowFaultPlanes(!showFaultPlanes)}
            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
              showFaultPlanes
                ? 'bg-red-950 text-red-200 border-red-500/60'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
          >
            Faults
          </button>
          <button
            onClick={() => setShowAssayGrades(!showAssayGrades)}
            className={`px-2 py-1 rounded text-[11px] font-semibold border ${
              showAssayGrades
                ? 'bg-amber-950 text-amber-200 border-amber-500/60'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
          >
            Assay Ribbons
          </button>
        </div>
      </div>

      {/* Row 2: D3 Interactive 3D Density Heat-Map Overlay Controls */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-stone-950 via-[#23120B] to-stone-950 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <button
            id="btn-toggle-3d-density-heatmap"
            onClick={() => setShowDensityHeatmap(!showDensityHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-extrabold transition-all border ${
              showDensityHeatmap
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 border-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
            }`}
            title="Toggle Heatmap visualization layer that renders mineral density concentrations as a color-coded gradient overlay on borehole models"
          >
            <Flame size={14} className={showDensityHeatmap ? 'text-stone-950' : 'text-amber-400'} />
            <span>Heatmap Layer (Mineral Density Gradient Overlay): {showDensityHeatmap ? 'ACTIVE' : 'OFF'}</span>
          </button>

          {showDensityHeatmap && (
            <div className="flex items-center gap-1.5 bg-stone-900/90 p-1 rounded-lg border border-stone-800">
              <button
                onClick={() => setHeatmapMetric('mineral_concentration')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  heatmapMetric === 'mineral_concentration'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Spatial Mineral Conc. (%)
              </button>
              <button
                onClick={() => setHeatmapMetric('bulk_density')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  heatmapMetric === 'bulk_density'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Core Bulk Density (g/cm³)
              </button>
              <button
                onClick={() => setHeatmapMetric('ore_density_tensor')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  heatmapMetric === 'ore_density_tensor'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                3D Density × Grade Tensor
              </button>
            </div>
          )}
        </div>

        {showDensityHeatmap && (
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-stone-300">
            {/* Color Scale Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400 font-semibold">D3 Scale:</span>
              {(['inferno', 'turbo', 'viridis'] as HeatmapColorPalette[]).map((pal) => (
                <button
                  key={pal}
                  onClick={() => setHeatmapPalette(pal)}
                  className={`px-2 py-0.5 rounded uppercase text-[10px] font-bold border ${
                    heatmapPalette === pal
                      ? 'bg-amber-500 text-stone-950 border-amber-300'
                      : 'bg-stone-900 text-stone-400 border-stone-700 hover:text-white'
                  }`}
                >
                  {pal}
                </button>
              ))}
            </div>

            {/* Voxel Iso-Cutoff Slider */}
            <div className="flex items-center gap-2">
              <span className="text-stone-400">Iso-Cutoff ({heatmapCutoffPct}%):</span>
              <input
                type="range"
                min="10"
                max="60"
                step="2"
                value={heatmapCutoffPct}
                onChange={(e) => setHeatmapCutoffPct(Number(e.target.value))}
                className="w-20 accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Heat-map Opacity Slider */}
            <div className="flex items-center gap-2">
              <span className="text-stone-400">Voxel Alpha ({Math.round(heatmapOpacity * 100)}%):</span>
              <input
                type="range"
                min="0.3"
                max="0.95"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                className="w-20 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* SVG Canvas with D3 3D Strata & Volumetric Density Heat-Map Overlay */}
      <div className="relative rounded-2xl bg-[#110B07] border-2 border-amber-900/50 shadow-2xl overflow-hidden flex items-center justify-center select-none">
        <svg
          ref={svgRef}
          viewBox="0 0 880 490"
          className="w-full h-[470px] max-h-[510px]"
        />

        {/* Hovered Drill Core Interval Tooltip */}
        {hoveredInterval && (
          <div
            className="absolute z-40 p-3 rounded-xl bg-stone-950/95 border border-amber-500/60 shadow-2xl text-xs text-stone-200 pointer-events-none backdrop-blur-md max-w-xs"
            style={{
              left: Math.min(hoveredInterval.screenX + 15, 590),
              top: Math.max(hoveredInterval.screenY - 85, 16),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-1.5 mb-1.5">
              <span className="font-bold text-amber-400">{hoveredInterval.holeId}</span>
              <span className="font-mono text-[11px] text-stone-400">
                {(hoveredInterval.interval.fromDepthM ?? hoveredInterval.interval.from).toFixed(1)}m –{' '}
                {(hoveredInterval.interval.toDepthM ?? hoveredInterval.interval.to).toFixed(1)}m
              </span>
            </div>
            <div className="font-semibold text-white">{hoveredInterval.interval.lithology}</div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              {hoveredInterval.interval.alteration ||
                hoveredInterval.interval.mineralization ||
                'Disseminated mineral matrix'}
            </div>
            <div className="mt-2 pt-1.5 border-t border-stone-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-stone-400 block text-[10px]">Bulk Density (SG)</span>
                <strong className="text-cyan-300">{hoveredInterval.bulkDensityGcm3} g/cm³</strong>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Spatial Conc.</span>
                <strong className="text-amber-300">{hoveredInterval.mineralConcentrationPct}%</strong>
              </div>
            </div>
          </div>
        )}

        {/* Hovered 3D Heat-Map Voxel Tooltip */}
        {hoveredVoxel && !hoveredInterval && (
          <div
            className="absolute z-40 p-3 rounded-xl bg-stone-950/95 border border-rose-500/70 shadow-2xl text-xs text-stone-200 pointer-events-none backdrop-blur-md max-w-xs"
            style={{
              left: Math.min(hoveredVoxel.screenX + 15, 580),
              top: Math.max(hoveredVoxel.screenY - 90, 16),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-1.5 mb-1.5">
              <span className="font-extrabold text-rose-400 flex items-center gap-1">
                <Flame size={12} /> 3D Heat-Map Voxel
              </span>
              <span className="font-mono text-[11px] text-amber-300">
                Depth ~{hoveredVoxel.voxel.depthM}m (Z:{hoveredVoxel.voxel.worldZ}m)
              </span>
            </div>
            <div className="text-[11px] text-white font-semibold">
              {hoveredVoxel.voxel.dominantMineral}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              Nearest Collar: <strong className="text-stone-200">{hoveredVoxel.voxel.nearestHoleId}</strong> • Host:{' '}
              {hoveredVoxel.voxel.dominantLithology}
            </div>
            <div className="mt-2 pt-1.5 border-t border-stone-800 grid grid-cols-3 gap-2 text-[10px] font-mono">
              <div>
                <span className="text-stone-400 block">Density</span>
                <strong className="text-cyan-300">{hoveredVoxel.voxel.bulkDensityGcm3} g/cm³</strong>
              </div>
              <div>
                <span className="text-stone-400 block">Mineral Conc</span>
                <strong className="text-amber-300">{hoveredVoxel.voxel.mineralConcentrationPct}%</strong>
              </div>
              <div>
                <span className="text-stone-400 block">3D Tensor</span>
                <strong className="text-rose-300">{hoveredVoxel.voxel.tensorScore}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Left Overlay: Lithostratigraphic Legend */}
        <div className="absolute bottom-3 left-3 p-2.5 rounded-xl bg-black/80 border border-stone-800 backdrop-blur-md text-[10px] text-stone-300 max-w-md hidden sm:block">
          <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
            D3.js Lithostratigraphic Units
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(LITHOLOGY_COLORS)
              .slice(0, 6)
              .map(([name, col]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: col.front }} />
                  <span className="truncate">{name}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Right Overlay: D3 3D Density & Concentration Color Scale Bar */}
        {showDensityHeatmap && (
          <div className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-black/85 border border-amber-500/40 backdrop-blur-md text-[10px] text-stone-200 w-60">
            <div className="flex items-center justify-between font-bold text-amber-300 uppercase tracking-wider mb-1">
              <span>D3 3D Density Heat-Map</span>
              <span className="font-mono text-[9px] text-stone-400">{heatmapPalette.toUpperCase()}</span>
            </div>
            <div
              className="h-2.5 w-full rounded-full border border-stone-700 my-1"
              style={{
                background:
                  heatmapPalette === 'inferno'
                    ? 'linear-gradient(90deg, #160b39 0%, #721f81 30%, #cf4446 60%, #fb9b06 85%, #fcffa4 100%)'
                    : heatmapPalette === 'turbo'
                    ? 'linear-gradient(90deg, #30123b 0%, #28bbec 30%, #a2fc3c 60%, #fb8022 85%, #7a0403 100%)'
                    : 'linear-gradient(90deg, #440154 0%, #31688e 35%, #35b779 70%, #fde725 100%)',
              }}
            />
            <div className="flex items-center justify-between font-mono text-[9px] text-stone-400">
              <span>2.45 g/cm³ (Low)</span>
              <span>3.25 g/cm³</span>
              <span className="text-amber-300 font-bold">4.40+ g/cm³ (Ore)</span>
            </div>
          </div>
        )}
      </div>

      {/* 3D Spatial Mineral Concentration Telemetry Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
              Peak 3D Core Bulk Density
            </span>
            <span className="text-base font-extrabold text-cyan-300 font-mono">
              {heatmapStats.peakDensity} g/cm³ (SG)
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
            IDW Voxel Field
          </span>
        </div>

        <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
              Peak Spatial Mineral Concentration
            </span>
            <span className="text-base font-extrabold text-amber-400 font-mono">
              {heatmapStats.peakConc}% ({heatmapStats.peakHoleId})
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
            {heatmapStats.peakDepthLabel}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
              High-Grade 3D Ore Plume Intercepts
            </span>
            <span className="text-base font-extrabold text-rose-400 font-mono">
              {heatmapStats.highConcentrationZones} Active Horizons
            </span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 font-mono">
            Iso-Cutoff &ge;{heatmapCutoffPct}%
          </span>
        </div>
      </div>
    </div>
  );
};
