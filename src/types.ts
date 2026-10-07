export type Region = 'Canada' | 'USA' | 'Europe' | 'Australia' | 'Africa';

export type ExplorationStage =
  | 'Reconnaissance'
  | 'Prospect Generation'
  | 'Target Definition'
  | 'Drilling'
  | 'Resource Definition'
  | 'Feasibility'
  | 'Development';

export interface Mineral {
  id: string;
  name: string;
  chemicalFormula: string;
  mineralGroup: string;
  crystalSystem: string;
  hardness: number;
  specificGravity: number;
  color: string;
  streak: string;
  luster: string;
  cleavage: string;
  economicImportance: string;
  majorProducingRegions: string[];
  depositTypes: string[];
  criticalMineral: boolean;
  spectralPeaks: {
    vnir?: string;
    swir?: string;
    lwir?: string;
  };
  associatedMinerals: string[];
}

export interface BoundingBox {
  id: string;
  label: string;
  mineral: string;
  confidence: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  description: string;
  color: string;
}

export interface SpectralAnalysis {
  band: 'VNIR' | 'SWIR' | 'LWIR';
  wavelengthRange: string;
  targetMinerals: string[];
  featuresDetected: string;
  absorptionIndex: number;
  colorHex: string;
}

export interface RockAnalysisResult {
  rockClassification: string;
  primaryMinerals: Array<{
    name: string;
    percentage: number;
    confidence: number;
    description: string;
  }>;
  alterationType: string;
  spectralBands: {
    vnir: string;
    swir: string;
    lwir: string;
  };
  economicProspectivity: {
    rating: 'Low' | 'Moderate' | 'High' | 'Exceptional';
    targetCommodities: string[];
    estimatedTonnagePotential: string;
    confidenceScore: number;
  };
  extractedPrompts: string[];
  recommendation: string;
  boxes?: BoundingBox[];
}

export interface ExplorationTarget {
  id: string;
  name: string;
  region: Region;
  country: string;
  coordinates: { lat: number; lng: number };
  commodity: string;
  stage: ExplorationStage;
  targetScore: number; // 0 - 100
  riskScore: number; // 0 - 100
  geologicalRationale: string;
  keyAnomalies: string[];
  areaKm2: number;
  licenseNumber: string;
  budgetUSD: number;
  expenditureUSD: number;
}

export interface DrillInterval {
  from: number;
  to: number;
  lithology: string;
  color: string;
  assayCuPct?: number;
  assayAuGpt?: number;
  assayLiPct?: number;
  mineralization: string;
  fromDepthM?: number;
  toDepthM?: number;
  alteration?: string;
  primaryGradeValue?: number;
  gradeUnit?: string;
  rqdPercent?: number;
  miningSectorLocation?: string;
  gpsCoordinates?: { lat: number; lng: number; accuracyM?: number; capturedAt?: string };
  annotations?: string[];
}

export interface DrillHole {
  id?: string;
  holeId: string;
  targetName?: string;
  primaryCommodity?: string;
  collarEasting?: number;
  collarNorthing?: number;
  projectName: string;
  collarLat: number;
  collarLng: number;
  elevationM: number;
  azimuthDeg: number;
  dipDeg: number;
  totalDepthM: number;
  drillDate: string;
  contractor: string;
  status: 'Completed' | 'In Progress' | 'Planned';
  intervals: DrillInterval[];
  miningSectorLocation?: string;
  gpsCoordinatesCaptured?: {
    lat: number;
    lng: number;
    altitudeM?: number;
    accuracyM?: number;
    capturedAt: string;
    sectorTag: string;
  };
}

export type Drillhole = DrillHole;

export interface GeochemicalSample {
  id?: string;
  sampleId: string;
  lat: number;
  lng: number;
  elevationM: number;
  sampleType: 'Rock Chip' | 'Soil' | 'Stream Sediment' | 'Core Half';
  auPpm: number;
  auPpb?: number;
  cuPct: number;
  cuPpm?: number;
  liPpm: number;
  reePpm: number;
  asPpm: number; // pathfinder
  anomalyRating: 'Background' | 'Elevated' | 'Anomalous' | 'High-Priority';
}

export interface EconomicInputs {
  capexMillionUSD: number;
  opexPerTonneUSD: number;
  resourceMillionTonnes: number;
  headGrade: number; // % or g/t
  unitName: string;
  metallurgicalRecoveryPct: number;
  commodityPriceUSD: number;
  discountRatePct: number;
  mineLifeYears: number;
  royaltyTaxPct: number;
}

export interface EconomicOutputs {
  grossRevenueMillionUSD: number;
  annualCashflowMillionUSD: number;
  npvMillionUSD: number;
  irrPct: number;
  paybackPeriodYears: number;
  breakevenPriceUSD: number;
}

export interface MinerHealthMetric {
  workerId: string;
  name: string;
  role: string;
  zone: string;
  heartRateBpm: number;
  coreTempC: number;
  oxygenSaturationPct: number;
  fatigueIndexPct: number;
  silicaExposurePpm: number;
  status: 'Normal' | 'Advisory' | 'Urgent Check';
  beaconActive: boolean;
}

export interface MineEnvironmentalTelemetry {
  zoneName: string;
  depthM: number;
  o2Pct: number;
  coPpm: number;
  ch4Pct: number;
  respirableSilicaUgM3: number;
  pm25UgM3: number;
  wetBulbTempC: number;
  ventilationFlowM3S: number;
  hazardStatus: 'Safe' | 'Warning' | 'Critical Evacuation';
}

