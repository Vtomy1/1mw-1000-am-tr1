import React from 'react';
import { AudioEngineSettings, AudioFilterMode } from '../types/radio';
import { Radio, Sliders, Volume2, ShieldCheck, X } from 'lucide-react';

interface AudioSettingsModalProps {
  settings: AudioEngineSettings;
  onUpdateSettings: (settings: Partial<AudioEngineSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  settings,
  onUpdateSettings,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-stone-100">Audio Profile & Receiver Filter</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Filter Response Mode */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-400 font-mono-numbers">
              Receiver Bandwidth & Filter Characteristic
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'vintage' as AudioFilterMode,
                  title: 'Vintage Tube AM',
                  desc: '4.5 kHz steep lowpass with warm 1.8 kHz tube resonance.',
                },
                {
                  id: 'hifi' as AudioFilterMode,
                  title: 'Hi-Fi Wideband',
                  desc: '10 kHz wide audio response for clear voice & music streams.',
                },
                {
                  id: 'dx_skywave' as AudioFilterMode,
                  title: 'Night DX Skywave',
                  desc: 'Ionospheric fading simulation with atmospheric roll-off.',
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdateSettings({ filterMode: m.id })}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    settings.filterMode === m.id
                      ? 'bg-amber-950/40 border-amber-500 shadow-sm shadow-amber-500/10'
                      : 'bg-stone-950/50 border-stone-800 hover:border-stone-700 hover:bg-stone-800/40'
                  }`}
                >
                  <span className={`text-xs font-semibold ${settings.filterMode === m.id ? 'text-amber-300' : 'text-stone-200'}`}>
                    {m.title}
                  </span>
                  <span className="text-[11px] text-stone-400 mt-1 leading-snug">
                    {m.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Medium Wave Atmospheric Static Level */}
          <div className="space-y-2 p-4 bg-stone-950/40 border border-stone-800/80 rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-200">Atmospheric Static & Crackle</span>
              <span className="font-mono-numbers text-amber-400 font-semibold">
                {Math.round(settings.staticVolume * 100)}%
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Analog background pink-noise that naturally increases when you tune off-frequency.
            </p>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={settings.staticVolume}
              onChange={(e) => onUpdateSettings({ staticVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
            />
          </div>

          {/* Heterodyne Whine Toggle */}
          <div className="flex items-center justify-between p-4 bg-stone-950/40 border border-stone-800/80 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-stone-200">Heterodyne Beat Frequency</span>
              <p className="text-[11px] text-stone-400">
                Audible whistle as you approach an AM carrier until zero-beating on center.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ heterodyneEnabled: !settings.heterodyneEnabled })}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                settings.heterodyneEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-stone-800 text-stone-400 border-stone-700'
              }`}
            >
              {settings.heterodyneEnabled ? 'Enabled' : 'Bypassed'}
            </button>
          </div>

          {/* Band Channel Raster */}
          <div className="flex items-center justify-between p-4 bg-stone-950/40 border border-stone-800/80 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-xs font-medium text-stone-200">Channel Raster Standard</span>
              <p className="text-[11px] text-stone-400">
                10 kHz spacing in North & South America; 9 kHz spacing in Europe, Asia & Africa.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-lg border border-stone-800">
              <button
                onClick={() => onUpdateSettings({ raster: 10 })}
                className={`px-3 py-1 text-xs font-mono-numbers rounded-md transition-colors ${
                  settings.raster === 10
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                10 kHz
              </button>
              <button
                onClick={() => onUpdateSettings({ raster: 9 })}
                className={`px-3 py-1 text-xs font-mono-numbers rounded-md transition-colors ${
                  settings.raster === 9
                    ? 'bg-amber-500 text-stone-950 font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                9 kHz
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-stone-800 bg-stone-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
