import React from 'react';
import { AudioEngineSettings, AudioFilterMode } from '../types/radio';
import { Sliders, Radio, Activity, Volume2, Sparkles, HelpCircle } from 'lucide-react';

interface SoundProfileViewProps {
  settings: AudioEngineSettings;
  onUpdateSettings: (settings: Partial<AudioEngineSettings>) => void;
  isPowerOn: boolean;
}

export const SoundProfileView: React.FC<SoundProfileViewProps> = ({
  settings,
  onUpdateSettings,
  isPowerOn,
}) => {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* Intro Header */}
      <div className="p-6 bg-stone-900/90 border border-stone-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-100">Medium Wave Acoustic Profile</h2>
          <p className="text-xs text-stone-400 mt-1">
            Configure RF selectivity filters, atmospheric ionization simulation, and heterodyne beat parameters.
          </p>
        </div>
        <span className="text-xs font-mono-numbers text-stone-500">
          530 kHz – 1710 kHz IF Stage
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Filter Characteristics */}
        <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-2xl flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-stone-100">Receiver Bandwidth Presets</h3>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                id: 'vintage' as AudioFilterMode,
                name: 'Vintage Vacuum Tube (4.5 kHz)',
                desc: 'Authentic medium-wave AM timbre with steep low-pass filtering and subtle tube warmth.',
              },
              {
                id: 'hifi' as AudioFilterMode,
                name: 'Modern Broadcast Hi-Fi (10 kHz)',
                desc: 'Full-spectrum audio without high-frequency attenuation for pristine news and sports streaming.',
              },
              {
                id: 'dx_skywave' as AudioFilterMode,
                name: 'Night Skywave / DX Mode',
                desc: 'Simulates ionospheric bouncing with natural low-frequency signal fading and QSB fluctuation.',
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => onUpdateSettings({ filterMode: f.id })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  settings.filterMode === f.id
                    ? 'bg-amber-950/30 border-amber-500 shadow-sm shadow-amber-500/10'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${settings.filterMode === f.id ? 'text-amber-300' : 'text-stone-200'}`}>
                    {f.name}
                  </span>
                  {settings.filterMode === f.id && (
                    <span className="text-[10px] font-mono-numbers text-amber-400 uppercase">
                      Engaged
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                  {f.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Atmospheric & Physical Effects */}
        <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-2xl flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-stone-100">Atmospheric & RF Parameters</h3>
            </div>

            {/* Static Intensity Slider */}
            <div className="space-y-2 p-4 bg-stone-950/50 border border-stone-800/80 rounded-xl">
              <div className="flex items-center justify-between text-xs font-mono-numbers">
                <span className="text-stone-300">Atmospheric Static Volume</span>
                <span className="text-amber-400 font-bold">{Math.round(settings.staticVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={settings.staticVolume}
                onChange={(e) => onUpdateSettings({ staticVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
              />
              <p className="text-[10px] text-stone-500">
                Adjusts real-time bandpass-filtered noise. Automatically attenuated when a clear station carrier is locked.
              </p>
            </div>

            {/* Heterodyne Whine Toggle */}
            <div className="flex items-center justify-between p-4 bg-stone-950/50 border border-stone-800/80 rounded-xl">
              <div>
                <span className="text-xs font-medium text-stone-200 block">Heterodyne Beat Tone</span>
                <span className="text-[10px] text-stone-500">Whistle heard when tuning near an AM carrier.</span>
              </div>
              <button
                onClick={() => onUpdateSettings({ heterodyneEnabled: !settings.heterodyneEnabled })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  settings.heterodyneEnabled
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}
              >
                {settings.heterodyneEnabled ? 'Active' : 'Muted'}
              </button>
            </div>

            {/* AM Raster */}
            <div className="flex items-center justify-between p-4 bg-stone-950/50 border border-stone-800/80 rounded-xl">
              <div>
                <span className="text-xs font-medium text-stone-200 block">ITU Channel Raster</span>
                <span className="text-[10px] text-stone-500">Regional station frequency channel grid.</span>
              </div>
              <div className="flex items-center gap-1 bg-stone-900 p-1 rounded-lg border border-stone-800">
                <button
                  onClick={() => onUpdateSettings({ raster: 10 })}
                  className={`px-2.5 py-1 text-xs font-mono-numbers rounded-md ${
                    settings.raster === 10
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400'
                  }`}
                >
                  10 kHz (US)
                </button>
                <button
                  onClick={() => onUpdateSettings({ raster: 9 })}
                  className={`px-2.5 py-1 text-xs font-mono-numbers rounded-md ${
                    settings.raster === 9
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'text-stone-400'
                  }`}
                >
                  9 kHz (EU)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
