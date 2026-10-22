/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Station, PresetSlot, AudioEngineSettings, SignalStatus } from './types/radio';
import { DEFAULT_STATIONS, INITIAL_PRESETS } from './data/defaultStations';
import { AMAudioEngine } from './services/audioEngine';
import { detectUserLocation } from './services/radioApi';
import { TopBar } from './components/TopBar';
import { TunerConsole } from './components/TunerConsole';
import { StationDirectory } from './components/StationDirectory';
import { PresetsView } from './components/PresetsView';
import { SoundProfileView } from './components/SoundProfileView';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { AddStationModal } from './components/AddStationModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tuner' | 'directory' | 'presets' | 'profile'>('tuner');
  const [frequency, setFrequency] = useState<number>(1030); // Default tuned to WBZ 1030 AM
  const [stations, setStations] = useState<Station[]>(() => {
    try {
      const stored = localStorage.getItem('mw1000_custom_stations');
      if (stored) {
        const custom = JSON.parse(stored);
        return [...DEFAULT_STATIONS, ...custom];
      }
    } catch {
      // Fallback
    }
    return DEFAULT_STATIONS;
  });

  const [presets, setPresets] = useState<PresetSlot[]>(() => {
    try {
      const stored = localStorage.getItem('mw1000_presets');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return INITIAL_PRESETS;
  });

  const [settings, setSettings] = useState<AudioEngineSettings>({
    staticVolume: 0.22,
    heterodyneEnabled: true,
    filterMode: 'vintage',
    masterVolume: 0.85,
    raster: 10,
  });

  const [isPowerOn, setIsPowerOn] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [signal, setSignal] = useState<SignalStatus>({
    strength: 1.0,
    sUnits: 'S9 + 30dB',
    isLocked: true,
    frequencyOffset: 0,
    nearestStation: DEFAULT_STATIONS[0],
  });

  const [userLocation, setUserLocation] = useState<{ city: string; region: string; country: string } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Audio Engine singleton ref
  const engineRef = useRef<AMAudioEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    const engine = new AMAudioEngine();
    engineRef.current = engine;

    engine.registerSignalCallback((status) => {
      setSignal(status);
    });

    engine.setStations(stations);
    engine.setFrequency(frequency);
    engine.setSettings(settings);

    return () => {
      engine.destroy();
    };
  }, []);

  // Update engine when stations change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setStations(stations);
    }
  }, [stations]);

  // Handle frequency change
  const handleFrequencyChange = useCallback((newFreq: number) => {
    setFrequency(newFreq);
    if (engineRef.current) {
      engineRef.current.initAudioContext();
      engineRef.current.playClickSound();
      engineRef.current.setFrequency(newFreq);
    }
  }, []);

  // Handle power toggle
  const handleTogglePower = () => {
    const nextPower = !isPowerOn;
    setIsPowerOn(nextPower);
    if (engineRef.current) {
      engineRef.current.initAudioContext();
      engineRef.current.setPower(nextPower);
    }
  };

  // Handle play/pause
  const handleTogglePlay = () => {
    if (engineRef.current) {
      engineRef.current.initAudioContext();
      const state = engineRef.current.togglePlayPause();
      setIsPlaying(state);
    }
  };

  // Handle mute toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (engineRef.current) {
      engineRef.current.setMute(nextMuted);
    }
  };

  // Handle settings update
  const handleUpdateSettings = (newSettings: Partial<AudioEngineSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        engineRef.current.setSettings(updated);
      }
      return updated;
    });
  };

  // Seek up or down on dial
  const handleSeek = (direction: 'up' | 'down') => {
    if (!isPowerOn) return;
    const sorted = [...stations].sort((a, b) => a.frequency - b.frequency);
    if (sorted.length === 0) return;

    if (direction === 'up') {
      const next = sorted.find((s) => s.frequency > frequency + 2);
      if (next) {
        handleFrequencyChange(next.frequency);
      } else {
        // Wrap around to bottom
        handleFrequencyChange(sorted[0].frequency);
      }
    } else {
      const reversed = [...sorted].reverse();
      const prev = reversed.find((s) => s.frequency < frequency - 2);
      if (prev) {
        handleFrequencyChange(prev.frequency);
      } else {
        // Wrap around to top
        handleFrequencyChange(sorted[sorted.length - 1].frequency);
      }
    }
  };

  // Handle preset selection
  const handleSelectPreset = (preset: PresetSlot) => {
    handleFrequencyChange(preset.frequency);
  };

  // Handle saving to preset slot
  const handleSavePreset = (slot: number) => {
    const targetStation = signal.nearestStation || stations.find((s) => Math.abs(s.frequency - frequency) <= 2);
    const updated = presets.map((p) => {
      if (p.slot === slot) {
        return {
          ...p,
          frequency,
          stationId: targetStation ? targetStation.id : null,
          stationName: targetStation ? targetStation.name : `${frequency} kHz AM`,
          callSign: targetStation ? targetStation.callSign : `${frequency}`,
        };
      }
      return p;
    });
    setPresets(updated);
    try {
      localStorage.setItem('mw1000_presets', JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  // Set preset directly from station
  const handleSetPresetFromStation = (slot: number, station: Station) => {
    const updated = presets.map((p) => {
      if (p.slot === slot) {
        return {
          ...p,
          frequency: station.frequency,
          stationId: station.id,
          stationName: station.name,
          callSign: station.callSign,
        };
      }
      return p;
    });
    setPresets(updated);
    try {
      localStorage.setItem('mw1000_presets', JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  // Clear preset
  const handleClearPreset = (slot: number) => {
    const updated = presets.map((p) => {
      if (p.slot === slot) {
        return {
          ...p,
          frequency: 1000,
          stationId: null,
          stationName: 'Empty Slot',
          callSign: 'EMPTY',
        };
      }
      return p;
    });
    setPresets(updated);
    try {
      localStorage.setItem('mw1000_presets', JSON.stringify(updated));
    } catch {
      // Ignored
    }
  };

  // Tune to station from directory
  const handleTuneStation = (station: Station) => {
    setActiveTab('tuner');
    handleFrequencyChange(station.frequency);
  };

  // Add custom station
  const handleAddCustomStation = (newStation: Station) => {
    setStations((prev) => {
      const updated = [newStation, ...prev];
      try {
        const customOnly = updated.filter((s) => s.isCustom);
        localStorage.setItem('mw1000_custom_stations', JSON.stringify(customOnly));
      } catch {
        // Ignored
      }
      return updated;
    });
    handleTuneStation(newStation);
  };

  // Detect location
  const handleDetectLocation = async () => {
    setIsLocating(true);
    const loc = await detectUserLocation();
    setIsLocating(false);
    if (loc) {
      setUserLocation(loc);
    }
  };

  // Auto detect location on initial load
  useEffect(() => {
    detectUserLocation().then((loc) => {
      if (loc) setUserLocation(loc);
    });
  }, []);

  // Global user interaction to unlock Web Audio context
  useEffect(() => {
    const handleFirstGesture = () => {
      if (engineRef.current) {
        engineRef.current.initAudioContext();
      }
      window.removeEventListener('pointerdown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture);
    return () => window.removeEventListener('pointerdown', handleFirstGesture);
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar with 3-Zone Contract */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPowerOn={isPowerOn}
        onTogglePower={handleTogglePower}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'tuner' && (
          <TunerConsole
            frequency={frequency}
            onFrequencyChange={handleFrequencyChange}
            signal={signal}
            currentStation={signal.nearestStation}
            stations={stations}
            presets={presets}
            onSelectPreset={handleSelectPreset}
            onSavePreset={handleSavePreset}
            isPowerOn={isPowerOn}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            analyser={engineRef.current?.getAnalyser() || null}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onSeek={handleSeek}
          />
        )}

        {activeTab === 'directory' && (
          <StationDirectory
            stations={stations}
            currentFrequency={frequency}
            onTuneStation={handleTuneStation}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            isPowerOn={isPowerOn}
            userLocation={userLocation}
            onDetectLocation={handleDetectLocation}
            isLocating={isLocating}
          />
        )}

        {activeTab === 'presets' && (
          <PresetsView
            presets={presets}
            stations={stations}
            currentFrequency={frequency}
            onSelectPreset={handleSelectPreset}
            onClearPreset={handleClearPreset}
            onSetPresetFromStation={handleSetPresetFromStation}
            isPowerOn={isPowerOn}
          />
        )}

        {activeTab === 'profile' && (
          <SoundProfileView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            isPowerOn={isPowerOn}
          />
        )}
      </main>

      {/* Minimalist Footnote (No ornamental status tickers) */}
      <footer className="border-t border-stone-800/60 py-6 px-6 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>MW-1000 Solid State Tuner</span>
            <span aria-hidden="true">·</span>
            <span>Medium Wave 530–1710 kHz</span>
          </div>
          <div className="flex items-center gap-4 text-stone-400">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Receiver Settings
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="hover:text-amber-400 transition-colors"
            >
              Add Custom Station
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AudioSettingsModal
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <AddStationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddStation={handleAddCustomStation}
        defaultFrequency={frequency}
      />
    </div>
  );
}
