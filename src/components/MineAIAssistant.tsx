import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Globe,
  RefreshCw,
  HelpCircle,
  ExternalLink,
  Zap,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers,
  ScanEye,
  MapPin,
  Database,
  FlaskConical,
  Calculator,
  ShieldCheck,
  Cpu,
  LayoutDashboard,
  Mic,
  FileText,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { VoiceToSummaryFieldNotes } from './VoiceToSummaryFieldNotes';

interface MineAIAssistantProps {
  activeTool: ActiveTab;
  onNavigate?: (tab: ActiveTab) => void;
  initialPrompt?: string;
  onStartTour?: () => void;
}

interface ToolGuide {
  id: ActiveTab;
  name: string;
  icon: any;
  purpose: string;
  howToUse: string[];
  proTip: string;
  sampleQuestions: string[];
}

const TOOL_GUIDES: ToolGuide[] = [
  {
    id: 'dashboard',
    name: 'Executive Dashboard',
    icon: LayoutDashboard,
    purpose: 'Provides a macro executive overview of global exploration assets, JORC/NI 43-101 target scores, real-time telemetry alerts, and quick regional pivots across Canada, USA, Europe, Australia, and Africa.',
    howToUse: [
      'Step 1: Select your target exploration jurisdiction from the region pills (e.g. Canada, USA, Australia).',
      'Step 2: Review critical alert feeds (silica exposure, drillhole grade intercepts, pending A2A audits).',
      'Step 3: Click any high-priority target card to jump directly into the GIS map or Downhole log.',
    ],
    proTip: 'Compare Target Scores against Risk Scores to identify undervalued brownfield and greenfield tenements with the highest ROI potential.',
    sampleQuestions: [
      'Summarize our highest-priority critical mineral targets globally.',
      'Which region currently has the lowest geopolitical and permitting risk?',
      'How are the 4 ESG zero-harm indicators calculated?',
    ],
  },
  {
    id: 'vision',
    name: 'Computer Vision & Inspection Center',
    icon: ScanEye,
    purpose: 'Employs multimodal neural networks to identify geological rock formations, detect mining equipment & safety hazards (highwalls, PPE, cracks), and analyze ore quality & environmental impacts (AMD runoff, dust).',
    howToUse: [
      'Step 1: Choose an inspection module filter: Geological Formations, Equipment & Safety Hazards, or Ore & Environmental Impact.',
      'Step 2: Select a pre-loaded core tray/scene or upload your own core photograph.',
      'Step 3: Toggle spectral bands (RGB, VNIR, SWIR, LWIR) and hover over bounding boxes to inspect confidence and mineral percentages.',
      'Step 4: Click "Run Multimodal Vision" to generate petrographic classifications and extracted AI prompts.',
    ],
    proTip: 'Use SWIR 2200nm to verify illite/muscovite crystallinity, vectoring directly toward hydrothermal feeder zones in porphyry and orogenic gold systems.',
    sampleQuestions: [
      'How does hyperspectral SWIR distinguish chalcopyrite from pyrite?',
      'What are the key visual indicators of an unstable open-pit highwall crest?',
      'Explain how NDVI identifies acid rock drainage runoff plumes.',
    ],
  },
  {
    id: 'gis_map',
    name: 'Exploration GIS Map',
    icon: MapPin,
    purpose: 'Interactive spatial GIS exploration canvas displaying regional geology, aeromagnetic shear corridors, gravity highs, geochemical soil anomalies, and active drillhole collars across 5 continents.',
    howToUse: [
      'Step 1: Select an active exploration jurisdiction from Canada, USA, Europe, Australia, or Africa.',
      'Step 2: Use the Layer Drawer to toggle Geological Terranes, Aeromagnetic TMI, Geochemical Halos, and Drill Collars.',
      'Step 3: Tap any target marker on the canvas to open the JORC Target Inspector with license numbers, budgets, and geological rationales.',
    ],
    proTip: 'Focus on locations where aeromagnetic lineament splays intersect gravity highs and arsenic-antimony pathfinder anomalies for tier-1 gold and copper discoveries.',
    sampleQuestions: [
      'Explain the geology of the Abitibi Greenstone Belt Cadillac Break.',
      'Why is the Central African Copperbelt prone to sediment-hosted stratiform copper?',
      'What do aeromagnetic lows indicate in porphyry copper exploration?',
    ],
  },
  {
    id: 'minerals',
    name: 'Mineral & Petrography Database',
    icon: Database,
    purpose: 'Comprehensive diagnostic mineral database detailing chemical formulas, Mohs hardness, cleavage, diagnostic spectral peaks (VNIR/SWIR/LWIR), deposit associations, and critical mineral classifications.',
    howToUse: [
      'Step 1: Search by mineral name, chemical formula, or filter by mineral group (Silicates, Sulphides, Oxides, Carbonates).',
      'Step 2: Toggle the "Critical Mineral" filter to isolate strategic clean energy minerals (Lithium, REE, Cobalt, Nickel, Copper).',
      'Step 3: Click any card to inspect diagnostic spectral troughs and economic producing regions.',
    ],
    proTip: 'Check the associated alteration minerals to identify whether a mineral specimen originated in an epithermal, porphyry, or pegmatite environment.',
    sampleQuestions: [
      'Compare specific gravity and hardness of spodumene vs petalite.',
      'What are the key diagnostic spectral absorption peaks for illite?',
      'Which minerals are classified as Critical Minerals by the USGS and EU?',
    ],
  },
  {
    id: 'geochemistry',
    name: 'Geochemistry & Geophysics Analyzer',
    icon: FlaskConical,
    purpose: 'Vectors toward hidden ore bodies using pathfinder element associations (Au-As-Sb, Cu-Mo, Li-Cs-Ta) alongside airborne geophysics (Magnetics, Induced Polarization Chargeability, Gravity, Radiometrics).',
    howToUse: [
      'Step 1: Review the multi-element sample assays table, filtering by anomaly classification (High-Priority, Anomalous).',
      'Step 2: Inspect the Pathfinder Correlation Matrix to see elemental associations (e.g. Au with As and Sb).',
      'Step 3: Review geophysics profiles (TMI Magnetics, IP Chargeability, Bouguer Gravity) to model subsurface anomalies.',
    ],
    proTip: 'In orogenic gold exploration, high arsenic (As > 150 ppm) and antimony (Sb > 10 ppm) in soil samples frequently vector toward blind gold shoots hundreds of meters away.',
    sampleQuestions: [
      'How does an Induced Polarization (IP) chargeability high reveal disseminated sulphides?',
      'What pathfinder elements vector toward LCT pegmatites?',
      'Explain how radiometric potassium/thorium ratios identify potassic alteration halos.',
    ],
  },
  {
    id: 'drillholes',
    name: 'Drillhole Logging & Core Intercepts',
    icon: Layers,
    purpose: 'Manages diamond core drill collars, azimuth, dip, downhole lithology intervals, and composite grade intercepts compliant with JORC and Canadian NI 43-101 reporting standards.',
    howToUse: [
      'Step 1: Filter collars by commodity (Gold, Lithium, Copper) and select a drillhole from the left table.',
      'Step 2: Hover or tap on the continuous downhole core composite bar to view lithology, alteration, and assay values.',
      'Step 3: Review the table of intervals and click "Export CSV (JORC)" to download clean tabular assay data.',
    ],
    proTip: 'Check both the true thickness and the dip angle when calculating composite grade intercepts to avoid overestimating reserve volumes.',
    sampleQuestions: [
      'What constitutes an official JORC Code significant intercept calculation?',
      'How do I calculate true downhole thickness from core alpha and beta angles?',
      'What is the difference between inferred and indicated mineral resources?',
    ],
  },
  {
    id: 'economics',
    name: 'Mining Economics & PEA Calculator',
    icon: Calculator,
    purpose: 'Calculates preliminary economic assessments (PEA), including Net Present Value (NPV), Internal Rate of Return (IRR), Payback Period, and Breakeven Commodity Price based on CAPEX, OPEX, and recoveries.',
    howToUse: [
      'Step 1: Adjust CAPEX ($M), OPEX ($/tonne), resource tonnage, head grade, and metallurgical recovery percentage.',
      'Step 2: Set the commodity market price and discount rate (e.g. 8.0%).',
      'Step 3: Review real-time recalculated NPV, IRR, payback period, and annual cash flows.',
    ],
    proTip: 'Always run sensitivity analysis with a ±20% variation in commodity price and OPEX to ensure project viability under market downturns.',
    sampleQuestions: [
      'How does a 10% change in metallurgical recovery affect the project NPV?',
      'What is an acceptable IRR hurdle rate for tier-1 mining projects?',
      'Explain the difference between sustaining capital and initial CAPEX.',
    ],
  },
  {
    id: 'healthcare_esg',
    name: 'Miner Healthcare & ESG Telemetry',
    icon: ShieldCheck,
    purpose: 'Protects underground personnel with real-time biometric vitals (Heart Rate, SpO₂, Core Temp, Heat Index) combined with underground atmospheric gas sensors (Respirable Silica, CO, CH₄, O₂) and emergency medical dispatch.',
    howToUse: [
      'Step 1: Inspect the personnel vitals roster; workers with elevated heart rate or silica exposure are flagged with yellow/red advisory tags.',
      'Step 2: Review environmental gas telemetry across underground mine zones (Stope 12, Haulage Drift, Decline Ramp).',
      'Step 3: In an emergency, click "Dispatch Emergency Response" to trigger instant audible alerts and notify safety rescue teams.',
    ],
    proTip: 'Underground respirable silica must strictly stay below the OSHA/MSHA threshold of 0.05 mg/m³ to prevent silicosis. Use water misting and high-velocity auxiliary ventilation when drilling.',
    sampleQuestions: [
      'What are the physiological warning signs of severe underground heat exhaustion?',
      'What are the mandatory evacuation thresholds for carbon monoxide (CO) in mines?',
      'How does the platform ensure zero-harm worker protection under ICMM rules?',
    ],
  },
  {
    id: 'a2a_judge',
    name: 'A2A with Judge Agent & Self-Maintenance',
    icon: Cpu,
    purpose: 'Autonomous Agent-to-Agent software engineering pipeline. The Worker Agent generates geological algorithms, scripts, and targeting prompts, while the Judge Agent audits them against JORC/NI 43-101 rubrics and executes self-repair cycles.',
    howToUse: [
      'Step 1: Choose a task type (Spectral Inversion, Drill Targeting, Geochem Vectoring) and target jurisdiction.',
      'Step 2: Click "Run A2A Autonomous Generation" to witness the Worker Agent write the script and the Judge Agent audit scientific accuracy and safety.',
      'Step 3: Inspect the self-maintenance terminal to observe automated bug detection, dependency pruning, and self-repair logs.',
    ],
    proTip: 'The Judge Agent evaluates scripts against a 4-pillar rubric: Scientific Accuracy, Safety & Compliance, Executable Validity, and Hallucination Risk.',
    sampleQuestions: [
      'How does the A2A Judge Agent detect geological hallucinations in code?',
      'What happens when a generated script fails the NI 43-101 compliance rubric?',
      'Explain how the self-maintenance engine performs autonomous hot-patches.',
    ],
  },
  {
    id: 'assistant',
    name: 'MineAI Interactive Assistant',
    icon: Bot,
    purpose: 'Your 24/7 Chief Geologist and Mining Intelligence Copilot with live Google Search Grounding for verified USGS, Geoscience Australia, and international regulatory facts.',
    howToUse: [
      'Step 1: Ask any geological, geophysical, engineering, or safety question in the prompt input.',
      'Step 2: Toggle "Live Search Grounding" to cite real-time verified sources from the web.',
      'Step 3: Click any tool guide pill above to learn how that specific module works and navigate there directly.',
    ],
    proTip: 'MineAI is context-aware: it automatically detects which tool you are working in and tailors its responses to your current geological data.',
    sampleQuestions: [
      'What are the highest-grade lithium pegmatite districts in Canada?',
      'Explain the difference between JORC Code and NI 43-101 reporting standards.',
      'Walk me through the ideal workflow for a greenfield porphyry copper discovery.',
    ],
  },
];

