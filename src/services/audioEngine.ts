import { AudioEngineSettings, AudioFilterMode, SignalStatus, Station } from '../types/radio';

export class AMAudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement;
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private stationGain: GainNode | null = null;
  private staticGain: GainNode | null = null;
  private heterodyneGain: GainNode | null = null;
  private heterodyneOsc: OscillatorNode | null = null;
  private stationFilter: BiquadFilterNode | null = null;
  private skywaveLfo: OscillatorNode | null = null;
  private skywaveLfoGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Dedicated White-Noise & Atmospheric Static generator nodes
  private whiteNoiseNode: AudioBufferSourceNode | null = null;
  private crackleNoiseNode: AudioBufferSourceNode | null = null;
  private whiteNoiseGain: GainNode | null = null;
  private crackleNoiseGain: GainNode | null = null;
  private staticFilter: BiquadFilterNode | null = null;
  private isStaticRunning = false;
  private isConnectedToWebAudio = false;

  private currentStation: Station | null = null;
  private currentFrequency: number = 1030;
  private allStations: Station[] = [];
  private isMuted: boolean = false;
  private isPowerOn: boolean = true;
  private settings: AudioEngineSettings = {
    staticVolume: 0.25,
    heterodyneEnabled: true,
    filterMode: 'vintage',
    masterVolume: 0.85,
    raster: 10,
  };

  private onSignalUpdate?: (status: SignalStatus) => void;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'none';
  }

  public initAudioContext() {
    if (this.audioCtx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioCtx = new AudioContextClass();
    
    // Master Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.audioCtx.currentTime);

    // Analyser for oscilloscope
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    // Station Channel
    this.stationGain = this.audioCtx.createGain();
    this.stationFilter = this.audioCtx.createBiquadFilter();
    this.applyFilterMode(this.settings.filterMode);

    // Skywave LFO for fading simulation
    this.skywaveLfo = this.audioCtx.createOscillator();
    this.skywaveLfo.frequency.setValueAtTime(0.12, this.audioCtx.currentTime); // ~8 sec period
    this.skywaveLfoGain = this.audioCtx.createGain();
    this.skywaveLfoGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.skywaveLfo.connect(this.skywaveLfoGain);
    this.skywaveLfoGain.connect(this.stationGain.gain);
    try {
      this.skywaveLfo.start();
    } catch {
      // Ignored if already started
    }

    this.stationFilter.connect(this.stationGain);
    this.stationGain.connect(this.masterGain);

    // Heterodyne Whine Oscillator
    this.heterodyneOsc = this.audioCtx.createOscillator();
    this.heterodyneOsc.type = 'sine';
    this.heterodyneGain = this.audioCtx.createGain();
    this.heterodyneGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.heterodyneOsc.connect(this.heterodyneGain);
    this.heterodyneGain.connect(this.masterGain);
    try {
      this.heterodyneOsc.start();
    } catch {
      // Ignored
    }

    // Static Noise Channel
    this.staticGain = this.audioCtx.createGain();
    this.staticGain.gain.setValueAtTime(this.settings.staticVolume, this.audioCtx.currentTime);
    this.staticGain.connect(this.masterGain);

    this.startNoiseSynthesizer();
    this.connectMediaElement();
  }

  private connectMediaElement() {
    if (!this.audioCtx || this.isConnectedToWebAudio) return;
    try {
      this.mediaSourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
      if (this.stationFilter) {
        this.mediaSourceNode.connect(this.stationFilter);
      }
      this.isConnectedToWebAudio = true;
    } catch {
      // Media element already connected or CORS policy restriction
      this.isConnectedToWebAudio = false;
    }
  }

  private startNoiseSynthesizer() {
    if (!this.audioCtx || this.isStaticRunning) return;

    const sampleRate = this.audioCtx.sampleRate;
    const duration = 5; // 5-second seamless loop buffer
    const bufferSize = sampleRate * duration;

    // 1. Pure Gaussian White-Noise Generator (Johnson-Nyquist RF thermal noise)
    const whiteBuffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const whiteData = whiteBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 2) {
      // Box-Muller transform for true Gaussian white noise
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      const radius = Math.sqrt(-2.0 * Math.log(u1));
      const theta = 2.0 * Math.PI * u2;
      whiteData[i] = radius * Math.cos(theta) * 0.12;
      if (i + 1 < bufferSize) {
        whiteData[i + 1] = radius * Math.sin(theta) * 0.12;
      }
    }

    this.whiteNoiseNode = this.audioCtx.createBufferSource();
    this.whiteNoiseNode.buffer = whiteBuffer;
    this.whiteNoiseNode.loop = true;

    this.whiteNoiseGain = this.audioCtx.createGain();
    this.whiteNoiseGain.gain.setValueAtTime(0.65, this.audioCtx.currentTime);

    // 2. Medium-Wave Atmospheric Crackle / Spherics (Lightning & Ionospheric discharge)
    const crackleBuffer = this.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const crackleData = crackleBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;

      // Occasional faint atmospheric crackle bursts
      if (Math.random() < 0.0007) {
        pink += (Math.random() * 2 - 1) * 3.4;
      }
      crackleData[i] = pink * 0.065;
    }

    this.crackleNoiseNode = this.audioCtx.createBufferSource();
    this.crackleNoiseNode.buffer = crackleBuffer;
    this.crackleNoiseNode.loop = true;

    this.crackleNoiseGain = this.audioCtx.createGain();
    this.crackleNoiseGain.gain.setValueAtTime(0.35, this.audioCtx.currentTime);

    // 3. Medium-Wave IF Bandpass Filter (Simulates 455 kHz receiver IF bandpass)
    this.staticFilter = this.audioCtx.createBiquadFilter();
    this.staticFilter.type = 'bandpass';
    this.staticFilter.frequency.setValueAtTime(1600, this.audioCtx.currentTime);
    this.staticFilter.Q.setValueAtTime(0.85, this.audioCtx.currentTime);

    // Connect noise sources to filter and staticGain
    this.whiteNoiseNode.connect(this.whiteNoiseGain);
    this.whiteNoiseGain.connect(this.staticFilter);

    this.crackleNoiseNode.connect(this.crackleNoiseGain);
    this.crackleNoiseGain.connect(this.staticFilter);

    if (this.staticGain) {
      this.staticFilter.connect(this.staticGain);
    }

    try {
      this.whiteNoiseNode.start();
      this.crackleNoiseNode.start();
      this.isStaticRunning = true;
    } catch {
      // Ignored if audio context is restarting
    }
  }

  public setStations(stations: Station[]) {
    this.allStations = stations;
    this.evaluateSignal();
  }

  public async setFrequency(freq: number) {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    this.currentFrequency = Math.max(530, Math.min(1710, Math.round(freq)));
    this.evaluateSignal();
  }

  public setSettings(settings: Partial<AudioEngineSettings>) {
    this.settings = { ...this.settings, ...settings };
    if (!this.audioCtx) return;

    if (settings.filterMode) {
      this.applyFilterMode(settings.filterMode);
    }

    if (settings.masterVolume !== undefined && this.masterGain) {
      const vol = this.isMuted || !this.isPowerOn ? 0 : this.settings.masterVolume;
      this.masterGain.gain.setTargetAtTime(vol, this.audioCtx.currentTime, 0.05);
      this.audioElement.volume = Math.max(0, Math.min(1, vol));
    }

    this.evaluateSignal();
  }

  public setPower(power: boolean) {
    this.isPowerOn = power;
    if (!power) {
      this.audioElement.pause();
      if (this.masterGain && this.audioCtx) {
        this.masterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
      }
    } else {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (this.masterGain && this.audioCtx) {
        const vol = this.isMuted ? 0 : this.settings.masterVolume;
        this.masterGain.gain.setTargetAtTime(vol, this.audioCtx.currentTime, 0.05);
      }
      this.evaluateSignal();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.audioCtx) {
      const vol = muted || !this.isPowerOn ? 0 : this.settings.masterVolume;
      this.masterGain.gain.setTargetAtTime(vol, this.audioCtx.currentTime, 0.05);
    }
    this.audioElement.muted = muted;
  }

  public playClickSound() {
    if (!this.audioCtx || !this.isPowerOn) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const clickGain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.audioCtx.currentTime + 0.015);
      
      clickGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.018);
      
      osc.connect(clickGain);
      clickGain.connect(this.masterGain || this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.02);
    } catch {
      // Ignored
    }
  }

  private applyFilterMode(mode: AudioFilterMode) {
    if (!this.stationFilter || !this.audioCtx) return;

    if (mode === 'vintage') {
      // Classic AM roll-off at 4.5 kHz
      this.stationFilter.type = 'lowpass';
      this.stationFilter.frequency.setTargetAtTime(4500, this.audioCtx.currentTime, 0.05);
      this.stationFilter.Q.setTargetAtTime(1.2, this.audioCtx.currentTime, 0.05);
      if (this.skywaveLfoGain) {
        this.skywaveLfoGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
      }
    } else if (mode === 'dx_skywave') {
      // Skywave fading with 3.8 kHz bandwidth and ionospheric fading
      this.stationFilter.type = 'lowpass';
      this.stationFilter.frequency.setTargetAtTime(3600, this.audioCtx.currentTime, 0.05);
      this.stationFilter.Q.setTargetAtTime(1.0, this.audioCtx.currentTime, 0.05);
      if (this.skywaveLfoGain) {
        this.skywaveLfoGain.gain.setTargetAtTime(0.22, this.audioCtx.currentTime, 0.05);
      }
    } else {
      // Hi-Fi wideband
      this.stationFilter.type = 'lowpass';
      this.stationFilter.frequency.setTargetAtTime(10500, this.audioCtx.currentTime, 0.05);
      this.stationFilter.Q.setTargetAtTime(0.7, this.audioCtx.currentTime, 0.05);
      if (this.skywaveLfoGain) {
        this.skywaveLfoGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.05);
      }
    }
  }

  private evaluateSignal() {
    if (this.allStations.length === 0) return;

    // Find closest station
    let nearest: Station | null = null;
    let minDistance = Infinity;

    for (const station of this.allStations) {
      const dist = Math.abs(this.currentFrequency - station.frequency);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = station;
      }
    }

    const offset = nearest ? this.currentFrequency - nearest.frequency : 999;
    const absOffset = Math.abs(offset);

    // Calculate S-Meter & Signal strength
    // AM receiver selectivity curve:
    // Perfect lock: 0 kHz offset -> strength 1.0
    // Skirt: 1-6 kHz offset -> fast drop-off
    // Beyond 10 kHz -> negligible carrier
    let strength = 0;
    const powerMultiplier = nearest?.powerKw ? Math.min(1.2, Math.max(0.7, Math.sqrt(nearest.powerKw / 50))) : 1.0;

    if (absOffset <= 12) {
      strength = Math.max(0, 1 - (absOffset / 12) ** 1.8) * powerMultiplier;
    }

    strength = Math.min(1.0, Math.max(0, strength));

    // Convert strength to S-Units
    let sUnits = 'S1';
    if (strength > 0.92) sUnits = 'S9 + 30dB';
    else if (strength > 0.8) sUnits = 'S9 + 20dB';
    else if (strength > 0.65) sUnits = 'S9 + 10dB';
    else if (strength > 0.5) sUnits = 'S9';
    else if (strength > 0.38) sUnits = 'S7';
    else if (strength > 0.25) sUnits = 'S5';
    else if (strength > 0.12) sUnits = 'S3';
    else if (strength > 0.05) sUnits = 'S2';

    const isLocked = absOffset <= 2 && strength >= 0.6;

    // Notify UI
    if (this.onSignalUpdate) {
      this.onSignalUpdate({
        strength,
        sUnits,
        isLocked,
        frequencyOffset: offset,
        nearestStation: nearest,
      });
    }

    // Audio mixing logic:
    // When tuned in (absOffset <= 4): Station audio should be clear, static minimal
    // When slightly detuned (5 <= absOffset <= 14): Station audio falls off, heterodyne whistle is heard
    // When off-station: static is dominant
    if (!this.isPowerOn) return;

    const ctx = this.audioCtx;
    const now = ctx ? ctx.currentTime : 0;

    // Station stream switching & playback
    if (absOffset <= 14 && nearest) {
      if (this.currentStation?.id !== nearest.id) {
        this.currentStation = nearest;
        this.audioElement.src = nearest.streamUrl;
        this.audioElement.play().catch(() => {
          // Auto-play was prevented by browser policy until user click
        });
      } else if (this.audioElement.paused) {
        this.audioElement.play().catch(() => {});
      }

      // Compute station gain from offset
      const stationVol = Math.max(0, 1 - (absOffset / 11) ** 2);
      if (this.stationGain && ctx) {
        this.stationGain.gain.setTargetAtTime(stationVol, now, 0.05);
      }
      if (!this.isConnectedToWebAudio) {
        this.audioElement.volume = Math.max(0, Math.min(1, stationVol * this.settings.masterVolume));
      }
    } else {
      // Off station
      if (this.stationGain && ctx) {
        this.stationGain.gain.setTargetAtTime(0, now, 0.05);
      }
      if (!this.isConnectedToWebAudio) {
        this.audioElement.volume = 0;
      }
    }

    // Dynamic White-Noise scaling based on S-meter strength and carrier proximity:
    // When tuning between stations (absOffset > 10 kHz, strength ≈ 0, S1):
    // -> Receiver AGC opens wide, producing the authentic full-spectrum white-noise rush.
    // As carrier strength rises (S3 -> S5 -> S7 -> S9):
    // -> AGC progressively and non-linearly suppresses the white-noise floor.
    // At S9+20dB / S9+30dB (strength >= 0.8):
    // -> White noise drops to a clean imperceptible floor (< 1%), letting broadcast stream shine.
    const noiseScale = Math.max(0.005, Math.pow(1 - strength, 1.75));
    const dynamicStaticGain = noiseScale * this.settings.staticVolume;

    if (this.staticGain && ctx) {
      this.staticGain.gain.setTargetAtTime(dynamicStaticGain, now, 0.035);
    }

    // Dynamic IF noise filter bandwidth:
    // Open-band static has crisp high-frequency hiss (~3200 Hz cutoff);
    // as carrier locks, residual noise bandwidth softens to 1600 Hz.
    if (this.staticFilter && ctx) {
      const dynamicBandwidth = 1600 + (1 - strength) * 1600;
      this.staticFilter.frequency.setTargetAtTime(dynamicBandwidth, now, 0.04);
    }

    // Heterodyne whine:
    // Heard between 2 kHz and 14 kHz from an AM carrier
    if (this.heterodyneOsc && this.heterodyneGain && ctx) {
      if (this.settings.heterodyneEnabled && absOffset >= 2 && absOffset <= 14) {
        // Frequency of whistle: offset * 110 Hz (e.g. 3 kHz offset = 330 Hz whine)
        const whistleFreq = Math.max(80, Math.min(2200, absOffset * 130));
        this.heterodyneOsc.frequency.setTargetAtTime(whistleFreq, now, 0.05);
        const whistleGain = Math.sin((absOffset / 14) * Math.PI) * 0.08 * this.settings.staticVolume;
        this.heterodyneGain.gain.setTargetAtTime(whistleGain, now, 0.05);
      } else {
        this.heterodyneGain.gain.setTargetAtTime(0, now, 0.05);
      }
    }
  }

  public registerSignalCallback(cb: (status: SignalStatus) => void) {
    this.onSignalUpdate = cb;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getFrequency(): number {
    return this.currentFrequency;
  }

  public getCurrentStation(): Station | null {
    return this.currentStation;
  }

  public isPlaying(): boolean {
    return !this.audioElement.paused && this.isPowerOn;
  }

  public togglePlayPause(): boolean {
    this.initAudioContext();
    if (this.audioElement.paused) {
      this.audioElement.play().catch(() => {});
      return true;
    } else {
      this.audioElement.pause();
      return false;
    }
  }

  public destroy() {
    this.audioElement.pause();
    this.audioElement.src = '';
    try {
      if (this.whiteNoiseNode) this.whiteNoiseNode.stop();
      if (this.crackleNoiseNode) this.crackleNoiseNode.stop();
    } catch {
      // Ignored
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
    }
  }
}
