export type AMBandRaster = 10 | 9; // 10 kHz (Americas) or 9 kHz (Europe/Asia/Africa)

export type AudioFilterMode = 'hifi' | 'vintage' | 'dx_skywave';

export interface Station {
  id: string;
  callSign: string;
  name: string;
  frequency: number; // in kHz, e.g. 1030, 660, 1070
  city: string;
  region: string; // state or province, e.g. "MA", "CA", "NY"
  country: string; // "United States", "Canada", "United Kingdom", etc.
  format: string; // "News / Talk", "Sports", "Oldies", "Classic Country", etc.
  streamUrl: string;
  homepage?: string;
  powerKw?: number; // e.g. 50 (kW)
  bitrate?: number;
  isCustom?: boolean;
  isVerified?: boolean;
}

export interface PresetSlot {
  slot: number; // 1 to 6
  stationId: string | null;
  stationName: string;
  frequency: number;
  callSign: string;
}

export interface AudioEngineSettings {
  staticVolume: number; // 0.0 to 1.0
  heterodyneEnabled: boolean;
  filterMode: AudioFilterMode;
  masterVolume: number; // 0.0 to 1.0
  raster: AMBandRaster;
}

export interface SignalStatus {
  strength: number; // 0.0 to 1.0
  sUnits: string; // "S1" .. "S9+30dB"
  isLocked: boolean;
  frequencyOffset: number; // in kHz (-15 to +15)
  nearestStation: Station | null;
}
