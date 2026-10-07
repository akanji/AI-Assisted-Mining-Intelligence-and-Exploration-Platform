import React from 'react';
import {
  Compass,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bot,
  CheckCircle,
} from 'lucide-react';
import { TOUR_STEPS } from '../data/miningData';
import { ActiveTab, TourStep } from '../types';

interface GuidedTourProps {
  isOpen: boolean;
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onJumpToTab: (tab: ActiveTab) => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  isOpen,
  currentStepIndex,
  onNext,
  onPrev,
  onClose,
  onJumpToTab,
}) => {
  if (!isOpen) return null;

  const currentStep: TourStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      const nextStep = TOUR_STEPS[currentStepIndex + 1];
      const target = nextStep?.tabToSwitch || nextStep?.targetTab;
      if (target) {
        onJumpToTab(target);
      }
      onNext();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevStep = TOUR_STEPS[currentStepIndex - 1];
      const target = prevStep?.tabToSwitch || prevStep?.targetTab;
      if (target) {
        onJumpToTab(target);
      }
      onPrev();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#381F14] to-[#4C1D95] border-2 border-amber-500/60 p-6 shadow-2xl text-white space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Tour Header with MineAI Icon */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-stone-950 font-bold shadow-md">
            <Bot size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Interactive Platform Tour
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white font-['Space_Grotesk']">
              {currentStep.title}
            </h2>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-4 rounded-xl bg-black/40 border border-stone-800 text-sm text-stone-200 leading-relaxed">
          {currentStep.description}
        </div>

        {/* Target Tab Highlight Pill */}
        {(currentStep.tabToSwitch || currentStep.targetTab) && (
          <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium">
            <Sparkles size={14} className="text-amber-400" />
            <span>
              Active Context: <strong className="capitalize text-white">{(currentStep.tabToSwitch || currentStep.targetTab || '').replace('_', ' ')}</strong>
            </span>
          </div>
        )}

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {TOUR_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex
                  ? 'w-6 bg-amber-400'
                  : idx < currentStepIndex
                  ? 'w-2 bg-purple-400'
                  : 'w-2 bg-stone-700'
              }`}
            />
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800/80">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-400 hover:text-stone-200"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-bold text-xs shadow-lg transition-all"
            >
              <span>{isLastStep ? 'Complete Tour' : 'Next Step'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
