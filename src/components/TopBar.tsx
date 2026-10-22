import React from 'react';
import { Power } from 'lucide-react';

interface TopBarProps {
  activeTab: 'tuner' | 'directory' | 'presets' | 'profile';
  setActiveTab: (tab: 'tuner' | 'directory' | 'presets' | 'profile') => void;
  isPowerOn: boolean;
  onTogglePower: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  isPowerOn,
  onTogglePower,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-stone-800 bg-stone-950/95 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#tuner"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('tuner');
          }}
          className="text-lg font-bold tracking-wider text-stone-100 whitespace-nowrap shrink-0 hover:text-amber-400 transition-colors"
        >
          MW-1000 AM TUNER
        </a>
        <span className="hidden sm:inline text-xs text-stone-500 font-mono-numbers">
          530–1710 kHz
        </span>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-400">
        <button
          onClick={() => setActiveTab('tuner')}
          className={`hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'tuner' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Tuner Console
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'directory' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Local Stations
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'presets' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Quick Presets
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`hover:text-stone-100 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'profile' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Sound Profile
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onTogglePower}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 border ${
            isPowerOn
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20 shadow-sm shadow-amber-500/10'
              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200 hover:border-stone-700'
          }`}
          title="Toggle Receiver Power"
        >
          <Power className={`w-3.5 h-3.5 ${isPowerOn ? 'text-amber-400' : 'text-stone-500'}`} />
          <span>{isPowerOn ? 'Receiver Active' : 'Standby'}</span>
        </button>
      </div>
    </header>
  );
};
