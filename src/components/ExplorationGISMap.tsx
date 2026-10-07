import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  MapPin,
  Layers,
  Globe,
  Compass,
  Maximize2,
  Filter,
  Eye,
  Crosshair,
  Shield,
  Zap,
  Info,
  ChevronRight,
  TrendingUp,
  Flame,
  Sliders,
  Sparkles,
  Mountain,
  CheckCircle2,
  RefreshCw,
  Database,
  Download,
  Radio,
  Activity,
  Navigation,
  Route,
  Play,
  Pause,
} from 'lucide-react';
import { EXPLORATION_TARGETS, SAMPLE_DRILLHOLES, GEOCHEMICAL_ASSAYS } from '../data/miningData';
import {
  HISTORICAL_DRILLING_GEOJSON_BY_REGION,
  HistoricalGeoJsonFeature,
} from '../data/historicalDrillingGeoJson';
import { Region, ExplorationTarget } from '../types';
import { gisMappingService, BaseMapMode, BaseMapMetadata } from '../services/gisMappingService';
import { BaseMapToggle } from './BaseMapToggle';
import { MiningLogisticsRouteAgent } from './MiningLogisticsRouteAgent';
import { PredictiveHeatmapLegend } from './PredictiveHeatmapLegend';

export interface RealTimeGeochemSensorNode {
  id: string;
  collarName: string;
  mapX: number;
  mapY: number;
  commodity: string;
  baseAuPpm: number;
  currentAuPpm: number;
  baseCuPct: number;
  currentCuPct: number;
  baseLiPpm: number;
  currentLiPpm: number;
  baseAsPpm: number;
  currentAsPpm: number;
  fluxIntensityPct: number;
  intensityCategory: 'Low' | 'Moderate' | 'High Surge';
  colorHex: string;
  gradientId: string;
  lastUpdatedMs: number;
}

export interface PredictedHighYieldZone {
  zoneId: string;
  zoneName: string;
  commodity: string;
  mapX: number;
  mapY: number;
  radiusPx: number;
  polygonPoints: string;
  coordinates: [number, number];
  yieldPotentialScore: number;
  estimatedTonnageGrade: string;
  geochemicalSignature: string;
  vibrationSignature: string;
  dominantFrequencyBand: string;
  mseAnomalyMpa: number;
  shearVelocityDropPct: number;
  recommendedDrillDepthM: string;
  aiReasoning: string;
}

export interface MineralAnomalyPredictionResult {
  region: string;
  metallogenicProvince: string;
  coincidentCorrelationScore: number;
  fusionModelSummary: string;
  predictedHighYieldZones: PredictedHighYieldZone[];
}

const INITIAL_ANOMALY_PREDICTIONS_BY_REGION: Record<Region, MineralAnomalyPredictionResult> = {
  Canada: {
    region: 'Canada',
    metallogenicProvince: 'Abitibi Greenstone & James Bay Pegmatite Corridor',
    coincidentCorrelationScore: 97,
    fusionModelSummary:
      'Gemini Multi-Modal Spatial Fusion cross-correlates Abitibi & James Bay multi-element geochemical halos (Au-As-Bi-Te & Li-Cs-Ta) with Ambient Noise Tomography (ANT Vs velocity inversions) and downhole diamond-bit vibration resonance (80–150 Hz fracture spikes & 185 kHz pegmatite crystal harmonics).',
    predictedHighYieldZones: [
      {
        zoneId: 'HYZ-CA-01',
        zoneName: 'Cadillac-Malartic Shear Apex High-Yield Zone',
        commodity: 'Au-Cu (Orogenic Quartz-Sulfide)',
        mapX: 335,
        mapY: 225,
        radiusPx: 68,
        polygonPoints: '275,190 365,172 405,228 370,278 282,262',
        coordinates: [-79.0412, 48.2685],
        yieldPotentialScore: 97,
        estimatedTonnageGrade: '18.4 Mt @ 7.15 g/t Au & 1.42% Cu',
        geochemicalSignature: 'Au 9.8 ppm, As 1,420 ppm, Bi-Te pathfinder halo (>96th percentile)',
        vibrationSignature: '80–145 Hz micro-seismic fracture spikes + ANT Vs drop -14.8%',
        dominantFrequencyBand: '80–150 Hz (Fracture Sulfide Resonance)',
        mseAnomalyMpa: 365,
        shearVelocityDropPct: 14.8,
        recommendedDrillDepthM: '240m – 620m',
        aiReasoning:
          'Coincident multi-element Au-As-Te geochemical dispersion peak directly overlies a sharp 80–150 Hz acoustic impedance boundary and 3.8 Hz ambient noise tomography low-velocity shear conduit.',
      },
      {
        zoneId: 'HYZ-CA-02',
        zoneName: 'James Bay Spodumene Pegmatite Acoustic Wall',
        commodity: 'Li₂O (LCT Spodumene Pegmatite)',
        mapX: 645,
        mapY: 275,
        radiusPx: 64,
        polygonPoints: '585,235 695,228 715,288 655,325 580,302',
        coordinates: [-78.864, 48.219],
        yieldPotentialScore: 94,
        estimatedTonnageGrade: '24.2 Mt @ 1.96% Li₂O & 185 ppm Ta₂O₅',
        geochemicalSignature: 'Li 3,840 ppm, Cs 410 ppm, Rb/K fractionation index >0.045',
        vibrationSignature: '165–225 kHz diamond-bit crystal resonance + 512 MPa MSE surge',
        dominantFrequencyBand: '120–250 kHz (Crystalline Pegmatite Lattice)',
        mseAnomalyMpa: 512,
        shearVelocityDropPct: -11.2,
        recommendedDrillDepthM: '110m – 380m',
        aiReasoning:
          'Extreme Li-Cs-Ta soil/core geochemical anomaly aligns with a high-velocity Vp (+11.2%) rigid pegmatite dike swarm exhibiting 185 kHz bit micro-shock signatures.',
      },
      {
        zoneId: 'HYZ-CA-03',
        zoneName: 'Noranda Deep VMS Sulfide Feeder Lens',
        commodity: 'Cu-Zn-Au (Volcanogenic Massive Sulfide)',
        mapX: 495,
        mapY: 365,
        radiusPx: 58,
        polygonPoints: '442,330 535,322 558,378 502,412 438,388',
        coordinates: [-78.948, 48.182],
        yieldPotentialScore: 91,
        estimatedTonnageGrade: '11.6 Mt @ 2.85% Cu, 4.10% Zn & 2.1 g/t Au',
        geochemicalSignature: 'Cu 2.45%, Zn 3.90%, Na₂O alteration depletion index <0.4%',
        vibrationSignature: '24–38 Hz continuous shear attenuation + >3.25 g/cm³ density pocket',
        dominantFrequencyBand: '20–40 Hz (Sulfide Shear Wave Attenuation)',
        mseAnomalyMpa: 318,
        shearVelocityDropPct: 16.4,
        recommendedDrillDepthM: '420m – 850m',
        aiReasoning:
          'Deep Cu-Zn feeder alteration pipe coincides with a pronounced 0.5–4.5 Hz ANT shear-wave slowness pocket (-16.4% Vs) and rhythmic 32 Hz axial drill chatter.',
      },
    ],
  },
  USA: {
    region: 'USA',
    metallogenicProvince: 'Carlin Trend & Great Basin Porphyry-Epithermal Belt',
    coincidentCorrelationScore: 96,
    fusionModelSummary:
      'Combined Au-Hg-Tl-Sb geochemical pathfinder vectors and Cu-Mo porphyry shells in Nevada correlate with 80–150 Hz silicified breccia fracture resonance and 20–40 Hz porphyry shear-wave attenuation zones.',
    predictedHighYieldZones: [
      {
        zoneId: 'HYZ-US-01',
        zoneName: 'Carlin Lower-Plate Decarbonatized Breccia Core',
        commodity: 'Au (Carlin-Type Replacement)',
        mapX: 350,
        mapY: 235,
        radiusPx: 66,
        polygonPoints: '290,195 395,185 418,245 368,288 285,268',
        coordinates: [-116.412, 40.742],
        yieldPotentialScore: 96,
        estimatedTonnageGrade: '21.5 Mt @ 8.40 g/t Au',
        geochemicalSignature: 'Au 11.2 ppm, Hg-Tl-Sb-As Carlin pathfinder suite (>95th pct)',
        vibrationSignature: '95–140 Hz silicified breccia fracture spikes + Vs impedance trough',
        dominantFrequencyBand: '80–150 Hz (Silicified Breccia Resonance)',
        mseAnomalyMpa: 382,
        shearVelocityDropPct: 15.2,
        recommendedDrillDepthM: '320m – 740m',
        aiReasoning:
          'Strong Au-As-Sb-Tl geochemical vector intersects a decarbonatized Roberts Mountains Formation collapse breccia imaged by 3–8 Hz ANT wave scatter.',
      },
      {
        zoneId: 'HYZ-US-02',
        zoneName: 'Battle Mountain Potassic Porphyry Stockwork',
        commodity: 'Cu-Mo-Au (Porphyry Stockwork)',
        mapX: 625,
        mapY: 290,
        radiusPx: 62,
        polygonPoints: '565,248 675,242 692,302 635,342 560,315',
        coordinates: [-116.265, 40.688],
        yieldPotentialScore: 93,
        estimatedTonnageGrade: '85.0 Mt @ 1.18% Cu, 0.045% Mo & 0.65 g/t Au',
        geochemicalSignature: 'Cu 1.35%, Mo 480 ppm, K-silicate alteration core',
        vibrationSignature: '28–42 Hz shear attenuation + 310 MPa rotational torque dampening',
        dominantFrequencyBand: '20–40 Hz (Porphyry Sulfide Attenuation)',
        mseAnomalyMpa: 310,
        shearVelocityDropPct: 13.9,
        recommendedDrillDepthM: '250m – 900m',
        aiReasoning:
          'Concentric Cu-Mo geochemical shell matches a 1.2 km wide high Vp/Vs porphyry cupola anomaly and 35 Hz active drilling vibration signature.',
      },
    ],
  },
  Europe: {
    region: 'Europe',
    metallogenicProvince: 'Fennoscandian Shield (Kiruna-Boliden-Kittilä Belt)',
    coincidentCorrelationScore: 95,
    fusionModelSummary:
      'Fennoscandian Cu-Au-REE IOCG and orogenic gold geochemical anomalies converge with dense 20–40 Hz magnetite-sulfide shear attenuation and 90–145 Hz brittle shear fracture acoustics.',
    predictedHighYieldZones: [
      {
        zoneId: 'HYZ-EU-01',
        zoneName: 'Kiruna Per Geijer IOCG-REE Deep Apatite Lens',
        commodity: 'Cu-Au-REE (IOCG Magnetite-Chalcopyrite)',
        mapX: 375,
        mapY: 230,
        radiusPx: 66,
        polygonPoints: '315,190 420,182 445,240 390,282 310,265',
        coordinates: [20.165, 67.882],
        yieldPotentialScore: 95,
        estimatedTonnageGrade: '42.0 Mt @ 1.95% Cu, 1.4 g/t Au & 2.35% TREO',
        geochemicalSignature: 'Cu 2.1%, La+Ce+Nd 18,400 ppm, Co 420 ppm',
        vibrationSignature: '22–36 Hz dense magnetite-sulfide attenuation + 3.85 g/cm³ SG',
        dominantFrequencyBand: '20–40 Hz (IOCG High-Density Shear Band)',
        mseAnomalyMpa: 395,
        shearVelocityDropPct: 15.6,
        recommendedDrillDepthM: '380m – 950m',
        aiReasoning:
          'Coincident Cu-Au-REE geochemical enrichment and TMI magnetic peak directly match a 25 Hz shear-wave attenuation body.',
      },
      {
        zoneId: 'HYZ-EU-02',
        zoneName: 'Kittilä Suurikuusikko Shear Gold Shoot',
        commodity: 'Au (Refractory Sulfide Shear)',
        mapX: 630,
        mapY: 280,
        radiusPx: 60,
        polygonPoints: '570,240 675,232 695,292 640,330 568,308',
        coordinates: [20.312, 67.834],
        yieldPotentialScore: 92,
        estimatedTonnageGrade: '15.2 Mt @ 6.10 g/t Au',
        geochemicalSignature: 'Au 7.8 ppm, As 2,100 ppm, Sb 185 ppm',
        vibrationSignature: '90–145 Hz brittle quartz-arsenopyrite micro-seismic spikes',
        dominantFrequencyBand: '80–150 Hz (Orogenic Shear Fracture)',
        mseAnomalyMpa: 372,
        shearVelocityDropPct: 13.4,
        recommendedDrillDepthM: '220m – 680m',
        aiReasoning:
          'High-grade Au-As-Sb structural corridor exhibits classic 3–8 Hz ANT wave scatter and 120 Hz active bit chatter.',
      },
    ],
  },
  Australia: {
    region: 'Australia',
    metallogenicProvince: 'Pilbara Craton & Gawler IOCG Province',
    coincidentCorrelationScore: 98,
    fusionModelSummary:
      'Pilbara LCT spodumene pegmatite Li-Cs-Ta halos and Mallina intrusive gold anomalies align with 190–240 kHz crystalline bit resonance and 85–135 Hz shear fracture velocity spikes.',
    predictedHighYieldZones: [
      {
        zoneId: 'HYZ-AU-01',
        zoneName: 'Pilgangoora-Wodgina Spodumene Feeder Dike',
        commodity: 'Li₂O-Ta (Giant LCT Pegmatite)',
        mapX: 360,
        mapY: 240,
        radiusPx: 68,
        polygonPoints: '300,198 408,190 432,250 375,292 295,272',
        coordinates: [119.682, -21.005],
        yieldPotentialScore: 98,
        estimatedTonnageGrade: '38.5 Mt @ 2.12% Li₂O & 210 ppm Ta₂O₅',
        geochemicalSignature: 'Li 4,420 ppm, Cs 520 ppm, Ta 195 ppm',
        vibrationSignature: '190–240 kHz diamond-bit acoustic resonance + 535 MPa MSE',
        dominantFrequencyBand: '120–250 kHz (Spodumene Crystal Resonance)',
        mseAnomalyMpa: 535,
        shearVelocityDropPct: -12.6,
        recommendedDrillDepthM: '90m – 420m',
        aiReasoning:
          'Peak Li-Cs-Ta pegmatite fractionation halo aligns with a high-rigidity Vp seismic wall (+12.6%) and 210 kHz bit acoustic resonance.',
      },
      {
        zoneId: 'HYZ-AU-02',
        zoneName: 'Hemi-Style Intrusive Gold-Sulfide Crown',
        commodity: 'Au-Cu (Sanukitoid Intrusive Hosted)',
        mapX: 635,
        mapY: 285,
        radiusPx: 62,
        polygonPoints: '575,245 680,238 702,298 645,338 572,312',
        coordinates: [119.815, -21.052],
        yieldPotentialScore: 94,
        estimatedTonnageGrade: '26.4 Mt @ 4.85 g/t Au & 0.65% Cu',
        geochemicalSignature: 'Au 6.4 ppm, As 980 ppm, Bi-Te-Mo intrusive pathfinders',
        vibrationSignature: '85–135 Hz fracture velocity spikes + 355 MPa MSE transition',
        dominantFrequencyBand: '80–150 Hz (Intrusive Breccia Spikes)',
        mseAnomalyMpa: 355,
        shearVelocityDropPct: 14.1,
        recommendedDrillDepthM: '180m – 560m',
        aiReasoning:
          'Coincident sanukitoid Au-Bi-Te soil/core halo and 110 Hz downhole acoustic fracture zone along the Mallina shear.',
      },
    ],
  },
  Africa: {
    region: 'Africa',
    metallogenicProvince: 'Central African Copperbelt & Bushveld Complex',
    coincidentCorrelationScore: 98,
    fusionModelSummary:
      'Katanga Copperbelt Cu-Co redox boundary geochemical highs directly overlay laterally continuous 20–35 Hz shear-wave attenuation blankets (-17.2% Vs slow-zones).',
    predictedHighYieldZones: [
      {
        zoneId: 'HYZ-AF-01',
        zoneName: 'Kamoa-Kakula Roan Basal Chalcocite Blanket',
        commodity: 'Cu-Co (Stratiform Sediment-Hosted)',
        mapX: 365,
        mapY: 235,
        radiusPx: 70,
        polygonPoints: '302,192 415,185 438,245 382,290 298,268',
        coordinates: [25.258, -10.792],
        yieldPotentialScore: 98,
        estimatedTonnageGrade: '54.0 Mt @ 4.65% Cu & 0.38% Co',
        geochemicalSignature: 'Cu 5.12%, Co 3,850 ppm, Bi-Ag redox boundary peak',
        vibrationSignature: '20–35 Hz continuous shear attenuation + -17.2% ANT Vs slow-zone',
        dominantFrequencyBand: '20–40 Hz (High-Density Sulfide Blanket)',
        mseAnomalyMpa: 328,
        shearVelocityDropPct: 17.2,
        recommendedDrillDepthM: '260m – 720m',
        aiReasoning:
          'Bonanza Cu-Co redox contact geochemistry correlates with a laterally continuous 28 Hz shear-wave attenuation horizon.',
      },
      {
        zoneId: 'HYZ-AF-02',
        zoneName: 'Katanga Domes Structural Thrust Breccia',
        commodity: 'Cu-Au-U (Thrust Decollement Breccia)',
        mapX: 640,
        mapY: 295,
        radiusPx: 60,
        polygonPoints: '580,255 685,248 705,308 650,345 578,320',
        coordinates: [25.394, -10.848],
        yieldPotentialScore: 92,
        estimatedTonnageGrade: '22.8 Mt @ 2.75% Cu & 1.25 g/t Au',
        geochemicalSignature: 'Cu 2.90%, Au 1.65 ppm, U 340 ppm, Mo 210 ppm',
        vibrationSignature: '55–95 Hz axial chatter + 345 MPa impedance contrast',
        dominantFrequencyBand: '40–90 Hz (Fractured Sulfide Shear)',
        mseAnomalyMpa: 345,
        shearVelocityDropPct: 14.5,
        recommendedDrillDepthM: '310m – 650m',
        aiReasoning:
          'Thrust-fault breccia Cu-Au anomaly aligns with a strong 65 Hz axial vibration dampening zone and ANT velocity step.',
      },
    ],
  },
};

