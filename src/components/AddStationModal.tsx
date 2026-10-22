import React, { useState } from 'react';
import { Station } from '../types/radio';
import { Radio, Plus, X } from 'lucide-react';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStation: (station: Station) => void;
  defaultFrequency?: number;
}

export const AddStationModal: React.FC<AddStationModalProps> = ({
  isOpen,
  onClose,
  onAddStation,
  defaultFrequency = 1030,
}) => {
  const [callSign, setCallSign] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState(defaultFrequency.toString());
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('United States');
  const [format, setFormat] = useState('Community / Talk');
  const [streamUrl, setStreamUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const freqNum = parseInt(frequency, 10);
    if (isNaN(freqNum) || freqNum < 530 || freqNum > 1710) {
      setError('Frequency must be between 530 kHz and 1710 kHz');
      return;
    }
    if (!streamUrl.trim() || !streamUrl.startsWith('http')) {
      setError('Please provide a valid stream URL starting with http:// or https://');
      return;
    }
    if (!name.trim()) {
      setError('Station name is required');
      return;
    }

    const newStation: Station = {
      id: `custom-${Date.now()}`,
      callSign: callSign.trim().toUpperCase() || 'CUSTOM',
      name: name.trim(),
      frequency: freqNum,
      city: city.trim() || 'Local',
      region: region.trim(),
      country: country.trim() || 'Global',
      format: format.trim() || 'AM Stream',
      streamUrl: streamUrl.trim(),
      isCustom: true,
      powerKw: 10,
    };

    onAddStation(newStation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-stone-100">Add Custom AM Station Stream</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-300 bg-rose-950/50 border border-rose-900 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Call Sign (e.g. WBZ)
              </label>
              <input
                type="text"
                placeholder="WBZ"
                maxLength={6}
                value={callSign}
                onChange={(e) => setCallSign(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500 font-mono-numbers uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                AM Frequency (kHz)
              </label>
              <input
                type="number"
                min="530"
                max="1710"
                step="1"
                placeholder="1030"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500 font-mono-numbers"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Station Name & Brand
            </label>
            <input
              type="text"
              placeholder="e.g. WBZ NewsRadio 1030 AM"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                City / Market
              </label>
              <input
                type="text"
                placeholder="e.g. Boston"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Format / Genre
              </label>
              <input
                type="text"
                placeholder="e.g. News / Talk"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Live Audio Stream URL (MP3 / AAC / M3U8)
            </label>
            <input
              type="url"
              placeholder="https://example.com/stream.mp3"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-stone-950 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-amber-500 font-mono-numbers"
              required
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Direct streaming endpoint (Icecast, Shoutcast, HLS stream or podcast feed).
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-400 hover:text-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Station</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
