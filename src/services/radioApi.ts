import { Station } from '../types/radio';
import { DEFAULT_STATIONS } from '../data/defaultStations';

// Radio-Browser API mirrors
const RADIO_BROWSER_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

interface RadioBrowserStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  tags: string;
  country: string;
  state: string;
  bitrate: number;
  codec: string;
  votes: number;
}

export function extractFrequencyFromName(name: string, tags: string = ''): number | null {
  const combined = `${name} ${tags}`.toUpperCase();
  // Match patterns like "1030 AM", "AM 1030", "1030 KHZ", "720-AM", "AM720"
  const amMatch = combined.match(/(?:AM\s*|KHZ\s*|MW\s*)(\d{3,4})|(\d{3,4})\s*(?:AM|KHZ|MW)\b/i);
  if (amMatch) {
    const val = parseInt(amMatch[1] || amMatch[2], 10);
    if (val >= 530 && val <= 1710) {
      return val;
    }
  }

  // Any standalone 3-4 digit number between 530 and 1710
  const standaloneMatch = combined.match(/\b(5[3-9]\d|[6-9]\d{2}|1[0-6]\d{2}|17[0-1]0)\b/);
  if (standaloneMatch) {
    const val = parseInt(standaloneMatch[1], 10);
    return val;
  }

  return null;
}

export function extractCallSign(name: string): string {
  // Common US/Canada call signs (Wxxx, Kxxx, Cxxx)
  const callMatch = name.match(/\b([WK|C][A-Z]{2,4})\b/i);
  if (callMatch) {
    return callMatch[1].toUpperCase();
  }
  // Fallback to first word or abbreviated name
  const words = name.trim().split(/\s+/);
  return words[0].slice(0, 5).toUpperCase();
}

export async function detectUserLocation(): Promise<{ city: string; region: string; country: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return {
        city: data.city || '',
        region: data.region_code || data.region || '',
        country: data.country_name || 'United States',
      };
    }
  } catch {
    // If blocked or rate limited, silent fallback
  }
  return null;
}

export async function searchRadioStations(query: string, country?: string): Promise<Station[]> {
  const trimmed = query.trim().toLowerCase();
  
  // First match in local curated database
  const localMatches = DEFAULT_STATIONS.filter((s) => {
    if (!trimmed) return true;
    return (
      s.name.toLowerCase().includes(trimmed) ||
      s.callSign.toLowerCase().includes(trimmed) ||
      s.city.toLowerCase().includes(trimmed) ||
      s.region.toLowerCase().includes(trimmed) ||
      s.format.toLowerCase().includes(trimmed) ||
      s.frequency.toString().includes(trimmed)
    );
  });

  if (trimmed.length < 2 && localMatches.length > 0) {
    return localMatches;
  }

  // Next query Radio-Browser API mirror
  const mirror = RADIO_BROWSER_MIRRORS[0];
  try {
    const params = new URLSearchParams();
    params.set('limit', '40');
    params.set('order', 'votes');
    params.set('reverse', 'true');
    params.set('hidebroken', 'true');
    
    if (trimmed) {
      params.set('name', trimmed);
    } else {
      params.set('tag', 'am');
    }

    if (country) {
      params.set('country', country);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${mirror}/json/stations/search?${params.toString()}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const remoteStations: RadioBrowserStation[] = await res.json();
      const mapped: Station[] = remoteStations
        .map((rb, idx) => {
          const freq = extractFrequencyFromName(rb.name, rb.tags) || (540 + (idx * 20) % 1170);
          return {
            id: `rb-${rb.stationuuid}`,
            callSign: extractCallSign(rb.name),
            name: rb.name,
            frequency: freq,
            city: rb.state || rb.country || 'Broadcast',
            region: rb.state || '',
            country: rb.country || 'Global',
            format: rb.tags ? rb.tags.split(',').slice(0, 2).join(' / ') : 'AM Broadcast',
            streamUrl: rb.url_resolved || rb.url,
            homepage: rb.homepage,
            bitrate: rb.bitrate,
            isVerified: false,
          };
        })
        .filter((s) => s.streamUrl && s.streamUrl.startsWith('http'));

      // Deduplicate by ID and combine
      const ids = new Set(localMatches.map((s) => s.id));
      const combined = [...localMatches];
      for (const m of mapped) {
        if (!ids.has(m.id)) {
          combined.push(m);
          ids.add(m.id);
        }
      }
      return combined;
    }
  } catch {
    // API timeout or network failure; gracefully return curated local stations
  }

  return localMatches;
}
