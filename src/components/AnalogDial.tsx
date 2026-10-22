import React, { useRef, useState, useEffect } from 'react';
import { Station } from '../types/radio';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface AnalogDialProps {
  frequency: number;
  onFrequencyChange: (freq: number) => void;
  stations: Station[];
  isPowerOn: boolean;
  onSeek: (direction: 'up' | 'down') => void;
  raster: number;
}

export const AnalogDial: React.FC<AnalogDialProps> = ({
  frequency,
  onFrequencyChange,
  stations,
  isPowerOn,
  onSeek,
  raster,
}) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const minFreq = 530;
  const maxFreq = 1710;
  const range = maxFreq - minFreq;

  // Percentage position of current frequency (0% to 100%)
  const needlePercent = Math.max(0, Math.min(100, ((frequency - minFreq) / range) * 100));

  // Major frequency markings
  const majorMarks = [540, 600, 700, 800, 900, 1000, 1200, 1400, 1600, 1710];

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPowerOn) return;
    setIsDragging(true);
    updateFreqFromClientX(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !isPowerOn) return;
    updateFreqFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const updateFreqFromClientX = (clientX: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawFreq = minFreq + ratio * range;
    // Snap to nearest 1 kHz (or raster step)
    const snapped = Math.round(rawFreq);
    onFrequencyChange(snapped);
  };

  // Keyboard navigation for precision tuning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPowerOn) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onFrequencyChange(Math.max(minFreq, frequency - (e.shiftKey ? 10 : 1)));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onFrequencyChange(Math.min(maxFreq, frequency + (e.shiftKey ? 10 : 1)));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frequency, isPowerOn, onFrequencyChange]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* The Illuminated Glass Dial Housing */}
      <div
        ref={dialRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative w-full h-32 select-none cursor-ew-resize rounded-2xl border transition-all duration-300 overflow-hidden ${
          isPowerOn
            ? 'bg-stone-900 border-amber-900/40 amber-glow'
            : 'bg-stone-950 border-stone-800/80 opacity-60'
        }`}
      >
        {/* Warm incandescent ambient wash */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
            isPowerOn ? 'opacity-90' : 'opacity-0'
          }`}
          style={{
            background:
              'radial-gradient(circle at 50% 120%, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.05) 50%, rgba(0, 0, 0, 0.5) 100%)',
          }}
        />

        {/* Top Header inside dial: Band & Medium Wave Scale */}
        <div className="absolute top-3 inset-x-6 flex items-center justify-between text-xs text-stone-500 font-mono-numbers pointer-events-none z-10">
          <span className="tracking-widest uppercase text-stone-400">AM / Medium Wave Band</span>
          <span className="text-amber-500/80 font-medium tracking-wider">kHz × 10</span>
        </div>

        {/* Station Markers (Amber Pips along scale) */}
        <div className="absolute inset-x-8 top-11 h-2 pointer-events-none z-10">
          {stations.map((st) => {
            const pos = ((st.frequency - minFreq) / range) * 100;
            const isCurrent = Math.abs(st.frequency - frequency) <= 2;
            return (
              <div
                key={st.id}
                style={{ left: `${pos}%` }}
                className={`absolute top-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  isCurrent && isPowerOn
                    ? 'bg-amber-400 shadow-md shadow-amber-400 scale-125'
                    : 'bg-stone-600/70 hover:bg-stone-400'
                }`}
                title={`${st.callSign} (${st.frequency} kHz)`}
              />
            );
          })}
        </div>

        {/* Dial Scale Tick Lines & Major Frequency Numbers */}
        <div className="absolute inset-x-8 top-16 bottom-3 pointer-events-none z-10 flex flex-col justify-between">
          {/* Major and minor ticks */}
          <div className="relative w-full h-5">
            {/* 10 kHz ticks (rendered in steps across the range) */}
            {Array.from({ length: 60 }).map((_, i) => {
              const freqVal = minFreq + (i * range) / 59;
              const pos = (i / 59) * 100;
              const isMajor = majorMarks.some((m) => Math.abs(m - freqVal) < 12);
              return (
                <div
                  key={i}
                  style={{ left: `${pos}%` }}
                  className={`absolute top-0 -translate-x-1/2 ${
                    isMajor
                      ? 'w-[1.5px] h-4 bg-amber-400/80'
                      : i % 2 === 0
                      ? 'w-[1px] h-2.5 bg-stone-600/80'
                      : 'w-[1px] h-1.5 bg-stone-700/60'
                  }`}
                />
              );
            })}
          </div>

          {/* Numbers row */}
          <div className="relative w-full h-5 text-stone-400 font-mono-numbers text-[11px] sm:text-xs">
            {majorMarks.map((freqVal) => {
              const pos = ((freqVal - minFreq) / range) * 100;
              const isNear = Math.abs(frequency - freqVal) <= 15;
              return (
                <div
                  key={freqVal}
                  style={{ left: `${pos}%` }}
                  className={`absolute bottom-0 -translate-x-1/2 transition-colors ${
                    isNear && isPowerOn ? 'text-amber-400 font-bold' : 'text-stone-500'
                  }`}
                >
                  {freqVal >= 1000 ? freqVal : ` ${freqVal}`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Illuminated Red/Amber Sliding Needle */}
        <div
          style={{ left: `calc(2rem + (100% - 4rem) * ${needlePercent / 100})` }}
          className={`absolute top-2 bottom-2 -translate-x-1/2 w-0.5 pointer-events-none transition-transform z-20 ${
            isPowerOn ? 'bg-amber-400 amber-needle' : 'bg-stone-700'
          }`}
        >
          {/* Top needle head pin */}
          <div className="absolute top-0 -translate-x-1/2 left-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-md shadow-amber-400/80" />
          {/* Bottom needle guide */}
          <div className="absolute bottom-0 -translate-x-1/2 left-1/2 w-2 h-1 bg-amber-500" />
        </div>

        {/* Glass reflection overlay */}
        <div className="absolute inset-0 pointer-events-none tuner-dial-glass" />
      </div>

      {/* Manual Tuning Controls & Step Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Left Step Buttons: Coarse & Fine Down */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek('down')}
            disabled={!isPowerOn}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono-numbers bg-stone-900 border border-stone-800 rounded-lg text-stone-300 hover:text-stone-100 hover:border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Scan to previous station"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
            <span>Seek ◄</span>
          </button>
          <button
            onClick={() => onFrequencyChange(Math.max(minFreq, frequency - 10))}
            disabled={!isPowerOn}
            className="px-2.5 py-1.5 text-xs font-mono-numbers bg-stone-900 border border-stone-800 rounded-lg text-stone-400 hover:text-stone-200 hover:border-stone-700 disabled:opacity-40 transition-colors"
            title="Step down 10 kHz"
          >
            -10
          </button>
          <button
            onClick={() => onFrequencyChange(Math.max(minFreq, frequency - 1))}
            disabled={!isPowerOn}
            className="px-2.5 py-1.5 text-xs font-mono-numbers bg-stone-900 border border-stone-800 rounded-lg text-stone-400 hover:text-stone-200 hover:border-stone-700 disabled:opacity-40 transition-colors"
            title="Fine step down 1 kHz"
          >
            -1
          </button>
        </div>

        {/* Center Hint */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
          <span>Drag dial or use</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono-numbers bg-stone-800 rounded border border-stone-700 text-stone-300">
            ←
          </kbd>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono-numbers bg-stone-800 rounded border border-stone-700 text-stone-300">
            →
          </kbd>
          <span>keys</span>
        </div>

        {/* Right Step Buttons: Coarse & Fine Up */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onFrequencyChange(Math.min(maxFreq, frequency + 1))}
            disabled={!isPowerOn}
            className="px-2.5 py-1.5 text-xs font-mono-numbers bg-stone-900 border border-stone-800 rounded-lg text-stone-400 hover:text-stone-200 hover:border-stone-700 disabled:opacity-40 transition-colors"
            title="Fine step up 1 kHz"
          >
            +1
          </button>
          <button
            onClick={() => onFrequencyChange(Math.min(maxFreq, frequency + 10))}
            disabled={!isPowerOn}
            className="px-2.5 py-1.5 text-xs font-mono-numbers bg-stone-900 border border-stone-800 rounded-lg text-stone-400 hover:text-stone-200 hover:border-stone-700 disabled:opacity-40 transition-colors"
            title="Step up 10 kHz"
          >
            +10
          </button>
          <button
            onClick={() => onSeek('up')}
            disabled={!isPowerOn}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono-numbers bg-stone-900 border border-stone-800 rounded-lg text-stone-300 hover:text-stone-100 hover:border-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Scan to next station"
          >
            <span>► Seek</span>
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
