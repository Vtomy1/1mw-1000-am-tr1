import React, { useRef, useEffect, useState } from 'react';
import { SignalStatus } from '../types/radio';

interface SignalHistoryChartProps {
  signal: SignalStatus;
  isPowerOn: boolean;
}

interface DataPoint {
  time: number;
  strength: number; // 0.0 to 1.0
  sUnits: string;
}

export const SignalHistoryChart: React.FC<SignalHistoryChartProps> = ({
  signal,
  isPowerOn,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<DataPoint[]>([]);
  const lastSampleTimeRef = useRef<number>(0);
  const [driftTrend, setDriftTrend] = useState<'STABLE' | 'RISING' | 'FADING'>('STABLE');
  const [peakSUnit, setPeakSUnit] = useState<string>('S1');

  // Push new signal sample into history buffer at regular intervals (~100ms)
  useEffect(() => {
    const now = performance.now();
    if (now - lastSampleTimeRef.current >= 90) {
      lastSampleTimeRef.current = now;
      const currentStrength = isPowerOn ? signal.strength : 0;
      
      const newPoint: DataPoint = {
        time: now,
        strength: currentStrength,
        sUnits: signal.sUnits,
      };

      const history = historyRef.current;
      history.push(newPoint);

      // Keep ~120 samples (approx. 12-15 seconds of history)
      if (history.length > 120) {
        history.shift();
      }

      // Compute drift delta (last 10 samples vs preceding 10 samples)
      if (history.length >= 20 && isPowerOn) {
        const recent = history.slice(-10);
        const older = history.slice(-20, -10);
        const avgRecent = recent.reduce((sum, p) => sum + p.strength, 0) / recent.length;
        const avgOlder = older.reduce((sum, p) => sum + p.strength, 0) / older.length;
        const delta = avgRecent - avgOlder;

        if (delta > 0.04) {
          setDriftTrend('RISING');
        } else if (delta < -0.04) {
          setDriftTrend('FADING');
        } else {
          setDriftTrend('STABLE');
        }

        // Calculate peak in current history buffer
        let maxStr = 0;
        let maxUnit = 'S1';
        for (const pt of history) {
          if (pt.strength > maxStr) {
            maxStr = pt.strength;
            maxUnit = pt.sUnits;
          }
        }
        setPeakSUnit(maxStr > 0 ? maxUnit : 'S1');
      } else {
        setDriftTrend('STABLE');
        if (!isPowerOn) setPeakSUnit('OFF');
      }
    }
  }, [signal, isPowerOn]);

  // Canvas drawing loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      const history = historyRef.current;

      // Dark instrument screen background
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, width, height);

      // Graticule Grid Lines & Calibration Markers
      ctx.strokeStyle = 'rgba(68, 64, 60, 0.25)';
      ctx.lineWidth = 1;

      // Reference S-Meter Level Heights:
      // S9 + 30dB -> strength 0.92
      // S9 + 10dB -> strength 0.65
      // S9        -> strength 0.50
      // S5        -> strength 0.25
      const refLevels = [
        { label: '+20dB', val: 0.8, color: 'rgba(239, 68, 68, 0.3)' },
        { label: 'S9', val: 0.5, color: 'rgba(217, 119, 6, 0.3)' },
        { label: 'S5', val: 0.25, color: 'rgba(120, 113, 108, 0.2)' },
      ];

      refLevels.forEach((level) => {
        const y = height - (level.val * (height - 14) + 6);
        ctx.beginPath();
        ctx.strokeStyle = level.color;
        ctx.setLineDash([2, 4]);
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label on left margin
        ctx.fillStyle = '#78716c';
        ctx.font = '7.5px monospace';
        ctx.fillText(level.label, 4, y - 2);
      });

      // Vertical time grid lines (every 25% of width)
      ctx.strokeStyle = 'rgba(68, 64, 60, 0.18)';
      ctx.setLineDash([2, 4]);
      for (let i = 1; i <= 3; i++) {
        const x = (width / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      if (!isPowerOn || history.length < 2) {
        // Flatline baseline
        const baseY = height - 6;
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        ctx.lineTo(width, baseY);
        ctx.stroke();
        return;
      }

      // Coordinates calculation
      const bottomPadding = 6;
      const topPadding = 6;
      const usableHeight = height - bottomPadding - topPadding;
      const maxPoints = 120;
      const stepX = width / (maxPoints - 1);
      const startIndex = Math.max(0, maxPoints - history.length);

      // Area fill below signal curve
      const gradient = ctx.createLinearGradient(0, topPadding, 0, height - bottomPadding);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.32)');
      gradient.addColorStop(0.6, 'rgba(245, 158, 11, 0.12)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

      ctx.beginPath();
      const firstX = (startIndex) * stepX;
      const firstY = height - bottomPadding - history[0].strength * usableHeight;
      ctx.moveTo(firstX, height - bottomPadding);
      ctx.lineTo(firstX, firstY);

      for (let i = 1; i < history.length; i++) {
        const x = (startIndex + i) * stepX;
        const y = height - bottomPadding - history[i].strength * usableHeight;
        ctx.lineTo(x, y);
      }

      const lastX = (startIndex + history.length - 1) * stepX;
      ctx.lineTo(lastX, height - bottomPadding);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Signal Trace Line
      ctx.beginPath();
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 5;

      for (let i = 0; i < history.length; i++) {
        const x = (startIndex + i) * stepX;
        const y = height - bottomPadding - history[i].strength * usableHeight;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Leading Head Cursor (current live signal point)
      if (history.length > 0) {
        const latestY = height - bottomPadding - history[history.length - 1].strength * usableHeight;
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(lastX, latestY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPowerOn]);

  const getTrendColor = () => {
    if (!isPowerOn) return 'text-stone-500';
    if (driftTrend === 'RISING') return 'text-emerald-400';
    if (driftTrend === 'FADING') return 'text-amber-400';
    return 'text-stone-400';
  };

  return (
    <div className="flex flex-col items-center justify-between p-3 bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden w-full max-w-[280px] h-[140px] shadow-inner">
      {/* Top Header Labels */}
      <div className="w-full flex items-center justify-between text-[10px] uppercase font-mono-numbers text-stone-400 tracking-wider">
        <span>Signal Drift / Trend</span>
        <span className={`font-semibold ${getTrendColor()}`}>
          {isPowerOn ? driftTrend : 'OFF'}
        </span>
      </div>

      {/* Canvas Strip Chart */}
      <div className="w-full h-[85px] rounded-lg overflow-hidden border border-stone-800/80 bg-stone-950 relative">
        <canvas
          ref={canvasRef}
          width={280}
          height={85}
          className="w-full h-full block"
        />
      </div>

      {/* Bottom Telemetry Status */}
      <div className="w-full flex items-center justify-between text-[9px] font-mono-numbers text-stone-500 pt-0.5">
        <span>-15s &larr; T &rarr; NOW</span>
        <span className="text-stone-400">
          PEAK: <strong className="text-amber-400/90">{isPowerOn ? peakSUnit : '--'}</strong>
        </span>
      </div>
    </div>
  );
};
