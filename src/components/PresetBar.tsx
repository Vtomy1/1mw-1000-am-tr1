import React, { useState } from 'react';
import { PresetSlot, Station } from '../types/radio';
import { BookmarkPlus, Check } from 'lucide-react';

interface PresetBarProps {
  presets: PresetSlot[];
  onSelectPreset: (preset: PresetSlot) => void;
  onSavePreset: (slot: number) => void;
  currentFrequency: number;
  currentStation: Station | null;
  isPowerOn: boolean;
}

export const PresetBar: React.FC<PresetBarProps> = ({
  presets,
  onSelectPreset,
  onSavePreset,
  currentFrequency,
  currentStation,
  isPowerOn,
}) => {
  const [storeMode, setStoreMode] = useState(false);
  const [savedSlot, setSavedSlot] = useState<number | null>(null);

  const handleSlotClick = (slotNum: number) => {
    if (!isPowerOn) return;
    if (storeMode) {
      onSavePreset(slotNum);
      setSavedSlot(slotNum);
      setStoreMode(false);
      setTimeout(() => setSavedSlot(null), 1800);
    } else {
      const found = presets.find((p) => p.slot === slotNum);
      if (found) {
        onSelectPreset(found);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 p-4 bg-stone-900/60 border border-stone-800 rounded-xl">
      <div className="flex items-center justify-between text-xs text-stone-400 font-mono-numbers">
        <span className="uppercase tracking-wider">Fast Presets (P1 – P6)</span>
        <button
          onClick={() => isPowerOn && setStoreMode(!storeMode)}
          disabled={!isPowerOn}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] transition-colors border ${
            storeMode
              ? 'bg-amber-500 text-stone-950 font-semibold border-amber-400'
              : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:text-stone-100 hover:border-stone-600'
          } disabled:opacity-40`}
        >
          {storeMode ? (
            <>
              <Check className="w-3 h-3" />
              <span>Select Slot to Store {currentFrequency} kHz</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="w-3 h-3 text-amber-400" />
              <span>Save Current to Slot</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Physical Push Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {presets.map((preset) => {
          const isCurrent = Math.abs(currentFrequency - preset.frequency) <= 2;
          const wasJustSaved = savedSlot === preset.slot;

          return (
            <button
              key={preset.slot}
              onClick={() => handleSlotClick(preset.slot)}
              disabled={!isPowerOn}
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all text-left group ${
                wasJustSaved
                  ? 'border-emerald-500 bg-emerald-950/40'
                  : isCurrent && isPowerOn
                  ? 'border-amber-500 bg-amber-950/30 shadow-sm shadow-amber-500/20'
                  : storeMode
                  ? 'border-dashed border-amber-400/60 hover:border-amber-400 bg-stone-800/60'
                  : 'border-stone-800 bg-stone-900/80 hover:bg-stone-800 hover:border-stone-700'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {/* Slot Number Label */}
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-mono-numbers text-stone-500 font-bold group-hover:text-stone-300">
                  [{preset.slot}]
                </span>
                <span
                  className={`text-[9px] font-mono-numbers px-1 rounded ${
                    isCurrent && isPowerOn ? 'text-amber-300 font-bold' : 'text-stone-400'
                  }`}
                >
                  {preset.frequency} kHz
                </span>
              </div>

              {/* Station Name / Call Sign */}
              <div className="w-full text-xs font-semibold text-stone-200 truncate group-hover:text-amber-300">
                {preset.callSign || preset.stationName || `Slot ${preset.slot}`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
