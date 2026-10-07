export type MaintenanceUrgency =
  | 'Critical (Within 48h)'
  | 'High (Within 7d)'
  | 'Moderate (14-21d)'
  | 'Routine (30d+)';

export interface HistoricalTelemetryPoint {
  month: string;
  hoursRun: number;
  vibrationMmS: number;
  tempC: number;
  oilWearFePpm: number;
  nearMisses: number;
}

export interface EquipmentRecord {
  id: string;
  unitCode: string;
  name: string;
  model: string;
  category: 'Haulage & Loading' | 'Drilling & Blasting' | 'Ventilation & Infrastructure' | 'Continuous Mining';
  assignedZone: string;
  levelDepthM: number;
  operatingHours: number;
  mtbfHours: number;
  vibrationMmS: number;
  vibrationThreshold: number; // mm/s safety threshold
  bearingTempC: number;
  bearingTempThreshold: number; // °C safety threshold
  oilParticlePpm: number;
  oilParticleThreshold: number; // ppm safety threshold (nominally 70 ppm)
  hydraulicPressurePsi: number;
  hydraulicPressureNominal: number;
  historicalSafetyIncidentsCount: number;
  safetyIncidentSummary: string;
  prescribedActions: string[];
  requiredParts: { partNo: string; name: string; inStock: boolean; qty: number }[];
  estimatedLaborHours: number;
  estimatedCostAvoidanceUSD: number;
  historicalTelemetry: HistoricalTelemetryPoint[];
}

export interface EquipmentAlertNotification {
  id: string;
  timestamp: string;
  unitCode: string;
  equipmentId: string;
  equipmentName: string;
  category: string;
  assignedZone: string;
  metricName: 'Vibration RMS' | 'Bearing Temperature' | 'Operating Hours / MTBF' | 'Oil Contamination' | 'Hydraulic Surge';
  currentValue: number;
  thresholdValue: number;
  unit: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  message: string;
  read: boolean;
  acknowledged: boolean;
  acknowledgedAt?: string;
  actionSuggested: string;
}

