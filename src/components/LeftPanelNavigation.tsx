import React from 'react';
import {
  LayoutDashboard,
  ScanEye,
  MapPin,
  Database,
  FlaskConical,
  Layers,
  Calculator,
  ShieldCheck,
  Cpu,
  Bot,
  Compass,
  BookOpen,
  Smartphone,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Radio,
  X,
  CreditCard,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { HealthcareLogo } from './HealthcareLogo';

export interface LeftPanelNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isDarkMode?: boolean;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  isMobileSimulator?: boolean;
  onToggleMobileSimulator?: () => void;
  onOpenTour?: () => void;
  onStartTour?: () => void;
  onOpenDocs?: () => void;
  onOpenDownload?: () => void;
  isOffline?: boolean;
  onToggleOffline?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const LeftPanelNavigation: React.FC<LeftPanelNavigationProps> = ({
  activeTab,
  onTabChange,
  isDarkMode = true,
  darkMode,
  onToggleDarkMode,
  isMobileSimulator = false,
  onToggleMobileSimulator,
  onOpenTour,
  onStartTour,
  onOpenDocs,
  onOpenDownload,
  isOffline = false,
  onToggleOffline,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const onToggleCollapse = controlledToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const effectiveDarkMode = darkMode !== undefined ? darkMode : isDarkMode;
  const triggerTour = onStartTour || onOpenTour || (() => {});
  const navSections = [
    {
      title: 'EXPLORATION & CORE',
      items: [
        {
          id: 'dashboard' as ActiveTab,
          label: 'Executive Dashboard',
          icon: LayoutDashboard,
          badge: 'Live',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'vision' as ActiveTab,
          label: 'Computer Vision & Core',
          icon: ScanEye,
          badge: 'AI HSI',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        {
          id: 'gis_map' as ActiveTab,
          label: 'GIS Exploration Map',
          icon: MapPin,
          badge: '5 Regions',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        },
        {
          id: 'minerals' as ActiveTab,
          label: 'Mineral Database',
          icon: Database,
          badge: 'USGS',
          badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
        },
      ],
    },
    {
      title: 'ANALYTICS & DRILLING',
      items: [
        {
          id: 'geochemistry' as ActiveTab,
          label: 'Geochemistry & Assays',
          icon: FlaskConical,
          badge: 'ICP-MS',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        },
        {
          id: 'drillholes' as ActiveTab,
          label: 'Drill-Hole Manager',
          icon: Layers,
          badge: '3D Log',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        },
        {
          id: 'vibration_signals' as ActiveTab,
          label: 'AI Vibration & Telemetry',
          icon: Radio,
          badge: 'ANT & Bit',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        {
          id: 'economics' as ActiveTab,
          label: 'Resource & Economics',
          icon: Calculator,
          badge: 'NPV/IRR',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
      ],
    },
    {
      title: 'LIFE SAFETY & AI ORCHESTRATION',
      items: [
        {
          id: 'healthcare_esg' as ActiveTab,
          label: 'Miner Health & ESG',
          icon: ShieldCheck,
          badge: 'Safety',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        },
        {
          id: 'a2a_judge' as ActiveTab,
          label: 'A2A Judge Agent',
          icon: Cpu,
          badge: 'Audit',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        },
        {
          id: 'assistant' as ActiveTab,
          label: 'MineAI Assistant',
          icon: Bot,
          badge: 'Search',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
      ],
    },
    {
      title: 'SUBSCRIPTION & LICENSING',
      items: [
        {
          id: 'subscription' as ActiveTab,
          label: 'Subscription & Billing',
          icon: CreditCard,
          badge: '7-Day Trial',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
      ],
    },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (isMobileDrawer: boolean = false) => {
    const showCollapsed = !isMobileDrawer && isCollapsed;
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Branding Section */}
        <div className="p-4 border-b border-amber-900/30 flex items-center justify-between">
          <HealthcareLogo size="md" showText={!showCollapsed} />
          {isMobileDrawer ? (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-stone-300 hover:text-white transition-colors"
              aria-label="Close Mobile Navigation"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              id="btn-toggle-sidebar"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-amber-300 hover:text-amber-100 transition-colors"
              title={showCollapsed ? 'Expand panel' : 'Collapse panel'}
              aria-label="Toggle Panel"
            >
              {showCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>

        {/* Quick Status Bar */}
        {!showCollapsed && (
          <div className="px-4 py-2 border-b border-amber-950/40 bg-black/20 flex items-center justify-between text-xs">
            {/* Offline/Online toggle */}
            <button
              id={isMobileDrawer ? 'btn-offline-toggle-mobile' : 'btn-offline-toggle'}
              onClick={onToggleOffline}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors font-medium ${
                isOffline
                  ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/50'
              }`}
              title="Toggle offline simulated synchronization"
            >
              {isOffline ? <WifiOff size={13} /> : <Wifi size={13} />}
              <span>{isOffline ? 'Offline Cache' : 'Cloud Sync'}</span>
            </button>

            {/* Quick controls: Dark Mode & Mobile Simulator */}
            <div className="flex items-center gap-1">
              <button
                id={isMobileDrawer ? 'btn-toggle-theme-mobile' : 'btn-toggle-theme'}
                onClick={onToggleDarkMode}
                className="p-1.5 rounded hover:bg-white/10 text-amber-300 transition-colors"
                title={effectiveDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {effectiveDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              {onToggleMobileSimulator && (
                <button
                  id={isMobileDrawer ? 'btn-toggle-mobile-view-mobile' : 'btn-toggle-mobile-view'}
                  onClick={onToggleMobileSimulator}
                  className={`p-1.5 rounded transition-colors ${
                    isMobileSimulator ? 'bg-purple-600 text-white' : 'hover:bg-white/10 text-purple-300'
                  }`}
                  title="Toggle Mobile Simulator Frame (iOS/Android)"
                >
                  <Smartphone size={15} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Navigation Button Panel */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              {!showCollapsed && (
                <div className="px-2 text-[10px] font-bold tracking-widest text-amber-500/70 uppercase">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-btn-${item.id}${isMobileDrawer ? '-mobile' : ''}`}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-900/90 to-[#3D2314] text-white shadow-md border border-amber-500/60 font-semibold'
                          : effectiveDarkMode
                          ? 'text-stone-300 hover:bg-stone-800/60 hover:text-white border border-transparent'
                          : 'text-stone-700 hover:bg-stone-200 hover:text-stone-900 border border-transparent'
                      }`}
                      title={item.label}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg transition-transform group-hover:scale-110 flex-shrink-0 ${
                            isActive
                              ? 'bg-amber-500 text-stone-950 font-bold'
                              : 'bg-purple-950/50 text-amber-400 border border-purple-700/30'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        {!showCollapsed && (
                          <span className="truncate text-sm tracking-tight">{item.label}</span>
                        )}
                      </div>
                      {!showCollapsed && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Panel Utility Actions */}
        <div className="p-3 border-t border-amber-900/40 bg-black/20 space-y-2">
          {/* Remote Field Offline Status Pill */}
          {!showCollapsed && (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-stone-900/80 border border-stone-800 text-[11px]">
              <span className="flex items-center gap-1.5 text-stone-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Field Offline Cache</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                IndexedDB
              </span>
            </div>
          )}

          {!showCollapsed ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                id={isMobileDrawer ? 'btn-start-tour-mobile' : 'btn-start-tour'}
                onClick={() => {
                  triggerTour();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-600/40 transition-colors"
              >
                <Compass size={14} className="text-amber-400" />
                <span>Tour</span>
              </button>
              <button
                id={isMobileDrawer ? 'btn-open-docs-mobile' : 'btn-open-docs'}
                onClick={() => {
                  if (onOpenDocs) onOpenDocs();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold bg-stone-800/60 hover:bg-stone-700 text-stone-200 border border-stone-700/50 transition-colors"
              >
                <BookOpen size={14} className="text-amber-400" />
                <span>Guide</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={triggerTour}
                className="p-2 rounded-lg bg-purple-900/40 text-amber-300 hover:bg-purple-800"
                title="Start App Tour"
              >
                <Compass size={18} />
              </button>
              <button
                onClick={onOpenDocs || (() => {})}
                className="p-2 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700"
                title="Quick Start Guide"
              >
                <BookOpen size={18} />
              </button>
            </div>
          )}

          {/* Download App Button */}
          <button
            id={isMobileDrawer ? 'btn-download-app-panel-mobile' : 'btn-download-app-panel'}
            onClick={() => {
              if (onOpenDownload) onOpenDownload();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold transition-all shadow-lg ${
              showCollapsed
                ? 'px-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950'
                : 'px-3 text-xs uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 hover:brightness-110 active:scale-95'
            }`}
            title="Download App for Android and iOS"
          >
            <Download size={16} className="flex-shrink-0" />
            {!showCollapsed && <span>Download App (iOS/APK)</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sticky Sidebar (Visible on lg and larger) */}
      <aside
        id="nav-panel"
        className={`hidden lg:flex relative flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r z-30 select-none ${
          isCollapsed ? 'lg:w-20' : 'lg:w-72 xl:w-80'
        } ${
          effectiveDarkMode
            ? 'bg-[#2A1810] border-stone-800/80 text-stone-200'
            : 'bg-[#FAF7F2] border-stone-300 text-stone-900 shadow-lg'
        } lg:sticky lg:top-0 lg:h-screen overflow-hidden`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer (Visible on screens < lg when opened) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-in drawer container */}
          <aside
            id="nav-panel-mobile-drawer"
            className={`relative flex flex-col w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300 select-none ${
              effectiveDarkMode
                ? 'bg-[#2A1810] border-r border-amber-900/50 text-stone-200'
                : 'bg-[#FAF7F2] border-r border-stone-300 text-stone-900'
            }`}
          >
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
