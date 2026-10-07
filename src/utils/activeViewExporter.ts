import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActiveTab, Region, DrillHole } from '../types';
import {
  MINERALS_DATABASE,
  SAMPLE_DRILLHOLES,
  EXPLORATION_TARGETS,
  GEOCHEMICAL_ASSAYS,
  REGIONAL_EXTRACTION_TONNAGE,
  REGIONAL_ESG_SITES,
  SAMPLE_A2A_TASKS,
} from '../data/miningData';
import { downloadCSV, exportDrillholesToCSV, computeIntervalVisualizationMetrics } from './exportUtils';

const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

export interface ViewExportResult {
  success: boolean;
  filename: string;
  format: 'csv' | 'pdf';
  viewName: string;
  recordCount: number;
}

/**
 * Get human-readable title and description for each application view
 */
export const getViewMetadata = (tab: ActiveTab, region: Region = 'Canada') => {
  switch (tab) {
    case 'drillholes':
      return {
        title: 'Drill Hole Logging & 3D Borehole Models',
        filenamePrefix: `MineAI_DrillHoles_${region}`,
        description: 'Diamond drill core intervals, assay intercepts, petrophysical density, spatial mineral concentrations, and custom depth annotations.',
      };
    case 'minerals':
      return {
        title: 'Mineral Petrography & Spectral Catalog',
        filenamePrefix: 'MineAI_Mineral_Database',
        description: 'Crystallographic database, Mohs hardness, specific gravity, VNIR/SWIR diagnostic spectral peaks, and critical mineral classifications.',
      };
    case 'dashboard':
      return {
        title: 'Executive Mineral Resource & Extraction Dashboard',
        filenamePrefix: `MineAI_Executive_Dashboard_${region}`,
        description: `Regional mine production tonnages, 7-day extraction trends, head grades, metallurgical recoveries, and hub operations for ${region}.`,
      };
    case 'gis_map':
      return {
        title: 'Exploration GIS Spatial Targets & Georeferencing',
        filenamePrefix: `MineAI_GIS_Targets_${region}`,
        description: 'Georeferenced exploration targets, GPS collar coordinates, prospective mineral corridors, and priority exploration targets.',
      };
    case 'geochemistry':
      return {
        title: 'Geochemical Multi-Element Assays & Geophysics',
        filenamePrefix: `MineAI_Geochemistry_Assays_${region}`,
        description: 'Surface soil and grab sample geochemistry, gold and pathfinder elemental concentrations, alteration halo indices, and GPS coordinates.',
      };
    case 'vibration_signals':
      return {
        title: 'SCADA Machinery Vibration & AI Fault Telemetry',
        filenamePrefix: 'MineAI_SCADA_Vibration_Telemetry',
        description: 'Continuous accelerometer frequencies, bearing wear degradation indices, ISO vibration velocity, and predictive maintenance schedules.',
      };
    case 'economics':
      return {
        title: 'Mining Economics Feasibility & DCF Cashflows',
        filenamePrefix: 'MineAI_Mining_Economics_Model',
        description: 'Life of Mine (LOM) financial models, initial CAPEX, OPEX per tonne, net present value (NPV @ 8%), IRR, and commodity price sensitivities.',
      };
    case 'healthcare_esg':
      return {
        title: 'Occupational Miner Health & ESG Environmental Compliance',
        filenamePrefix: `MineAI_Health_ESG_Audit_${region}`,
        description: 'Underground miner vitals, respirable silica dust (PM2.5/PM10), wet-bulb heat stress indices, tailings dam stability, and carbon offsets.',
      };
    case 'a2a_judge':
      return {
        title: 'A2A Autonomous Agent Consensus & Decision Audits',
        filenamePrefix: 'MineAI_A2A_Agent_Audit_Log',
        description: 'Multi-agent deliberation logs, exploration hypothesis verifications, consensus scores, and autonomous workflow actions.',
      };
    case 'vision':
      return {
        title: 'Computer Vision Drill Core Petrography & Fractures',
        filenamePrefix: 'MineAI_Core_Vision_Inspection',
        description: 'Rock quality designation (RQD) image inference, vein stockwork fracture density, and visual mineral identification models.',
      };
    case 'assistant':
      return {
        title: 'MineAI Copilot Field Notes & Geological Synthesis',
        filenamePrefix: 'MineAI_Copilot_Field_Notes',
        description: 'Field geologist Q&A logs, automated assay interpretation synthesis, drill plan recommendations, and voice field notes.',
      };
    case 'subscription':
      return {
        title: 'MineAI Platform License & Offline Field Entitlements',
        filenamePrefix: 'MineAI_License_Entitlements',
        description: 'Enterprise subscriber credentials, 7-day field trial status, and certified offline data synchronization tokens.',
      };
    default:
      return {
        title: 'MineAI Exploration Intelligence Field Data',
        filenamePrefix: `MineAI_Field_Data_${region}`,
        description: 'Certified mining operational telemetry and geological survey records for offline field analysis.',
      };
  }
};

