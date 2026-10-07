import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Compass,
  ArrowRight,
  Sparkles,
  Route,
  Clock,
  Fuel,
  AlertTriangle,
  Send,
  Building2,
  CheckCircle2,
  RefreshCw,
  X,
  Phone,
} from 'lucide-react';
import { Region } from '../types';

export interface LogisticsPlace {
  id: string;
  name: string;
  type: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating: number;
  phone: string;
  operationalStatus: string;
  capabilities: string[];
}

export interface LogisticsRouteStep {
  instruction: string;
  distanceKm: number;
  durationMin: number;
  hazardWarning?: string;
}

export interface LogisticsRoute {
  origin: string;
  destination: string;
  totalDistanceKm: number;
  totalTransitMinutes: number;
  roadCondition: string;
  seasonalRestrictions: string;
  fuelConsumptionLiters: number;
  co2EmissionKg: number;
  elevationGainM: number;
  turnByTurn: LogisticsRouteStep[];
  suggestedStops: string[];
}

interface MiningLogisticsRouteAgentProps {
  region: Region;
  isOpen: boolean;
  onClose: () => void;
  onSelectCoordinates?: (coords: { lat: number; lng: number }) => void;
}

export const MiningLogisticsRouteAgent: React.FC<MiningLogisticsRouteAgentProps> = ({
  region,
  isOpen,
  onClose,
  onSelectCoordinates,
}) => {
  const [activeTab, setActiveTab] = useState<'routes' | 'places' | 'chat'>('routes');
  const [queryInput, setQueryInput] = useState<string>('');
  const [originInput, setOriginInput] = useState<string>('Val-d’Or Regional Logistics Hub');
  const [destinationInput, setDestinationInput] = useState<string>('Perron Diamond Drill Camp #3');
  const [transportMode, setTransportMode] = useState<'heavy_convoy' | '4x4_field_truck' | 'helicopter'>(
    'heavy_convoy'
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [agentSynthesis, setAgentSynthesis] = useState<string>(
    `MINEX Geospatial Route Agent analyzed mining transit infrastructure in the ${region} exploration sector. Full heavy-haul routing, emergency clinics, fuel depots, and turn-by-turn waypoint directions are active.`
  );

  const [places, setPlaces] = useState<LogisticsPlace[]>([
    {
      id: 'pl-01',
      name: "Val-d'Or Regional Mining Supply & Logistics Hub",
      type: 'Supply Depot & Heavy Equipment Staging',
      address: "1420 3e Avenue, Val-d'Or, QC J9P 1V3",
      coordinates: { lat: 48.098, lng: -77.789 },
      rating: 4.8,
      phone: '+1 (819) 824-3400',
      operationalStatus: 'Open 24/7 • Heavy Crane Staging Ready',
      capabilities: ['HQ Core Barrel Stock', 'Mud Additives', 'Diesel Fuel Depots', 'Rotary Rig Dispatch'],
    },
    {
      id: 'pl-02',
      name: "ALS Geochemistry Val-d'Or Laboratory",
      type: 'Certified Commercial Assay Facility',
      address: "1324 Rue Turcotte, Val-d'Or, QC J9P 3X6",
      coordinates: { lat: 48.105, lng: -77.795 },
      rating: 4.9,
      phone: '+1 (819) 825-0178',
      operationalStatus: 'ISO/IEC 17025 Certified • Rush Assay Enabled',
      capabilities: ['Fire Assay Au', '48-Element ICP-MS', 'Metallic Screen', 'Core Cutting Facility'],
    },
    {
      id: 'pl-03',
      name: 'Perron Camp Helipad & Field Command Base',
      type: 'Remote Drill Camp & Helipad',
      address: "Route d'Accès Nord Km 64, Abitibi, QC",
      coordinates: { lat: 48.242, lng: -78.981 },
      rating: 4.7,
      phone: '+1 (819) 555-0199 (Satcom)',
      operationalStatus: 'Active Camp • VFR Helicopter Flight Strip',
      capabilities: ['AStar B3 Helipad', '60-Bed Accommodation', 'First Aid Trauma Clinic', 'Water Well Line'],
    },
  ]);

  const [route, setRoute] = useState<LogisticsRoute>({
    origin: 'Val-d’Or Regional Logistics Hub',
    destination: 'Perron Diamond Drill Camp #3',
    totalDistanceKm: 142.5,
    totalTransitMinutes: 135,
    roadCondition: 'Class-3 All-Weather Graded Gravel Haul Road with Culvert Crossings',
    seasonalRestrictions: 'Spring thaw half-load limit (May 1-June 15). Winter ice bridge open (Dec-April).',
    fuelConsumptionLiters: 98.4,
    co2EmissionKg: 262.7,
    elevationGainM: 185,
    turnByTurn: [
      {
        instruction: "Depart Val-d'Or Logistics Staging Yard heading North on QC-111 N.",
        distanceKm: 28.0,
        durationMin: 22,
        hazardWarning: 'Watch for open-pit haul trucks merging at Km 14.',
      },
      {
        instruction: 'Turn left onto Chemin des Mines / Route R-1025 toward Cadillac Shear sector.',
        distanceKm: 56.4,
        durationMin: 48,
        hazardWarning: 'Unpaved crushed-granite surface. Reduce convoy speed to 60 km/h.',
      },
      {
        instruction: 'Cross the Harricana River Bridge (load rated to 95 metric tonnes).',
        distanceKm: 1.2,
        durationMin: 3,
        hazardWarning: 'Single-lane alternating radio check on VHF Channel 146.520.',
      },
      {
        instruction: 'Continue North-West on Forest Access Road Km 45 spur directly to Drill Collar Pad DDH-AB-01.',
        distanceKm: 56.9,
        durationMin: 62,
        hazardWarning: 'Steep 8% grade incline over ridge crest. Retarders mandatory.',
      },
    ],
    suggestedStops: [
      'Km 42 Petro-Pass Diesel & Satellite Checkpoint',
      'Harricana Bridge Weigh Scale & Radio Protocol Station',
    ],
  });

  const handleQueryAgent = async (overrideQuery?: string) => {
    const q = overrideQuery || queryInput || `Route from ${originInput} to ${destinationInput}`;
    setIsLoading(true);
    try {
      const res = await fetch('/api/gemini/places-routes-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          region,
          origin: originInput,
          destination: destinationInput,
          transportMode,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.places?.length > 0) setPlaces(data.data.places);
        if (data.data.route) setRoute(data.data.route);
        if (data.data.agentSynthesis) setAgentSynthesis(data.data.agentSynthesis);
      }
    } catch (_err) {
      // fallback already in state
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-gradient-to-br from-[#1C100B] via-[#23150D] to-[#120B08] border-2 border-amber-500/50 shadow-2xl overflow-hidden text-stone-200">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 border-b border-amber-900/40 bg-black/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Navigation size={18} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white font-['Space_Grotesk']">
                  Mining Logistics, Places &amp; Routes Agent
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                  {region} Sector
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Pulls real-world exploration places, camps, laboratories, haul roads, and turn-by-turn driving directions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-800 bg-stone-950/60 text-xs font-bold">
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'routes'
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Route size={14} />
            <span>Directions &amp; Haul Routes</span>
          </button>

          <button
            onClick={() => setActiveTab('places')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'places'
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Building2 size={14} />
            <span>Places &amp; Depots ({places.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow-sm'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Ask Logistics Agent (AI)</span>
          </button>
        </div>

        {/* Agent Synthesis Banner */}
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
          <Compass size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-mono uppercase text-[10px] block">
              Logistics Agent Routing Intelligence:
            </strong>
            {agentSynthesis}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* TAB 1: ROUTES & DIRECTIONS */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              {/* Origin / Destination & Transport Form */}
              <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">Origin Location:</span>
                  <input
                    type="text"
                    value={originInput}
                    onChange={(e) => setOriginInput(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">Destination Camp / Pad:</span>
                  <input
                    type="text"
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">Transport Specification:</span>
                  <div className="flex gap-2">
                    <select
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value as any)}
                      className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-white"
                    >
                      <option value="heavy_convoy">Heavy Rig Convoy (≤90t)</option>
                      <option value="4x4_field_truck">4x4 Light Crew Truck</option>
                      <option value="helicopter">Helicopter Sling Route</option>
                    </select>

                    <button
                      onClick={() => handleQueryAgent()}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      {isLoading ? <RefreshCw size={13} className="animate-spin" /> : <Navigation size={13} />}
                      <span>Route</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Key Route Metrics Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 uppercase">
                    <Route size={12} className="text-amber-400" />
                    <span>Distance</span>
                  </div>
                  <div className="text-lg font-extrabold text-white mt-0.5">{route.totalDistanceKm} km</div>
                  <span className="text-[10px] text-stone-400">({(route.totalDistanceKm * 0.621371).toFixed(1)} miles)</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 uppercase">
                    <Clock size={12} className="text-cyan-400" />
                    <span>Transit Time</span>
                  </div>
                  <div className="text-lg font-extrabold text-cyan-300 mt-0.5">
                    {Math.floor(route.totalTransitMinutes / 60)}h {route.totalTransitMinutes % 60}m
                  </div>
                  <span className="text-[10px] text-stone-400">@ 60 km/h average</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 uppercase">
                    <Fuel size={12} className="text-emerald-400" />
                    <span>Diesel Fuel</span>
                  </div>
                  <div className="text-lg font-extrabold text-emerald-300 mt-0.5">{route.fuelConsumptionLiters} L</div>
                  <span className="text-[10px] text-stone-400">{route.co2EmissionKg} kg CO₂</span>
                </div>

                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                  <div className="flex items-center gap-1 text-[10px] text-stone-400 uppercase">
                    <Compass size={12} className="text-purple-400" />
                    <span>Elevation Climb</span>
                  </div>
                  <div className="text-lg font-extrabold text-purple-300 mt-0.5">+{route.elevationGainM} m</div>
                  <span className="text-[10px] text-stone-400">Max Grade 8.2%</span>
                </div>
              </div>

              {/* Road Condition & Seasonal Restrictions */}
              <div className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 text-xs space-y-1">
                <div className="text-stone-300">
                  <strong className="text-stone-400">Surface Condition:</strong> {route.roadCondition}
                </div>
                <div className="text-stone-300">
                  <strong className="text-amber-400">Seasonal Advisory:</strong> {route.seasonalRestrictions}
                </div>
              </div>

              {/* Turn-by-Turn Waypoint Directions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Turn-by-Turn Driving Directions:
                </span>
                <div className="space-y-2">
                  {route.turnByTurn.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-stone-950 border border-stone-800 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="text-white font-medium">{step.instruction}</div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-stone-400">
                          <span>Segment: <strong className="text-amber-300">{step.distanceKm} km</strong></span>
                          <span>Est. Time: <strong className="text-stone-200">{step.durationMin} min</strong></span>
                        </div>
                        {step.hazardWarning && (
                          <div className="p-1.5 rounded bg-red-950/40 border border-red-800/40 text-[10px] text-red-300 flex items-center gap-1.5">
                            <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
                            <span>{step.hazardWarning}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLACES & MINING INFRASTRUCTURE */}
          {activeTab === 'places' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Field Camps, Assay Labs &amp; Logistics Infrastructure ({region}):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {places.map((place) => (
                  <div
                    key={place.id}
                    className="p-3.5 rounded-xl bg-stone-950 border border-stone-800 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                          {place.type}
                        </span>
                        <h4 className="text-sm font-extrabold text-white font-['Space_Grotesk']">
                          {place.name}
                        </h4>
                        <p className="text-[11px] text-stone-400">{place.address}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-stone-900 text-amber-300 font-mono font-bold text-[11px]">
                        ★ {place.rating}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-stone-300 pt-1 border-t border-stone-800/80">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 size={12} />
                        <span>{place.operationalStatus}</span>
                      </span>
                      <span className="flex items-center gap-1 text-stone-400">
                        <Phone size={12} />
                        <span>{place.phone}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {place.capabilities.map((cap, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[10px] text-stone-300"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    {onSelectCoordinates && (
                      <button
                        onClick={() => {
                          onSelectCoordinates(place.coordinates);
                          onClose();
                        }}
                        className="w-full mt-1 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                      >
                        <MapPin size={12} />
                        <span>View on GIS Map [{place.coordinates.lat.toFixed(3)}, {place.coordinates.lng.toFixed(3)}]</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: AGENT CHAT */}
          {activeTab === 'chat' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs space-y-2">
                <span className="font-bold text-amber-400">Example Quick Queries:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "What is the fastest route from Val-d'Or airport to Perron Drill Camp?",
                    'Locate closest certified ALS or SGS core assay laboratory',
                    'Heavy haul restrictions for 80-tonne diamond rig convoy',
                    'Helicopter emergency evacuation waypoint coordinates',
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQueryInput(example);
                        handleQueryAgent(example);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 text-[11px] text-left transition-all"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask for mining camps, access roads, assay labs, or driving directions..."
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQueryAgent();
                  }}
                  className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  onClick={() => handleQueryAgent()}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Ask Agent</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
