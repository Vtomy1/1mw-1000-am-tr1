import React, { useState } from 'react';
import { Station } from '../types/radio';
import { POPULAR_LOCATIONS } from '../data/defaultStations';
import { Search, MapPin, Radio, Plus, Play, Sparkles, Globe } from 'lucide-react';

interface StationDirectoryProps {
  stations: Station[];
  currentFrequency: number;
  onTuneStation: (station: Station) => void;
  onOpenAddModal: () => void;
  isPowerOn: boolean;
  userLocation: { city: string; region: string; country: string } | null;
  onDetectLocation: () => void;
  isLocating: boolean;
}

export const StationDirectory: React.FC<StationDirectoryProps> = ({
  stations,
  currentFrequency,
  onTuneStation,
  onOpenAddModal,
  isPowerOn,
  userLocation,
  onDetectLocation,
  isLocating,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('All Regions');
  const [genreFilter, setGenreFilter] = useState<string>('all');

  const filteredStations = stations.filter((st) => {
    // Location filter
    if (selectedLocation !== 'All Regions') {
      const loc = POPULAR_LOCATIONS.find((l) => l.label === selectedLocation);
      if (loc) {
        if (loc.tag === 'heritage') {
          if (!st.id.includes('otr') && !st.id.includes('jazz') && !st.id.includes('wcon')) {
            return false;
          }
        } else if (loc.city && !st.city.toLowerCase().includes(loc.city.toLowerCase())) {
          return false;
        }
      }
    }

    // Genre filter
    if (genreFilter !== 'all') {
      const fmt = st.format.toLowerCase();
      if (genreFilter === 'news' && !fmt.includes('news')) return false;
      if (genreFilter === 'sports' && !fmt.includes('sports')) return false;
      if (genreFilter === 'talk' && !fmt.includes('talk')) return false;
      if (genreFilter === 'heritage' && !fmt.includes('vintage') && !fmt.includes('classic') && !fmt.includes('jazz')) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        st.name.toLowerCase().includes(q) ||
        st.callSign.toLowerCase().includes(q) ||
        st.city.toLowerCase().includes(q) ||
        st.region.toLowerCase().includes(q) ||
        st.format.toLowerCase().includes(q) ||
        st.frequency.toString().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Sort by frequency ascending
  const sortedStations = [...filteredStations].sort((a, b) => a.frequency - b.frequency);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Header & Search Area */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-6 bg-stone-900/90 border border-stone-800 rounded-2xl">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Search callsign, frequency (e.g. 1030), city, or format..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Location Selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full sm:w-48 appearance-none pl-3 pr-8 py-2 text-xs bg-stone-950 border border-stone-800 rounded-xl text-stone-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {POPULAR_LOCATIONS.map((loc) => (
                  <option key={loc.label} value={loc.label}>
                    {loc.label}
                  </option>
                ))}
              </select>
              <MapPin className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
            </div>

            {/* Detect Local City Button */}
            <button
              onClick={onDetectLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-stone-800 bg-stone-950 text-stone-300 hover:text-amber-400 hover:border-stone-700 transition-colors whitespace-nowrap"
              title="Detect my local city via network"
            >
              <Globe className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-400' : 'text-stone-400'}`} />
              <span>{isLocating ? 'Detecting...' : userLocation ? `${userLocation.city || userLocation.region}` : 'Localize'}</span>
            </button>
          </div>
        </div>

        {/* Action: Add Custom Stream */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 rounded-xl hover:bg-amber-300 transition-colors whitespace-nowrap shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Stream</span>
        </button>
      </div>

      {/* Filter Tabs / Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-stone-900 border border-stone-800 rounded-xl overflow-x-auto">
        {[
          { id: 'all', label: 'All Formats' },
          { id: 'news', label: 'All News' },
          { id: 'sports', label: 'Sports Radio' },
          { id: 'talk', label: 'Talk & Discussion' },
          { id: 'heritage', label: 'Vintage Heritage & OTR' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setGenreFilter(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              genreFilter === tab.id
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Station Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedStations.length === 0 ? (
          <div className="col-span-full py-16 text-center text-stone-500 flex flex-col items-center gap-2">
            <Radio className="w-8 h-8 text-stone-600" />
            <p className="text-sm">No AM stations matched your filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('All Regions');
                setGenreFilter('all');
              }}
              className="text-xs text-amber-400 hover:underline mt-2"
            >
              Reset search & filters
            </button>
          </div>
        ) : (
          sortedStations.map((station) => {
            const isCurrentlyTuned = Math.abs(currentFrequency - station.frequency) <= 2;

            return (
              <div
                key={station.id}
                onClick={() => isPowerOn && onTuneStation(station)}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all cursor-pointer group ${
                  isCurrentlyTuned && isPowerOn
                    ? 'bg-amber-950/20 border-amber-500/80 shadow-md shadow-amber-500/10'
                    : 'bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-800/60'
                }`}
              >
                {/* Upper line: Callsign & Frequency */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold font-mono-numbers text-stone-100 group-hover:text-amber-400 transition-colors">
                      {station.callSign}
                    </span>
                    <span className="text-sm font-semibold text-stone-300 line-clamp-1">
                      {station.name}
                    </span>
                  </div>

                  {/* Frequency badge */}
                  <div className="text-right flex flex-col items-end shrink-0">
                    <span className="text-lg font-bold font-mono-numbers text-amber-400">
                      {station.frequency}
                    </span>
                    <span className="text-[10px] uppercase font-mono-numbers text-stone-500">
                      kHz AM
                    </span>
                  </div>
                </div>

                {/* Clean unboxed metadata with typographic separators */}
                <div className="flex items-center gap-2 text-xs text-stone-400 mt-2 mb-4 flex-wrap">
                  <span>{station.city}{station.region ? `, ${station.region}` : ''}</span>
                  <span aria-hidden="true">·</span>
                  <span>{station.format}</span>
                  {station.powerKw && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{station.powerKw} kW</span>
                    </>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-800/80">
                  <span className="text-[11px] font-mono-numbers text-stone-500">
                    {station.country}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTuneStation(station);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isCurrentlyTuned && isPowerOn
                        ? 'bg-amber-400 text-stone-950 shadow-sm shadow-amber-400/30'
                        : 'bg-stone-800 text-stone-300 hover:bg-amber-400 hover:text-stone-950'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isCurrentlyTuned && isPowerOn ? 'Tuned In' : 'Tune In'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
