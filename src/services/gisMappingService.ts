import { Region } from '../types';

export type BaseMapMode = 'satellite' | 'terrain' | 'aeromagnetic';

export interface BaseMapMetadata {
  id: BaseMapMode;
  name: string;
  category: 'Optical Satellite' | 'Topographic DEM' | 'Airborne Geophysics';
  provider: string;
  apiEndpoint: string;
  attribution: string;
  crs: string;
  resolution: string;
  sensorOrModel: string;
  contourInterval?: string;
  cloudCoverPct?: number;
  lastAcquisitionDate: string;
  tileUrlPattern: string;
  previewImageUrl: string;
  status: 'active' | 'synced' | 'cached';
  features: string[];
}

export interface RegionSpatialBounds {
  centerLat: number;
  centerLng: number;
  centerFormatted: string;
  crsName: string;
  epsgCode: string;
  minElevationM: number;
  maxElevationM: number;
  quadsheetName: string;
  tileCoordinates: { x: number; y: number; z: number };
}

export const REGION_SPATIAL_DATA: Record<Region, RegionSpatialBounds> = {
  Canada: {
    centerLat: 48.2415,
    centerLng: -78.9822,
    centerFormatted: '48.2415° N, 78.9822° W',
    crsName: 'NAD83 / UTM Zone 17N',
    epsgCode: 'EPSG:26917',
    minElevationM: 285,
    maxElevationM: 520,
    quadsheetName: 'Abitibi Greenstone Belt (NTS 32D/01)',
    tileCoordinates: { x: 37, y: 44, z: 7 },
  },
  USA: {
    centerLat: 40.7128,
    centerLng: -116.3421,
    centerFormatted: '40.7128° N, 116.3421° W',
    crsName: 'NAD83 / Nevada Central',
    epsgCode: 'EPSG:32108',
    minElevationM: 1420,
    maxElevationM: 2890,
    quadsheetName: 'Carlin Trend Gold Province (USGS 7.5\' Quad)',
    tileCoordinates: { x: 23, y: 49, z: 7 },
  },
  Europe: {
    centerLat: 52.7612,
    centerLng: 6.3514,
    centerFormatted: '52.7612° N, 6.3514° E',
    crsName: 'ETRS89 / UTM Zone 30N',
    epsgCode: 'EPSG:25830',
    minElevationM: 110,
    maxElevationM: 840,
    quadsheetName: 'Fennoscandian Shield / Iberian Pyrite Belt',
    tileCoordinates: { x: 67, y: 41, z: 7 },
  },
  Australia: {
    centerLat: -21.0314,
    centerLng: 119.7422,
    centerFormatted: '21.0314° S, 119.7422° E',
    crsName: 'GDA2020 / MGA Zone 50',
    epsgCode: 'EPSG:7850',
    minElevationM: 210,
    maxElevationM: 1045,
    quadsheetName: 'Pilbara Craton / Hamersley Basin (GA 1:250k)',
    tileCoordinates: { x: 107, y: 77, z: 7 },
  },
  Africa: {
    centerLat: -10.8214,
    centerLng: 25.3218,
    centerFormatted: '10.8214° S, 25.3218° E',
    crsName: 'WGS 84 / UTM Zone 35S',
    epsgCode: 'EPSG:32735',
    minElevationM: 1150,
    maxElevationM: 1580,
    quadsheetName: 'Central African Copperbelt (Kolwezi-Tenke Nappe)',
    tileCoordinates: { x: 74, y: 71, z: 7 },
  },
};

/**
 * Registry of GIS base map configurations provided by the mapping API service
 */