export const INITIAL_EQUIPMENT_DATA: EquipmentRecord[] = [
  {
    id: 'eq-lhd-01',
    unitCode: 'LHD-01',
    name: 'Diesel-Electric Underground Loader',
    model: 'Cat R2900 XE (20-Tonne Payload)',
    category: 'Haulage & Loading',
    assignedZone: 'Stope 14 Muck-Bay',
    levelDepthM: 780,
    operatingHours: 4180,
    mtbfHours: 4000,
    vibrationMmS: 7.4,
    vibrationThreshold: 4.5,
    bearingTempC: 89,
    bearingTempThreshold: 75,
    oilParticlePpm: 88,
    oilParticleThreshold: 70,
    hydraulicPressurePsi: 3820,
    hydraulicPressureNominal: 3500,
    historicalSafetyIncidentsCount: 3,
    safetyIncidentSummary:
      'High hydraulic line pressure pulsation observed during bucket crowd; near-miss hose pinhole spray reported in Q2.',
    prescribedActions: [
      'Lockout/Tagout (LOTO) and depressurize secondary boom hydraulics',
      'Ultrasonic non-destructive testing (NDT) on front articulation hitch pin',
      'Replace high-pressure steel-braided hoist cylinder hoses',
      'Perform ISO 4406 synthetic hydraulic fluid change and flush',
    ],
    requiredParts: [
      { partNo: 'CAT-528-9811', name: 'Hydraulic Cylinder Seal Kit', inStock: true, qty: 2 },
      { partNo: 'CAT-419-7720', name: 'Flexible Armor Hydraulic Line (2m)', inStock: true, qty: 4 },
      { partNo: 'MOBIL-SHC-524', name: 'Synthetic ISO VG 32 Fluid (200L)', inStock: true, qty: 1 },
    ],
    estimatedLaborHours: 14,
    estimatedCostAvoidanceUSD: 145000,
    historicalTelemetry: [
      { month: 'Apr', hoursRun: 620, vibrationMmS: 3.2, tempC: 68, oilWearFePpm: 22, nearMisses: 0 },
      { month: 'May', hoursRun: 660, vibrationMmS: 3.9, tempC: 72, oilWearFePpm: 34, nearMisses: 0 },
      { month: 'Jun', hoursRun: 710, vibrationMmS: 4.8, tempC: 77, oilWearFePpm: 49, nearMisses: 1 },
      { month: 'Jul', hoursRun: 690, vibrationMmS: 5.6, tempC: 81, oilWearFePpm: 63, nearMisses: 1 },
      { month: 'Aug', hoursRun: 740, vibrationMmS: 6.7, tempC: 85, oilWearFePpm: 76, nearMisses: 0 },
      { month: 'Sep', hoursRun: 760, vibrationMmS: 7.4, tempC: 89, oilWearFePpm: 88, nearMisses: 1 },
    ],
  },
  {
    id: 'eq-fan-02',
    unitCode: 'FAN-02',
    name: 'Primary Shaft Booster Impeller',
    model: 'TLT-Turbo 450 kW Variable Pitch',
    category: 'Ventilation & Infrastructure',
    assignedZone: 'Shaft 2 Ventilation Intake, Level 3',
    levelDepthM: 520,
    operatingHours: 12480,
    mtbfHours: 12000,
    vibrationMmS: 8.1,
    vibrationThreshold: 4.0,
    bearingTempC: 92,
    bearingTempThreshold: 70,
    oilParticlePpm: 112,
    oilParticleThreshold: 70,
    hydraulicPressurePsi: 2100,
    hydraulicPressureNominal: 2100,
    historicalSafetyIncidentsCount: 4,
    safetyIncidentSummary:
      'Vibration trip warning triggered during peak blasting fume clearance; bearing thermal gradient elevated 22°C above baseline.',
    prescribedActions: [
      'Emergency dynamic blade laser re-balancing & pitch calibration',
      'Replace drive-end spherical roller bearings (SKF 23148)',
      'Inspect intake acoustic silencer baffles for fatigue cracks',
      'Check automatic dry-chemical fire suppression discharge nozzle',
    ],
    requiredParts: [
      { partNo: 'SKF-23148-CC', name: 'Spherical Roller Bearing Assembly', inStock: true, qty: 2 },
      { partNo: 'TLT-IMP-09', name: 'Dynamic Impeller Balancing Weight Kit', inStock: true, qty: 1 },
      { partNo: 'KLUBER-PET-71', name: 'High-Temp Synthetic Greasing Cartridge', inStock: true, qty: 6 },
    ],
    estimatedLaborHours: 18,
    estimatedCostAvoidanceUSD: 280000,
    historicalTelemetry: [
      { month: 'Apr', hoursRun: 720, vibrationMmS: 2.8, tempC: 62, oilWearFePpm: 18, nearMisses: 0 },
      { month: 'May', hoursRun: 720, vibrationMmS: 3.5, tempC: 66, oilWearFePpm: 29, nearMisses: 0 },
      { month: 'Jun', hoursRun: 720, vibrationMmS: 4.6, tempC: 73, oilWearFePpm: 46, nearMisses: 1 },
      { month: 'Jul', hoursRun: 720, vibrationMmS: 5.9, tempC: 79, oilWearFePpm: 68, nearMisses: 1 },
      { month: 'Aug', hoursRun: 720, vibrationMmS: 7.1, tempC: 86, oilWearFePpm: 92, nearMisses: 1 },
      { month: 'Sep', hoursRun: 720, vibrationMmS: 8.1, tempC: 92, oilWearFePpm: 112, nearMisses: 1 },
    ],
  },
  {
    id: 'eq-trk-07',
    unitCode: 'TRK-07',
    name: 'Articulated Underground Dump Truck',
    model: 'Sandvik TH663i (63-Tonne Payload)',
    category: 'Haulage & Loading',
    assignedZone: 'Main Decline Ramp 1 (14% Gradient)',
    levelDepthM: 650,
    operatingHours: 5740,
    mtbfHours: 5500,
    vibrationMmS: 5.8,
    vibrationThreshold: 4.8,
    bearingTempC: 84,
    bearingTempThreshold: 78,
    oilParticlePpm: 74,
    oilParticleThreshold: 70,
    hydraulicPressurePsi: 3620,
    hydraulicPressureNominal: 3400,
    historicalSafetyIncidentsCount: 2,
    safetyIncidentSummary:
      'Wet-disc brake retarder thermal alarm sounded during loaded descent down 1:7 portal ramp in high ambient stope humidity.',
    prescribedActions: [
      'Measure brake retarder friction disc pack wear & cooling oil flow',
      'Replace front steer axle kingpin thrust bearings',
      'Flush and analyze retarder hydraulic cooling circuit',
      'Calibrate electronic descent speed limiter and proximity radar',
    ],
    requiredParts: [
      { partNo: 'SDVK-BG-884', name: 'Wet Disc Brake Pack Friction Kit', inStock: true, qty: 4 },
      { partNo: 'SDVK-KP-102', name: 'Steering Kingpin Tapered Roller Set', inStock: false, qty: 2 },
      { partNo: 'CASTROL-TRQ-40', name: 'Heavy Duty Transmission & Retarder Oil', inStock: true, qty: 2 },
    ],
    estimatedLaborHours: 12,
    estimatedCostAvoidanceUSD: 195000,
    historicalTelemetry: [
      { month: 'Apr', hoursRun: 580, vibrationMmS: 3.1, tempC: 67, oilWearFePpm: 24, nearMisses: 0 },
      { month: 'May', hoursRun: 610, vibrationMmS: 3.6, tempC: 70, oilWearFePpm: 33, nearMisses: 0 },
      { month: 'Jun', hoursRun: 640, vibrationMmS: 4.1, tempC: 74, oilWearFePpm: 45, nearMisses: 1 },
      { month: 'Jul', hoursRun: 620, vibrationMmS: 4.7, tempC: 78, oilWearFePpm: 56, nearMisses: 0 },
      { month: 'Aug', hoursRun: 650, vibrationMmS: 5.2, tempC: 81, oilWearFePpm: 66, nearMisses: 0 },
      { month: 'Sep', hoursRun: 630, vibrationMmS: 5.8, tempC: 84, oilWearFePpm: 74, nearMisses: 1 },
    ],
  },
  {
    id: 'eq-jmb-03',
    unitCode: 'JMB-03',
    name: 'Dual-Boom Face Drilling Jumbo',
    model: 'Epiroc Boomer M2D (Rock Drill 2238)',
    category: 'Drilling & Blasting',
    assignedZone: 'Face Heading 3, Sub-Level 2',
    levelDepthM: 840,
    operatingHours: 2920,
    mtbfHours: 3200,
    vibrationMmS: 4.6,
    vibrationThreshold: 4.5,
    bearingTempC: 73,
    bearingTempThreshold: 75,
    oilParticlePpm: 52,
    oilParticleThreshold: 70,
    hydraulicPressurePsi: 3410,
    hydraulicPressureNominal: 3350,
    historicalSafetyIncidentsCount: 1,
    safetyIncidentSummary:
      'Feed chain lash detected during perimeter lifter hole drilling; drill steel binding caused sudden hydraulic kickback.',
    prescribedActions: [
      'Re-torque percussion rock drill shank adapter and dampener seals',
      'Tension aluminum feed beam chains to 45 kN specifications',
      'Inspect operator canopy rollover protective structure (ROPS/FOPS) bolts',
      'Replace water mist flush booster diaphragm seal',
    ],
    requiredParts: [
      { partNo: 'EPI-COP-2238-DK', name: 'COP 2238 Rock Drill Dampener Kit', inStock: true, qty: 2 },
      { partNo: 'EPI-CHN-BM-40', name: 'Heavy Duty Feed Chain (4m)', inStock: true, qty: 2 },
    ],
    estimatedLaborHours: 9,
    estimatedCostAvoidanceUSD: 85000,
    historicalTelemetry: [
      { month: 'Apr', hoursRun: 420, vibrationMmS: 2.9, tempC: 60, oilWearFePpm: 15, nearMisses: 0 },
      { month: 'May', hoursRun: 450, vibrationMmS: 3.2, tempC: 63, oilWearFePpm: 21, nearMisses: 0 },
      { month: 'Jun', hoursRun: 480, vibrationMmS: 3.7, tempC: 67, oilWearFePpm: 31, nearMisses: 0 },
      { month: 'Jul', hoursRun: 470, vibrationMmS: 4.0, tempC: 69, oilWearFePpm: 38, nearMisses: 1 },
      { month: 'Aug', hoursRun: 490, vibrationMmS: 4.3, tempC: 71, oilWearFePpm: 45, nearMisses: 0 },
      { month: 'Sep', hoursRun: 510, vibrationMmS: 4.6, tempC: 73, oilWearFePpm: 52, nearMisses: 0 },
    ],
  },
  {
    id: 'eq-pmp-05',
    unitCode: 'PMP-05',
    name: 'Multistage Dewatering Slurry Pump',
    model: 'Weir Minerals Warman 150 kW 6/4 D-AH',
    category: 'Ventilation & Infrastructure',
    assignedZone: 'Main Sump Station 5, Level 5',
    levelDepthM: 920,
    operatingHours: 8460,
    mtbfHours: 9000,
    vibrationMmS: 4.2,
    vibrationThreshold: 4.2,
    bearingTempC: 71,
    bearingTempThreshold: 72,
    oilParticlePpm: 46,
    oilParticleThreshold: 70,
    hydraulicPressurePsi: 2450,
    hydraulicPressureNominal: 2400,
    historicalSafetyIncidentsCount: 1,
    safetyIncidentSummary:
      'Mechanical shaft packing seal leakage prompted sump high-water level float alert near 4160V substation wall.',
    prescribedActions: [
      'Repack gland seal with PTFE graphite impregnated yarn',
      'Inspect chrome-moly impeller throatbush for abrasive rock slurry erosion',
      'Verify sump level redundant ultrasonic emergency trip switches',
    ],
    requiredParts: [
      { partNo: 'WEIR-TB-64-A05', name: 'High-Chrome Throatbush Liner', inStock: true, qty: 1 },
      { partNo: 'WEIR-GS-PKG-3', name: 'PTFE Graphite Gland Packing Rings', inStock: true, qty: 3 },
    ],
    estimatedLaborHours: 7,
    estimatedCostAvoidanceUSD: 110000,
    historicalTelemetry: [
      { month: 'Apr', hoursRun: 700, vibrationMmS: 2.2, tempC: 58, oilWearFePpm: 12, nearMisses: 0 },
      { month: 'May', hoursRun: 710, vibrationMmS: 2.7, tempC: 61, oilWearFePpm: 19, nearMisses: 0 },
      { month: 'Jun', hoursRun: 690, vibrationMmS: 3.1, tempC: 64, oilWearFePpm: 26, nearMisses: 0 },
      { month: 'Jul', hoursRun: 720, vibrationMmS: 3.6, tempC: 67, oilWearFePpm: 34, nearMisses: 1 },
      { month: 'Aug', hoursRun: 710, vibrationMmS: 3.9, tempC: 69, oilWearFePpm: 40, nearMisses: 0 },
      { month: 'Sep', hoursRun: 720, vibrationMmS: 4.2, tempC: 71, oilWearFePpm: 46, nearMisses: 0 },
    ],
  },
  {
    id: 'eq-rod-01',
    unitCode: 'ROD-01',
    name: 'Hard-Rock Continuous Miner',
    model: 'Komatsu MC51 DynaCut Excavator',
    category: 'Continuous Mining',
    assignedZone: 'Drive 8 Exploration Drift',
    levelDepthM: 810,
    operatingHours: 1980,
    mtbfHours: 3500,
    vibrationMmS: 3.4,
    vibrationThreshold: 5.0,
    bearingTempC: 66,
    bearingTempThreshold: 76,
    oilParticlePpm: 32,
    oilParticleThreshold: 70,
    hydraulicPressurePsi: 4100,
    hydraulicPressureNominal: 4100,
    historicalSafetyIncidentsCount: 0,
    safetyIncidentSummary:
      'Nominal operational history. Zero recordable mechanical safety incidents during exploratory drift advance.',
    prescribedActions: [
      'Routine 50-hour inspection of carbide cutter disc face rings',
      'Grease crawler track tensioners and planetary gearbox hubs',
      'Test methane sensor sniffer auto-shutdown interlock',
    ],
    requiredParts: [
      { partNo: 'KM-CUT-D300', name: 'Carbide Under-Cutting Disc Ring', inStock: true, qty: 6 },
      { partNo: 'KM-EP2-GREASE', name: 'Extreme Pressure Lithium Grease (18kg)', inStock: true, qty: 2 },
    ],
    estimatedLaborHours: 5,
    estimatedCostAvoidanceUSD: 60000,
    historicalTelemetry: [
      { month: 'Apr', hoursRun: 320, vibrationMmS: 2.1, tempC: 56, oilWearFePpm: 10, nearMisses: 0 },
      { month: 'May', hoursRun: 340, vibrationMmS: 2.4, tempC: 59, oilWearFePpm: 15, nearMisses: 0 },
      { month: 'Jun', hoursRun: 350, vibrationMmS: 2.7, tempC: 61, oilWearFePpm: 19, nearMisses: 0 },
      { month: 'Jul', hoursRun: 360, vibrationMmS: 3.0, tempC: 63, oilWearFePpm: 24, nearMisses: 0 },
      { month: 'Aug', hoursRun: 370, vibrationMmS: 3.2, tempC: 65, oilWearFePpm: 28, nearMisses: 0 },
      { month: 'Sep', hoursRun: 380, vibrationMmS: 3.4, tempC: 66, oilWearFePpm: 32, nearMisses: 0 },
    ],
  },
];

