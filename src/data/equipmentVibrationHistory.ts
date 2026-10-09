export interface EquipmentVibrationDataPoint {
  timestamp: string;
  fullTimestamp: string;
  rmsVelocityMmS: number;
  peakAccelerationG: number;
  dominantFrequencyHz: number;
  bearingTempC: number;
  crestFactor: number;
  motorLoadPct: number;
  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  note?: string;
}

export interface CriticalMiningEquipment {
  id: string;
  name: string;
  type: string;
  category: string;
  location: string;
  isoClass: string; // ISO 10816-3 Machine Class
  warningThresholdMmS: number;
  criticalThresholdMmS: number;
  currentStatus: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  currentRmsMmS: number;
  currentPeakG: number;
  currentTempC: number;
  currentFreqHz: number;
  healthScorePct: number;
  predictedRulHours: number;
  recommendation: string;
  data: {
    '1H': EquipmentVibrationDataPoint[];
    '24H': EquipmentVibrationDataPoint[];
    '7D': EquipmentVibrationDataPoint[];
    '30D': EquipmentVibrationDataPoint[];
  };
}

// Generate realistic simulated historical vibration time-series data
function generateHistoricalSeries(
  baseRms: number,
  basePeakG: number,
  baseTemp: number,
  baseFreq: number,
  warningLimit: number,
  criticalLimit: number,
  spikeAtEnd: boolean = false
): {
  '1H': EquipmentVibrationDataPoint[];
  '24H': EquipmentVibrationDataPoint[];
  '7D': EquipmentVibrationDataPoint[];
  '30D': EquipmentVibrationDataPoint[];
} {
  const now = new Date();

  // 1H: 30 points (every 2 mins)
  const series1H: EquipmentVibrationDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 2 * 60 * 1000);
    const progress = (29 - i) / 29;
    const isSpike = spikeAtEnd && progress > 0.75;
    const spikeMult = isSpike ? 1.8 + Math.random() * 0.5 : 1.0;

    const noise = (Math.sin(i * 0.4) + Math.cos(i * 0.7)) * 0.25;
    const rms = Math.max(0.5, Number((baseRms * spikeMult + noise).toFixed(2)));
    const peakG = Math.max(0.2, Number((basePeakG * spikeMult + noise * 0.6).toFixed(2)));
    const temp = Number((baseTemp + (isSpike ? 6.5 : 0) + Math.sin(i * 0.3) * 1.2).toFixed(1));
    const freq = Math.round(baseFreq + (isSpike ? 45 : 0) + (Math.random() - 0.5) * 8);

    let status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
    if (rms >= criticalLimit) status = 'CRITICAL';
    else if (rms >= warningLimit) status = 'WARNING';

    series1H.push({
      timestamp: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTimestamp: t.toLocaleString(),
      rmsVelocityMmS: rms,
      peakAccelerationG: peakG,
      dominantFrequencyHz: freq,
      bearingTempC: temp,
      crestFactor: Number((peakG / (rms * 0.35 + 0.1)).toFixed(2)),
      motorLoadPct: Math.round(75 + Math.sin(i * 0.5) * 15),
      status,
      note: isSpike ? 'Harmonic chatter & thermal surge detected' : undefined,
    });
  }

  // 24H: 24 points (every 1 hr)
  const series24H: EquipmentVibrationDataPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    const progress = (23 - i) / 23;
    const isSpike = spikeAtEnd && progress > 0.8;
    const spikeMult = isSpike ? 1.6 + Math.random() * 0.4 : 1.0;

    const noise = Math.sin(i * 0.6) * 0.4;
    const rms = Math.max(0.6, Number((baseRms * spikeMult + noise).toFixed(2)));
    const peakG = Math.max(0.25, Number((basePeakG * spikeMult + noise * 0.5).toFixed(2)));
    const temp = Number((baseTemp + (isSpike ? 7 : 0) + Math.sin(i * 0.4) * 2.5).toFixed(1));
    const freq = Math.round(baseFreq + (isSpike ? 35 : 0) + (Math.random() - 0.5) * 10);

    let status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
    if (rms >= criticalLimit) status = 'CRITICAL';
    else if (rms >= warningLimit) status = 'WARNING';

    series24H.push({
      timestamp: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullTimestamp: t.toLocaleString(),
      rmsVelocityMmS: rms,
      peakAccelerationG: peakG,
      dominantFrequencyHz: freq,
      bearingTempC: temp,
      crestFactor: Number((peakG / (rms * 0.35 + 0.1)).toFixed(2)),
      motorLoadPct: Math.round(80 + Math.sin(i * 0.8) * 12),
      status,
      note: isSpike ? 'Exceeded operational ISO 10816 Zone C threshold' : undefined,
    });
  }

  // 7D: 28 points (every 6 hrs)
  const series7D: EquipmentVibrationDataPoint[] = [];
  for (let i = 27; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 6 * 3600 * 1000);
    const progress = (27 - i) / 27;
    const isSpike = spikeAtEnd && progress > 0.85;
    const spikeMult = isSpike ? 1.5 : 0.95 + Math.random() * 0.15;

    const rms = Math.max(0.6, Number((baseRms * spikeMult + Math.cos(i * 0.3) * 0.3).toFixed(2)));
    const peakG = Math.max(0.2, Number((basePeakG * spikeMult + Math.sin(i * 0.3) * 0.3).toFixed(2)));
    const temp = Number((baseTemp + (isSpike ? 5.5 : 0) + Math.cos(i * 0.2) * 3).toFixed(1));

    let status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
    if (rms >= criticalLimit) status = 'CRITICAL';
    else if (rms >= warningLimit) status = 'WARNING';

    const dayName = t.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
    series7D.push({
      timestamp: `${dayName} ${t.getHours()}:00`,
      fullTimestamp: t.toLocaleString(),
      rmsVelocityMmS: rms,
      peakAccelerationG: peakG,
      dominantFrequencyHz: baseFreq + Math.round((Math.random() - 0.5) * 12),
      bearingTempC: temp,
      crestFactor: Number((peakG / (rms * 0.35 + 0.1)).toFixed(2)),
      motorLoadPct: Math.round(78 + Math.sin(i * 0.4) * 14),
      status,
    });
  }

  // 30D: 30 points (daily)
  const series30D: EquipmentVibrationDataPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const progress = (29 - i) / 29;
    const drift = progress * (spikeAtEnd ? 0.6 : 0.1);
    const rms = Math.max(0.5, Number((baseRms * (1 + drift) + Math.sin(i * 0.5) * 0.3).toFixed(2)));
    const peakG = Math.max(0.2, Number((basePeakG * (1 + drift) + Math.cos(i * 0.5) * 0.25).toFixed(2)));
    const temp = Number((baseTemp + drift * 6 + Math.sin(i * 0.3) * 2).toFixed(1));

    let status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = 'OPTIMAL';
    if (rms >= criticalLimit) status = 'CRITICAL';
    else if (rms >= warningLimit) status = 'WARNING';

    series30D.push({
      timestamp: t.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      fullTimestamp: t.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }),
      rmsVelocityMmS: rms,
      peakAccelerationG: peakG,
      dominantFrequencyHz: baseFreq + Math.round(Math.sin(i * 0.4) * 10),
      bearingTempC: temp,
      crestFactor: Number((peakG / (rms * 0.35 + 0.1)).toFixed(2)),
      motorLoadPct: Math.round(76 + Math.cos(i * 0.5) * 10),
      status,
    });
  }

  return { '1H': series1H, '24H': series24H, '7D': series7D, '30D': series30D };
}

