import React, { useState } from 'react';
import { Sun, Moon, Eye, Smartphone, Sliders, Sparkles, Check, AlertCircle } from 'lucide-react';
import { AmbientLightState } from '../hooks/useAmbientLightTheme';

interface AmbientLightSensorWidgetProps {
  ambientState: AmbientLightState;
}

export const AmbientLightSensorWidget: React.FC<AmbientLightSensorWidgetProps> = ({ ambientState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isMobile,
    darkMode,
    toggleDarkMode,
    ambientLux,
    sensorAvailable,
    autoAmbientEnabled,
    setAutoAmbientEnabled,
    simulateLux,
    lightCondition,
  } = ambientState;

  return (
    <div className="relative">
      {/* Trigger pill button in operational header */}
      <button
        id="btn-ambient-sensor-status"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          isMobile && autoAmbientEnabled
            ? darkMode
              ? 'bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-xs'
              : 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
            : darkMode
            ? 'bg-stone-800/80 text-stone-300 border-stone-700/60 hover:bg-stone-700'
            : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
        }`}
        title="Ambient Light Sensor & Mobile Theme Adapter"
      >
        {darkMode ? <Moon size={14} className="text-amber-400" /> : <Sun size={14} className="text-amber-500" />}

        {isMobile && autoAmbientEnabled ? (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">{ambientLux !== null ? `${ambientLux} lx` : 'Auto'}</span>
            <span className="text-[10px] uppercase font-bold opacity-80 hidden sm:inline">
              {darkMode ? 'Subterranean' : 'Sunlight'}
            </span>
          </span>
        ) : (
          <span className="text-[11px] hidden sm:inline font-mono">
            {darkMode ? 'Dark' : 'Light'} {isMobile ? '(Manual)' : ''}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#2A1810] border border-amber-500/40 shadow-2xl p-4 z-50 text-stone-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                <Eye size={15} />
              </span>
              <div>
                <h4 className="font-bold text-xs text-white">Ambient Light Sensor</h4>
                <p className="text-[10px] text-stone-400">Mobile System Sensor &bull; CSS 'dark' Class</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-white p-1 text-xs"
            >
              &times;
            </button>
          </div>

          {/* Current Sensor Reading */}
          <div className="p-3 rounded-xl bg-black/40 border border-stone-800 space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-400">Illuminance Reading:</span>
              <span className="font-mono font-extrabold text-amber-300 text-sm">
                {ambientLux !== null ? `${ambientLux.toLocaleString()} Lux` : 'Reading...'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400">Class 'dark' State:</span>
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                darkMode ? 'bg-purple-900/60 text-purple-200 border border-purple-500/40' : 'bg-amber-400 text-stone-950'
              }`}>
                {darkMode ? 'Active (HTML .dark)' : 'Inactive (Daylight)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400">Detected Environment:</span>
              <span className="font-semibold text-stone-200">
                {lightCondition === 'dark_subterranean'
                  ? '🔦 Underground Adit / Night'
                  : lightCondition === 'indoor_coreshed'
                  ? '🏢 Core Shed / Office'
                  : '☀️ Open-Pit Direct Sun'}
              </span>
            </div>

            <div className="pt-1 text-[10px] text-stone-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${sensorAvailable ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>
                {sensorAvailable
                  ? 'Hardware AmbientLightSensor Connected'
                  : 'Calibrated System Sensor Active'}
              </span>
            </div>
          </div>

          {/* Mobile Auto-Switch Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-stone-900/80 border border-stone-800 text-xs">
              <div>
                <span className="font-semibold block text-stone-200">Mobile Auto-Light Toggle</span>
                <span className="text-[10px] text-stone-400">Auto-switch 'dark' below 50 lux</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoAmbientEnabled(!autoAmbientEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  autoAmbientEnabled ? 'bg-amber-500' : 'bg-stone-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-stone-950 transition-transform ${
                    autoAmbientEnabled ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Manual Toggle Switch */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 border border-stone-700"
              >
                {darkMode ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} />}
                <span>Toggle Theme Manually ({darkMode ? 'Switch to Light' : 'Switch to Dark'})</span>
              </button>
            </div>

            {/* Field Lux Simulator Controls */}
            <div className="pt-2 border-t border-stone-800">
              <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2">
                <span className="flex items-center gap-1">
                  <Sliders size={12} className="text-amber-400" />
                  <span>Test Mobile Field Conditions:</span>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => simulateLux(15)}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    ambientLux !== null && ambientLux < 50
                      ? 'bg-purple-900 text-white border-amber-500 font-bold'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  <span className="block font-bold">15 Lux</span>
                  <span className="text-[9px] opacity-75">Adit &bull; Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => simulateLux(350)}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    ambientLux !== null && ambientLux >= 50 && ambientLux < 1000
                      ? 'bg-amber-500 text-stone-950 border-amber-300 font-bold'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  <span className="block font-bold">350 Lux</span>
                  <span className="text-[9px] opacity-75">Shed &bull; Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => simulateLux(8000)}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    ambientLux !== null && ambientLux >= 1000
                      ? 'bg-amber-400 text-stone-950 border-amber-300 font-bold'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  <span className="block font-bold">8k Lux</span>
                  <span className="text-[9px] opacity-75">Sun &bull; Light</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