// Evaluates equipment wear metrics against safety thresholds and returns any alerts
export function evaluateEquipmentSafetyThresholds(
  equipment: EquipmentRecord
): EquipmentAlertNotification[] {
  const alerts: EquipmentAlertNotification[] = [];
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // 1. Vibration Severity Check (ISO 10816 Mechanical Vibration Limits)
  if (equipment.vibrationMmS >= equipment.vibrationThreshold) {
    const isCritical = equipment.vibrationMmS >= equipment.vibrationThreshold * 1.35;
    alerts.push({
      id: `alt-vib-${equipment.id}-${Math.floor(equipment.vibrationMmS * 10)}`,
      timestamp: nowStr,
      unitCode: equipment.unitCode,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      category: equipment.category,
      assignedZone: equipment.assignedZone,
      metricName: 'Vibration RMS',
      currentValue: Number(equipment.vibrationMmS.toFixed(1)),
      thresholdValue: equipment.vibrationThreshold,
      unit: 'mm/s',
      severity: isCritical ? 'CRITICAL' : 'HIGH',
      message: `Vibration velocity reached ${equipment.vibrationMmS.toFixed(1)} mm/s, breaching ${equipment.vibrationThreshold} mm/s ISO threshold. Bearing raceway flaking or blade unbalance detected.`,
      read: false,
      acknowledged: false,
      actionSuggested: 'Perform immediate vibration spectrography & isolate drive coupling before fatigue failure.',
    });
  }

  // 2. Bearing Thermal Gradient Check
  if (equipment.bearingTempC >= equipment.bearingTempThreshold) {
    const isCritical = equipment.bearingTempC >= equipment.bearingTempThreshold + 10;
    alerts.push({
      id: `alt-temp-${equipment.id}-${equipment.bearingTempC}`,
      timestamp: nowStr,
      unitCode: equipment.unitCode,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      category: equipment.category,
      assignedZone: equipment.assignedZone,
      metricName: 'Bearing Temperature',
      currentValue: equipment.bearingTempC,
      thresholdValue: equipment.bearingTempThreshold,
      unit: '°C',
      severity: isCritical ? 'CRITICAL' : 'HIGH',
      message: `Bearing temperature reached ${equipment.bearingTempC}°C, exceeding ${equipment.bearingTempThreshold}°C thermal limit. Severe friction or lubrication starvation in progress.`,
      read: false,
      acknowledged: false,
      actionSuggested: 'Lockout/Tagout (LOTO) unit; check synthetic lubricant viscosity and thermal imaging hotspot.',
    });
  }

  // 3. Operating Hours vs MTBF Wear Ratio
  if (equipment.operatingHours >= equipment.mtbfHours) {
    alerts.push({
      id: `alt-hrs-${equipment.id}-${equipment.operatingHours}`,
      timestamp: nowStr,
      unitCode: equipment.unitCode,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      category: equipment.category,
      assignedZone: equipment.assignedZone,
      metricName: 'Operating Hours / MTBF',
      currentValue: equipment.operatingHours,
      thresholdValue: equipment.mtbfHours,
      unit: 'hrs',
      severity: 'HIGH',
      message: `Accumulated ${equipment.operatingHours} operating hours has exceeded the ${equipment.mtbfHours} hr Mean Time Between Failures (MTBF) design interval. Component fatigue probability > 85%.`,
      read: false,
      acknowledged: false,
      actionSuggested: 'Schedule comprehensive mid-life mechanical rebuild during next planned shift change.',
    });
  }

  // 4. Hydraulic Pressure Pulsation Check
  const pressureOverNominal = equipment.hydraulicPressurePsi - equipment.hydraulicPressureNominal;
  if (pressureOverNominal > 200) {
    alerts.push({
      id: `alt-hyd-${equipment.id}-${equipment.hydraulicPressurePsi}`,
      timestamp: nowStr,
      unitCode: equipment.unitCode,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      category: equipment.category,
      assignedZone: equipment.assignedZone,
      metricName: 'Hydraulic Surge',
      currentValue: equipment.hydraulicPressurePsi,
      thresholdValue: equipment.hydraulicPressureNominal,
      unit: 'psi',
      severity: 'WARNING',
      message: `Hydraulic circuit pressure is operating at ${equipment.hydraulicPressurePsi} psi (+${pressureOverNominal} psi above ${equipment.hydraulicPressureNominal} psi nominal). Surge risk on flexible lines.`,
      read: false,
      acknowledged: false,
      actionSuggested: 'Inspect accumulator nitrogen precharge and high-pressure relief valve cracking pressure.',
    });
  }

  // 5. Oil Contamination ISO Cleanliness Check
  if (equipment.oilParticlePpm >= equipment.oilParticleThreshold) {
    alerts.push({
      id: `alt-oil-${equipment.id}-${equipment.oilParticlePpm}`,
      timestamp: nowStr,
      unitCode: equipment.unitCode,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      category: equipment.category,
      assignedZone: equipment.assignedZone,
      metricName: 'Oil Contamination',
      currentValue: equipment.oilParticlePpm,
      thresholdValue: equipment.oilParticleThreshold,
      unit: 'ppm',
      severity: equipment.oilParticlePpm > 95 ? 'CRITICAL' : 'HIGH',
      message: `Spectrometric oil analysis reveals ${equipment.oilParticlePpm} ppm ferrous particulate wear debris (Limit: ${equipment.oilParticleThreshold} ppm). Accelerating internal component scuffing.`,
      read: false,
      acknowledged: false,
      actionSuggested: 'Offline kidney-loop filter cartridge change and fluid top-up required immediately.',
    });
  }

  return alerts;
}

// Initial alerts generated from current initial fleet state
export function getInitialFleetAlerts(): EquipmentAlertNotification[] {
  const allAlerts: EquipmentAlertNotification[] = [];
  INITIAL_EQUIPMENT_DATA.forEach((eq) => {
    allAlerts.push(...evaluateEquipmentSafetyThresholds(eq));
  });
  return allAlerts;
}

// Web Audio API Synthesizer chime for real-time equipment safety threshold alarms
export function playAlertChime(severity: 'CRITICAL' | 'HIGH' | 'WARNING') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === 'CRITICAL' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(severity === 'CRITICAL' ? 880 : 587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(severity === 'CRITICAL' ? 440 : 880, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Audio contexts may be suspended or blocked by autoplay policy; silent fallback
  }
}