export interface A2ATask {
  id: string;
  title: string;
  taskType: 'spectral_inversion' | 'drill_targeting' | 'geochem_vectoring' | 'mineral_classification';
  timestamp: string;
  workerOutput: {
    codeOrPrompt: string;
    standards: string;
    assumptions: string[];
  };
  judgeEvaluation: {
    verdict: 'PASSED_WITH_DISTINCTION' | 'APPROVED' | 'REQUIRES_REVISION';
    overallScore: number;
    rubric: {
      scientificAccuracy: number;
      safetyAndCompliance: number;
      executableValidity: number;
      hallucinationRisk: number;
    };
    critique: string;
    selfMaintenanceLogs: string[];
  };
}

export type ActiveTab =
  | 'dashboard'
  | 'vision'
  | 'gis_map'
  | 'minerals'
  | 'geochemistry'
  | 'drillholes'
  | 'vibration_signals'
  | 'economics'
  | 'healthcare_esg'
  | 'a2a_judge'
  | 'assistant'
  | 'subscription';

export interface MineralVibrationProfile {
  id: string;
  mineralName: string;
  primaryCompound: string;
  depthLevel: string;
  diagnosticSignal: string;
  sensorRange: string;
  alarmThreshold: string;
  passiveAntSignal: string;
  activeDrillTelemetry: string;
  systemAlarmType: string;
  depositType: string;
  frequencyBand: string;
  closedLoopAction: string;
}

export interface TelemetryMetricPoint {
  timestampMs: number;
  wobLbs: number;
  torqueFtLbs: number;
  rpm: number;
  ropFtHr: number;
  vibeFreqHz: number;
  mseMpa: number;
  lithologyTag: string;
  alarmStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
}

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  tabToSwitch?: ActiveTab;
  targetTab?: ActiveTab;
}

export interface DailyExtractionPoint {
  day: string;
  dateLabel: string;
  tonnage: number;
  targetTonnage: number;
  gradeAuEqGpt: number;
}

export interface RegionalExtractionProfile {
  region: Region;
  hubName: string;
  primaryCommodity: string;
  currentTonnage: number;
  sevenDayAvgTonnage: number;
  sevenDayDeltaPct: number;
  sevenDayHistory: DailyExtractionPoint[];
}

export interface ProspectiveMineralSignature {
  id: string;
  signatureName: string;
  depthIntervalM: string;
  targetMinerals: string[];
  diagnosticIndicators: string;
  estimatedCompositeGrade: string;
  confidenceScore: number;
  prospectivityRating: 'Exceptional' | 'High' | 'Moderate' | 'Low';
  geochemicalVector: string;
}

export interface DrillLogAnalysisResult {
  holeId: string;
  projectName: string;
  region: string;
  overallProspectivityScore: number;
  depositModelClassification: string;
  executiveSummary: string;
  mineralSignatures: ProspectiveMineralSignature[];
  alterationHaloProfile: Array<{
    zone: string;
    assemblage: string;
    vectorStatus: string;
  }>;
  structuralAndRqdSummary: {
    estimatedAverageRqdPct: number;
    structuralControls: string;
    geotechnicalNote: string;
  };
  recommendedFollowUpActions: string[];
}

export interface RegionalMineSiteESG {
  siteId: string;
  siteName: string;
  region: Region;
  subProvince: string;
  coordinates: {
    lat: number;
    lng: number;
    mapX: number; // 0-100 percentage on regional map canvas
    mapY: number; // 0-100 percentage on regional map canvas
  };
  elevationM: number;
  primaryCommodity: string;
  certification: string;
  overallEsgScore: number;
  colorHex: string;
  waterRecycledPct: number;
  scope1And2IntensityKgCO2ePerT: number;
  trifrPerMillionHours: number;
  scores: {
    tailingsStewardship: number;
    decarbonization: number;
    occupationalSafety: number;
    biodiversityReclamation: number;
    communityFPIC: number;
    airSilicaSuppression: number;
  };
}

export interface DrillLogSessionHistoryEntry {
  sessionId: string;
  savedAt: string;
  holeId: string;
  projectName: string;
  region: Region;
  totalDepthM: number;
  rawLogText: string;
  intervalsCount: number;
  analysisResult: DrillLogAnalysisResult;
  drillHoleSnapshot: DrillHole;
}

export interface PredictedMineralPhase {
  id: string;
  mineralName: string;
  chemicalFormula: string;
  predictedModalPct: number;
  confidencePct: number;
  depthHorizonM: string;
  economicRole: 'Primary Ore' | 'Pathfinder / Accessory' | 'Alteration Gangue';
  specificGravityGcm3: number;
  historicalSiteBasis: string;
}

export interface DrillPredictorResult {
  holeId: string;
  projectName: string;
  historicalSiteBaselineName: string;
  overallPredictionConfidencePct: number;
  predictedDepositStyle: string;
  historicalSiteCorrelationSummary: string;
  predictedMineralComposition: PredictedMineralPhase[];
  unassayedDepthExtensionPrediction: {
    projectedIntervalM: string;
    predictedLithology: string;
    expectedMineralAssemblage: string;
    projectedGradeRange: string;
    rationale: string;
  };
  recommendedAssayAndStepOutPlan: string[];
}




