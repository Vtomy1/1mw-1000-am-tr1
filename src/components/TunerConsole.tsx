import React, { useRef, useState, useEffect } from 'react';
import { AudioEngineSettings, PresetSlot, SignalStatus, Station } from '../types/radio';
import { SMeter } from './SMeter';
import { SignalHistoryChart } from './SignalHistoryChart';
import { Oscilloscope } from './Oscilloscope';
import { AnalogDial } from './AnalogDial';
import { PresetBar } from './PresetBar';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCw,
  Sliders,
  Radio,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface TunerConsoleProps {
  frequency: number;
  onFrequencyChange: (freq: number) => void;
  signal: SignalStatus;
  currentStation: Station | null;
  stations: Station[];
  presets: PresetSlot[];
  onSelectPreset: (preset: PresetSlot) => void;
  onSavePreset: (slot: number) => void;
  isPowerOn: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  settings: AudioEngineSettings;
  onUpdateSettings: (settings: Partial<AudioEngineSettings>) => void;
  analyser: AnalyserNode | null;
  onOpenSettings: () => void;
  onSeek: (direction: 'up' | 'down') => void;
  isScanning?: boolean;
  onToggleScan?: () => void;
  scanCountdown?: number;
}

export const TunerConsole: React.FC<TunerConsoleProps> = ({
  frequency,
  onFrequencyChange,
  signal,
  currentStation,
  stations,
  presets,
  onSelectPreset,
  onSavePreset,
  isPowerOn,
  isPlaying,
  onTogglePlay,
  isMuted,
  onToggleMute,
  settings,
  onUpdateSettings,
  analyser,
  onOpenSettings,
  onSeek,
  isScanning = false,
  onToggleScan,
  scanCountdown = 3.0,
}) => {
  const [knobRotation, setKnobRotation] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);
  const isKnobDragging = useRef(false);
  const lastKnobY = useRef(0);

  // Synchronize knob visual rotation with frequency
  useEffect(() => {
    setKnobRotation((frequency * 8) % 360);
  }, [frequency]);

  const handleKnobPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPowerOn) return;
    isKnobDragging.current = true;
    lastKnobY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleKnobPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isKnobDragging.current || !isPowerOn) return;
    const deltaY = lastKnobY.current - e.clientY;
    if (Math.abs(deltaY) >= 4) {
      const step = deltaY > 0 ? 1 : -1;
      const multiplier = e.shiftKey ? 10 : 1;
      onFrequencyChange(Math.max(530, Math.min(1710, frequency + step * multiplier)));
      lastKnobY.current = e.clientY;
    }
  };

  const handleKnobPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isKnobDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Upper Chassis: Minimalist Industrial Enclosure */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-8 flex flex-col gap-8 shadow-xl">
        {/* Top Section: Digital Frequency readout & Station Information */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-stone-800/80">
          {/* Large Digital Frequency Readout */}
          <div className="flex items-baseline gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-mono-numbers uppercase tracking-widest text-stone-500">
                Tuned Frequency
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-bold font-mono-numbers tracking-tight text-amber-400">
                  {frequency}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-stone-400 font-mono-numbers">
                  kHz
                </span>
                <span className="text-sm font-semibold text-stone-500 ml-1">
                  AM
                </span>
              </div>
            </div>

            {/* Carrier Lock Lamp */}
            <div className="hidden sm:flex flex-col items-center justify-center pl-4 border-l border-stone-800 h-14">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  signal.isLocked && isPowerOn
                    ? 'bg-amber-400 shadow-md shadow-amber-400'
                    : 'bg-stone-800'
                }`}
              />
              <span className="text-[9px] font-mono-numbers text-stone-400 mt-1 uppercase">
                {signal.isLocked && isPowerOn ? 'Locked' : 'Off-Lock'}
              </span>
            </div>
          </div>

          {/* Current Station Metadata / Status */}
          <div className="flex-1 max-w-lg lg:text-right flex flex-col lg:items-end justify-center">
            {isScanning && (
              <div className="flex items-center gap-1.5 mb-1.5 text-xs font-mono-numbers text-amber-400 lg:justify-end">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-semibold uppercase tracking-wider">
                  Auto-Scanning S9+ Carriers · Next in {scanCountdown.toFixed(1)}s
                </span>
              </div>
            )}
            {currentStation && signal.isLocked ? (
              <>
                <div className="text-lg font-bold text-stone-100 flex items-center gap-2 lg:justify-end">
                  <span>{currentStation.name}</span>
                  {currentStation.homepage && (
                    <a
                      href={currentStation.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-400 hover:text-amber-400 transition-colors"
                      title="Station Homepage"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                {/* Unboxed metadata with typographic separators */}
                <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
                  <span>{currentStation.city}, {currentStation.region}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentStation.format}</span>
                  {currentStation.powerKw && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{currentStation.powerKw} kW Clear Channel</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-medium text-stone-400 italic">
                  Medium Wave Atmospheric Static
                </div>
                <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                  <span>No carrier locked</span>
                  <span aria-hidden="true">·</span>
                  <span>{signal.nearestStation ? `Nearest: ${signal.nearestStation.callSign} at ${signal.nearestStation.frequency} kHz` : 'Search dial for local broadcast'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mid Section: Telemetry Instrumentation (S-Meter, Signal Drift Chart, RF Scope) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center justify-items-center">
          <SMeter signal={signal} isPowerOn={isPowerOn} />
          <SignalHistoryChart signal={signal} isPowerOn={isPowerOn} />
          <Oscilloscope analyser={analyser} isPowerOn={isPowerOn} isLocked={signal.isLocked} />
        </div>

        {/* Centerpiece: The Illuminated Analog Slide Tuning Dial */}
        <AnalogDial
          frequency={frequency}
          onFrequencyChange={onFrequencyChange}
          stations={stations}
          isPowerOn={isPowerOn}
          onSeek={onSeek}
          raster={settings.raster}
          isScanning={isScanning}
          onToggleScan={onToggleScan}
          scanCountdown={scanCountdown}
        />

        {/* Lower Console: Physical Rotary Tuning Knob & Volume/Noise Strips */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-stone-800/80 items-center">
          {/* Left: Volume & Mute Controls */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-stone-400 font-mono-numbers">
              <span className="uppercase tracking-wider">AF Gain / Volume</span>
              <span>{isMuted ? 'Muted' : `${Math.round(settings.masterVolume * 100)}%`}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onToggleMute}
                disabled={!isPowerOn}
                className="p-2 rounded-lg bg-stone-950 border border-stone-800 text-stone-400 hover:text-stone-100 disabled:opacity-40 transition-colors"
                title="Mute / Unmute"
              >
                {isMuted || settings.masterVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                disabled={!isPowerOn}
                value={isMuted ? 0 : settings.masterVolume}
                onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
                className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-stone-950 rounded-lg disabled:opacity-40"
              />
            </div>
          </div>

          {/* Center: Tactile Precision Rotary Knob */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <span className="text-[10px] font-mono-numbers uppercase tracking-widest text-stone-500">
              Rotary Tuning Dial
            </span>
            <div
              ref={knobRef}
              onPointerDown={handleKnobPointerDown}
              onPointerMove={handleKnobPointerMove}
              onPointerUp={handleKnobPointerUp}
              className={`relative w-20 h-20 rounded-full bg-stone-950 border-2 transition-colors select-none cursor-ns-resize shadow-md flex items-center justify-center ${
                isPowerOn
                  ? 'border-stone-700 hover:border-amber-500/80'
                  : 'border-stone-800 opacity-50'
              }`}
              title="Drag up/down to rotate tuning dial"
            >
              {/* Concentric knurled aluminum ridges */}
              <div className="absolute inset-2 rounded-full border border-stone-800 bg-stone-900/90" />
              <div className="absolute inset-4 rounded-full border border-stone-800/80 bg-stone-950" />
              
              {/* Rotating index indicator notch */}
              <div
                style={{ transform: `rotate(${knobRotation}deg)` }}
                className="absolute inset-0 flex items-start justify-center pointer-events-none"
              >
                <div className="w-1.5 h-3.5 bg-amber-400 rounded-full mt-1 shadow-sm shadow-amber-400" />
              </div>

              {/* Center Cap */}
              <div className="w-4 h-4 rounded-full bg-stone-800 border border-stone-700" />
            </div>
            <span className="text-[9px] text-stone-500 font-mono-numbers">
              Drag Up / Down
            </span>
          </div>

          {/* Right: Static Crackle & Filter Mode Strip */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-stone-400 font-mono-numbers">
              <span className="uppercase tracking-wider">Atmospheric Static</span>
              <button
                onClick={onOpenSettings}
                className="text-[11px] text-amber-400/90 hover:underline flex items-center gap-1"
              >
                <span>Filter: {settings.filterMode}</span>
                <Sliders className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                disabled={!isPowerOn}
                value={settings.staticVolume}
                onChange={(e) => onUpdateSettings({ staticVolume: parseFloat(e.target.value) })}
                className="flex-1 accent-amber-500 cursor-pointer h-1.5 bg-stone-950 rounded-lg disabled:opacity-40"
              />
              <span className="text-xs font-mono-numbers text-stone-400 w-10 text-right">
                {Math.round(settings.staticVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Bank (P1 - P6) */}
      <PresetBar
        presets={presets}
        onSelectPreset={onSelectPreset}
        onSavePreset={onSavePreset}
        currentFrequency={frequency}
        currentStation={currentStation}
        isPowerOn={isPowerOn}
      />
    </div>
  );
};
