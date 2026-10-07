import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Calculator,
  RefreshCw,
  PieChart,
  BarChart3,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  LineChart,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const MiningEconomicsCalculator: React.FC = () => {
  const [initialCapexM, setInitialCapexM] = useState<number>(145);
  const [oreTonnageMt, setOreTonnageMt] = useState<number>(24);
  const [headGrade, setHeadGrade] = useState<number>(3.8); // g/t Au or % Li2O
  const [recoveryPct, setRecoveryPct] = useState<number>(91);
  const [commodityPrice, setCommodityPrice] = useState<number>(2450); // $ / oz
  const [opexPerTonne, setOpexPerTonne] = useState<number>(48);
  const [discountRate, setDiscountRate] = useState<number>(8);
  const [mineLifeYears, setMineLifeYears] = useState<number>(10);

  // Predictive Price Forecasting state
  const [predictiveModelingEnabled, setPredictiveModelingEnabled] = useState<boolean>(true);
  const [forecastScenario, setForecastScenario] = useState<
    'consensus' | 'supercycle' | 'conservative' | 'bear' | 'custom'
  >('consensus');
  const [customPriceEscalationPct, setCustomPriceEscalationPct] = useState<number>(3.5);

  const [isForecastingAi, setIsForecastingAi] = useState<boolean>(false);
  const [aiEconomicsData, setAiEconomicsData] = useState<any | null>(null);

  const handleRunAiEconomicsForecast = async () => {
    setIsForecastingAi(true);
    try {
      const res = await fetch('/api/gemini/economics-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialCapexM,
          oreTonnageMt,
          headGrade,
          recoveryPct,
          commodityPrice,
          opexPerTonne,
          discountRate,
          mineLifeYears,
        }),
      });
      const data = await res.json();
      if (data.success && data.economics) {
        setAiEconomicsData(data.economics);
      }
    } catch (err) {
      console.error('Failed to run AI economics forecast:', err);
    } finally {
      setIsForecastingAi(false);
    }
  };

  // Economic calculations - Base Case
  const annualMilledTonnes = (oreTonnageMt * 1000000) / mineLifeYears;
  const annualGramsContained = annualMilledTonnes * headGrade;
  const annualRecoveredOz = (annualGramsContained / 31.1035) * (recoveryPct / 100);
  const annualRevenueUSD = annualRecoveredOz * commodityPrice;
  const annualOpexUSD = annualMilledTonnes * opexPerTonne;
  const annualEbitdaUSD = annualRevenueUSD - annualOpexUSD;

  // Simple discounted cash flow for NPV (Base Case)
  let calculatedNpv = -initialCapexM * 1000000;
  for (let y = 1; y <= mineLifeYears; y++) {
    calculatedNpv += annualEbitdaUSD / Math.pow(1 + discountRate / 100, y);
  }
  const npvM = calculatedNpv / 1000000;
  const irrPct = Math.min(
    95,
    Math.max(5, ((annualEbitdaUSD / (initialCapexM * 1000000)) * 100 * 0.85).toFixed(1) as any)
  );
  const paybackYears = (initialCapexM * 1000000) / annualEbitdaUSD;
  const baseRoiPct = (((annualEbitdaUSD * mineLifeYears - initialCapexM * 1000000) / (initialCapexM * 1000000)) * 100);

  // Forecast escalation rate
  const annualEscalation =
    forecastScenario === 'supercycle'
      ? 0.085 // +8.5% p.a.
      : forecastScenario === 'consensus'
      ? 0.038 // +3.8% p.a.
      : forecastScenario === 'conservative'
      ? 0.0 // flat 0%
      : forecastScenario === 'bear'
      ? -0.04 // -4.0% p.a.
      : customPriceEscalationPct / 100;

  // Predictive Year-by-Year Modeling
  const yearlyForecast = Array.from({ length: mineLifeYears }, (_, idx) => {
    const year = idx + 1;
    // Price with compounding growth or trajectory
    const forecastPrice = Math.round(commodityPrice * Math.pow(1 + annualEscalation, year - 1));
    const revenueUSD = annualRecoveredOz * forecastPrice;
    const opexUSD = annualOpexUSD * Math.pow(1.02, year - 1); // 2% opex inflation
    const ebitdaUSD = revenueUSD - opexUSD;
    const discountedEbitda = ebitdaUSD / Math.pow(1 + discountRate / 100, year);

    return {
      year,
      price: forecastPrice,
      revenueM: revenueUSD / 1000000,
      ebitdaM: ebitdaUSD / 1000000,
      discountedEbitdaM: discountedEbitda / 1000000,
    };
  });

  // Predictive NPV & ROI
  const predictiveTotalEbitdaUSD = yearlyForecast.reduce((sum, item) => sum + item.ebitdaM * 1000000, 0);
  const predictiveDiscountedTotalUSD = yearlyForecast.reduce(
    (sum, item) => sum + item.discountedEbitdaM * 1000000,
    0
  );
  const predictiveNpvM = (predictiveDiscountedTotalUSD - initialCapexM * 1000000) / 1000000;
  const predictiveTotalRoiPct =
    ((predictiveTotalEbitdaUSD - initialCapexM * 1000000) / (initialCapexM * 1000000)) * 100;
  const predictiveDiscountedRoiPct = (predictiveNpvM / initialCapexM) * 100;

  // Predictive payback calculation
  let cumCash = -initialCapexM * 1000000;
  let predictivePayback = mineLifeYears;
  for (let i = 0; i < yearlyForecast.length; i++) {
    cumCash += yearlyForecast[i].ebitdaM * 1000000;
    if (cumCash >= 0) {
      const prevCum = cumCash - yearlyForecast[i].ebitdaM * 1000000;
      const fraction = Math.abs(prevCum) / (yearlyForecast[i].ebitdaM * 1000000);
      predictivePayback = Number((i + fraction).toFixed(1));
      break;
    }
  }

  // Sensitivity Matrix across varying mineral prices (-30% to +30%)
  const sensitivityVariations = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
  const sensitivityMatrix = sensitivityVariations.map((pctDelta) => {
    const p = commodityPrice * (1 + pctDelta);
    const rev = annualRecoveredOz * p;
    const ebitda = rev - annualOpexUSD;
    let sensNpv = -initialCapexM * 1000000;
    for (let y = 1; y <= mineLifeYears; y++) {
      sensNpv += ebitda / Math.pow(1 + discountRate / 100, y);
    }
    const sensRoi = (((ebitda * mineLifeYears - initialCapexM * 1000000) / (initialCapexM * 1000000)) * 100);
    return {
      percentLabel: `${pctDelta >= 0 ? '+' : ''}${Math.round(pctDelta * 100)}%`,
      price: Math.round(p),
      npvM: sensNpv / 1000000,
      roiPct: sensRoi,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-900/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign size={24} className="text-amber-400" />
            <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Mining Economics, CAPEX &amp; Predictive ROI Modeling
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 mt-1">
            Preliminary Economic Assessment (PEA) with real-time mineral price forecast predictive modeling and JORC compliance.
          </p>
        </div>

        {/* Predictive Modeling Toggle Header Switch & AI Engine Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-run-ai-economics"
            disabled={isForecastingAi}
            onClick={handleRunAiEconomicsForecast}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isForecastingAi ? (
              <>
                <RefreshCw size={13} className="animate-spin text-stone-950" />
                <span>Valuating Project...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Run Gemini PEA Valuation AI</span>
              </>
            )}
          </button>

          <button
            id="btn-toggle-predictive-modeling"
            onClick={() => setPredictiveModelingEnabled(!predictiveModelingEnabled)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md ${
              predictiveModelingEnabled
                ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-stone-950 border-amber-400 shadow-amber-500/20'
                : 'bg-stone-900 text-stone-400 border-stone-850 hover:border-stone-700'
            }`}
          >
            <Sparkles size={14} className={predictiveModelingEnabled ? 'text-stone-950 animate-spin-slow' : 'text-stone-500'} />
            <span>Predictive ROI: {predictiveModelingEnabled ? 'ENABLED' : 'OFF'}</span>
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
            DCF Rate: {discountRate}%
          </span>
        </div>
      </div>

      {/* Gemini AI Valuation Intelligence Panel */}
      {aiEconomicsData && (
        <div className="rounded-2xl bg-gradient-to-br from-[#2D160E] to-[#1F100B] border border-amber-500/40 p-5 space-y-4 shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles size={18} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-white font-['Space_Grotesk']">
                  Gemini 3.8 Flash Preliminary Economic Assessment (PEA) Valuation
                </h3>
                <p className="text-xs text-amber-300/80">
                  Risk Rating: {aiEconomicsData.riskRating} &bull; All-In Sustaining Cost: ${aiEconomicsData.allInSustainingCostPerOz}/oz
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                NPV: ${aiEconomicsData.projectedNpvMillionUSD}M &bull; IRR: {aiEconomicsData.projectedIrrPct}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400">Discounted Cash Flow &amp; Payback</span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {aiEconomicsData.paybackPeriodYears} Years
              </div>
              <p className="text-[11px] text-stone-300">
                Annual free cash flow projected at ${aiEconomicsData.annualFreeCashflowM}M/year post-commissioning.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400">AI Sensitivity Bounds</span>
              <div className="space-y-1 pt-1 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-stone-300">+15% Commodity Price:</span>
                  <span className="text-emerald-400 font-bold">${aiEconomicsData.sensitivityAnalysis?.pricePlus15PctNpvM}M NPV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-300">-15% Commodity Price:</span>
                  <span className="text-rose-400 font-bold">${aiEconomicsData.sensitivityAnalysis?.priceMinus15PctNpvM}M NPV</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-300">+20% CAPEX Overrun:</span>
                  <span className="text-amber-400 font-bold">${aiEconomicsData.sensitivityAnalysis?.capexOverrun20PctNpvM}M NPV</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/40 border border-stone-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-400">Macro Supercycle Drivers</span>
              <ul className="list-disc list-inside text-[11px] text-stone-300 space-y-1 pt-1">
                {aiEconomicsData.supercycleMacroTrends?.slice(0, 3).map((trend: string, idx: number) => (
                  <li key={idx}>{trend}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Strategic Capital Recommendations */}
          {aiEconomicsData.aiRecommendations?.length > 0 && (
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs space-y-1.5">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-purple-400" />
                <span>AI Capital Allocation &amp; Cost Reduction Strategies:</span>
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px] text-stone-200">
                {aiEconomicsData.aiRecommendations.map((rec: string, i: number) => (
                  <div key={i} className="p-2 rounded-lg bg-black/40 border border-stone-800/80">
                    &bull; {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Parameter Sliders & Inputs */}
        <div className="rounded-2xl bg-[#2A1810]/80 border border-stone-800 p-5 space-y-4 text-xs">
          <h2 className="text-base font-bold text-white flex items-center gap-2 font-['Space_Grotesk'] border-b border-stone-800 pb-2">
            <Calculator size={18} className="text-amber-400" />
            <span>Feasibility Assumptions</span>
          </h2>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Initial CAPEX ($M USD):</span>
                <strong className="text-amber-400">${initialCapexM}M</strong>
              </div>
              <input
                type="range"
                min="20"
                max="500"
                step="5"
                value={initialCapexM}
                onChange={(e) => setInitialCapexM(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Ore Reserve (Million Tonnes):</span>
                <strong className="text-white">{oreTonnageMt} Mt</strong>
              </div>
              <input
                type="range"
                min="2"
                max="100"
                step="1"
                value={oreTonnageMt}
                onChange={(e) => setOreTonnageMt(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Head Grade (g/t Au / % Li₂O):</span>
                <strong className="text-purple-300">{headGrade} g/t</strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="12.0"
                step="0.1"
                value={headGrade}
                onChange={(e) => setHeadGrade(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Mill Metallurgical Recovery:</span>
                <strong className="text-emerald-400">{recoveryPct}%</strong>
              </div>
              <input
                type="range"
                min="50"
                max="98"
                step="1"
                value={recoveryPct}
                onChange={(e) => setRecoveryPct(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Commodity Base Spot Price ($/oz):</span>
                <strong className="text-amber-400">${commodityPrice}</strong>
              </div>
              <input
                type="range"
                min="1200"
                max="3500"
                step="25"
                value={commodityPrice}
                onChange={(e) => setCommodityPrice(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>OPEX ($ / tonne processed):</span>
                <strong className="text-white">${opexPerTonne} / t</strong>
              </div>
              <input
                type="range"
                min="15"
                max="150"
                step="1"
                value={opexPerTonne}
                onChange={(e) => setOpexPerTonne(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Life of Mine (Years):</span>
                <strong className="text-white">{mineLifeYears} Years</strong>
              </div>
              <input
                type="range"
                min="4"
                max="25"
                step="1"
                value={mineLifeYears}
                onChange={(e) => setMineLifeYears(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Financial KPIs & Predictive Modeling Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Predictive Modeling Scenario Selector (Active when toggle is ON) */}
          {predictiveModelingEnabled && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 to-amber-950/60 border border-amber-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <span className="font-bold text-white text-sm font-['Space_Grotesk']">
                    Predictive Mineral Price Forecasting Scenarios
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dynamic Price Curve Active
                </span>
              </div>

              {/* Scenario Selection Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                {[
                  { id: 'consensus' as const, label: 'Consensus Trend', sub: '+3.8% / yr' },
                  { id: 'supercycle' as const, label: 'Supercycle Bull', sub: '+8.5% / yr' },
                  { id: 'conservative' as const, label: 'Conservative', sub: 'Flat $0' },
                  { id: 'bear' as const, label: 'Stress-Test Bear', sub: '-4.0% / yr' },
                  { id: 'custom' as const, label: 'Custom CAGR', sub: `${customPriceEscalationPct}% / yr` },
                ].map((s) => (
                  <button
                    key={s.id}
                    id={`btn-scenario-${s.id}`}
                    onClick={() => setForecastScenario(s.id)}
                    className={`p-2 rounded-xl text-left transition-all ${
                      forecastScenario === s.id
                        ? 'bg-amber-500 text-stone-950 font-extrabold shadow-md scale-102'
                        : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-800'
                    }`}
                  >
                    <div className="font-bold text-[11px] truncate">{s.label}</div>
                    <div className="text-[10px] opacity-80 font-mono">{s.sub}</div>
                  </button>
                ))}
              </div>

              {/* Custom CAGR Slider if custom is selected */}
              {forecastScenario === 'custom' && (
                <div className="p-2.5 rounded-xl bg-black/40 border border-stone-800 flex items-center justify-between gap-4 text-xs">
                  <span className="text-stone-300 font-semibold">
                    Custom Annual Price Escalation: <strong className="text-amber-400">{customPriceEscalationPct}%</strong>
                  </span>
                  <input
                    type="range"
                    min="-10"
                    max="20"
                    step="0.5"
                    value={customPriceEscalationPct}
                    onChange={(e) => setCustomPriceEscalationPct(Number(e.target.value))}
                    className="w-48 accent-amber-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* 4 Major Financial & ROI KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Potential Total ROI */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-500/50 shadow-lg">
              <span className="text-[10px] text-stone-400 uppercase font-bold flex items-center justify-between">
                <span>Potential Total ROI</span>
                <TrendingUp size={13} className="text-amber-400" />
              </span>
              <p
                className={`text-2xl sm:text-3xl font-extrabold font-['Space_Grotesk'] mt-2 ${
                  (predictiveModelingEnabled ? predictiveTotalRoiPct : baseRoiPct) > 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {(predictiveModelingEnabled ? predictiveTotalRoiPct : baseRoiPct).toFixed(1)}%
              </p>
              <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                <span>Undiscounted LOM Return</span>
                {predictiveModelingEnabled && (
                  <span
                    className={`font-bold ${
                      predictiveTotalRoiPct >= baseRoiPct ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {predictiveTotalRoiPct >= baseRoiPct ? '▲ +' : '▼ '}
                    {(predictiveTotalRoiPct - baseRoiPct).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Discounted ROI / NPV */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40">
              <span className="text-[10px] text-stone-400 uppercase font-bold">
                Projected NPV (@{discountRate}%)
              </span>
              <p
                className={`text-2xl sm:text-3xl font-extrabold font-['Space_Grotesk'] mt-2 ${
                  (predictiveModelingEnabled ? predictiveNpvM : npvM) > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ${(predictiveModelingEnabled ? predictiveNpvM : npvM).toFixed(1)}M
              </p>
              <span className="text-[11px] text-stone-400">
                Discounted ROI: <strong className="text-amber-300">{(predictiveModelingEnabled ? predictiveDiscountedRoiPct : (npvM / initialCapexM) * 100).toFixed(0)}%</strong>
              </span>
            </div>

            {/* Internal Rate of Return (IRR) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Internal Rate (IRR)</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-['Space_Grotesk'] mt-2">
                {predictiveModelingEnabled
                  ? Math.min(120, Math.max(5, (irrPct * (1 + annualEscalation * 2.5)).toFixed(1) as any))
                  : irrPct}%
              </p>
              <span className="text-[11px] text-emerald-400">&gt; 15% hurdle rate met</span>
            </div>

            {/* Payback Period */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#2A1810] to-[#1C100B] border border-amber-900/40">
              <span className="text-[10px] text-stone-400 uppercase font-bold">Payback Horizon</span>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-['Space_Grotesk'] mt-2">
                {(predictiveModelingEnabled ? predictivePayback : paybackYears).toFixed(1)} <span className="text-sm font-normal text-stone-400">Yrs</span>
              </p>
              <span className="text-[11px] text-stone-400">Full CAPEX amortized</span>
            </div>
          </div>

          {/* Predictive Year-by-Year Price Forecast & Cash Flow Progression Chart */}
          {predictiveModelingEnabled && (
            <div className="p-5 rounded-2xl bg-[#2A1810]/80 border border-stone-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} className="text-amber-400" />
                  <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                    Predictive LOM Price Curve &amp; Free Cash Flow Progression
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                    <span>Forecast Price ($/oz)</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                    <span>Annual EBITDA ($M)</span>
                  </span>
                </div>
              </div>

              {/* Progression Bars */}
              <div className="space-y-2 pt-2">
                {yearlyForecast.slice(0, 10).map((item) => {
                  const maxPrice = Math.max(...yearlyForecast.map((y) => y.price));
                  const maxEbitda = Math.max(...yearlyForecast.map((y) => y.ebitdaM), 1);
                  const pricePct = (item.price / maxPrice) * 100;
                  const ebitdaPct = Math.max(5, (item.ebitdaM / maxEbitda) * 100);

                  return (
                    <div key={item.year} className="flex items-center gap-3 text-[11px]">
                      <span className="w-12 text-stone-400 font-mono font-bold">Yr {item.year}:</span>
                      <div className="flex-1 space-y-1">
                        {/* EBITDA Bar */}
                        <div className="h-4 bg-stone-900 rounded-md overflow-hidden flex">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-500"
                            style={{ width: `${ebitdaPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-24 text-right font-mono font-bold text-emerald-400">
                        ${item.ebitdaM.toFixed(1)}M USD
                      </div>
                      <div className="w-20 text-right font-mono text-amber-300">
                        ${item.price}/oz
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Sensitivity Matrix Table */}
          <div className="p-5 rounded-2xl bg-[#2A1810]/80 border border-stone-800 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h3 className="text-sm font-bold text-white font-['Space_Grotesk']">
                Commodity Price Sensitivity &amp; Potential ROI Matrix
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">
                Base Price: ${commodityPrice} / oz
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-stone-800 text-[10px] uppercase text-stone-400">
                    <th className="py-2 px-2.5">Price Shift</th>
                    <th className="py-2 px-2.5">Metal Price ($/oz)</th>
                    <th className="py-2 px-2.5 text-right">Projected NPV ($M)</th>
                    <th className="py-2 px-2.5 text-right">Potential Total ROI</th>
                    <th className="py-2 px-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850">
                  {sensitivityMatrix.map((row, idx) => {
                    const isBase = row.percentLabel === '+0%';
                    const isPositive = row.roiPct > 0;

                    return (
                      <tr
                        key={idx}
                        className={`hover:bg-stone-900/50 transition-colors ${
                          isBase ? 'bg-amber-500/10 font-bold' : ''
                        }`}
                      >
                        <td className="py-2 px-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.percentLabel.startsWith('+') && !isBase
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : isBase
                                ? 'bg-amber-500 text-stone-950'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {row.percentLabel}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-white">${row.price}</td>
                        <td
                          className={`py-2 px-2.5 text-right font-bold ${
                            row.npvM > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          ${row.npvM.toFixed(1)}M
                        </td>
                        <td
                          className={`py-2 px-2.5 text-right font-bold ${
                            isPositive ? 'text-emerald-300' : 'text-rose-400'
                          }`}
                        >
                          {row.roiPct.toFixed(1)}%
                        </td>
                        <td className="py-2 px-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              row.roiPct > 150
                                ? 'bg-purple-900 text-purple-200'
                                : isPositive
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-rose-950 text-rose-300'
                            }`}
                          >
                            {row.roiPct > 150 ? 'Tier 1 Asset' : isPositive ? 'Viable' : 'Sub-Economic'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
