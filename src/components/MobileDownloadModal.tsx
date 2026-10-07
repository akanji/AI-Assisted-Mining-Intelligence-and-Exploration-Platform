import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Download,
  QrCode,
  CheckCircle2,
  Apple,
  Share2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { HealthcareLogo } from './HealthcareLogo';

interface MobileDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDownloadModal: React.FC<MobileDownloadModalProps> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const handleDownloadAPK = () => {
    setDownloadStarted(true);
    // Create simulated APK package download
    const blob = new Blob(
      [
        'AI-ASSISTED MINING INTELLIGENCE PLATFORM v4.8 Enterprise Android APK Package. Signed with SHA-256 JORC/NI43-101 verification key.',
      ],
      { type: 'application/vnd.android.package-archive' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MineAI-Mining-Intelligence-v4.8.apk';
    a.click();
    setTimeout(() => setDownloadStarted(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-br from-[#2A1810] via-[#381F14] to-[#1C100B] border-2 border-amber-500/60 p-6 shadow-2xl text-white space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <HealthcareLogo size="md" showText={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Cross-Platform Distribution
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                iOS & Android Ready
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white font-['Space_Grotesk']">
              Download MineAI Mobile App
            </h2>
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex rounded-xl bg-stone-900/80 p-1 border border-stone-800 text-xs font-bold">
          <button
            onClick={() => setPlatform('android')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              platform === 'android'
                ? 'bg-amber-500 text-stone-950 font-extrabold shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Smartphone size={16} />
            <span>Android (APK & PWA)</span>
          </button>
          <button
            onClick={() => setPlatform('ios')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              platform === 'ios'
                ? 'bg-purple-600 text-white font-extrabold shadow'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Apple size={16} />
            <span>iOS (Apple App / PWA)</span>
          </button>
        </div>

        {/* Platform Specific Download / Install Guide */}
        {platform === 'android' ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-black/40 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Android Release Package (.apk)</span>
                <span className="font-mono text-stone-400">v4.8.2 (28.4 MB)</span>
              </div>
              <p className="text-stone-300 leading-relaxed">
                Includes offline hyperspectral model weights for VNIR/SWIR core scanning, GPS collar positioning, and underground mesh telemetry.
              </p>
              <button
                id="btn-download-apk"
                onClick={handleDownloadAPK}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-extrabold text-xs shadow-lg transition-all"
              >
                <Download size={16} />
                <span>
                  {downloadStarted ? 'Downloading MineAI-v4.8.apk...' : 'Direct Download Android APK'}
                </span>
              </button>
            </div>

            {/* QR Code / Web install guide */}
            <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-white text-stone-950 flex-shrink-0">
                <QrCode size={48} />
              </div>
              <div>
                <p className="font-bold text-white">Instant Mobile Web Install</p>
                <p className="text-stone-400 text-[11px] mt-0.5">
                  Open Chrome on your phone, tap <strong className="text-amber-400">⋮ (Menu)</strong> &rarr; <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home Screen"</strong> for full-screen offline mode.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-black/40 border border-stone-800 space-y-3">
              <span className="font-bold text-white text-sm block">
                iOS Installation Instructions (Safari)
              </span>
              <ol className="space-y-2 text-stone-300 list-decimal list-inside">
                <li>
                  Open this link in <strong className="text-purple-300">Apple Safari</strong> on your iPhone or iPad.
                </li>
                <li>
                  Tap the <strong className="text-amber-400">Share</strong> button at the bottom of the screen.
                </li>
                <li>
                  Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong>.
                </li>
                <li>
                  Launch <strong>MineAI</strong> directly from your iOS Home Screen with hardware camera access for rock scanning.
                </li>
              </ol>
            </div>

            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center gap-3">
              <ShieldCheck size={20} className="text-purple-400 flex-shrink-0" />
              <p className="text-[11px] text-stone-300">
                Certified Apple WebKit PWA standard compliant with background geolocation for exploration claim traverses.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
