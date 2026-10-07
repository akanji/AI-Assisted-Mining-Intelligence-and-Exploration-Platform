import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HardHat,
  Radio,
  MapPin,
  FileCheck2,
  HeartPulse,
  Compass,
  X,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';
import { Region } from '../types';

interface SiteSafetyChecklistModalProps {
  isOpen: boolean;
  currentRegion: Region;
  targetRegion: Region;
  onConfirm: (region: Region) => void;
  onCancel: () => void;
}

interface SafetyItem {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: React.ElementType;
  mandatory: boolean;
}

const REGION_SITE_DETAILS: Record<
  Region,
  {
    siteName: string;
    province: string;
    primaryHazards: string[];
    riskLevel: 'MODERATE' | 'HIGH' | 'CRITICAL';
    evacPoint: string;
    coordinates: string;
  }
> = {
  Canada: {
    siteName: 'Abitibi & James Bay Exploration Camp',
    province: 'Quebec / Ontario Greenstone Belt',
    primaryHazards: [
      'Extreme sub-zero windchill (< -28°C) and frostbite risks',
      'Muskeg swamp instability & winter ice-crossing load limits',
      'Remote wilderness VHF blackouts (Satellite comms mandatory)',
      'Black bear & wildlife encounter protocols',
    ],
    riskLevel: 'HIGH',
    evacPoint: 'Rouyn-Noranda Regional Heliport (CYUY) - 42 min medevac',
    coordinates: '48.24° N, 78.98° W (NAD83 / UTM 17N)',
  },
  USA: {
    siteName: 'Great Basin & Carlin Trend Surface Benches',
    province: 'Nevada / Arizona Basin and Range',
    primaryHazards: [
      'Highwall bench rockfall & loose talus slope hazards',
      'Unmarked historic 19th-century underground shafts',
      'Severe lightning strike warnings during afternoon thermal updrafts',
      'Dehydration index exceeding 4.2 L/day requirement',
    ],
    riskLevel: 'MODERATE',
    evacPoint: 'Elko County Regional Medical Flight Hub - 35 min flight',
    coordinates: '40.71° N, 116.34° W (NAD83 / Nevada Central)',
  },
  Europe: {
    siteName: 'Fennoscandian Shield & Pyrite Belt Sector',
    province: 'Sweden / Finland / Spain Metallogenic Province',
    primaryHazards: [
      'Subsurface tunnel air quality & radon / methane ventilation',
      'Seismic micro-tremors induced by deep block-caving operations',
      'Heavy autonomous haulage transport corridor crossings',
      'EU REACH environmental chemical containment standards',
    ],
    riskLevel: 'MODERATE',
    evacPoint: 'Kiruna Hospital Trauma Center - 25 min road/heli',
    coordinates: '52.76° N, 6.35° E (ETRS89 / UTM 30N)',
  },
  Australia: {
    siteName: 'Pilbara & Gawler Craton Deep Exploration Ground',
    province: 'Western Australia / South Australia',
    primaryHazards: [
      'Extreme thermal stress & heat stroke thresholds (> 44°C ambient)',
      'Venomous Eastern Brown Snake & spider bite emergency protocols',
      'Remote outback desert isolation (> 450 km from hospital)',
      'Sudden cyclone flash flooding in dry ephemeral creek beds',
    ],
    riskLevel: 'CRITICAL',
    evacPoint: 'Royal Flying Doctor Service (RFDS) Newman Airstrip',
    coordinates: '21.03° S, 119.74° E (GDA2020 / MGA 50)',
  },
  Africa: {
    siteName: 'Central African Copperbelt Exploration Grid',
    province: 'DRC / Zambia Metallogenic Belt',
    primaryHazards: [
      'Malaria & tropical vector disease prophylaxis verification',
      'Monsoon wet-season mudslides and road washouts',
      'Artisanal mining pit stability and proximity exclusion zones',
      'Heavy tropical thunderstorm electrical discharge hazards',
    ],
    riskLevel: 'CRITICAL',
    evacPoint: 'Kolwezi Airport Air Ambulance Evacuation Base',
    coordinates: '10.82° S, 25.32° E (WGS 84 / UTM 35S)',
  },
};

const PROTOCOL_ITEMS: SafetyItem[] = [
  {
    id: 'ppe_compliance',
    category: 'Personal Protective Equipment',
    title: 'Site-Specific PPE & Biosafety Gear Inspection',
    description:
      'Verified CSA/OSHA Class 3 high-visibility apparel, steel/composite metatarsal boots, eye protection with side-shields, dust respirators, and wearable personal emergency beacon (PLB).',
    icon: HardHat,
    mandatory: true,
  },
  {
    id: 'satellite_comm',
    category: 'Emergency Communications',
    title: 'Lone-Worker Satellite Transceiver & Comms Check',
    description:
      'Active Iridium / Garmin InReach check-in message received by base dispatch. 2-hour automated deadman muster schedule programmed with GPS tracking.',
    icon: Radio,
    mandatory: true,
  },
  {
    id: 'terrain_hazards',
    category: 'Geotechnical & Terrain Hazards',
    title: 'Highwall Stability & Blast Clearance Verification',
    description:
      'Bench stability acoustic radar confirmed green. All personnel briefed on exclusion zones, unexploded blast radius, and heavy haulage right-of-way.',
    icon: AlertTriangle,
    mandatory: true,
  },
  {
    id: 'medevac_plan',
    category: 'Emergency Response',
    title: 'Medevac Corridor & Trauma First-Aid Confirmation',
    description:
      'Nearest emergency airstrip/helipad GPS coordinates verified. Vehicle trauma kits, snake-bite antivenom / thermal blankets, and on-site AED inspected.',
    icon: HeartPulse,
    mandatory: true,
  },
  {
    id: 'statutory_permits',
    category: 'Regulatory & Environmental',
    title: 'Exploration Concession & Environmental Clearances',
    description:
      'Active mining exploration license in order. Indigenous cultural heritage boundaries cleared, and fuel/drill-mud spill containment kits deployed.',
    icon: FileCheck2,
    mandatory: true,
  },
];

