import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  Region,
} from './types';
import { LeftPanelNavigation } from './components/LeftPanelNavigation';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { ComputerVisionCenter } from './components/ComputerVisionCenter';
import { ExplorationGISMap } from './components/ExplorationGISMap';
import { MineralDatabase } from './components/MineralDatabase';
import { MinerHealthAndESG } from './components/MinerHealthAndESG';
import { A2AJudgeAgentCenter } from './components/A2AJudgeAgentCenter';
import { DrillHoleManager } from './components/DrillHoleManager';
import { GeochemistryGeophysics } from './components/GeochemistryGeophysics';
import { MiningEconomicsCalculator } from './components/MiningEconomicsCalculator';
import { AIVibrationSignalsCenter } from './components/AIVibrationSignalsCenter';
import { MineAIAssistant } from './components/MineAIAssistant';
import { GuidedTour } from './components/GuidedTour';
import { MobileDownloadModal } from './components/MobileDownloadModal';
import { QuickStartDocsModal } from './components/QuickStartDocsModal';
import { VoiceCommandBar } from './components/VoiceCommandBar';
import { OfflineSyncBadge } from './components/OfflineSyncBadge';
import { SiteSafetyChecklistModal } from './components/SiteSafetyChecklistModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EquipmentNotificationCenter } from './components/EquipmentNotificationCenter';
import { AmbientLightSensorWidget } from './components/AmbientLightSensorWidget';
import { SubscriptionBillingSection } from './components/SubscriptionBillingSection';
import { GlobalExportDataModal } from './components/GlobalExportDataModal';
import { FirebaseSyncModal } from './components/FirebaseSyncModal';
import { useFirebase } from './context/FirebaseContext';
import { useAmbientLightTheme } from './hooks/useAmbientLightTheme';
import { useEquipmentNotifications } from './context/EquipmentNotificationContext';
import { useSubscriptionAuth } from './context/SubscriptionAuthContext';
import { useVoiceNavigation } from './hooks/useVoiceNavigation';
import {
  Bot,
  Compass,
  Download,
  BookOpen,
  Globe,
  Bell,
  Sparkles,
  ShieldCheck,
  HardHat,
  X,
  ShieldAlert,
  Menu,
  Smartphone,
  CreditCard,
  Lock,
  Clock,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

const initialOptions = {
  clientId:
    import.meta.env.VITE_PAYPAL_CLIENT_ID ||
    'BAAIOmq3Kx_2Lo8oiG7L8JlzOuuAKT2E1V2cJaJka7wJ5afyYJRYJRhXzbX-KnAPEU19Hn4jdHf79ksIqo',
  components: 'buttons',
  intent: 'subscription',
  vault: true,
};

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedRegion, setSelectedRegion] = useState<Region>('Canada');
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [currentTourStep, setCurrentTourStep] = useState<number>(0);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [isFloatingAssistantOpen, setIsFloatingAssistantOpen] = useState<boolean>(false);
  const [assistantPrompt, setAssistantPrompt] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobileSimulator, setIsMobileSimulator] = useState<boolean>(false);

  // Firebase Firestore & Auth Hook
  const { firebaseUser, isFirestoreConnected } = useFirebase();

  // System Ambient Light Sensor (Auto-toggles 'dark' CSS class on Mobile, manual on Desktop)
  const ambientTheme = useAmbientLightTheme(isMobileSimulator);
  const { darkMode, toggleDarkMode, setDarkMode } = ambientTheme;

  // SCADA Equipment Notifications Navigation Hook
  const { registerNavigationHandler } = useEquipmentNotifications();

  // Subscription & 7-Day Trial Auth Hook
  const {
    isAccessGranted,
    isSubscribed,
    isTrialActive,
    isTrialExpiringSoon,
    trialDaysRemaining,
    trialHoursRemaining,
    currentUser,
  } = useSubscriptionAuth();

  // Allow full navigation across all tools while displaying license status in top bar and nav
  useEffect(() => {
    registerNavigationHandler((_equipmentId) => {
      setActiveTab('healthcare_esg');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [registerNavigationHandler]);

  // Site Mobilization Safety Checklist Modal State
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);
  const [pendingRegion, setPendingRegion] = useState<Region>('Canada');
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);

  const handleRequestRegionChange = (newRegion: Region) => {
    if (newRegion === selectedRegion) return;
    setPendingRegion(newRegion);
    setIsSafetyModalOpen(true);
  };

  const handleConfirmSafetyClearance = (region: Region) => {
    setSelectedRegion(region);
    setIsSafetyModalOpen(false);
    setSafetyNotice(`Site Safety Clearance Verified for ${region} Sector. All GIS data authorized.`);
    setTimeout(() => setSafetyNotice(null), 6000);
  };

  // Web Speech API Hands-Free Voice Controller
  const voiceState = useVoiceNavigation({
    activeTab,
    onNavigate: (tab) => setActiveTab(tab),
    onStartTour: () => {
      setCurrentTourStep(0);
      setIsTourOpen(true);
    },
    onToggleDarkMode: () => setDarkMode((prev) => !prev),
    onOpenDownload: () => setIsDownloadModalOpen(true),
  });

  // Apply dark mode class to root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSendToAssistant = (prompt: string) => {
    setAssistantPrompt(prompt);
    setActiveTab('assistant');
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ExecutiveDashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectRegion={handleRequestRegionChange}
            selectedRegion={selectedRegion}
          />
        );
      case 'vision':
        return <ComputerVisionCenter onSendToAssistant={handleSendToAssistant} />;
      case 'gis_map':
        return (
          <ExplorationGISMap
            selectedRegion={selectedRegion}
            onSelectRegion={handleRequestRegionChange}
          />
        );
      case 'minerals':
        return <MineralDatabase />;
      case 'geochemistry':
        return <GeochemistryGeophysics />;
      case 'drillholes':
        return <DrillHoleManager onNavigate={(tab) => setActiveTab(tab)} />;
      case 'vibration_signals':
        return <AIVibrationSignalsCenter />;
      case 'economics':
        return <MiningEconomicsCalculator />;
      case 'healthcare_esg':
        return (
          <MinerHealthAndESG
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => setSelectedRegion(reg)}
          />
        );
      case 'a2a_judge':
        return <A2AJudgeAgentCenter />;
      case 'assistant':
        return (
          <MineAIAssistant
            activeTool={activeTab}
            onNavigate={(tab) => setActiveTab(tab)}
            initialPrompt={assistantPrompt}
            onStartTour={() => {
              setCurrentTourStep(0);
              setIsTourOpen(true);
            }}
          />
        );
      case 'subscription':
        return <SubscriptionBillingSection onNavigateToTab={(tab) => setActiveTab(tab)} />;
      default:
        return (
          <ExecutiveDashboard
            onNavigate={(tab) => setActiveTab(tab)}
            onSelectRegion={handleRequestRegionChange}
            selectedRegion={selectedRegion}
          />
        );
    }
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className={`min-h-screen ${darkMode ? 'bg-[#1C100B] text-stone-100' : 'bg-[#FAF5EF] text-stone-900'} flex flex-col lg:flex-row transition-colors duration-300 font-['Plus_Jakarta_Sans']`}>
      {/* Left-Hand Single Navigation Panel */}
      <LeftPanelNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onStartTour={() => {
          setCurrentTourStep(0);
          setIsTourOpen(true);
        }}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isMobileSimulator={isMobileSimulator}
        onToggleMobileSimulator={() => setIsMobileSimulator((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Operational Bar */}
        <header className="sticky top-0 z-30 bg-[#2A1810]/90 backdrop-blur-md border-b border-amber-900/40 px-3 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              id="btn-mobile-menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors flex-shrink-0"
              aria-label="Open mobile navigation menu"
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider hidden sm:inline">
              Platform &bull;
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-400 capitalize truncate max-w-[140px] sm:max-w-none">
              {activeTab.replace('_', ' ')}
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-500/30 text-[11px] font-mono">
              <Globe size={11} className="text-amber-400" />
              {selectedRegion} Province
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Hands-Free Web Speech Voice Controller */}
            <VoiceCommandBar voiceState={voiceState} />

            {/* Offline Storage & Remote Field Sync Status */}
            <OfflineSyncBadge />

            {/* SCADA Equipment Wear & Safety Alarm Notifications */}
            <EquipmentNotificationCenter />

            {/* Mobile Ambient Light Sensor Auto-Class & Desktop Manual Toggle */}
            <AmbientLightSensorWidget ambientState={ambientTheme} />

            {/* Quick Tour Button */}
            <button
              id="btn-top-quick-tour"
              onClick={() => {
                setCurrentTourStep(0);
                setIsTourOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-500/40 text-xs font-bold transition-colors"
            >
              <Compass size={14} className="text-amber-400" />
              <span className="hidden sm:inline">Start Tour</span>
            </button>

            {/* Quick Docs Button */}
            <button
              id="btn-top-quick-docs"
              onClick={() => setIsDocsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700/60 transition-colors"
              title="Documentation & Tutorial"
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">Docs</span>
            </button>

            {/* Global Export Data Action (CSV / PDF) */}
            <button
              id="btn-top-global-export-data"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 text-xs font-extrabold shadow-md border border-amber-300 transition-all cursor-pointer"
              title="Global Export Data: Download active view data as CSV or PDF report for offline field analysis"
            >
              <FileSpreadsheet size={14} className="text-stone-950" />
              <span>Export Data</span>
            </button>

            {/* Mobile App Download Button */}
            <button
              id="btn-top-download-app"
              onClick={() => setIsDownloadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700/60 transition-colors"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Mobile App</span>
            </button>

            {/* Firebase Cloud Sync Button */}
            <button
              id="btn-top-firebase-sync"
              onClick={() => setIsFirebaseModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                firebaseUser
                  ? 'bg-amber-950/70 hover:bg-amber-900/70 text-amber-300 border-amber-500/50 shadow-sm'
                  : isFirestoreConnected
                  ? 'bg-stone-800/90 hover:bg-stone-700 text-stone-200 border-emerald-500/50'
                  : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 border-stone-700/60'
              }`}
              title="Firebase Firestore & Google Auth Cloud Sync"
            >
              <Database size={14} className={isFirestoreConnected ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="hidden sm:inline">
                {firebaseUser ? (firebaseUser.displayName?.split(' ')[0] || 'Synced') : 'Firebase'}
              </span>
              <span className={`w-2 h-2 rounded-full ${isFirestoreConnected ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
            </button>

            {/* Subscription & Billing Top Action Button */}
            <button
              id="btn-top-subscription-billing"
              onClick={() => setActiveTab('subscription')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                activeTab === 'subscription'
                  ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md font-extrabold'
                  : isSubscribed
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40'
                  : isTrialActive
                  ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-500/40'
                  : 'bg-rose-950/90 hover:bg-rose-900 text-rose-300 border-rose-500 animate-pulse'
              }`}
              title="Subscription & Billing: 7-Day Free Trial, Monthly ($19.99), Yearly ($199.99)"
            >
              <CreditCard size={14} className={isSubscribed ? 'text-emerald-400' : 'text-amber-400'} />
              <span className="hidden sm:inline">
                {isSubscribed
                  ? currentUser?.plan === 'yearly'
                    ? 'Enterprise'
                    : 'Pro ($19.99)'
                  : isTrialActive
                  ? `Trial (${trialDaysRemaining}d)`
                  : 'Subscribe'}
              </span>
              <span className="sm:hidden">Billing</span>
            </button>

            {/* MineAI Floating Assistant Launcher */}
            <button
              id="btn-top-launch-assistant"
              onClick={() => setIsFloatingAssistantOpen(!isFloatingAssistantOpen)}
              className={`p-2 rounded-xl text-xs font-bold transition-all relative ${
                isFloatingAssistantOpen
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-purple-900 text-white border border-purple-500/40 hover:bg-purple-800'
              }`}
              title="Toggle MineAI Quick Copilot"
            >
              <Bot size={17} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            </button>
          </div>
        </header>

        {/* Site Safety Clearance Alert Banner */}
        {safetyNotice && (
          <div className="mx-4 sm:mx-8 mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">{safetyNotice}</span>
            </div>
            <button
              onClick={() => setSafetyNotice(null)}
              className="text-stone-400 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Pre-Expiration Warning Notification Banner (Notifies users before trial expires) */}
        {isAccessGranted && isTrialActive && isTrialExpiringSoon && (
          <div
            id="trial-expiring-soon-banner"
            className="mx-4 sm:mx-8 mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/95 via-[#3D2314]/95 to-amber-950/95 border-2 border-amber-500 text-amber-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2 duration-200 ring-2 ring-amber-500/30"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex-shrink-0">
                <Clock size={18} className="animate-pulse" />
              </div>
              <div>
                <strong className="text-white block font-['Space_Grotesk'] text-sm">
                  Trial Expiring Soon: {trialDaysRemaining} {trialDaysRemaining === 1 ? 'Day' : 'Days'} ({trialHoursRemaining}h) Remaining
                </strong>
                <span className="text-amber-200/90 text-[11px]">
                  Your 7-Day Free Trial will conclude soon. Select a Monthly ($19.99) or Yearly ($199.99) plan to continue uninterrupted geological analysis.
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('subscription')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <CreditCard size={13} />
              <span>Extend with Subscription</span>
            </button>
          </div>
        )}

        {/* Global Access Restriction Alert Banner (Trial Expired or Unauthenticated) */}
        {!isAccessGranted && (
          <div
            id="access-restricted-banner"
            className="mx-4 sm:mx-8 mt-3 p-3.5 rounded-2xl bg-rose-950/95 border-2 border-rose-500 text-rose-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2 duration-200 ring-2 ring-rose-500/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex-shrink-0 animate-bounce">
                <Lock size={18} />
              </div>
              <div>
                <strong className="text-white block font-['Space_Grotesk'] text-sm">
                  {currentUser ? '7-Day Free Trial Expired • Access Restricted' : 'Registration & 7-Day Free Trial Required'}
                </strong>
                <span className="text-rose-200 text-[11px]">
                  {currentUser
                    ? 'Further access to application tools is restricted. Select an available subscription plan below and complete payment to restore full access.'
                    : 'Create your account to activate your 7-Day Free Trial and access the entire exploration suite.'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('subscription')}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <CreditCard size={13} />
              <span>{currentUser ? 'Choose Subscription Plan' : 'Activate 7-Day Free Trial'}</span>
            </button>
          </div>
        )}

        {/* Dynamic Tool Viewport */}
        {isMobileSimulator ? (
          <div className="flex-1 p-4 flex flex-col items-center justify-center bg-stone-950/60 backdrop-blur-xs min-h-[calc(100vh-65px)]">
            <div className="mb-3 flex items-center justify-between w-full max-w-[420px] px-2 text-xs">
              <span className="flex items-center gap-1.5 text-purple-300 font-bold">
                <Smartphone size={15} />
                <span>Field Ruggedized Device Simulator (CAT S62 / Pixel)</span>
              </span>
              <button
                onClick={() => setIsMobileSimulator(false)}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-mono text-[11px]"
              >
                Exit Simulator &times;
              </button>
            </div>

            {/* Mobile Device Frame */}
            <div className="relative w-full max-w-[420px] h-[780px] bg-stone-900 rounded-[44px] p-3 shadow-2xl border-4 border-stone-700 ring-1 ring-amber-500/30 flex flex-col overflow-hidden">
              {/* Device Speaker Notch / Dynamic Island */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-stone-950 rounded-full z-40 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-stone-800 mr-2" />
                <div className="w-10 h-1 rounded-full bg-stone-800" />
              </div>

              {/* Mobile Screen Surface */}
              <div className="w-full h-full rounded-[34px] overflow-y-auto bg-[#1C100B] text-stone-100 p-3 pt-8 border border-stone-800/80 custom-scrollbar">
                <ErrorBoundary fallbackTab={() => setActiveTab('dashboard')}>
                  {renderActiveTabContent()}
                </ErrorBoundary>
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-stone-500 rounded-full" />
            </div>
          </div>
        ) : (
          <main className="flex-1 p-3 sm:p-5 lg:p-8 max-w-7xl w-full mx-auto">
            <ErrorBoundary fallbackTab={() => setActiveTab('dashboard')}>
              {renderActiveTabContent()}
            </ErrorBoundary>
          </main>
        )}
      </div>

      {/* Floating Persistent MineAI Copilot Drawer */}
      {isFloatingAssistantOpen && (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm sm:max-w-md rounded-2xl bg-[#2A1810] border-2 border-amber-500 shadow-2xl overflow-hidden animate-slideUp">
          <div className="p-3 bg-gradient-to-r from-purple-900 to-amber-900/90 flex items-center justify-between text-white border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-amber-400" />
              <span className="font-bold text-xs">MineAI Quick Assistant</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-300">
                {activeTab}
              </span>
            </div>
            <button
              onClick={() => setIsFloatingAssistantOpen(false)}
              className="p-1 rounded hover:bg-black/30 text-stone-300 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-4 max-h-[420px] overflow-y-auto">
            <MineAIAssistant
              activeTool={activeTab}
              onNavigate={(tab) => {
                setActiveTab(tab);
                setIsFloatingAssistantOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Modals: Tour, Mobile Download & Quick Start Documentation */}
      <GuidedTour
        isOpen={isTourOpen}
        currentStepIndex={currentTourStep}
        onNext={() => setCurrentTourStep((prev) => prev + 1)}
        onPrev={() => setCurrentTourStep((prev) => prev - 1)}
        onClose={() => setIsTourOpen(false)}
        onJumpToTab={(tab) => setActiveTab(tab)}
      />

      <MobileDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      <QuickStartDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        onStartTour={() => {
          setCurrentTourStep(0);
          setIsTourOpen(true);
        }}
      />

      {/* Mandatory Site Mobilization Safety Checklist Modal */}
      <SiteSafetyChecklistModal
        isOpen={isSafetyModalOpen}
        currentRegion={selectedRegion}
        targetRegion={pendingRegion}
        onConfirm={handleConfirmSafetyClearance}
        onCancel={() => setIsSafetyModalOpen(false)}
      />

      {/* Global Data Export Modal (CSV & PDF for Active View) */}
      {isExportModalOpen && (
        <GlobalExportDataModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          activeTab={activeTab}
          selectedRegion={selectedRegion}
        />
      )}

      {/* Firebase Firestore & Auth Cloud Sync Modal */}
      {isFirebaseModalOpen && (
        <FirebaseSyncModal
          isOpen={isFirebaseModalOpen}
          onClose={() => setIsFirebaseModalOpen(false)}
        />
      )}
    </div>
  </PayPalScriptProvider>
  );
}

export default App;
