import React from 'react';

interface HealthcareLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const HealthcareLogo: React.FC<HealthcareLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const dimensions = {
    sm: { box: 'w-8 h-8', icon: 32, text: 'text-xs' },
    md: { box: 'w-11 h-11', icon: 44, text: 'text-sm' },
    lg: { box: 'w-16 h-16', icon: 64, text: 'text-base' },
    xl: { box: 'w-24 h-24', icon: 96, text: 'text-lg' },
  }[size];

  return (
    <div id="healthcare-logo" className={`flex items-center gap-3 ${className}`}>
      {/* Exquisite Healthcare & Miner Safety Emblem */}
      <div className={`relative ${dimensions.box} flex-shrink-0 flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-md transition-transform hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Shield / Geological Octagon in Deep Brown with Gold Rim */}
          <polygon
            points="50,4 88,20 94,62 50,96 6,62 12,20"
            fill="#2A1810"
            stroke="#F59E0B"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Safety Shield in Deep Purple */}
          <polygon
            points="50,12 80,25 84,58 50,86 16,58 20,25"
            fill="#4C1D95"
            stroke="#7E22CE"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Radial Gold Grid Accent lines */}
          <line x1="50" y1="12" x2="50" y2="86" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.6" />
          <line x1="20" y1="25" x2="80" y2="58" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.3" />
          <line x1="80" y1="25" x2="20" y2="58" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.3" />

          {/* Medical Healthcare Cross in Crisp White with Golden Edge */}
          <path
            d="M44,26 H56 V38 H68 V50 H56 V62 H44 V50 H32 V38 H44 Z"
            fill="#FFFFFF"
            stroke="#F59E0B"
            strokeWidth="1.5"
          />

          {/* Geological Pickaxe & Heartbeat EKG Pulse Silhouette in Golden-Yellow & Purple */}
          <path
            d="M34,44 L42,44 L46,36 L50,52 L54,41 L58,46 L66,46"
            stroke="#F59E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Crossed Golden Mining Hammer/Pick Head */}
          <path
            d="M47,20 L53,20 L55,23 L45,23 Z"
            fill="#F59E0B"
          />

          {/* Life & Respiratory Protection Leaf / Droplet Accent */}
          <circle cx="50" cy="72" r="3.5" fill="#F59E0B" />
          <circle cx="50" cy="72" r="1.5" fill="#FFFFFF" />
        </svg>

        {/* Pulse beacon ring for real-time health indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-[#2A1810]"></span>
        </span>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white tracking-wide text-sm sm:text-base font-['Space_Grotesk']">
              MINEX <span className="text-amber-400">AI</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-900/70 text-purple-200 border border-purple-600/50">
              HEALTH & SAFETY
            </span>
          </div>
          <span className="text-[11px] text-amber-200/80 font-medium">
            Mining Intelligence & Life Protection
          </span>
        </div>
      )}
    </div>
  );
};
