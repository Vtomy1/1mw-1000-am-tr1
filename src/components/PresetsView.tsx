import React from 'react';
import { PresetSlot, Station } from '../types/radio';
import { Play, BookmarkCheck, Trash2, Radio } from 'lucide-react';

interface PresetsViewProps {
  presets: PresetSlot[];
  stations: Station[];
  currentFrequency: number;
  onSelectPreset: (preset: PresetSlot) => void;
  onClearPreset: (slot: number) => void;
  onSetPresetFromStation: (slot: number, station: Station) => void;
  isPowerOn: boolean;
}

export const PresetsView: React.FC<PresetsViewProps> = ({
  presets,
  stations,
  currentFrequency,
  onSelectPreset,
  onClearPreset,
  onSetPresetFromStation,
  isPowerOn,
}) => {
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="p-6 bg-stone-900/90 border border-stone-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-100">Receiver Fast Presets</h2>
          <p className="text-xs text-stone-400 mt-1">
            Program your favorite local or regional stations to physical pushbuttons P1 through P6.
          </p>
        </div>
        <span className="text-xs font-mono-numbers text-stone-500">
          6 Dedicated Hardware Registers
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => {
          const isTuned = Math.abs(currentFrequency - preset.frequency) <= 2;
          const assignedStation = stations.find((s) => s.id === preset.stationId || Math.abs(s.frequency - preset.frequency) <= 2);

          return (
            <div
              key={preset.slot}
              className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                isTuned && isPowerOn
                  ? 'bg-amber-950/20 border-amber-500/80 shadow-md shadow-amber-500/10'
                  : 'bg-stone-900/80 border-stone-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center text-xs font-mono-numbers font-bold text-amber-400">
                    P{preset.slot}
                  </span>
                  <div>
                    <span className="text-base font-bold text-stone-100">
                      {preset.callSign || `Preset ${preset.slot}`}
                    </span>
                    <p className="text-xs text-stone-400">
                      {preset.stationName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold font-mono-numbers text-amber-400">
                    {preset.frequency}
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono-numbers block uppercase">
                    kHz AM
                  </span>
                </div>
              </div>

              {assignedStation && (
                <div className="text-xs text-stone-400">
                  <span>{assignedStation.city}, {assignedStation.region}</span>
                  <span aria-hidden="true" className="mx-1.5">·</span>
                  <span>{assignedStation.format}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-stone-800">
                <select
                  aria-label={`Assign station to preset ${preset.slot}`}
                  onChange={(e) => {
                    const st = stations.find((s) => s.id === e.target.value);
                    if (st) {
                      onSetPresetFromStation(preset.slot, st);
                    }
                  }}
                  value={assignedStation?.id || ''}
                  className="text-xs bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-stone-300 max-w-[150px] truncate focus:outline-none focus:border-amber-500"
                >
                  <option value="">Reassign Station...</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.frequency} kHz - {s.callSign}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => onSelectPreset(preset)}
                  disabled={!isPowerOn}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isTuned && isPowerOn
                      ? 'bg-amber-400 text-stone-950 shadow-sm'
                      : 'bg-stone-800 text-stone-300 hover:bg-amber-400 hover:text-stone-950'
                  } disabled:opacity-40`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isTuned && isPowerOn ? 'Active' : 'Tune'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