interface ExplorationGISMapProps {
  selectedRegion: Region;
  onSelectRegion: (region: Region) => void;
  onSelectTarget?: (target: ExplorationTarget) => void;
}

export const ExplorationGISMap: React.FC<ExplorationGISMapProps> = ({
  selectedRegion,
  onSelectRegion,
  onSelectTarget,
}) => {
  const [activeLayers, setActiveLayers] = useState({
    geology: true,
    mineralOccurrences: true,
    faults: true,
    drillholes: true,
    geochemAnomalies: true,
    claims: true,
    mineralHeatmap: true,
    historicalGeoJsonGeochem: true,
    mineralAnomalyPredictor: true,
    predictiveAnomalyHeatmap: true,
  });

  // Mining Logistics, Places & Routes Agent Modal State
  const [isRouteAgentOpen, setIsRouteAgentOpen] = useState<boolean>(false);

  // Real-Time Geochemical Sensor Fluctuations & Predictive Anomaly Heatmap State
  const [isSensorStreaming, setIsSensorStreaming] = useState<boolean>(true);
  const [sensorStreamTick, setSensorStreamTick] = useState<number>(0);
  const [selectedSensorNodeId, setSelectedSensorNodeId] = useState<string>('GC-NODE-101');
  const [geochemSensorNodes, setGeochemSensorNodes] = useState<RealTimeGeochemSensorNode[]>([
    {
      id: 'GC-NODE-101',
      collarName: 'Perron Shear Apex Ionization Sensor',
      mapX: 295,
      mapY: 205,
      commodity: 'Au',
      baseAuPpm: 3.8,
      currentAuPpm: 4.6,
      baseCuPct: 0.45,
      currentCuPct: 0.52,
      baseLiPpm: 120,
      currentLiPpm: 125,
      baseAsPpm: 840,
      currentAsPpm: 920,
      fluxIntensityPct: 84,
      intensityCategory: 'High Surge',
      colorHex: '#EC4899',
      gradientId: 'predictiveSurgeFlux',
      lastUpdatedMs: Date.now(),
    },
    {
      id: 'GC-NODE-102',
      collarName: 'Cadillac Fault Dilational Jog Probe',
      mapX: 430,
      mapY: 260,
      commodity: 'Au-Cu',
      baseAuPpm: 2.1,
      currentAuPpm: 2.4,
      baseCuPct: 1.15,
      currentCuPct: 1.32,
      baseLiPpm: 160,
      currentLiPpm: 168,
      baseAsPpm: 520,
      currentAsPpm: 590,
      fluxIntensityPct: 62,
      intensityCategory: 'Moderate',
      colorHex: '#F59E0B',
      gradientId: 'predictiveModerateFlux',
      lastUpdatedMs: Date.now(),
    },
    {
      id: 'GC-NODE-103',
      collarName: 'James Bay Spodumene Outcrop Spectrometer',
      mapX: 680,
      mapY: 255,
      commodity: 'Li',
      baseAuPpm: 0.12,
      currentAuPpm: 0.14,
      baseCuPct: 0.08,
      currentCuPct: 0.09,
      baseLiPpm: 3100,
      currentLiPpm: 3450,
      baseAsPpm: 65,
      currentAsPpm: 72,
      fluxIntensityPct: 78,
      intensityCategory: 'High Surge',
      colorHex: '#EC4899',
      gradientId: 'predictiveSurgeFlux',
      lastUpdatedMs: Date.now(),
    },
    {
      id: 'GC-NODE-104',
      collarName: 'Noranda VMS Footwall Sensor Node',
      mapX: 520,
      mapY: 375,
      commodity: 'Cu',
      baseAuPpm: 0.85,
      currentAuPpm: 0.92,
      baseCuPct: 2.2,
      currentCuPct: 2.45,
      baseLiPpm: 95,
      currentLiPpm: 102,
      baseAsPpm: 310,
      currentAsPpm: 345,
      fluxIntensityPct: 71,
      intensityCategory: 'Moderate',
      colorHex: '#F59E0B',
      gradientId: 'predictiveModerateFlux',
      lastUpdatedMs: Date.now(),
    },
    {
      id: 'GC-NODE-105',
      collarName: 'East Greenstone Regional Background Sentinel',
      mapX: 790,
      mapY: 340,
      commodity: 'Multi',
      baseAuPpm: 0.25,
      currentAuPpm: 0.28,
      baseCuPct: 0.18,
      currentCuPct: 0.21,
      baseLiPpm: 210,
      currentLiPpm: 225,
      baseAsPpm: 140,
      currentAsPpm: 155,
      fluxIntensityPct: 32,
      intensityCategory: 'Low',
      colorHex: '#06B6D4',
      gradientId: 'predictiveLowFlux',
      lastUpdatedMs: Date.now(),
    },
    {
      id: 'GC-NODE-106',
      collarName: 'North Thrust Contact XRF Sensor',
      mapX: 210,
      mapY: 390,
      commodity: 'Au',
      baseAuPpm: 1.1,
      currentAuPpm: 1.25,
      baseCuPct: 0.35,
      currentCuPct: 0.38,
      baseLiPpm: 80,
      currentLiPpm: 84,
      baseAsPpm: 260,
      currentAsPpm: 285,
      fluxIntensityPct: 38,
      intensityCategory: 'Low',
      colorHex: '#06B6D4',
      gradientId: 'predictiveLowFlux',
      lastUpdatedMs: Date.now(),
    },
  ]);

  // Mineral Anomaly Predictor (Geochemical + Vibration Fusion) States
  const [anomalyPrediction, setAnomalyPrediction] = useState<MineralAnomalyPredictionResult>(
    () => INITIAL_ANOMALY_PREDICTIONS_BY_REGION[selectedRegion] || INITIAL_ANOMALY_PREDICTIONS_BY_REGION.Canada
  );
  const [selectedHighYieldZone, setSelectedHighYieldZone] = useState<PredictedHighYieldZone | null>(
    () =>
      (INITIAL_ANOMALY_PREDICTIONS_BY_REGION[selectedRegion] || INITIAL_ANOMALY_PREDICTIONS_BY_REGION.Canada)
        .predictedHighYieldZones[0] || null
  );
  const [isPredictingAnomalies, setIsPredictingAnomalies] = useState<boolean>(false);
  const [vibrationBandFilter, setVibrationBandFilter] = useState<'all' | '20-40Hz' | '80-150Hz' | '120-250kHz'>('all');
  const [simulatedRigMseMpa, setSimulatedRigMseMpa] = useState<number>(385);
  const [minYieldCutoffScore, setMinYieldCutoffScore] = useState<number>(85);

  const d3GeoJsonGroupRef = useRef<SVGGElement | null>(null);
  const activeGeoJsonCollection = useMemo(
    () => HISTORICAL_DRILLING_GEOJSON_BY_REGION[selectedRegion] || HISTORICAL_DRILLING_GEOJSON_BY_REGION.Canada,
    [selectedRegion]
  );

  const [selectedGeoJsonFeature, setSelectedGeoJsonFeature] = useState<HistoricalGeoJsonFeature | null>(() => {
    const pts = HISTORICAL_DRILLING_GEOJSON_BY_REGION[selectedRegion]?.features.filter(
      (f) => f.geometry.type === 'Point'
    );
    return pts?.[0] || null;
  });
  const [geoJsonColorScaleMode, setGeoJsonColorScaleMode] = useState<'ylorrd' | 'plasma' | 'viridis'>('ylorrd');
  const [isRunningAiGis, setIsRunningAiGis] = useState<boolean>(false);
  const [aiGisAnalysis, setAiGisAnalysis] = useState<{
    region: string;
    metallogenicProvince: string;
    overallProspectivityScore: number;
    regionalVectorSynthesis: string;
    pathfinderRatioAnalysis: string;
    aiRecommendedStepOutCollars: Array<{
      collarId: string;
      name: string;
      coordinates: [number, number];
      mapX: number;
      mapY: number;
      targetCommodity: string;
      predictedInterceptGrade: string;
      confidencePct: number;
      geochemicalRationale: string;
    }>;
  } | null>(null);

  const [selectedTarget, setSelectedTarget] = useState<ExplorationTarget>(EXPLORATION_TARGETS[0]);
  const [mapMode, setMapMode] = useState<BaseMapMode>('terrain');
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showOpticalLabels, setShowOpticalLabels] = useState<boolean>(true);
  const [heatmapCommodity, setHeatmapCommodity] = useState<'all' | 'Au' | 'Cu' | 'Li' | 'REE'>('all');
  const [heatmapIntensity, setHeatmapIntensity] = useState<number>(1.2);
  const [heatmapRadius, setHeatmapRadius] = useState<number>(65);
  const [basemapOpacity, setBasemapOpacity] = useState<number>(100);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [mouseCoords, setMouseCoords] = useState<{ lat: string; lng: string; elev: number } | null>(null);

  const [baseMapMetadata, setBaseMapMetadata] = useState<BaseMapMetadata>(
    gisMappingService.getBaseMapConfig(mapMode, selectedRegion)
  );

  const filteredTargets = EXPLORATION_TARGETS.filter((t) => t.region === selectedRegion);

  // Sync selected target & GeoJSON feature when region updates
  useEffect(() => {
    const firstInRegion = EXPLORATION_TARGETS.find((t) => t.region === selectedRegion);
    if (firstInRegion) {
      setSelectedTarget(firstInRegion);
    }
    const pts = HISTORICAL_DRILLING_GEOJSON_BY_REGION[selectedRegion]?.features.filter(
      (f) => f.geometry.type === 'Point'
    );
    if (pts && pts.length > 0) {
      setSelectedGeoJsonFeature(pts[0]);
    }
    setAiGisAnalysis(null);
    const nextPred =
      INITIAL_ANOMALY_PREDICTIONS_BY_REGION[selectedRegion] || INITIAL_ANOMALY_PREDICTIONS_BY_REGION.Canada;
    setAnomalyPrediction(nextPred);
    setSelectedHighYieldZone(nextPred.predictedHighYieldZones[0] || null);

    // Sync sensor nodes coordinates to region center
    const regionCenters = {
      Canada: { xMod: 0, yMod: 0 },
      USA: { xMod: 30, yMod: -15 },
      Europe: { xMod: -20, yMod: 25 },
      Australia: { xMod: 40, yMod: 10 },
      Africa: { xMod: -15, yMod: -20 },
    };
    const mod = regionCenters[selectedRegion] || regionCenters.Canada;
    setGeochemSensorNodes((nodes) =>
      nodes.map((n, i) => ({
        ...n,
        mapX: Math.max(160, Math.min(840, 220 + (i * 115 + mod.xMod * 2) % 640)),
        mapY: Math.max(160, Math.min(480, 180 + (i * 70 + mod.yMod * 2) % 310)),
      }))
    );
  }, [selectedRegion]);

  // Real-Time Geochemical Sensor Fluctuations Simulator Loop
  useEffect(() => {
    if (!isSensorStreaming) return;
    const interval = setInterval(() => {
      setSensorStreamTick((t) => t + 1);
      setGeochemSensorNodes((prevNodes) =>
        prevNodes.map((node) => {
          const delta = (Math.random() - 0.48) * 0.12;
          const auFactor = Math.max(0.5, 1 + delta);
          const newAu = Number((node.baseAuPpm * auFactor).toFixed(2));
          const newCu = Number((node.baseCuPct * (1 + (Math.random() - 0.48) * 0.1)).toFixed(2));
          const newLi = Math.round(node.baseLiPpm * (1 + (Math.random() - 0.48) * 0.15));
          const newAs = Math.round(node.baseAsPpm * (1 + (Math.random() - 0.48) * 0.12));

          const rawFlux = Math.round(node.fluxIntensityPct + (Math.random() - 0.48) * 14);
          const flux = Math.min(99, Math.max(15, rawFlux));

          let category: 'Low' | 'Moderate' | 'High Surge' = 'Low';
          let color = '#06B6D4';
          let grad = 'predictiveLowFlux';
          if (flux >= 75) {
            category = 'High Surge';
            color = '#EC4899';
            grad = 'predictiveSurgeFlux';
          } else if (flux >= 40) {
            category = 'Moderate';
            color = '#F59E0B';
            grad = 'predictiveModerateFlux';
          }

          return {
            ...node,
            currentAuPpm: newAu,
            currentCuPct: newCu,
            currentLiPpm: newLi,
            currentAsPpm: newAs,
            fluxIntensityPct: flux,
            intensityCategory: category,
            colorHex: color,
            gradientId: grad,
            lastUpdatedMs: Date.now(),
          };
        })
      );
    }, 1800);
    return () => clearInterval(interval);
  }, [isSensorStreaming]);

  const handleTriggerGeochemSensorSurge = () => {
    setGeochemSensorNodes((prevNodes) =>
      prevNodes.map((node, i) => {
        if (i % 2 === 0) {
          return {
            ...node,
            fluxIntensityPct: 94,
            currentAuPpm: Number((node.baseAuPpm * 2.4).toFixed(2)),
            currentCuPct: Number((node.baseCuPct * 1.8).toFixed(2)),
            intensityCategory: 'High Surge',
            colorHex: '#EC4899',
            gradientId: 'predictiveSurgeFlux',
            lastUpdatedMs: Date.now(),
          };
        }
        return node;
      })
    );
  };

  const handleRunMineralAnomalyPredictor = async () => {
    setIsPredictingAnomalies(true);
    try {
      const geochemDigest = activeGeoJsonCollection.features.map((f) => ({
        id: f.properties.holeId || f.properties.id,
        commodity: f.properties.commodity,
        concentrationIndex: f.properties.concentrationIndex,
        auPpm: f.properties.auPpm,
        cuPct: f.properties.cuPct,
        liPpm: f.properties.liPpm,
        pathfinders: f.properties.pathfinderSummary,
      }));
      const res = await fetch('/api/gemini/mineral-anomaly-predictor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: selectedRegion,
          commodityFilter: heatmapCommodity,
          vibrationBandFilter,
          geochemicalSummary: geochemDigest,
          vibrationTelemetry: {
            mseMpa: simulatedRigMseMpa,
            vibeFreqHz:
              vibrationBandFilter === '20-40Hz'
                ? 32
                : vibrationBandFilter === '80-150Hz'
                ? 118
                : vibrationBandFilter === '120-250kHz'
                ? 195
                : 145,
            antShearWaveDropPct: 15.2,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.prediction) {
        setAnomalyPrediction(data.prediction);
        if (data.prediction.predictedHighYieldZones?.length > 0) {
          setSelectedHighYieldZone(data.prediction.predictedHighYieldZones[0]);
        }
        setActiveLayers((prev) => ({ ...prev, mineralAnomalyPredictor: true }));
      }
    } catch (_err) {
      // fallback already populated
    } finally {
      setIsPredictingAnomalies(false);
    }
  };

  const visibleHighYieldZones = useMemo(() => {
    return (anomalyPrediction?.predictedHighYieldZones || []).filter((z) => {
      if (z.yieldPotentialScore < minYieldCutoffScore) return false;
      if (vibrationBandFilter === '20-40Hz') return z.dominantFrequencyBand.includes('20–40');
      if (vibrationBandFilter === '80-150Hz') return z.dominantFrequencyBand.includes('80–150');
      if (vibrationBandFilter === '120-250kHz') return z.dominantFrequencyBand.includes('120–250');
      return true;
    });
  }, [anomalyPrediction, minYieldCutoffScore, vibrationBandFilter]);

  // D3 + GeoJSON Historical Drilling Mineral Concentration Layer Rendering
  useEffect(() => {
    if (!d3GeoJsonGroupRef.current) return;
    const g = d3.select(d3GeoJsonGroupRef.current);
    g.selectAll('*').remove();

    if (!activeLayers.historicalGeoJsonGeochem) return;

    const projection = d3
      .geoMercator()
      .center(activeGeoJsonCollection.metadata.center)
      .scale(activeGeoJsonCollection.metadata.scaleFactor)
      .translate([500, 300]);

    const geoPathGenerator = d3.geoPath().projection(projection as any);

    const interpolator =
      geoJsonColorScaleMode === 'ylorrd'
        ? d3.interpolateYlOrRd
        : geoJsonColorScaleMode === 'plasma'
        ? d3.interpolatePlasma
        : d3.interpolateViridis;

    const colorScale = d3.scaleSequential(interpolator).domain([35, 100]);
    const radiusScale = d3.scaleSqrt().domain([50, 100]).range([7, 17]);

    const filteredFeatures = activeGeoJsonCollection.features.filter((f) => {
      if (heatmapCommodity === 'all') return true;
      return f.properties.commodity === heatmapCommodity;
    });

    // 1. Render GeoJSON Polygon Iso-Concentration Dispersion Halos
    const polygons = filteredFeatures.filter((f) => f.geometry.type === 'Polygon');
    g.selectAll('path.geojson-dispersion-poly')
      .data(polygons)
      .enter()
      .append('path')
      .attr('class', 'geojson-dispersion-poly')
      .attr('d', (d) => geoPathGenerator(d as any) || '')
      .attr('fill', (d) => colorScale(d.properties.concentrationIndex))
      .attr('fill-opacity', 0.22 * Math.min(1.5, heatmapIntensity))
      .attr('stroke', (d) => colorScale(d.properties.concentrationIndex))
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,3');

    // 2. Render GeoJSON LineString Historical Drill Fence Structural Trends
    const lines = filteredFeatures.filter((f) => f.geometry.type === 'LineString');
    g.selectAll('path.geojson-fence-line')
      .data(lines)
      .enter()
      .append('path')
      .attr('class', 'geojson-fence-line')
      .attr('d', (d) => geoPathGenerator(d as any) || '')
      .attr('fill', 'none')
      .attr('stroke', '#38BDF8')
      .attr('stroke-width', 2.4)
      .attr('stroke-dasharray', '8,4')
      .attr('opacity', 0.85);

    // 3. Render GeoJSON Point Historical Drilling Mineral Concentration Collars
    const points = filteredFeatures.filter((f) => f.geometry.type === 'Point');
    const pointNodes = g
      .selectAll('g.geojson-collar-node')
      .data(points)
      .enter()
      .append('g')
      .attr('class', 'geojson-collar-node')
      .style('cursor', 'pointer')
      .attr('transform', (d) => {
        const coords = projection(d.geometry.coordinates as [number, number]) || [500, 300];
        return `translate(${coords[0]}, ${coords[1]})`;
      })
      .on('click', (_event, d) => {
        setSelectedGeoJsonFeature(d);
      });

    // Outer D3 Geochemical Concentration Halo Ring
    pointNodes
      .append('circle')
      .attr('r', (d) => radiusScale(d.properties.concentrationIndex) * 2.1 * heatmapIntensity)
      .attr('fill', (d) => colorScale(d.properties.concentrationIndex))
      .attr('fill-opacity', 0.28)
      .attr('stroke', (d) => colorScale(d.properties.concentrationIndex))
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3,2');

    // Inner Collar Concentration Circle
    pointNodes
      .append('circle')
      .attr('r', (d) => radiusScale(d.properties.concentrationIndex))
      .attr('fill', (d) => colorScale(d.properties.concentrationIndex))
      .attr('stroke', (d) =>
        selectedGeoJsonFeature?.properties.id === d.properties.id ? '#FFFFFF' : '#1C100B'
      )
      .attr('stroke-width', (d) =>
        selectedGeoJsonFeature?.properties.id === d.properties.id ? 2.8 : 1.5
      );

    // Center Crosshair Dot
    pointNodes.append('circle').attr('r', 2.5).attr('fill', '#1C100B');

    // Collar ID & Concentration Label Badge
    pointNodes
      .append('rect')
      .attr('x', 12)
      .attr('y', -13)
      .attr('width', 132)
      .attr('height', 24)
      .attr('rx', 4)
      .attr('fill', '#0C0A09')
      .attr('fill-opacity', 0.88)
      .attr('stroke', (d) => colorScale(d.properties.concentrationIndex))
      .attr('stroke-width', 1);

    pointNodes
      .append('text')
      .attr('x', 17)
      .attr('y', -2)
      .attr('fill', '#FDE047')
      .attr('font-size', '8.5px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d) => `${d.properties.holeId} (${d.properties.concentrationIndex}%)`);

    pointNodes
      .append('text')
      .attr('x', 17)
      .attr('y', 7.5)
      .attr('fill', '#E7E5E4')
      .attr('font-size', '8px')
      .attr('font-family', 'sans-serif')
      .text((d) => d.properties.gradeLabel.slice(0, 22));
  }, [
    activeGeoJsonCollection,
    activeLayers.historicalGeoJsonGeochem,
    heatmapCommodity,
    heatmapIntensity,
    geoJsonColorScaleMode,
    selectedGeoJsonFeature,
  ]);

  const handleRunAiGisProspectivity = async () => {
    setIsRunningAiGis(true);
    try {
      const res = await fetch('/api/gemini/gis-geochem-prospectivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region: selectedRegion,
          commodityFilter: heatmapCommodity,
          geoJsonFeatures: activeGeoJsonCollection.features,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiGisAnalysis(data.analysis);
      }
    } catch (_err) {
      // handled gracefully by server fallback
    } finally {
      setIsRunningAiGis(false);
    }
  };

  const handleDownloadGeoJsonFile = () => {
    const blob = new Blob([JSON.stringify(activeGeoJsonCollection, null, 2)], {
      type: 'application/geo+json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Historical_Drilling_Geochemistry_${selectedRegion}_GeoJSON.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Keep GIS mapping metadata in sync when mode or region shifts
  useEffect(() => {
    setBaseMapMetadata(gisMappingService.getBaseMapConfig(mapMode, selectedRegion));
  }, [mapMode, selectedRegion]);

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    // Calculate approximate coordinates based on selected region
    const baseLat = selectedRegion === 'Canada' ? 48.24 : selectedRegion === 'USA' ? 40.71 : selectedRegion === 'Australia' ? -21.03 : selectedRegion === 'Africa' ? -10.82 : 52.76;
    const baseLng = selectedRegion === 'Canada' ? -78.98 : selectedRegion === 'USA' ? -116.34 : selectedRegion === 'Australia' ? 119.74 : selectedRegion === 'Africa' ? 25.32 : 6.35;

    const lat = (baseLat + (0.5 - yPct) * 0.45).toFixed(4);
    const lng = (baseLng + (xPct - 0.5) * 0.65).toFixed(4);
    const elev = gisMappingService.getElevationAtCoords(selectedRegion, xPct, yPct);

    setMouseCoords({
      lat: `${Math.abs(Number(lat))}° ${Number(lat) >= 0 ? 'N' : 'S'}`,
      lng: `${Math.abs(Number(lng))}° ${Number(lng) >= 0 ? 'E' : 'W'}`,
      elev,
    });
  };

  // Region center coordinates & simulated GIS map boundaries
  const regionConfig: Record<Region, { title: string; centerLat: string; centerLng: string; crs: string }> = {
    Canada: { title: 'Canadian Shield & Archean Belts', centerLat: '48.24° N', centerLng: '78.98° W', crs: 'NAD83 / UTM zone 17N' },
    USA: { title: 'Great Basin & Southwest Porphyry Arc', centerLat: '40.71° N', centerLng: '116.34° W', crs: 'NAD83 / Nevada Central' },
    Europe: { title: 'Fennoscandian & Iberian Metallogenic Provinces', centerLat: '52.76° N', centerLng: '6.35° E', crs: 'ETRS89 / UTM 30N' },
    Australia: { title: 'Pilbara & Gawler Craton Terranes', centerLat: '21.03° S', centerLng: '119.74° E', crs: 'GDA2020 / MGA zone 50' },
    Africa: { title: 'Central African Copperbelt & Bushveld Complex', centerLat: '10.82° S', centerLng: '25.32° E', crs: 'WGS 84 / UTM 35S' },
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Map Region Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe size={24} className="text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              GIS Exploration Center & 3D Spatial Maps
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Multi-layer geoscientific GIS integrating geological formations, aeromagnetics, drillholes, and geochemical vectors.
          </p>
        </div>

          {/* Region Selector Tabs & Places/Routes Agent Button */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              id="btn-open-logistics-route-agent"
              onClick={() => setIsRouteAgentOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md transition-all border border-blue-400/40"
              title="Open Mining Logistics, Places, Routes & Directions Agent"
            >
              <Navigation size={13} className="text-amber-300" />
              <span>Places &amp; Routes Agent</span>
            </button>

            {(['Canada', 'USA', 'Europe', 'Australia', 'Africa'] as Region[]).map((r) => (
            <button
              key={r}
              id={`btn-gis-region-${r.toLowerCase()}`}
              onClick={() => {
                onSelectRegion(r);
                const firstInRegion = EXPLORATION_TARGETS.find((t) => t.region === r);
                if (firstInRegion) setSelectedTarget(firstInRegion);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedRegion === r
                  ? 'bg-amber-500 text-stone-950 font-extrabold shadow-md'
                  : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive GIS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: GIS Map Stage */}
        <div className="lg:col-span-3 space-y-3">
          {/* Top Map Action Bar with BaseMapToggle Interface */}
          <BaseMapToggle
            currentMode={mapMode}
            currentRegion={selectedRegion}
            onModeChange={async (mode) => {
              setMapMode(mode);
              const res = await gisMappingService.switchBaseMap(mode, selectedRegion);
              setBaseMapMetadata(res.config);
            }}
            opacity={basemapOpacity}
            onOpacityChange={setBasemapOpacity}
            showContours={showContours}
            onToggleContours={setShowContours}
            showOpticalLabels={showOpticalLabels}
            onToggleOpticalLabels={setShowOpticalLabels}
          />

          {/* Interactive Geological Map Canvas */}
          <div
            onMouseMove={handleMapMouseMove}
            onMouseLeave={() => setMouseCoords(null)}
            className="relative overflow-hidden rounded-2xl border-2 border-amber-900/50 h-[520px] shadow-2xl bg-[#130B07] flex items-center justify-center select-none"
          >
            {/* Background Layer: Satellite Ortho vs Terrain Topo vs Aeromagnetic */}
            {mapMode === 'satellite' ? (
              <div
                className="absolute inset-0 transition-all duration-500 bg-cover bg-center"
                style={{
                  opacity: basemapOpacity / 100,
                  transform: `scale(${zoomLevel})`,
                  backgroundImage: `url('https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1600&q=80')`,
                  filter: 'contrast(1.15) brightness(0.85) saturate(1.1)',
                }}
              >
                {/* Optical GIS Gridlines Overlay for Satellite */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:50px_50px]" />
                <div className="absolute inset-0 bg-stone-950/20 mix-blend-multiply" />
              </div>
            ) : mapMode === 'terrain' ? (
              <div
                className="absolute inset-0 transition-all duration-500 bg-cover bg-center"
                style={{
                  opacity: basemapOpacity / 100,
                  transform: `scale(${zoomLevel})`,
                  backgroundImage: `url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80')`,
                  filter: 'sepia(0.3) contrast(1.2) brightness(0.55)',
                }}
              >
                {/* Topographic Contour lines overlay simulation */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#3b2210_0%,#1a0f0a_70%)] opacity-70 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f59e0b12_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b12_1px,transparent_1px)] bg-[size:40px_40px]" />
              </div>
            ) : (
              <div
                className="absolute inset-0 transition-all duration-500 bg-[radial-gradient(circle_at_center,_#4C1D95_0%,_#1E1B4B_40%,_#0B0604_90%)]"
                style={{ opacity: basemapOpacity / 100, transform: `scale(${zoomLevel})` }}
              />
            )}

            {/* Simulated Geological GIS Vector Layer (SVG) */}
            <svg
              className="absolute inset-0 w-full h-full transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                {/* Geological pattern 1: Greenstone belt */}
                <pattern id="greenstonePattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 0,20 Q 10,10 20,20 T 40,20" fill="none" stroke="#10B981" strokeWidth="1" opacity="0.4" />
                </pattern>
                {/* Geological pattern 2: Aeromagnetic contours */}
                <pattern id="magneticContours" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="24" fill="none" stroke="#F59E0B" strokeWidth="0.8" opacity="0.35" />
                  <circle cx="30" cy="30" r="14" fill="none" stroke="#EC4899" strokeWidth="1" opacity="0.45" />
                </pattern>

                {/* Topographic Elevation Contours (Active in Terrain View) */}
                <pattern id="topoContours" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M 0,40 Q 20,20 40,40 T 80,40" fill="none" stroke="#d97706" strokeWidth="0.8" opacity="0.5" />
                  <path d="M 0,60 Q 20,40 40,60 T 80,60" fill="none" stroke="#b45309" strokeWidth="0.6" opacity="0.4" />
                </pattern>

                {/* Mineral Concentration Heatmap Radial Gradients */}
                <radialGradient id="heatmapBonanza" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EC4899" stopOpacity="0.9" />
                  <stop offset="35%" stopColor="#EF4444" stopOpacity="0.75" />
                  <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.45" />
                  <stop offset="90%" stopColor="#10B981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="heatmapHigh" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                  <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.5" />
                  <stop offset="80%" stopColor="#84CC16" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#84CC16" stopOpacity="0" />
                </radialGradient>
                {/* Predictive Anomaly Heatmap Real-Time Sensor Flux Gradients */}
                <radialGradient id="predictiveSurgeFlux" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#EC4899" stopOpacity="0.95" />
                  <stop offset="40%" stopColor="#EF4444" stopOpacity="0.75" />
                  <stop offset="75%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="predictiveModerateFlux" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#F97316" stopOpacity="0.55" />
                  <stop offset="85%" stopColor="#06B6D4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="predictiveLowFlux" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.7" />
                  <stop offset="55%" stopColor="#10B981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Dynamic Terrain Topographic Contours & Drainage Network */}
              {mapMode === 'terrain' && showContours && (
                <g id="gis-terrain-topography-contours" opacity={0.75}>
                  <path
                    d="M 50,150 C 180,110 320,180 480,140 S 750,90 950,160"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="1.2"
                    strokeDasharray="6 2"
                  />
                  <text x="60" y="145" fill="#F59E0B" fontSize="9" fontFamily="monospace">450m</text>

                  <path
                    d="M 60,260 C 220,210 380,290 560,240 S 820,180 940,270"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                  />
                  <text x="70" y="255" fill="#F59E0B" fontSize="9" fontFamily="monospace">500m (Ridge Crest)</text>

                  <path
                    d="M 80,380 C 240,320 420,400 620,350 S 860,290 960,390"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="1.2"
                    strokeDasharray="6 2"
                  />
                  <text x="90" y="375" fill="#F59E0B" fontSize="9" fontFamily="monospace">550m</text>

                  <path
                    d="M 120,480 C 280,440 460,510 680,460 S 880,400 970,490"
                    fill="none"
                    stroke="#B45309"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                  />
                  <text x="130" y="475" fill="#D97706" fontSize="9" fontFamily="monospace">600m (Summit)</text>

                  {/* River & Catchment Drainage network */}
                  <path
                    d="M 880,80 Q 720,200 590,320 T 320,450 T 80,560"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.2"
                    opacity="0.8"
                  />
                  <text x="610" y="315" fill="#7DD3FC" fontSize="10" fontWeight="bold">
                    PERRON RIVER BASIN (HYDROLOGY)
                  </text>
                </g>
              )}

              {/* Dynamic Satellite Orthophoto Annotation Marks */}
              {mapMode === 'satellite' && showOpticalLabels && (
                <g id="gis-satellite-ground-features" opacity={0.7}>
                  {/* Mine Pit Footprint Outline */}
                  <polygon
                    points="310,210 470,180 520,310 420,390 280,310"
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                  />
                  <text x="320" y="200" fill="#FDE047" fontSize="9" fontFamily="monospace">
                    [OPTICAL] OPEN PIT BENCH #4
                  </text>

                  {/* Access Haul Roads */}
                  <path
                    d="M 180,120 L 310,210 L 420,390 L 610,480"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                    opacity="0.6"
                  />
                  <text x="190" y="115" fill="#E2E8F0" fontSize="8" fontFamily="monospace">
                    HAUL ROAD 01
                  </text>
                </g>
              )}

              {/* Dynamic Mineral Concentration Heatmap Overlay Layer */}
              {activeLayers.mineralHeatmap && (
                <g id="gis-mineral-concentration-heatmap" opacity={0.88}>
                  {/* Geochemical assay concentration plumes */}
                  {GEOCHEMICAL_ASSAYS.filter((assay) => {
                    if (heatmapCommodity === 'all') return true;
                    if (heatmapCommodity === 'Au') return (assay.auPpm || 0) > 0.4;
                    if (heatmapCommodity === 'Cu') return (assay.cuPct || 0) > 0.4;
                    if (heatmapCommodity === 'Li') return (assay.liPpm || 0) > 400;
                    if (heatmapCommodity === 'REE') return (assay.reePpm || 0) > 800;
                    return true;
                  }).map((assay, aIdx) => {
                    const cx = 180 + ((aIdx * 85) % 680);
                    const cy = 160 + ((aIdx * 58) % 320);
                    const isHigh = assay.anomalyRating === 'High-Priority';
                    const rad = (isHigh ? heatmapRadius * 1.3 : heatmapRadius) * heatmapIntensity;
                    return (
                      <circle
                        key={`heat-assay-${aIdx}`}
                        cx={cx}
                        cy={cy}
                        r={rad}
                        fill={isHigh ? 'url(#heatmapHigh)' : 'url(#heatmapModerate)'}
                      />
                    );
                  })}

                  {/* High-Value Exploration Targets Heatmap Plumes */}
                  {filteredTargets
                    .filter((target) => {
                      if (heatmapCommodity === 'all') return true;
                      return target.commodity.toLowerCase().includes(heatmapCommodity.toLowerCase());
                    })
                    .map((target, tIdx) => {
                      const tx = 280 + tIdx * 240;
                      const ty = 220 + tIdx * 90;
                      const score = target.targetScore;
                      const isBonanza = score >= 88;
                      const isHigh = score >= 75;
                      const rad =
                        (isBonanza ? heatmapRadius * 1.8 : isHigh ? heatmapRadius * 1.4 : heatmapRadius) *
                        heatmapIntensity;
                      return (
                        <g key={`heat-target-${target.id}`}>
                          <circle
                            cx={tx}
                            cy={ty}
                            r={rad}
                            fill={
                              isBonanza
                                ? 'url(#heatmapBonanza)'
                                : isHigh
                                ? 'url(#heatmapHigh)'
                                : 'url(#heatmapModerate)'
                            }
                          />
                          {isBonanza && (
                            <circle
                              cx={tx}
                              cy={ty}
                              r={rad * 0.45}
                              fill="none"
                              stroke="#EC4899"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                              className="animate-spin-slow"
                            />
                          )}
                        </g>
                      );
                    })}
                </g>
              )}

              {/* Layer 1: Geological Formations */}
              {activeLayers.geology && (
                <g id="gis-geological-units">
                  {/* Archean Greenstone Belt polygon */}
                  <path
                    d="M 120,80 Q 280,140 450,110 T 820,180 L 890,380 Q 640,320 480,440 T 150,420 Z"
                    fill="#15803D"
                    fillOpacity="0.25"
                    stroke="#22C55E"
                    strokeWidth="1.5"
                  />
                  {/* Hydrothermal Porphyry Intrusive Stock */}
                  <polygon
                    points="320,180 440,160 480,260 400,320 310,250"
                    fill="#7E22CE"
                    fillOpacity="0.35"
                    stroke="#A855F7"
                    strokeWidth="2"
                  />
                  {/* Pegmatite Swarm corridor */}
                  <path
                    d="M 540,220 L 780,260 L 760,340 L 520,300 Z"
                    fill="#D97706"
                    fillOpacity="0.3"
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                </g>
              )}

              {/* Layer 2: Aeromagnetic anomalies / Fault Lineaments */}
              {activeLayers.faults && (
                <g id="gis-fault-structures">
                  {/* Regional Crustal Shear Zone Fault */}
                  <path
                    d="M 60,340 Q 320,240 620,280 T 940,160"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="3"
                    strokeDasharray="8 4"
                  />
                  <path
                    d="M 380,80 L 450,520"
                    fill="none"
                    stroke="#F97316"
                    strokeWidth="2"
                    strokeDasharray="5 3"
                  />
                  <text x="630" y="270" fill="#EF4444" fontSize="11" fontWeight="bold" opacity="0.8">
                    CADILLAC-LARDER SHEAR FAULT SPLAY
                  </text>
                </g>
              )}

              {/* Layer 3: Exploration Claim Concessions */}
              {activeLayers.claims && (
                <g id="gis-mining-claims">
                  <rect x="220" y="140" width="280" height="220" fill="none" stroke="#FBBF24" strokeWidth="1.2" strokeDasharray="6 3" opacity="0.6" />
                  <rect x="520" y="200" width="300" height="180" fill="none" stroke="#A855F7" strokeWidth="1.2" strokeDasharray="6 3" opacity="0.6" />
                  <text x="230" y="160" fill="#FBBF24" fontSize="10" fontWeight="bold" opacity="0.7">
                    MINEX CONCESSION BLOCK A (142 km²)
                  </text>
                </g>
              )}

              {/* Layer 4: Geochemical Anomalies */}
              {activeLayers.geochemAnomalies && (
                <g id="gis-geochem-anomalies">
                  {GEOCHEMICAL_ASSAYS.map((assay, aIdx) => {
                    const cx = 200 + (aIdx * 75) % 650;
                    const cy = 180 + (aIdx * 55) % 300;
                    const isHigh = assay.anomalyRating === 'High-Priority';
                    return (
                      <g key={aIdx} className="transition-transform hover:scale-125">
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHigh ? 16 : 9}
                          fill={isHigh ? '#EF4444' : '#F59E0B'}
                          fillOpacity={isHigh ? 0.4 : 0.25}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHigh ? 6 : 4}
                          fill={isHigh ? '#F87171' : '#FBBF24'}
                          stroke="#1C100B"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Layer 5: Drillhole Collars */}
              {activeLayers.drillholes && (
                <g id="gis-drillholes">
                  {SAMPLE_DRILLHOLES.map((dh, dIdx) => {
                    const dx = 340 + dIdx * 110;
                    const dy = 230 + dIdx * 45;
                    return (
                      <g key={dIdx} className="cursor-pointer">
                        <polygon
                          points={`${dx},${dy - 10} ${dx + 8},${dy + 6} ${dx - 8},${dy + 6}`}
                          fill="#38BDF8"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                        <text x={dx + 10} y={dy + 4} fill="#E0F2FE" fontSize="10" fontWeight="bold">
                          {dh.holeId} ({dh.totalDepthM}m)
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Layer 5B: D3 + GeoJSON Historical Drilling Mineral Concentration Layer */}
              <g ref={d3GeoJsonGroupRef} id="gis-d3-geojson-historical-drilling-layer" />

              {/* Layer 5C: Gemini AI Recommended Step-Out Collars from GeoJSON Analysis */}
              {aiGisAnalysis &&
                aiGisAnalysis.aiRecommendedStepOutCollars.map((collar) => (
                  <g
                    key={collar.collarId}
                    className="cursor-pointer"
                    transform={`translate(${collar.mapX}, ${collar.mapY})`}
                  >
                    <circle
                      r="22"
                      fill="#10B981"
                      fillOpacity="0.22"
                      stroke="#34D399"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <polygon
                      points="0,-11 10,8 -10,8"
                      fill="#10B981"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                    />
                    <rect
                      x="-68"
                      y="11"
                      width="136"
                      height="22"
                      rx="4"
                      fill="#064E3B"
                      stroke="#34D399"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="21"
                      textAnchor="middle"
                      fill="#A7F3D0"
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {collar.collarId} ({collar.confidencePct}% AI)
                    </text>
                    <text
                      x="0"
                      y="29.5"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="7.5"
                    >
                      {collar.predictedInterceptGrade}
                    </text>
                  </g>
                ))}

              {/* Layer 5D: Mineral Anomaly Predictor — High-Yield Zones (Combined Geochemical + Vibration AI Overlay) */}
              {activeLayers.mineralAnomalyPredictor && (
                <g id="gis-mineral-anomaly-predictor-layer">
                  {visibleHighYieldZones.map((zone) => {
                    const isZoneSelected = selectedHighYieldZone?.zoneId === zone.zoneId;
                    return (
                      <g
                        key={zone.zoneId}
                        onClick={() => setSelectedHighYieldZone(zone)}
                        className="cursor-pointer"
                      >
                        {/* High-Yield Polygon Zone Footprint */}
                        <polygon
                          points={zone.polygonPoints}
                          fill={isZoneSelected ? '#F43F5E' : '#F59E0B'}
                          fillOpacity={isZoneSelected ? 0.28 : 0.18}
                          stroke={isZoneSelected ? '#FB7185' : '#FBBF24'}
                          strokeWidth={isZoneSelected ? 2.6 : 1.8}
                          strokeDasharray="7 3"
                        />

                        {/* Concentric Seismic Vibration Wave Resonance Ring */}
                        <circle
                          cx={zone.mapX}
                          cy={zone.mapY}
                          r={zone.radiusPx * 0.85}
                          fill="none"
                          stroke="#22D3EE"
                          strokeWidth="1.4"
                          strokeDasharray="4 4"
                          opacity="0.85"
                        />
                        <circle
                          cx={zone.mapX}
                          cy={zone.mapY}
                          r={zone.radiusPx * 0.52}
                          fill="#F43F5E"
                          fillOpacity="0.24"
                          stroke="#F43F5E"
                          strokeWidth="1.5"
                        />

                        {/* Center High-Yield Anomaly Apex Beacon */}
                        <circle
                          cx={zone.mapX}
                          cy={zone.mapY}
                          r={isZoneSelected ? 9 : 7}
                          fill="#F43F5E"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />

                        {/* High-Yield Zone Callout Tag on Map */}
                        <rect
                          x={zone.mapX - 86}
                          y={zone.mapY - 48}
                          width="172"
                          height="34"
                          rx="6"
                          fill="#090504"
                          fillOpacity="0.92"
                          stroke={isZoneSelected ? '#FB7185' : '#22D3EE'}
                          strokeWidth={isZoneSelected ? 1.8 : 1.1}
                        />
                        <text
                          x={zone.mapX}
                          y={zone.mapY - 34}
                          textAnchor="middle"
                          fill="#FDA4AF"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          ★ {zone.zoneId} • {zone.yieldPotentialScore}% HIGH-YIELD
                        </text>
                        <text
                          x={zone.mapX}
                          y={zone.mapY - 21}
                          textAnchor="middle"
                          fill="#67E8F9"
                          fontSize="7.8"
                          fontFamily="monospace"
                        >
                          {zone.estimatedTonnageGrade.slice(0, 28)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Layer 5E: Predictive Anomaly Heatmap (Real-Time Geochemical Sensor Fluctuations Overlay) */}
              {activeLayers.predictiveAnomalyHeatmap && (
                <g id="gis-predictive-anomaly-heatmap-layer">
                  {geochemSensorNodes.map((node) => {
                    const isSurge = node.intensityCategory === 'High Surge';
                    const isModerate = node.intensityCategory === 'Moderate';
                    const baseRadius = isSurge ? 82 : isModerate ? 62 : 44;
                    const isSelected = selectedSensorNodeId === node.id;

                    return (
                      <g
                        key={`sensor-node-${node.id}`}
                        onClick={() => setSelectedSensorNodeId(node.id)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        {/* Dynamic Radial Plume Overlay */}
                        <circle
                          cx={node.mapX}
                          cy={node.mapY}
                          r={baseRadius * (isSurge ? 1.3 : 1.0)}
                          fill={`url(#${node.gradientId})`}
                        />

                        {/* Automatic Color-Coded Intensity Ripple Ring */}
                        <circle
                          cx={node.mapX}
                          cy={node.mapY}
                          r={baseRadius * 0.75}
                          fill="none"
                          stroke={node.colorHex}
                          strokeWidth={isSurge ? 2.4 : 1.4}
                          strokeDasharray={isSurge ? '5 2' : '3 3'}
                          className={isSurge ? 'animate-pulse' : ''}
                        />

                        {/* Center IoT Sensor Pin Dot */}
                        <circle
                          cx={node.mapX}
                          cy={node.mapY}
                          r={isSurge ? 6.5 : 4.5}
                          fill={node.colorHex}
                          stroke="#FFFFFF"
                          strokeWidth={1.8}
                        />

                        {/* Real-Time Sensor Live Reading Overlay Tag */}
                        <rect
                          x={node.mapX - 58}
                          y={node.mapY - 32}
                          width="116"
                          height="20"
                          rx="4"
                          fill="#090504"
                          fillOpacity="0.92"
                          stroke={isSelected ? '#FFFFFF' : node.colorHex}
                          strokeWidth={isSelected ? 1.6 : 1}
                        />
                        <text
                          x={node.mapX}
                          y={node.mapY - 18}
                          textAnchor="middle"
                          fill={node.colorHex}
                          fontSize="8.2"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {node.id} • {node.fluxIntensityPct}% FLUX
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
              {activeLayers.mineralOccurrences &&
                filteredTargets.map((target, tIdx) => {
                  const tx = 280 + tIdx * 240;
                  const ty = 220 + tIdx * 90;
                  const isSelected = selectedTarget.id === target.id;
                  return (
                    <g
                      key={target.id}
                      onClick={() => {
                        setSelectedTarget(target);
                        if (onSelectTarget) onSelectTarget(target);
                      }}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      {/* Outer pulse beacon ring */}
                      <circle
                        cx={tx}
                        cy={ty}
                        r={isSelected ? 26 : 18}
                        fill="#F59E0B"
                        fillOpacity="0.25"
                        className="animate-pulse"
                      />
                      {/* Target Diamond Marker */}
                      <polygon
                        points={`${tx},${ty - 14} ${tx + 14},${ty} ${tx},${ty + 14} ${tx - 14},${ty}`}
                        fill={isSelected ? '#F59E0B' : '#7E22CE'}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <circle cx={tx} cy={ty} r="4" fill="#FFFFFF" />
                      {/* Target Label */}
                      <rect
                        x={tx - 70}
                        y={ty + 18}
                        width="140"
                        height="20"
                        rx="5"
                        fill="#1C100B"
                        fillOpacity="0.85"
                        stroke="#F59E0B"
                        strokeWidth="1"
                      />
                      <text
                        x={tx}
                        y={ty + 32}
                        fill="#FFFFFF"
                        fontSize="9.5"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {target.name.slice(0, 18)}...
                      </text>
                    </g>
                  );
                })}
            </svg>

            {/* Top-Left: Compass Rose & Coordinates */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
              <div className="p-2 rounded-xl bg-black/80 border border-amber-500/30 text-amber-300 flex items-center gap-2 text-xs font-mono backdrop-blur-md shadow-lg">
                <Compass size={18} className="text-amber-400 animate-spin-slow" />
                <span>N 0°00'00"</span>
              </div>

              {/* Cursor Coordinates HUD */}
              {mouseCoords && (
                <div className="p-2 rounded-xl bg-stone-950/85 border border-stone-700 text-[10px] font-mono text-stone-300 backdrop-blur-md shadow-md space-y-0.5 animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Crosshair size={12} className="text-amber-400" />
                    <span>{mouseCoords.lat}, {mouseCoords.lng}</span>
                  </div>
                  <div className="text-stone-400 flex items-center justify-between">
                    <span>Elevation: <strong className="text-white">{mouseCoords.elev} m</strong></span>
                    <span className="text-emerald-400 text-[9px] font-semibold">GIS Live</span>
                  </div>
                </div>
              )}
            </div>

            {/* Top-Right: Active Mapping API Service HUD Badge */}
            <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/85 border border-amber-500/40 text-stone-200 font-mono text-[11px] backdrop-blur-md shadow-xl">
              {mapMode === 'satellite' ? (
                <>
                  <Globe size={13} className="text-blue-400" />
                  <span>API: <strong className="text-white">Esri World Imagery</strong> ({baseMapMetadata.resolution})</span>
                </>
              ) : mapMode === 'terrain' ? (
                <>
                  <Mountain size={13} className="text-amber-400" />
                  <span>API: <strong className="text-white">USGS 3DEP DEM</strong> ({baseMapMetadata.contourInterval || '20m Contours'})</span>
                </>
              ) : (
                <>
                  <Zap size={13} className="text-purple-400" />
                  <span>API: <strong className="text-white">Airborne TMI RTP</strong> ({baseMapMetadata.resolution})</span>
                </>
              )}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-1" />
            </div>

            {/* Bottom-Left: Dynamic Retractable Predictive Heatmap Legend Component */}
            <div className="absolute bottom-4 left-4 z-20">
              <PredictiveHeatmapLegend
                isLayerActive={activeLayers.predictiveAnomalyHeatmap}
                onToggleLayer={() => toggleLayer('predictiveAnomalyHeatmap')}
                sensorNodes={geochemSensorNodes}
                isStreaming={isSensorStreaming}
                streamTick={sensorStreamTick}
                selectedSensorNodeId={selectedSensorNodeId}
                onSelectSensorNode={(nodeId) => setSelectedSensorNodeId(nodeId)}
              />
            </div>

            {/* Bottom-Right: GIS Basemap Layer Switcher Widget (Satellite vs Terrain) */}
            <div className="absolute bottom-4 right-4 z-20 p-2.5 rounded-2xl bg-stone-950/90 border border-amber-500/50 backdrop-blur-md shadow-2xl flex flex-col gap-2 text-xs max-w-[280px]">
              <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-1.5">
                <span className="font-extrabold text-[11px] text-amber-300 flex items-center gap-1 uppercase tracking-wider">
                  <Layers size={13} className="text-amber-400" />
                  <span>Base Map View</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{mapMode === 'satellite' ? 'OPTICAL' : mapMode === 'terrain' ? 'TOPO DEM' : 'GEOPHYSICS'}</span>
                </span>
              </div>

              {/* Layer Toggle: Satellite vs Terrain vs Aeromagnetic */}
              <div className="grid grid-cols-3 gap-1">
                <button
                  id="btn-layer-toggle-satellite"
                  onClick={async () => {
                    setMapMode('satellite');
                    const res = await gisMappingService.switchBaseMap('satellite', selectedRegion);
                    setBaseMapMetadata(res.config);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex flex-col items-center gap-0.5 transition-all ${
                    mapMode === 'satellite'
                      ? 'bg-amber-500 text-stone-950 font-extrabold shadow-md scale-105 ring-1 ring-amber-300'
                      : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300'
                  }`}
                  title="High-resolution optical satellite orthomosaic via GIS mapping service"
                >
                  <Globe size={15} className={mapMode === 'satellite' ? 'text-stone-950' : 'text-blue-400'} />
                  <span>Satellite</span>
                </button>

                <button
                  id="btn-layer-toggle-terrain"
                  onClick={async () => {
                    setMapMode('terrain');
                    const res = await gisMappingService.switchBaseMap('terrain', selectedRegion);
                    setBaseMapMetadata(res.config);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex flex-col items-center gap-0.5 transition-all ${
                    mapMode === 'terrain'
                      ? 'bg-amber-500 text-stone-950 font-extrabold shadow-md scale-105 ring-1 ring-amber-300'
                      : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300'
                  }`}
                  title="Digital Elevation Model (DEM) with 20m contour lines & hillshade relief"
                >
                  <Mountain size={15} className={mapMode === 'terrain' ? 'text-stone-950' : 'text-amber-400'} />
                  <span>Terrain</span>
                </button>

                <button
                  id="btn-layer-toggle-aeromag"
                  onClick={async () => {
                    setMapMode('aeromagnetic');
                    const res = await gisMappingService.switchBaseMap('aeromagnetic', selectedRegion);
                    setBaseMapMetadata(res.config);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex flex-col items-center gap-0.5 transition-all ${
                    mapMode === 'aeromagnetic'
                      ? 'bg-purple-600 text-white font-extrabold shadow-md scale-105'
                      : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300'
                  }`}
                  title="Total Magnetic Intensity (TMI) RTP geophysics"
                >
                  <Zap size={14} className={mapMode === 'aeromagnetic' ? 'text-amber-300' : 'text-purple-400'} />
                  <span>AeroMag</span>
                </button>
              </div>

              {/* View-Specific Quick Toggles */}
              <div className="pt-1.5 border-t border-stone-800 flex items-center justify-between text-[10px] text-stone-300">
                {mapMode === 'terrain' && (
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showContours}
                      onChange={(e) => setShowContours(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span>20m Contours &amp; Drainage</span>
                  </label>
                )}
                {mapMode === 'satellite' && (
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showOpticalLabels}
                      onChange={(e) => setShowOpticalLabels(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span>Optical Mine Features</span>
                  </label>
                )}
                {mapMode === 'aeromagnetic' && (
                  <span className="text-stone-400">Total Magnetic Intensity (TMI)</span>
                )}
              </div>

              {/* Basemap Opacity Slider */}
              <div className="pt-1 border-t border-stone-850 flex items-center justify-between gap-2 text-[10px] text-stone-300 font-mono">
                <span>Opacity:</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={basemapOpacity}
                  onChange={(e) => setBasemapOpacity(Number(e.target.value))}
                  className="w-24 accent-amber-500 cursor-pointer h-1.5"
                />
                <span>{basemapOpacity}%</span>
              </div>
            </div>

            {/* Bottom-Left: Zoom & Scale Bar Controls */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-black/80 border border-stone-800 text-[10px] text-stone-300 flex items-center gap-2 font-mono backdrop-blur-md shadow-md">
                <div className="w-16 h-1 bg-amber-400" />
                <span>5 km / 3.1 mi</span>
                <span className="text-stone-500">|</span>
                <span>1:50,000</span>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-black/80 border border-stone-800 rounded-xl p-1 backdrop-blur-md">
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.4))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  onClick={() => setZoomLevel(1.0)}
                  className="px-2 h-7 flex items-center justify-center rounded-lg bg-stone-900 hover:bg-stone-800 text-[10px] font-mono text-amber-400 font-bold"
                  title="Reset Zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
              </div>
            </div>

            {/* Mineral Heatmap Dynamic HUD Controller & Legend */}
            {activeLayers.mineralHeatmap && (
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-stone-950/90 border border-amber-500/50 backdrop-blur-md shadow-2xl space-y-2.5 max-w-xs text-xs">
                <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Flame size={14} className="text-amber-400" />
                    <span>Mineral Grade Heatmap</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    KDE Overlay
                  </span>
                </div>

                {/* Commodity Filter Pills */}
                <div className="space-y-1">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider block">
                    Target Commodity:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['all', 'Au', 'Cu', 'Li', 'REE'] as const).map((comm) => (
                      <button
                        key={comm}
                        onClick={() => setHeatmapCommodity(comm)}
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition-all ${
                          heatmapCommodity === comm
                            ? 'bg-amber-500 text-stone-950 shadow-sm'
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {comm === 'all' ? 'All (Multi)' : comm}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slider: Heatmap Intensity & Radius */}
                <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-300 pt-1 border-t border-stone-850">
                  <div>
                    <span className="block text-stone-400">Intensity ({heatmapIntensity}x):</span>
                    <input
                      type="range"
                      min="0.6"
                      max="2.0"
                      step="0.1"
                      value={heatmapIntensity}
                      onChange={(e) => setHeatmapIntensity(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="block text-stone-400">Plume Radius ({heatmapRadius}px):</span>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      step="5"
                      value={heatmapRadius}
                      onChange={(e) => setHeatmapRadius(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Concentration Ramp Legend */}
                <div className="pt-1 border-t border-stone-800 space-y-1">
                  <div className="flex items-center justify-between text-[9px] text-stone-400 font-mono">
                    <span>Background (Trace)</span>
                    <span className="text-amber-300 font-bold">Bonanza (&gt;90th %)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gradient-to-r from-sky-500 via-emerald-400 via-amber-400 via-red-500 to-pink-500 opacity-90 shadow-inner" />
                </div>
              </div>
            )}
          </div>

          {/* GIS Layer Toggles Panel */}
          <div className="p-3.5 rounded-xl bg-[#2A1810] border border-amber-900/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-stone-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers size={14} className="text-amber-400" /> GIS &amp; GeoJSON Layers:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  key: 'predictiveAnomalyHeatmap' as const,
                  label: 'Predictive Anomaly Heatmap (Real-Time Sensor Flux)',
                  color: 'text-cyan-300',
                  isHot: true,
                  id: 'btn-toggle-predictive-anomaly-heatmap',
                },
                {
                  key: 'mineralAnomalyPredictor' as const,
                  label: 'AI Mineral Anomaly Predictor (Geochem + Vibe)',
                  color: 'text-rose-400',
                  isHot: true,
                  id: 'btn-toggle-mineral-anomaly-predictor',
                },
                {
                  key: 'historicalGeoJsonGeochem' as const,
                  label: 'Historical Drilling Geochem (D3 + GeoJSON)',
                  color: 'text-amber-300',
                  isHot: true,
                  id: 'btn-toggle-geojson-geochem-layer',
                },
                { key: 'mineralHeatmap' as const, label: 'Mineral Heatmap', color: 'text-amber-400', isHot: true },
                { key: 'geology' as const, label: 'Geology', color: 'text-emerald-400' },
                { key: 'mineralOccurrences' as const, label: 'Occurrences', color: 'text-amber-400' },
                { key: 'faults' as const, label: 'Faults & Shear', color: 'text-rose-400' },
                { key: 'drillholes' as const, label: 'Drillholes', color: 'text-sky-400' },
                { key: 'geochemAnomalies' as const, label: 'Geochem Anomalies', color: 'text-red-400' },
                { key: 'claims' as const, label: 'Claims', color: 'text-purple-400' },
              ].map((layer) => (
                <button
                  key={layer.key}
                  id={(layer as any).id}
                  onClick={() => toggleLayer(layer.key)}
                  className={`px-2.5 py-1 rounded font-semibold transition-colors flex items-center gap-1.5 ${
                    activeLayers[layer.key]
                      ? 'bg-stone-800 text-white border border-amber-500/40'
                      : 'bg-stone-900/50 text-stone-500 border border-transparent'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeLayers[layer.key]
                        ? layer.isHot
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-amber-400'
                        : 'bg-stone-600'
                    }`}
                  />
                  <span>{layer.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PREDICTIVE ANOMALY HEATMAP & REAL-TIME GEOCHEMICAL SENSOR TELEMETRY HUD */}
          <div
            id="predictive-anomaly-heatmap-hud"
            className="p-4 rounded-2xl bg-gradient-to-br from-[#081820] via-[#0C1217] to-stone-950 border-2 border-cyan-500/40 shadow-xl space-y-3.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    <Activity size={15} />
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2">
                      <span>Predictive Anomaly Heatmap &bull; Real-Time Sensor Flux</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        STREAMING #{sensorStreamTick}
                      </span>
                    </h3>
                    <p className="text-[11px] text-stone-300">
                      Automatically toggles color-coded intensity overlays (Low Cyan &bull; Moderate Amber &bull; High-Surge Magenta) based on live geochemical sensor fluctuations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  id="btn-toggle-sensor-stream"
                  onClick={() => setIsSensorStreaming((s) => !s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isSensorStreaming
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}
                >
                  {isSensorStreaming ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isSensorStreaming ? 'Pause Stream' : 'Resume Stream'}</span>
                </button>

                <button
                  id="btn-trigger-geochem-surge"
                  onClick={handleTriggerGeochemSensorSurge}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 text-stone-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Simulate Geochem Surge</span>
                </button>
              </div>
            </div>

            {/* Live Fluctuating Geochemical Sensor Nodes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              {geochemSensorNodes.map((node) => {
                const isSelected = selectedSensorNodeId === node.id;
                const isSurge = node.intensityCategory === 'High Surge';
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedSensorNodeId(node.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400/50 shadow-md'
                        : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-[11px]">{node.id}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          isSurge
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 animate-pulse'
                            : node.intensityCategory === 'Moderate'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {node.intensityCategory}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] font-extrabold text-amber-300">
                      {node.currentAuPpm} ppm Au
                    </div>

                    <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                      <span>Flux:</span>
                      <strong className="text-white">{node.fluxIntensityPct}%</strong>
                    </div>

                    {/* Mini dynamic flux bar */}
                    <div className="h-1.5 w-full bg-stone-950 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${node.fluxIntensityPct}%`,
                          backgroundColor: node.colorHex,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GEMINI AI MINERAL ANOMALY PREDICTOR (Combined Geochemical + Vibration High-Yield Zone Tool) */}
          <div
            id="mineral-anomaly-predictor-panel"
            className="p-5 rounded-2xl bg-gradient-to-br from-[#241016] via-[#1C100B] to-stone-950 border-2 border-rose-500/40 shadow-2xl space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-stone-800 pb-3.5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-extrabold uppercase tracking-wider">
                    <Sparkles size={11} className="text-amber-400" /> Gemini AI Mineral Anomaly Predictor
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-bold">
                    <Radio size={11} /> Geochemical + Vibration Data Fusion
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Coincidence Score: {anomalyPrediction.coincidentCorrelationScore}%
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-white font-['Space_Grotesk']">
                  High-Yield Mineral Anomaly Predictor — {anomalyPrediction.metallogenicProvince}
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Highlights potential high-yield zones on the GIS map by fusing multi-element geochemical dispersion halos with Ambient Noise Tomography (ANT) velocity drops and active drill-bit vibration resonance.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  id="btn-run-mineral-anomaly-predictor"
                  onClick={handleRunMineralAnomalyPredictor}
                  disabled={isPredictingAnomalies}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-amber-500 to-amber-400 hover:from-rose-400 hover:to-amber-300 text-stone-950 font-extrabold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  {isPredictingAnomalies ? (
                    <>
                      <RefreshCw size={14} className="animate-spin text-stone-950" />
                      <span>Fusing Geochem &amp; Vibration Signals...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Predict High-Yield Zones (Gemini AI)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Interactive Geochemical + Vibration Fusion Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                  <Radio size={12} className="text-cyan-400" /> Target Vibration Resonance Band:
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'all' as const, label: 'All Bands' },
                    { id: '20-40Hz' as const, label: '20–40 Hz (Cu Sulfide)' },
                    { id: '80-150Hz' as const, label: '80–150 Hz (Au Shear)' },
                    { id: '120-250kHz' as const, label: '120–250 kHz (Li Pegmatite)' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setVibrationBandFilter(b.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                        vibrationBandFilter === b.id
                          ? 'bg-cyan-500 text-stone-950 font-extrabold'
                          : 'bg-stone-950 text-stone-300 hover:bg-stone-800 border border-stone-800'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-400 font-bold uppercase text-[10px] flex items-center gap-1">
                    <Activity size={12} className="text-amber-400" /> Active Bit MSE Telemetry:
                  </span>
                  <span className="font-mono font-bold text-amber-300">{simulatedRigMseMpa} MPa</span>
                </div>
                <input
                  type="range"
                  min={180}
                  max={560}
                  step={10}
                  value={simulatedRigMseMpa}
                  onChange={(e) => setSimulatedRigMseMpa(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-stone-400">
                  <span>180 MPa (Soft)</span>
                  <span>350 MPa (Shear)</span>
                  <span>520+ MPa (Pegmatite)</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-stone-400 font-bold uppercase text-[10px]">
                    High-Yield Cutoff Threshold:
                  </span>
                  <span className="font-mono font-bold text-rose-300">&ge; {minYieldCutoffScore}% Yield Score</span>
                </div>
                <input
                  type="range"
                  min={75}
                  max={96}
                  step={1}
                  value={minYieldCutoffScore}
                  onChange={(e) => setMinYieldCutoffScore(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-stone-400">
                  <span>75% (Broad)</span>
                  <span>88% (Tier-1)</span>
                  <span>96% (Bonanza)</span>
                </div>
              </div>
            </div>

            {/* AI Multi-Modal Synthesis Summary */}
            <div className="p-3 rounded-xl bg-stone-950/90 border border-rose-500/30 text-xs text-stone-200 leading-relaxed flex items-start gap-2.5">
              <Sparkles size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300 uppercase text-[10px] font-mono block mb-0.5">
                  Gemini Geochemical + Seismic Vibration Synthesis:
                </strong>
                {anomalyPrediction.fusionModelSummary}
              </div>
            </div>

            {/* Predicted High-Yield Zones Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {visibleHighYieldZones.map((zone) => {
                const isSelected = selectedHighYieldZone?.zoneId === zone.zoneId;
                return (
                  <div
                    key={zone.zoneId}
                    onClick={() => {
                      setSelectedHighYieldZone(zone);
                      setActiveLayers((prev) => ({ ...prev, mineralAnomalyPredictor: true }));
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-rose-950/35 border-rose-400 shadow-lg ring-1 ring-rose-400/50'
                        : 'bg-stone-900/90 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-extrabold text-[11px]">
                        ★ {zone.zoneId}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-extrabold text-[11px]">
                        {zone.yieldPotentialScore}% High-Yield
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-white font-['Space_Grotesk']">
                        {zone.zoneName}
                      </h4>
                      <div className="text-[11px] font-mono text-amber-300 font-bold mt-0.5">
                        {zone.estimatedTonnageGrade}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] pt-1 border-t border-stone-800/80">
                      <div className="p-2 rounded-lg bg-stone-950/90 border border-stone-800/80">
                        <span className="text-[9px] font-mono uppercase text-amber-400 font-bold block">
                          Geochemical Vector:
                        </span>
                        <span className="text-stone-200">{zone.geochemicalSignature}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-950/90 border border-stone-800/80">
                        <span className="text-[9px] font-mono uppercase text-cyan-400 font-bold block">
                          Vibration &amp; ANT Signal ({zone.dominantFrequencyBand}):
                        </span>
                        <span className="text-stone-200">{zone.vibrationSignature}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-stone-300 leading-relaxed italic">
                      &ldquo;{zone.aiReasoning}&rdquo;
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-1 border-t border-stone-800/60">
                      <span>Target Depth: <strong className="text-white">{zone.recommendedDrillDepthM}</strong></span>
                      <span>MSE: <strong className="text-cyan-300">{zone.mseAnomalyMpa} MPa</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* D3 + GeoJSON Historical Drilling Geochemical Overlay Inspector & Gemini AI Prospectivity Panel */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1F120B] via-[#26150C] to-stone-950 border border-amber-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                    <Database size={11} /> D3.js + GeoJSON Geochemical Overlay
                  </span>
                  <span className="text-[11px] font-mono text-stone-400">
                    {activeGeoJsonCollection.metadata.crs}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white mt-1 font-['Space_Grotesk']">
                  Historical Drilling Mineral Concentrations &amp; Gemini AI Step-Out Vectoring ({selectedRegion})
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* D3 Color Scale Switcher */}
                <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-lg border border-stone-800 text-[10px]">
                  {(['ylorrd', 'plasma', 'viridis'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setGeoJsonColorScaleMode(mode)}
                      className={`px-2 py-0.5 rounded uppercase font-bold ${
                        geoJsonColorScaleMode === mode
                          ? 'bg-amber-500 text-stone-950'
                          : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <button
                  id="btn-download-historical-geojson"
                  onClick={handleDownloadGeoJsonFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-bold transition-all"
                >
                  <Download size={13} className="text-amber-400" />
                  <span>Export .GeoJSON</span>
                </button>

                <button
                  id="btn-run-gis-ai-synthesizer"
                  onClick={handleRunAiGisProspectivity}
                  disabled={isRunningAiGis}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {isRunningAiGis ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Synthesizing GeoJSON Vectors...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>AI GeoJSON Prospectivity (Gemini)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selected GeoJSON Historical Drillhole Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="md:col-span-1 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  GeoJSON Historical Collars ({selectedRegion}):
                </span>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {activeGeoJsonCollection.features
                    .filter((f) => f.geometry.type === 'Point')
                    .map((feat) => {
                      const isSel = selectedGeoJsonFeature?.properties.id === feat.properties.id;
                      return (
                        <button
                          key={feat.properties.id}
                          onClick={() => setSelectedGeoJsonFeature(feat)}
                          className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                            isSel
                              ? 'bg-amber-500/20 border-amber-400 text-white'
                              : 'bg-stone-900/80 border-stone-800 text-stone-300 hover:border-stone-700'
                          }`}
                        >
                          <div>
                            <div className="font-mono font-bold text-amber-300 text-[11px]">
                              {feat.properties.holeId} ({feat.properties.campaignYear})
                            </div>
                            <div className="text-[11px] text-stone-300 truncate max-w-[180px]">
                              {feat.properties.gradeLabel}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-stone-950 text-amber-400 font-mono font-extrabold text-[11px]">
                            {feat.properties.concentrationIndex}%
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Active GeoJSON Feature Geochemical Breakdown */}
              {selectedGeoJsonFeature && (
                <div className="md:col-span-2 p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                        GeoJSON Feature • {selectedGeoJsonFeature.properties.holeId} • Campaign{' '}
                        {selectedGeoJsonFeature.properties.campaignYear}
                      </span>
                      <h4 className="text-sm font-extrabold text-white">
                        {selectedGeoJsonFeature.properties.name}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-extrabold text-xs">
                      {selectedGeoJsonFeature.properties.gradeLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                    <div className="p-2 rounded-lg bg-stone-950 border border-stone-800">
                      <span className="text-[9px] text-stone-400 block uppercase">Au Conc.</span>
                      <strong className="text-amber-300">{selectedGeoJsonFeature.properties.auPpm} ppm</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-950 border border-stone-800">
                      <span className="text-[9px] text-stone-400 block uppercase">Cu Conc.</span>
                      <strong className="text-cyan-300">{selectedGeoJsonFeature.properties.cuPct}%</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-950 border border-stone-800">
                      <span className="text-[9px] text-stone-400 block uppercase">Li Conc.</span>
                      <strong className="text-pink-300">{selectedGeoJsonFeature.properties.liPpm} ppm</strong>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-950 border border-stone-800">
                      <span className="text-[9px] text-stone-400 block uppercase">GeoJSON [Lng,Lat]</span>
                      <strong className="text-emerald-300 text-[10px]">
                        [{selectedGeoJsonFeature.geometry.coordinates[0]},{' '}
                        {selectedGeoJsonFeature.geometry.coordinates[1]}]
                      </strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-300 flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <strong className="text-stone-400">Host Lithology:</strong>{' '}
                      {selectedGeoJsonFeature.properties.lithologyHost} (
                      {selectedGeoJsonFeature.properties.depthInterceptM})
                    </span>
                    <span className="font-mono text-amber-300">
                      Pathfinders: {selectedGeoJsonFeature.properties.pathfinderSummary}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Gemini AI Geochemical Prospectivity & Step-Out Results */}
            {aiGisAnalysis && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    Gemini AI Geochemical Vector Synthesis — {aiGisAnalysis.metallogenicProvince}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold">
                    AI Prospectivity Score: {aiGisAnalysis.overallProspectivityScore}/100
                  </span>
                </div>
                <p className="text-xs text-stone-200 leading-relaxed">
                  {aiGisAnalysis.regionalVectorSynthesis}
                </p>
                <p className="text-[11px] text-amber-300 font-mono">
                  {aiGisAnalysis.pathfinderRatioAnalysis}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {aiGisAnalysis.aiRecommendedStepOutCollars.map((c) => (
                    <div
                      key={c.collarId}
                      className="p-2.5 rounded-xl bg-stone-950/90 border border-emerald-500/30 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <strong className="text-emerald-400">{c.collarId}</strong>
                        <span className="text-[10px] text-amber-300">{c.confidencePct}% Conf.</span>
                      </div>
                      <div className="font-bold text-white text-[11px]">{c.name}</div>
                      <div className="text-[11px] text-amber-300 font-mono">{c.predictedInterceptGrade}</div>
                      <p className="text-[10px] text-stone-400">{c.geochemicalRationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Selected Prospect Inspector */}
        <div className="rounded-2xl bg-[#2A1810]/80 border border-stone-800 p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="border-b border-stone-800 pb-3">
              <span className="text-[10px] uppercase font-bold text-amber-400">Prospect Inspector</span>
              <h3 className="text-lg font-bold text-white mt-0.5 font-['Space_Grotesk']">
                {selectedTarget.name}
              </h3>
              <p className="text-xs text-stone-400">{selectedTarget.country}</p>
            </div>

            {/* Target Score & Stage */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Target Score</span>
                <p className="text-2xl font-extrabold text-amber-400 font-['Space_Grotesk']">
                  {selectedTarget.targetScore}
                  <span className="text-xs text-stone-500 font-normal"> / 100</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-semibold">Commodity</span>
                <p className="text-sm font-bold text-purple-300 mt-1">{selectedTarget.commodity}</p>
                <span className="text-[10px] text-emerald-400 font-semibold">{selectedTarget.stage}</span>
              </div>
            </div>

            {/* Geological Rationale */}
            <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400">Geological Setting</span>
              <p className="text-stone-300 leading-relaxed text-[11px]">
                {selectedTarget.geologicalRationale}
              </p>
            </div>

            {/* Key Anomalies */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-amber-400">Coincident Anomalies</span>
              <div className="space-y-1">
                {selectedTarget.keyAnomalies.map((anom, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-black/40 border border-stone-800 text-[11px] text-stone-300 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span>{anom}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Concession info */}
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/30 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-400">License:</span>
                <strong className="text-white font-mono">{selectedTarget.licenseNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Area:</span>
                <strong className="text-white">{selectedTarget.areaKm2} km²</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Exploration Budget:</span>
                <strong className="text-amber-400">
                  ${(selectedTarget.budgetUSD / 1000000).toFixed(1)}M USD
                </strong>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300/80">
            Complies with JORC Code & NI 43-101 transparent evidence reporting rules.
          </div>
        </div>
      </div>
      {/* Mining Logistics, Places & Routes Agent Modal */}
      <MiningLogisticsRouteAgent
        region={selectedRegion}
        isOpen={isRouteAgentOpen}
        onClose={() => setIsRouteAgentOpen(false)}
        onSelectCoordinates={(coords) => {
          // focus map on target coordinates
          setMouseCoords({
            lat: `${Math.abs(coords.lat).toFixed(4)}° ${coords.lat >= 0 ? 'N' : 'S'}`,
            lng: `${Math.abs(coords.lng).toFixed(4)}° ${coords.lng >= 0 ? 'E' : 'W'}`,
            elev: 485,
          });
        }}
      />
    </div>
  );
};