export const CRITICAL_MINING_EQUIPMENT_LIST: CriticalMiningEquipment[] = [
  {
    id: 'EQ-TD-01',
    name: 'Hydraulic Top-Drive & Rotary Head',
    type: 'Rotary Drill Mast Head',
    category: 'Primary Drilling Rig Drive',
    location: 'Open-Pit Bench East • Drill Rig #4',
    isoClass: 'Class IV (Large Machines on Flexible Foundation)',
    warningThresholdMmS: 4.5,
    criticalThresholdMmS: 7.1,
    currentStatus: 'CRITICAL',
    currentRmsMmS: 9.8,
    currentPeakG: 4.2,
    currentTempC: 89.4,
    currentFreqHz: 180,
    healthScorePct: 42,
    predictedRulHours: 64,
    recommendation:
      'Imminent bearing cage fatigue detected at 180 Hz. Throttle rotary RPM to 350; engage active torsional dampener and replenish synthetic gear lube.',
    data: generateHistoricalSeries(6.2, 2.5, 82.0, 150, 4.5, 7.1, true),
  },
  {
    id: 'EQ-DS-02',
    name: 'Downhole Drill String & BHA Stabilizer',
    type: 'Drill String & Bottom Hole Assembly',
    category: 'Subsurface Exploration String',
    location: 'Collar DDH-24-082 • Depth 162m',
    isoClass: 'Class II (Medium Sized Rotating Assemblies)',
    warningThresholdMmS: 4.0,
    criticalThresholdMmS: 6.5,
    currentStatus: 'WARNING',
    currentRmsMmS: 6.4,
    currentPeakG: 2.8,
    currentTempC: 76.8,
    currentFreqHz: 115,
    healthScorePct: 68,
    predictedRulHours: 180,
    recommendation:
      'Axial harmonic bounce detected due to hard spodumene quartz contact. Apply dynamic WOB modulation to suppress stick-slip torsional chatter.',
    data: generateHistoricalSeries(4.2, 1.8, 72.0, 110, 4.0, 6.5, true),
  },
  {
    id: 'EQ-MP-03',
    name: 'Triplex High-Pressure Mud Flush Pump',
    type: 'Reciprocating Positive Displacement Pump',
    category: 'Drilling Fluid Circulation',
    location: 'Rig 4 Mud Treatment Skid',
    isoClass: 'Class III (Pumps and Medium Industrial Machines)',
    warningThresholdMmS: 3.5,
    criticalThresholdMmS: 5.5,
    currentStatus: 'OPTIMAL',
    currentRmsMmS: 2.1,
    currentPeakG: 0.85,
    currentTempC: 58.2,
    currentFreqHz: 28,
    healthScorePct: 96,
    predictedRulHours: 1250,
    recommendation:
      'Laminar fluid delivery verified at 1,850 PSI. Piston stroke vibration and crosshead acoustics well within ISO Zone A (Optimal).',
    data: generateHistoricalSeries(2.0, 0.8, 57.0, 28, 3.5, 5.5, false),
  },
  {
    id: 'EQ-CR-07',
    name: 'Metso Superior Primary Gyratory Crusher',
    type: 'Heavy Comminution Gyratory Crusher',
    category: 'Primary Ore Crushing Plant',
    location: 'ROM Pad Crusher Station #1',
    isoClass: 'Class IV (Heavy Comminution Equipment on Rigid Base)',
    warningThresholdMmS: 5.0,
    criticalThresholdMmS: 8.5,
    currentStatus: 'WARNING',
    currentRmsMmS: 7.2,
    currentPeakG: 3.4,
    currentTempC: 74.5,
    currentFreqHz: 32,
    healthScorePct: 64,
    predictedRulHours: 210,
    recommendation:
      'Eccentric bushing shockwave signature elevated. Inspect spider bushing lubrication pressure and spider arm clearance.',
    data: generateHistoricalSeries(4.8, 2.1, 68.0, 30, 5.0, 8.5, true),
  },
  {
    id: 'EQ-SM-08',
    name: 'SAG Mill Trunnion Bearing & Ring Gear',
    type: '36-Foot Semi-Autogenous Grinding Mill',
    category: 'Grinding & Concentrator Circuit',
    location: 'Mill Concentrator Bay 2',
    isoClass: 'Class IV (Large Heavy Mills on Flexible Foundation)',
    warningThresholdMmS: 4.5,
    criticalThresholdMmS: 7.5,
    currentStatus: 'OPTIMAL',
    currentRmsMmS: 3.1,
    currentPeakG: 1.25,
    currentTempC: 61.0,
    currentFreqHz: 42,
    healthScorePct: 92,
    predictedRulHours: 980,
    recommendation:
      'Hydrostatic oil lift pressure stable at 2,400 kPa. Trunnion displacement harmonics show uniform shell liner wear profile.',
    data: generateHistoricalSeries(3.0, 1.2, 60.0, 42, 4.5, 7.5, false),
  },
  {
    id: 'EQ-EX-05',
    name: 'CAT 7495 Electric Rope Shovel Slew Drive',
    type: 'Electric Rope Shovel Swing Motor & Gearbox',
    category: 'Open-Pit Heavy Loading Fleet',
    location: 'North-West Bench Stope Face',
    isoClass: 'Class III (Large Heavy Mining Excavator Drive)',
    warningThresholdMmS: 4.0,
    criticalThresholdMmS: 6.8,
    currentStatus: 'OPTIMAL',
    currentRmsMmS: 2.6,
    currentPeakG: 0.95,
    currentTempC: 64.0,
    currentFreqHz: 75,
    healthScorePct: 89,
    predictedRulHours: 720,
    recommendation:
      'Planetary swing transmission gear mesh frequency (75 Hz) stable. Slew bearing grease purge automated cycle functioning normally.',
    data: generateHistoricalSeries(2.5, 0.9, 63.0, 75, 4.0, 6.8, false),
  },
  {
    id: 'EQ-HT-06',
    name: 'Komatsu 930E Wheel Motor Planetary Drive',
    type: 'Ultra-Class 320t Haul Truck Left Wheel Motor',
    category: 'Heavy Haulage Transportation',
    location: 'Haul Ramp Incline (8% Grade) • Truck #12',
    isoClass: 'Class III (Heavy Vehicle Drive Train)',
    warningThresholdMmS: 3.8,
    criticalThresholdMmS: 6.2,
    currentStatus: 'WARNING',
    currentRmsMmS: 5.6,
    currentPeakG: 2.1,
    currentTempC: 83.2,
    currentFreqHz: 128,
    healthScorePct: 71,
    predictedRulHours: 240,
    recommendation:
      'Planetary wheel gear vibration elevated during loaded ramp ascent. Schedule wheel motor oil sampling (ferrography test) on next 250-hour service.',
    data: generateHistoricalSeries(3.6, 1.4, 76.0, 120, 3.8, 6.2, true),
  },
];