/**
 * Generate CSV dataset for the currently active view
 */
export const exportActiveViewAsCSV = (
  tab: ActiveTab,
  region: Region = 'Canada',
  customDrillholes?: DrillHole[]
): ViewExportResult => {
  const meta = getViewMetadata(tab, region);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${meta.filenamePrefix}_${dateStr}.csv`;
  const holes = customDrillholes || SAMPLE_DRILLHOLES;

  let csvContent = '';
  let recordCount = 0;

  switch (tab) {
    case 'drillholes': {
      exportDrillholesToCSV(holes);
      return {
        success: true,
        filename,
        format: 'csv',
        viewName: meta.title,
        recordCount: holes.reduce((acc, h) => acc + (h.intervals?.length || 1), 0),
      };
    }

    case 'minerals': {
      const headers = [
        'ID',
        'Mineral_Name',
        'Chemical_Formula',
        'Mineral_Group',
        'Mohs_Hardness',
        'Specific_Gravity',
        'Crystal_System',
        'Critical_Mineral_Flag',
        'VNIR_Peak',
        'SWIR_Peak',
        'Deposit_Types',
      ];
      const rows = [headers.join(',')];
      MINERALS_DATABASE.forEach((m) => {
        rows.push(
          [
            escapeCSV(m.id),
            escapeCSV(m.name),
            escapeCSV(m.chemicalFormula),
            escapeCSV(m.mineralGroup),
            escapeCSV(m.hardness),
            escapeCSV(m.specificGravity),
            escapeCSV(m.crystalSystem),
            escapeCSV(m.criticalMineral ? 'YES' : 'NO'),
            escapeCSV(m.spectralPeaks?.vnir || '-'),
            escapeCSV(m.spectralPeaks?.swir || '-'),
            escapeCSV(Array.isArray(m.depositTypes) ? m.depositTypes.join('; ') : m.depositTypes || ''),
          ].join(',')
        );
      });
      csvContent = rows.join('\r\n');
      recordCount = MINERALS_DATABASE.length;
      break;
    }

    case 'dashboard': {
      const profile = REGIONAL_EXTRACTION_TONNAGE[region] || REGIONAL_EXTRACTION_TONNAGE['Canada'];
      const headers = [
        'Region',
        'Mining_Hub',
        'Primary_Commodity',
        'Day_Label',
        'Calendar_Date',
        'Daily_Extraction_Tonnage',
        'Target_Tonnage',
        'Head_Grade_AuEq_gpt',
        'Seven_Day_Delta_Pct',
      ];
      const rows = [headers.join(',')];
      profile.sevenDayHistory.forEach((day) => {
        rows.push(
          [
            escapeCSV(profile.region),
            escapeCSV(profile.hubName),
            escapeCSV(profile.primaryCommodity),
            escapeCSV(day.day),
            escapeCSV(day.dateLabel),
            escapeCSV(day.tonnage),
            escapeCSV(day.targetTonnage),
            escapeCSV(day.gradeAuEqGpt),
            escapeCSV(profile.sevenDayDeltaPct),
          ].join(',')
        );
      });
      csvContent = rows.join('\r\n');
      recordCount = profile.sevenDayHistory.length;
      break;
    }

    case 'gis_map': {
      const targets = EXPLORATION_TARGETS.filter((t) => !t.region || t.region === region || region === 'Canada');
      const activeTargets = targets.length > 0 ? targets : EXPLORATION_TARGETS;
      const headers = [
        'Target_ID',
        'Target_Name',
        'Region',
        'Country',
        'Latitude',
        'Longitude',
        'Commodity',
        'Stage',
      ];
      const rows = [headers.join(',')];
      activeTargets.forEach((t) => {
        rows.push(
          [
            escapeCSV(t.id),
            escapeCSV(t.name),
            escapeCSV(t.region || region),
            escapeCSV(t.country),
            escapeCSV(t.coordinates.lat),
            escapeCSV(t.coordinates.lng),
            escapeCSV(t.commodity),
            escapeCSV(t.stage),
          ].join(',')
        );
      });
      csvContent = rows.join('\r\n');
      recordCount = activeTargets.length;
      break;
    }

    case 'geochemistry': {
      const headers = [
        'Sample_ID',
        'Latitude',
        'Longitude',
        'Elevation_m',
        'Sample_Type',
        'Au_ppm',
        'Cu_pct',
        'Li_ppm',
        'As_ppm_Pathfinder',
        'Anomaly_Rating',
      ];
      const rows = [headers.join(',')];
      GEOCHEMICAL_ASSAYS.forEach((s) => {
        rows.push(
          [
            escapeCSV(s.sampleId),
            escapeCSV(s.lat),
            escapeCSV(s.lng),
            escapeCSV(s.elevationM),
            escapeCSV(s.sampleType),
            escapeCSV(s.auPpm),
            escapeCSV(s.cuPct),
            escapeCSV(s.liPpm),
            escapeCSV(s.asPpm),
            escapeCSV(s.anomalyRating),
          ].join(',')
        );
      });
      csvContent = rows.join('\r\n');
      recordCount = GEOCHEMICAL_ASSAYS.length;
      break;
    }

    case 'vibration_signals': {
      const headers = [
        'Equipment_ID',
        'Asset_Name',
        'Frequency_Peak_Hz',
        'Velocity_RMS_mms',
        'Bearing_Health_Index_Pct',
        'ISO_Vibration_Zone',
        'Alert_Status',
        'Recommended_Action',
      ];
      const rows = [headers.join(',')];
      const equipmentRows = [
        { id: 'EQ-CRUSH-01', name: 'Primary Gyratory Crusher #1', freq: 29.4, vel: 4.8, health: 88, iso: 'Zone B (Acceptable)', status: 'NORMAL', action: 'Standard lube interval' },
        { id: 'EQ-SAG-02', name: 'SAG Mill Trunnion Drive #2', freq: 58.2, vel: 7.2, health: 74, iso: 'Zone C (Warning)', status: 'WARNING', action: 'Inspect pinion meshing on next shift' },
        { id: 'EQ-BALL-01', name: 'Secondary Ball Mill Motor', freq: 118.0, vel: 3.1, health: 93, iso: 'Zone A (Good)', status: 'OPTIMAL', action: 'Routine baseline' },
        { id: 'EQ-PUMP-04', name: 'Cyclone Slurry Feed Pump #4', freq: 14.8, vel: 6.4, health: 68, iso: 'Zone C (Warning)', status: 'ATTENTION', action: 'Impeller balance calibration required' },
        { id: 'EQ-VENT-03', name: 'Underground Main Exhaust Fan #3', freq: 44.5, vel: 2.2, health: 96, iso: 'Zone A (Good)', status: 'OPTIMAL', action: 'Compliant with MSHA/OSHA standards' },
      ];
      equipmentRows.forEach((r) => {
        rows.push(
          [
            escapeCSV(r.id),
            escapeCSV(r.name),
            escapeCSV(r.freq),
            escapeCSV(r.vel),
            escapeCSV(r.health),
            escapeCSV(r.iso),
            escapeCSV(r.status),
            escapeCSV(r.action),
          ].join(',')
        );
      });
      csvContent = rows.join('\r\n');
      recordCount = equipmentRows.length;
      break;
    }

    case 'economics': {
      const headers = [
        'Parameter',
        'Base_Case_Value',
        'Unit',
        'Downside_Case_-15%',
        'Upside_Case_+15%',
        'Sensitivity_Impact',
      ];
      const rows = [headers.join(',')];
      const financialRows = [
        { param: 'Net Present Value (NPV @ 8%)', val: 428.5, unit: 'USD Million', down: 320.1, up: 541.2, imp: 'High (Discount Rate Sensitivity)' },
        { param: 'Internal Rate of Return (IRR)', val: 26.4, unit: '%', down: 19.8, up: 33.1, imp: 'Very High (Capital Efficiency)' },
        { param: 'Initial Capital Expenditure (CAPEX)', val: 285.0, unit: 'USD Million', down: 242.25, up: 327.75, imp: 'Medium (Pre-Stripping & Mill Construction)' },
        { param: 'Life of Mine (LOM) Operating Cost (OPEX)', val: 48.50, unit: 'USD/t Processed', down: 41.22, up: 55.78, imp: 'High (Diesel & Reagent Power)' },
        { param: 'All-In Sustaining Costs (AISC)', val: 940.0, unit: 'USD/oz Au Eq', down: 799.0, up: 1081.0, imp: 'Top Quartile Global Cost Curve' },
        { param: 'Payback Period', val: 2.8, unit: 'Years', down: 3.4, up: 2.2, imp: 'Low Risk Return' },
      ];
      financialRows.forEach((f) => {
        rows.push(
          [
            escapeCSV(f.param),
            escapeCSV(f.val),
            escapeCSV(f.unit),
            escapeCSV(f.down),
            escapeCSV(f.up),
            escapeCSV(f.imp),
          ].join(',')
        );
      });
      csvContent = rows.join('\r\n');
      recordCount = financialRows.length;
      break;
    }

    case 'healthcare_esg': {
      const esgSites = REGIONAL_ESG_SITES[region] || REGIONAL_ESG_SITES['Canada'] || [];
      const headers = [
        'Site_Name',
        'Region',
        'Elevation_m',
        'Primary_Commodity',
        'Certification',
        'Overall_ESG_Score',
        'Water_Recycled_Pct',
        'TRIFR_Per_Million_Hours',
        'Tailings_Stewardship_Score',
      ];
      const rows = [headers.join(',')];
      esgSites.forEach((s) => {
        rows.push(
          [
            escapeCSV(s.siteName),
            escapeCSV(region),
            escapeCSV(s.elevationM),
            escapeCSV(s.primaryCommodity),
            escapeCSV(s.certification),
            escapeCSV(s.overallEsgScore),
            escapeCSV(s.waterRecycledPct),
            escapeCSV(s.trifrPerMillionHours),
            escapeCSV(s.scores.tailingsStewardship),
          ].join(',')
        );
      });
      csvContent = rows.join('\r\n');
      recordCount = esgSites.length;
      break;
    }

    case 'a2a_judge': {
      const headers = ['Task_ID', 'Task_Name', 'Task_Type', 'Timestamp', 'Judge_Verdict', 'Overall_Score'];
      const rows = [headers.join(',')];
      SAMPLE_A2A_TASKS.forEach((t) => {
        rows.push(
          [
            escapeCSV(t.id),
            escapeCSV(t.title),
            escapeCSV(t.taskType),
            escapeCSV(t.timestamp),
            escapeCSV(t.judgeEvaluation?.verdict || 'APPROVED'),
            escapeCSV(t.judgeEvaluation?.overallScore || 92),
          ].join(',')
        );
      });
      csvContent = rows.join('\r\n');
      recordCount = SAMPLE_A2A_TASKS.length;
      break;
    }

    default: {
      const headers = ['Timestamp', 'Station', 'Parameter', 'Measured_Value', 'Unit', 'Quality_Flag'];
      const rows = [headers.join(',')];
      const now = new Date().toISOString();
      const telemetryRows = [
        { st: 'Collar GPS Telemetry', param: 'Collar RTK Precision', val: 1.8, unit: 'meters', q: 'VALID' },
        { st: 'Downhole D3 Engine', param: 'Voxel Subsurface Grid Size', val: 117, unit: 'nodes', q: 'CALCULATED' },
        { st: 'Petrophysics Engine', param: 'Mineral Density Gradient Layer', val: 100, unit: 'pct overlay', q: 'ACTIVE' },
        { st: 'Offline Storage Store', param: 'Cached Records Count', val: holes.length + MINERALS_DATABASE.length, unit: 'entities', q: 'SYNCED' },
      ];
      telemetryRows.forEach((r) => {
        rows.push([escapeCSV(now), escapeCSV(r.st), escapeCSV(r.param), escapeCSV(r.val), escapeCSV(r.unit), escapeCSV(r.q)].join(','));
      });
      csvContent = rows.join('\r\n');
      recordCount = telemetryRows.length;
      break;
    }
  }

  downloadCSV(filename, csvContent);
  return {
    success: true,
    filename,
    format: 'csv',
    viewName: meta.title,
    recordCount,
  };
};

/**
 * Generate PDF technical field report for the currently active view
 */
export const exportActiveViewAsPDF = (
  tab: ActiveTab,
  region: Region = 'Canada',
  customDrillholes?: DrillHole[]
): ViewExportResult => {
  const meta = getViewMetadata(tab, region);
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${meta.filenamePrefix}_Report_${dateStr}.pdf`;
  const holes = customDrillholes || SAMPLE_DRILLHOLES;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner #2A1810
  doc.setFillColor(42, 24, 16);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Gold accent bar #F59E0B
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 24, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`MINEAI EXPLORATION & FIELD DOSSIER: ${meta.title.toUpperCase()}`, margin, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(251, 191, 36);
  doc.text('Certified Technical Dossier for Offline Field Analysis & Exploration Geology', margin, 18);

  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Region: ${region} \u2022 Date: ${dateStr}`, pageWidth - margin, 18, { align: 'right' });

  // Executive Context Block
  doc.setFillColor(245, 245, 244);
  doc.roundedRect(margin, 30, pageWidth - margin * 2, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(42, 24, 16);
  doc.text('Offline Field Analysis Briefing & Geological Scope:', margin + 4, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);
  const splitDesc = doc.splitTextToSize(meta.description, pageWidth - margin * 2 - 8);
  doc.text(splitDesc, margin + 4, 42);

  let currentY = 56;
  let recordCount = 0;

  switch (tab) {
    case 'drillholes': {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(42, 24, 16);
      doc.text(`Active Diamond Drillhole Intercepts & Downhole Petrophysics (${holes.length} Boreholes)`, margin, currentY);
      currentY += 4;

      const tableRows: any[] = [];
      holes.forEach((dh) => {
        (dh.intervals || []).forEach((iv) => {
          const viz = computeIntervalVisualizationMetrics(dh, iv);
          const from = iv.fromDepthM ?? iv.from;
          const to = iv.toDepthM ?? iv.to;
          const length = (to - from).toFixed(1);
          const gradeVal = iv.primaryGradeValue ?? iv.assayAuGpt ?? iv.assayLiPct ?? iv.assayCuPct ?? 0;
          const gradeUnit = iv.gradeUnit || (iv.assayAuGpt ? 'g/t Au' : iv.assayLiPct ? '% Li₂O' : '% Cu');
          const customNote = (iv.annotations && iv.annotations.length > 0) ? iv.annotations.join('; ') : '-';

          tableRows.push([
            dh.holeId,
            `${from.toFixed(1)} - ${to.toFixed(1)}m`,
            `${length}m`,
            iv.lithology,
            `${gradeVal} ${gradeUnit}`,
            `${viz.bulkDensityGcm3} g/cm³`,
            `${viz.mineralConcentrationPct}%`,
            customNote,
          ]);
        });
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Hole ID', 'Depth Interval', 'Length', 'Lithology', 'Grade Intercept', 'Bulk Density', 'Spatial Conc.', 'Field Annotations']],
        body: tableRows.slice(0, 35),
        styles: { fontSize: 7, cellPadding: 1.8 },
        headStyles: { fillColor: [42, 24, 16], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 245, 239] },
      });

      recordCount = tableRows.length;
      break;
    }

    case 'minerals': {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(42, 24, 16);
      doc.text(`Certified Mineral Petrographic & Spectral Database (${MINERALS_DATABASE.length} Specimens)`, margin, currentY);
      currentY += 4;

      const tableRows = MINERALS_DATABASE.map((m) => [
        m.name,
        m.chemicalFormula,
        m.mineralGroup,
        `${m.hardness}`,
        `${m.specificGravity}`,
        m.criticalMineral ? 'YES (Critical)' : 'No',
        m.spectralPeaks?.swir || '-',
        Array.isArray(m.depositTypes) ? m.depositTypes[0] || '-' : m.depositTypes || '-',
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Mineral', 'Formula', 'Group', 'Hardness', 'S.G.', 'Critical', 'SWIR Peak', 'Deposit Setting']],
        body: tableRows,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [42, 24, 16], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 245, 239] },
      });

      recordCount = tableRows.length;
      break;
    }

    case 'dashboard': {
      const profile = REGIONAL_EXTRACTION_TONNAGE[region] || REGIONAL_EXTRACTION_TONNAGE['Canada'];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(42, 24, 16);
      doc.text(`Regional Mine Production & Mineral Resource Profile: ${region} (${profile.hubName})`, margin, currentY);
      currentY += 4;

      const tableRows = profile.sevenDayHistory.map((day) => [
        day.day,
        day.dateLabel,
        `${day.tonnage.toLocaleString()} t`,
        `${day.targetTonnage.toLocaleString()} t`,
        `${day.gradeAuEqGpt} g/t AuEq`,
        `${profile.sevenDayDeltaPct > 0 ? '+' : ''}${profile.sevenDayDeltaPct}% Trend`,
        profile.primaryCommodity,
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Day Cycle', 'Calendar Date', 'Actual Extraction', 'Target Extraction', 'Head Grade', '7-Day Variance', 'Key Commodities']],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [42, 24, 16], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 245, 239] },
      });

      recordCount = tableRows.length;
      break;
    }

    case 'gis_map': {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(42, 24, 16);
      doc.text(`Georeferenced Exploration Targets & Anomaly Coordinates (${region})`, margin, currentY);
      currentY += 4;

      const tableRows = EXPLORATION_TARGETS.map((t) => [
        t.name,
        t.region || region,
        t.country,
        `${t.coordinates.lat.toFixed(4)}°N`,
        `${t.coordinates.lng.toFixed(4)}°W`,
        t.commodity,
        t.stage,
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Target Name', 'Province', 'Country', 'Latitude', 'Longitude', 'Commodity', 'Stage']],
        body: tableRows,
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [42, 24, 16], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 245, 239] },
      });

      recordCount = tableRows.length;
      break;
    }

    case 'economics': {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(42, 24, 16);
      doc.text('Life of Mine (LOM) Discounted Cashflow & Capital Expenditure Matrix', margin, currentY);
      currentY += 4;

      const tableRows = [
        ['Net Present Value (NPV @ 8%)', '$428.5M USD', '$320.1M (-15%)', '$541.2M (+15%)', 'Robust economic baseline'],
        ['Internal Rate of Return (IRR)', '26.4%', '19.8%', '33.1%', 'Well above 15% hurdle rate'],
        ['Initial Capital Expenditure (CAPEX)', '$285.0M USD', '$242.3M', '$327.8M', 'EPIC plant & tailings infrastructure'],
        ['LOM Operating Costs (OPEX)', '$48.50 / tonne', '$41.22/t', '$55.78/t', 'Includes power, reagents & haulage'],
        ['All-In Sustaining Costs (AISC)', '$940 / oz Au Eq', '$799/oz', '$1,081/oz', 'Lowest quartile global cost curve'],
        ['Payback Period', '2.8 Years', '3.4 Years', '2.2 Years', 'Rapid capital recovery horizon'],
      ];

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Economic Metric', 'Base Case Value', 'Downside (-15%)', 'Upside (+15%)', 'Technical Assessment']],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [42, 24, 16], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 245, 239] },
      });

      recordCount = tableRows.length;
      break;
    }

    default: {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(42, 24, 16);
      doc.text(`Exploration Intelligence Telemetry & Operational Parameters`, margin, currentY);
      currentY += 4;

      const tableRows = [
        ['Platform Runtime', 'AI Studio Build & React SPA', 'ONLINE (Port 3000)', 'Verified Clean'],
        ['Subsurface Borehole Engine', 'D3.js 3D Isometric Strata & Heatmap', 'ACTIVE', 'Interactive Rotation & Tilt'],
        ['Mineral Density Gradient Layer', 'Petrophysical SG & Spatial Conc. Gradient', 'ACTIVE', 'Color-Coded Overlay on Boreholes'],
        ['Local State Annotation Layer', 'Persistent Interval Field Notes', 'SYNCED', 'Stored locally and in exports'],
        ['Global Data Export', 'CSV & PDF Client-Side Downloads', 'ENABLED', 'Ready for Offline Field Analysis'],
      ];

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Subsystem', 'Operational Specification', 'Status', 'Offline Capability']],
        body: tableRows,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [42, 24, 16], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 245, 239] },
      });

      recordCount = tableRows.length;
      break;
    }
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 113, 108);
    doc.text(
      `MineAI Exploration Platform \u2022 ${meta.title} \u2022 Offline Field Report \u2022 JORC / NI 43-101 Aligned`,
      margin,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  doc.save(filename);
  return {
    success: true,
    filename,
    format: 'pdf',
    viewName: meta.title,
    recordCount,
  };
};