export const MineAIAssistant: React.FC<MineAIAssistantProps> = ({
  activeTool,
  onNavigate,
  initialPrompt = '',
  onStartTour,
}) => {
  const [selectedGuideTool, setSelectedGuideTool] = useState<ActiveTab>(activeTool);
  const [showToolGuideDrawer, setShowToolGuideDrawer] = useState<boolean>(false);
  const [activeAssistantTab, setActiveAssistantTab] = useState<'copilot' | 'voice_summary'>('copilot');
  const [messages, setMessages] = useState<
    Array<{
      sender: 'user' | 'assistant';
      text: string;
      sources?: Array<{ title: string; url: string }>;
      toolContext?: string;
    }>
  >([
    {
      sender: 'assistant',
      text: `Hello! I am **MineAI**, your dedicated Chief Geologist and Exploration Copilot. I am actively tracking your workflow in the **${activeTool.replace('_', ' ')}** module.\n\nI provide **interactive guidance for each specific tool** in the platform, explain its purpose and how to operate it, and answer complex geological, geochemical, and JORC compliance questions. How can I help you today?`,
      toolContext: activeTool,
    },
  ]);

  const [input, setInput] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);

  // Active guide tool metadata
  const currentGuide = TOOL_GUIDES.find((g) => g.id === selectedGuideTool) || TOOL_GUIDES[0];

  const handleSend = async (messageText?: string) => {
    const query = messageText || input;
    if (!query.trim()) return;

    const userMsg = { sender: 'user' as const, text: query, toolContext: activeTool };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          activeTool,
          useSearch: useSearchGrounding,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: data.reply,
            sources: data.groundingSources,
            toolContext: data.activeTool,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: `MineAI notice: Geological intelligence server offline. Using local verified knowledge for ${activeTool.replace('_', ' ')}.`,
            toolContext: activeTool,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `MineAI error: Unable to contact server. Please verify your connection or inspect the local tool documentation.`,
          toolContext: activeTool,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainTool = (toolId: ActiveTab) => {
    const guide = TOOL_GUIDES.find((g) => g.id === toolId);
    if (!guide) return;
    const prompt = `Please provide a comprehensive explanation of the ${guide.name} tool. Explain its geological purpose, key capabilities, how to use it step-by-step, and how it complies with JORC 2012 / NI 43-101 standards.`;
    handleSend(prompt);
  };

  const handleInjectSummaryIntoChat = (summaryPrompt: string) => {
    setActiveAssistantTab('copilot');
    handleSend(summaryPrompt);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              MineAI Geological Intelligence Copilot
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Interactive guidance for each dashboard tool, geological decision support, voice-to-summary field notes, and search-grounded scientific intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Search Grounding */}
          <button
            onClick={() => setUseSearchGrounding(!useSearchGrounding)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              useSearchGrounding
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-stone-800 text-stone-400 border border-stone-700'
            }`}
            title="Toggle Live Web Grounding (USGS, Geoscience Australia, etc.)"
          >
            <Globe size={14} className={useSearchGrounding ? 'text-emerald-400' : 'text-stone-400'} />
            <span>Search Grounding: {useSearchGrounding ? 'Active' : 'Off'}</span>
          </button>

          {/* Start Onboarding Tour */}
          {onStartTour && (
            <button
              onClick={onStartTour}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all"
            >
              <Compass size={14} className="text-amber-400" />
              <span>Launch Tour</span>
            </button>
          )}

          {/* Toggle Tool Guide Directory */}
          <button
            onClick={() => setShowToolGuideDrawer(!showToolGuideDrawer)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showToolGuideDrawer
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700'
            }`}
          >
            <BookOpen size={14} />
            <span>{showToolGuideDrawer ? 'Hide Tool Guides' : 'Browse Tool Guides'}</span>
          </button>
        </div>
      </div>

      {/* Primary Mode Switcher: MineAI Copilot vs Voice-to-Summary Field Notes */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-stone-900/90 border border-amber-900/40">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-mode-copilot"
            onClick={() => setActiveAssistantTab('copilot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAssistantTab === 'copilot'
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow-md'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <Bot size={15} />
            <span>MineAI Copilot &amp; Tool Guides</span>
          </button>

          <button
            type="button"
            id="tab-mode-voice-summary"
            onClick={() => setActiveAssistantTab('voice_summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAssistantTab === 'voice_summary'
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-amber-400 text-stone-950 font-extrabold shadow-md'
                : 'text-rose-300 hover:text-white hover:bg-stone-800 border border-rose-500/30'
            }`}
          >
            <Mic size={15} className={activeAssistantTab === 'voice_summary' ? 'text-stone-950' : 'text-rose-400 animate-pulse'} />
            <span>Voice-to-Summary (Field Notes)</span>
            <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] font-mono font-bold text-amber-300">
              Site Notes AI
            </span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-stone-400 pr-2">
          {activeAssistantTab === 'copilot' ? (
            <span>Tracking module: <strong className="text-amber-400 capitalize">{activeTool.replace('_', ' ')}</strong></span>
          ) : (
            <span className="text-rose-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Voice Field Notes Active &bull; Web Speech Dictation</span>
            </span>
          )}
        </div>
      </div>

      {/* Voice-to-Summary Dedicated View when Tab Selected */}
      {activeAssistantTab === 'voice_summary' && (
        <VoiceToSummaryFieldNotes
          onInjectIntoChat={handleInjectSummaryIntoChat}
          defaultLocation={`Site Inspection: ${activeTool.replace('_', ' ')} Zone`}
        />
      )}

      {/* Interactive Tool Guide Directory (Explains purpose & how to use every tool) */}
      <div className="rounded-2xl bg-[#2A1810]/90 border-2 border-amber-500/50 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Interactive Tool Guidance & Operator Manual
            </span>
            <h3 className="text-lg font-extrabold text-white font-['Space_Grotesk']">
              Select Any Tool for Detailed Instructions
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            Active Workspace: <strong className="text-amber-300 capitalize">{activeTool.replace('_', ' ')}</strong>
          </span>
        </div>

        {/* Tool Selector Chips */}
        <div className="flex flex-wrap gap-2">
          {TOOL_GUIDES.map((g) => {
            const Icon = g.icon;
            const isSelected = selectedGuideTool === g.id;
            const isCurrentActive = activeTool === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGuideTool(g.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-md scale-105'
                    : isCurrentActive
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500'
                    : 'bg-stone-900/80 text-stone-300 hover:bg-stone-800 border border-stone-800'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-stone-950' : 'text-amber-400'} />
                <span>{g.name}</span>
                {isCurrentActive && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Tool Deep Dive Panel: Purpose & How To Use It */}
        <div className="p-4 rounded-xl bg-black/50 border border-stone-800 space-y-4 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold shadow-md">
                {React.createElement(currentGuide.icon, { size: 20 })}
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base font-['Space_Grotesk']">
                  {currentGuide.name}
                </h4>
                <p className="text-xs text-stone-300 max-w-2xl mt-0.5">
                  {currentGuide.purpose}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigate && activeTool !== currentGuide.id && (
                <button
                  onClick={() => onNavigate(currentGuide.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-white text-xs font-bold border border-purple-500/40 shadow-sm transition-all"
                >
                  <span>Open This Tool</span>
                  <ArrowRight size={13} />
                </button>
              )}
              <button
                onClick={() => handleExplainTool(currentGuide.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-extrabold shadow-sm transition-all"
              >
                <Sparkles size={13} />
                <span>Ask MineAI To Walk Me Through</span>
              </button>
            </div>
          </div>

          {/* Step-by-Step Operator Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {currentGuide.howToUse.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-stone-900/70 border border-stone-800 space-y-1"
              >
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <CheckCircle2 size={14} className="text-amber-400" />
                  <span>Instruction {idx + 1}</span>
                </div>
                <p className="text-stone-300 text-[11px] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          {/* Pro Tip & Suggested Prompts */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200">
            <div>
              <strong className="text-amber-300">Geologist Pro Tip: </strong>
              <span>{currentGuide.proTip}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Chat Stream & Suggested Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Interactive Chat Stream */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl bg-[#2A1810]/70 border border-stone-800 overflow-hidden min-h-[500px] shadow-xl">
          {/* Chat Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[520px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold self-start shadow-md flex-shrink-0">
                    <Bot size={18} />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl max-w-[85%] space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-900 to-amber-950 text-white border border-purple-500/40 rounded-br-sm'
                      : 'bg-stone-900/90 text-stone-200 border border-stone-800 rounded-bl-sm'
                  }`}
                >
                  {msg.toolContext && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-wider pb-1 border-b border-white/10">
                      <span>Module Context: {msg.toolContext.replace('_', ' ')}</span>
                    </div>
                  )}

                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Grounding Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-stone-800 space-y-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <Globe size={11} className="text-emerald-400" />
                        <span>Grounding Sources:</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((s, sIdx) => (
                          <a
                            key={sIdx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 text-[10px] text-amber-300 hover:text-white border border-stone-700/60 transition-colors"
                          >
                            <span>{s.title}</span>
                            <ExternalLink size={10} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 text-xs justify-start animate-pulse">
                <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold self-start">
                  <Bot size={18} />
                </div>
                <div className="p-4 rounded-2xl bg-stone-900 text-stone-400 border border-stone-800 flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-amber-400" />
                  <span>MineAI is synthesizing geological models and JORC compliance rules...</span>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input Bar */}
          <div className="p-3 bg-black/40 border-t border-stone-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Ask MineAI about ${activeTool.replace('_', ' ')}, rock vision, JORC scores, or drill targeting...`}
              className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 text-xs font-extrabold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </div>
        </div>

        {/* Right 4 Cols: Contextual Suggested Questions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-[#2A1810]/70 border border-stone-800 space-y-3 shadow-md">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>Recommended Geological Questions</span>
            </span>
            <p className="text-[11px] text-stone-400">
              Click any question below to immediately prompt MineAI with expert geological queries:
            </p>

            <div className="space-y-2">
              {currentGuide.sampleQuestions.map((q, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-3 rounded-xl bg-stone-900/80 hover:bg-purple-950/60 border border-stone-800 hover:border-amber-500/50 text-xs text-stone-300 hover:text-white transition-all group flex items-start gap-2"
                >
                  <ArrowRight size={13} className="text-amber-400 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                  <span className="leading-relaxed">{q}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Onboarding Tour Card */}
          {onStartTour && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/80 via-[#2A1810] to-black border border-purple-600/40 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-purple-200">
                <Compass size={18} className="text-amber-400" />
                <h4 className="font-bold text-xs">New to the Mining Platform?</h4>
              </div>
              <p className="text-[11px] text-stone-300 leading-relaxed">
                Take our 7-step interactive platform tour to master Computer Vision, GIS exploration, A2A Judge Agent self-maintenance, and worker vitals.
              </p>
              <button
                onClick={onStartTour}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Start Interactive Walkthrough</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Voice-to-Summary Field Notes Section (Integrated directly in MineAI Assistant) */}
      {activeAssistantTab === 'copilot' && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mic size={14} className="text-rose-400" />
              <span>Voice-to-Summary Field Notes Recorder &bull; Site Inspection Audio Intelligence</span>
            </span>
            <button
              type="button"
              id="btn-focus-voice-summary"
              onClick={() => setActiveAssistantTab('voice_summary')}
              className="text-xs text-amber-400 hover:text-amber-300 underline font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>Focus Fullscreen Mode</span>
              <ArrowRight size={12} />
            </button>
          </div>
          <VoiceToSummaryFieldNotes
            onInjectIntoChat={handleInjectSummaryIntoChat}
            defaultLocation={`Site Inspection: ${activeTool.replace('_', ' ')} Zone`}
          />
        </div>
      )}
    </div>
  );
};