export const SiteSafetyChecklistModal: React.FC<SiteSafetyChecklistModalProps> = ({
  isOpen,
  currentRegion,
  targetRegion,
  onConfirm,
  onCancel,
}) => {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const siteInfo = REGION_SITE_DETAILS[targetRegion] || REGION_SITE_DETAILS.Canada;
  const allMandatoryChecked = PROTOCOL_ITEMS.every((item) => checkedIds[item.id]);
  const checkedCount = Object.values(checkedIds).filter(Boolean).length;
  const totalCount = PROTOCOL_ITEMS.length;

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectAll = () => {
    const allChecked: Record<string, boolean> = {};
    PROTOCOL_ITEMS.forEach((item) => {
      allChecked[item.id] = true;
    });
    setCheckedIds(allChecked);
  };

  const handleAuthorize = () => {
    if (!allMandatoryChecked) return;
    onConfirm(targetRegion);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-[#1C100B] border-2 border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-5 border-b border-amber-900/50 bg-gradient-to-r from-stone-950 via-[#2A1810] to-stone-950 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 animate-pulse">
              <ShieldAlert size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  MANDATORY SITE PROTOCOL
                </span>
                <span className="text-xs text-stone-400">ISO 45001 / Mining Safety Act</span>
              </div>
              <h2 className="text-xl font-black text-white font-['Space_Grotesk'] mt-0.5">
                Site Mobilization Safety Clearance
              </h2>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
            title="Cancel and stay on safe region"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-stone-300 flex-1">
          {/* Site Transition Banner */}
          <div className="p-3.5 rounded-xl bg-stone-900/90 border border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Active Site Transition
              </span>
              <div className="text-sm font-black text-white mt-0.5 flex items-center gap-2">
                <span className="text-stone-400">{currentRegion}</span>
                <span className="text-amber-400">➔</span>
                <span className="text-amber-300 underline underline-offset-4 font-extrabold">
                  {targetRegion}: {siteInfo.siteName}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-1 font-mono">
                Location: {siteInfo.coordinates} • {siteInfo.province}
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 flex-shrink-0">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  siteInfo.riskLevel === 'CRITICAL'
                    ? 'bg-red-950/80 text-red-200 border-red-600 animate-pulse'
                    : 'bg-amber-950/80 text-amber-200 border-amber-600'
                }`}
              >
                SITE RISK: {siteInfo.riskLevel}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Status: Awaiting Sign-Off</span>
            </div>
          </div>

          {/* Site-Specific Environmental Hazards */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle size={14} className="text-amber-400" />
              <span>Target Site Active Geo-Hazards ({targetRegion})</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {siteInfo.primaryHazards.map((hazard, hIdx) => (
                <div key={hIdx} className="flex items-start gap-2 text-stone-200">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{hazard}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-amber-900/40 text-[10px] text-stone-400 font-mono flex items-center justify-between">
              <span>Evac Base: <strong>{siteInfo.evacPoint}</strong></span>
            </div>
          </div>

          {/* Safety Protocols Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>Mandatory Pre-Entry Checklist ({checkedCount}/{totalCount})</span>
              </span>

              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
              >
                Select All Protocols (All-Clear)
              </button>
            </div>

            <div className="space-y-2.5">
              {PROTOCOL_ITEMS.map((item) => {
                const isChecked = !!checkedIds[item.id];
                const IconComponent = item.icon;

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md'
                        : 'bg-stone-900/70 border-stone-800 hover:border-amber-500/40'
                    }`}
                  >
                    {/* Custom Checkbox */}
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${
                        isChecked
                          ? 'bg-emerald-500 text-stone-950 font-bold'
                          : 'border-2 border-stone-600 hover:border-amber-400'
                      }`}
                    >
                      {isChecked && <CheckCircle2 size={15} className="text-stone-950 stroke-[3]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <IconComponent size={14} className={isChecked ? 'text-emerald-400' : 'text-amber-400'} />
                          <span>{item.title}</span>
                        </span>
                        <span className="text-[10px] uppercase font-mono font-bold text-stone-400">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 border-t border-amber-900/50 bg-[#140C07] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-stone-400 flex items-center gap-2">
            {allMandatoryChecked ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Unlock size={14} />
                <span>All 5 safety protocols acknowledged. Ready to unlock GIS layers.</span>
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                <Lock size={14} />
                <span>Acknowledge all {totalCount} items to authorize loading {targetRegion} GIS data.</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              id="btn-confirm-site-safety"
              onClick={handleAuthorize}
              disabled={!allMandatoryChecked}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black shadow-lg transition-all ${
                allMandatoryChecked
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 cursor-pointer shadow-emerald-500/20'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
              }`}
            >
              <ShieldAlert size={15} />
              <span>Authorize & Load {targetRegion} GIS Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