export const BASEMAP_REGISTRY: Record<BaseMapMode, (region: Region) => BaseMapMetadata> = {
  satellite: (region: Region) => ({
    id: 'satellite',
    name: 'Satellite Orthomosaic',
    category: 'Optical Satellite',
    provider: 'Esri World Imagery & Sentinel-2 MSI Service',
    apiEndpoint: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    attribution: '© Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USGS, AeroGRID, IGN, and GIS User Community',
    crs: REGION_SPATIAL_DATA[region].crsName,
    resolution: '0.5m – 15m Ground Sampling Distance (GSD)',
    sensorOrModel: 'Sentinel-2 Multispectral & High-Res Commercial Orthophoto',
    cloudCoverPct: 1.2,
    lastAcquisitionDate: '2026-08-14 (Pass 102/Orb 4)',
    tileUrlPattern: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    previewImageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1600&q=80',
    status: 'active',
    features: [
      'High-resolution multi-spectral optical reflectance',
      'True-color RGB surface geomorphology',
      'Visible open-pit benches & haul road infrastructure',
      'Vegetation canopy penetration & outcrop exposure index',
    ],
  }),

  terrain: (region: Region) => ({
    id: 'terrain',
    name: 'Topographic Terrain DEM',
    category: 'Topographic DEM',
    provider: 'USGS 3DEP & OpenTopoMap Hypsometric DEM',
    apiEndpoint: 'https://tile.opentopomap.org',
    attribution: 'Map data: © OpenStreetMap contributors, SRTM 1-ArcSec | Map style: © OpenTopoMap (CC-BY-SA)',
    crs: REGION_SPATIAL_DATA[region].crsName,
    resolution: '1 Arc-Second (30m DEM) / LiDAR 1m Shaded Relief',
    sensorOrModel: 'USGS 3D Elevation Program (3DEP) & Copernicus GLO-30 DEM',
    contourInterval: '20m Index / 10m Supplementary',
    lastAcquisitionDate: '2026-07-28 (DEM V4.1 Normalized)',
    tileUrlPattern: 'https://tile.opentopomap.org/{z}/{y}/{x}.png',
    previewImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
    status: 'active',
    features: [
      'Hydrographic drainage network & stream catchment flow vectors',
      'Hypsometric elevation tint with hillshaded slope illumination',
      'Calibrated 20m elevation contour lineaments',
      'Structural ridge crests, saddles, and steep escapement cliffs',
    ],
  }),

  aeromagnetic: (region: Region) => ({
    id: 'aeromagnetic',
    name: 'Airborne Aeromagnetic TMI',
    category: 'Airborne Geophysics',
    provider: 'Geological Survey Airborne Geophysics Repository',
    apiEndpoint: 'https://geophysics.usgs.gov/services/tmi_rtp/wms',
    attribution: 'Airborne Geophysical Survey Repository & Geological Survey Consortium',
    crs: REGION_SPATIAL_DATA[region].crsName,
    resolution: '100m Flight Line Spacing / 50m Cell Size',
    sensorOrModel: 'Cesium Vapor Magnetometer (0.01 nT Sensitivity)',
    lastAcquisitionDate: '2026-06-11 (Survey Grid C)',
    tileUrlPattern: 'https://geophysics.example.com/tiles/tmi/{z}/{y}/{x}.png',
    previewImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    status: 'active',
    features: [
      'Total Magnetic Intensity (TMI) Reduced to Magnetic Pole (RTP)',
      'Subsurface magnetic susceptibility structural lineaments',
      'Deep hydrothermal fluid pathways & fault contacts',
      'First Vertical Derivative (1VD) fault edge delineation',
    ],
  }),
};

/**
 * GIS Mapping Service Client Interface
 */
class GISMappingService {
  private activeMode: BaseMapMode = 'terrain';
  private listeners: Array<(mode: BaseMapMode, metadata: BaseMapMetadata) => void> = [];

  /**
   * Get metadata configuration for a specific basemap mode and region
   */
  public getBaseMapConfig(mode: BaseMapMode, region: Region): BaseMapMetadata {
    const builder = BASEMAP_REGISTRY[mode];
    return builder(region);
  }

  /**
   * Get spatial bounds for a given region
   */
  public getRegionBounds(region: Region): RegionSpatialBounds {
    return REGION_SPATIAL_DATA[region] || REGION_SPATIAL_DATA.Canada;
  }

  /**
   * Request basemap layer switch via the mapping API service
   */
  public async switchBaseMap(
    mode: BaseMapMode,
    region: Region
  ): Promise<{ mode: BaseMapMode; config: BaseMapMetadata; latencyMs: number }> {
    const startTime = performance.now();
    // Simulate real network API handshake with the GIS tile server
    await new Promise((resolve) => setTimeout(resolve, 80));
    this.activeMode = mode;
    const config = this.getBaseMapConfig(mode, region);
    const latencyMs = Math.round(performance.now() - startTime);

    // Notify registered listeners
    this.listeners.forEach((listener) => listener(mode, config));

    return {
      mode,
      config,
      latencyMs,
    };
  }

  /**
   * Get current active basemap mode
   */
  public getActiveMode(): BaseMapMode {
    return this.activeMode;
  }

  /**
   * Subscribe to basemap view changes
   */
  public subscribe(listener: (mode: BaseMapMode, metadata: BaseMapMetadata) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Calculate simulated elevation at specific point based on DEM model
   */
  public getElevationAtCoords(region: Region, xPct: number, yPct: number): number {
    const bounds = this.getRegionBounds(region);
    const range = bounds.maxElevationM - bounds.minElevationM;
    const relief =
      Math.sin(xPct * 7.5) * (range * 0.35) +
      Math.cos(yPct * 6.2) * (range * 0.25) +
      Math.sin((xPct + yPct) * 12) * (range * 0.15);
    return Math.round(bounds.minElevationM + range * 0.4 + relief);
  }
}

export const gisMappingService = new GISMappingService();
