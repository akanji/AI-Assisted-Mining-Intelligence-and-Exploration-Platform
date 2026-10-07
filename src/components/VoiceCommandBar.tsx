import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Volume2,
  FileAudio,
  Check,
  X,
  ChevronDown,
  Info,
} from 'lucide-react';
import { VoiceNavigationState } from '../hooks/useVoiceNavigation';

interface VoiceCommandBarProps {
  voiceState: VoiceNavigationState;
}

export const VoiceCommandBar: React.FC<VoiceCommandBarProps> = ({ voiceState }) => {
  const [showCommandCheatSheet, setShowCommandCheatSheet] = useState(false);

  if (!voiceState.isSupported) {
    return (
      <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-900/60 border border-stone-800 text-[10px] text-stone-400">
        <MicOff size={12} className="text-stone-500" />
        <span>Voice: Browser Unsupported</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Main Microphone Button */}
      <button
        id="btn-voice-nav-toggle"
        onClick={voiceState.toggleListening}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
          voiceState.isListening
            ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-rose-900/50 animate-pulse border border-rose-400/60'
            : 'bg-stone-900/90 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-700/70'
        }`}
        title={voiceState.isListening ? 'Click to pause voice commands' : 'Click to enable hands-free voice commands'}
      >
        {voiceState.isListening ? (
          <>
            <Mic size={14} className="text-white animate-bounce" />
            <span className="hidden sm:inline">Hands-Free Active</span>
          </>
        ) : (
          <>
            <Mic size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Voice Nav</span>
          </>
        )}
      </button>

      {/* Voice Note Recording Status Trigger */}
      {voiceState.isListening && (
        <button
          onClick={() => {
            if (voiceState.isRecordingVoiceNote) {
              voiceState.stopVoiceNoteRecording();
            } else {
              voiceState.startVoiceNoteRecording();
            }
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
            voiceState.isRecordingVoiceNote
              ? 'bg-amber-500 text-stone-950 font-bold border border-amber-400'
              : 'bg-purple-950/70 text-purple-200 border border-purple-500/40 hover:bg-purple-900'
          }`}
        >
          <FileAudio size={13} className={voiceState.isRecordingVoiceNote ? 'text-stone-950' : 'text-amber-400'} />
          <span className="text-[11px]">
            {voiceState.isRecordingVoiceNote
              ? `Recording (${voiceState.activeNoteDuration}s)`
              : 'Voice Note'}
          </span>
        </button>
      )}

      {/* Dynamic Feedback / Heard Phrase Pill */}
      {voiceState.feedback && voiceState.isListening && (
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-amber-500/30 text-[11px] text-amber-300 font-mono animate-fadeIn">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="max-w-xs truncate">{voiceState.feedback}</span>
        </div>
      )}

      {/* Voice Command Cheat Sheet Toggle */}
      <button
        onClick={() => setShowCommandCheatSheet(!showCommandCheatSheet)}
        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 text-xs"
        title="View Available Hands-Free Voice Commands"
      >
        <Info size={14} />
      </button>

      {/* Cheat Sheet Dropdown */}
      {showCommandCheatSheet && (
        <div className="absolute top-10 right-0 z-50 w-72 p-4 rounded-2xl bg-[#2A1810] border-2 border-amber-500/80 shadow-2xl text-white text-xs space-y-3 animate-slideDown">
          <div className="flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles size={14} />
              <span>Hands-Free Commands</span>
            </span>
            <button
              onClick={() => setShowCommandCheatSheet(false)}
              className="p-1 rounded text-stone-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[11px] text-stone-300">
            Designed for field geologists wearing heavy gloves or working in truck cabs:
          </p>

          <div className="space-y-1.5 text-[11px]">
            <div className="p-1.5 rounded bg-black/40 font-mono text-amber-300">"Go to vision" / "Inspect core"</div>
            <div className="p-1.5 rounded bg-black/40 font-mono text-amber-300">"Open map" / "Show GIS targets"</div>
            <div className="p-1.5 rounded bg-black/40 font-mono text-amber-300">"Show drillholes" / "Open assays"</div>
            <div className="p-1.5 rounded bg-black/40 font-mono text-amber-300">"Open minerals" / "Show petrography"</div>
            <div className="p-1.5 rounded bg-black/40 font-mono text-amber-300">"Open miner safety" / "Worker vitals"</div>
            <div className="p-1.5 rounded bg-black/40 font-mono text-amber-300">"Start voice note" / "Stop recording"</div>
            <div className="p-1.5 rounded bg-black/40 font-mono text-amber-300">"Start tour" / "Ask MineAI"</div>
          </div>
        </div>
      )}
    </div>
  );
};
