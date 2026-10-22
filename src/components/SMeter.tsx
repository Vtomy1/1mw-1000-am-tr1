import React from 'react';
import { SignalStatus } from '../types/radio';

interface SMeterProps {
  signal: SignalStatus;
  isPowerOn: boolean;
}

export const SMeter: React.FC<SMeterProps> = ({ signal, isPowerOn }) => {
  // Map signal strength (0 to 1) to needle angle degrees (-45deg to +45deg)
  const strength = isPowerOn ? signal.strength : 0;
  const needleAngle = -42 + strength * 84;

  return (
    <div className="relative flex flex-col items-center justify-between p-4 bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden w-full max-w-[280px] h-[140px] shadow-inner">
      {/* Subtle warm incandescent backlighting */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          isPowerOn ? 'opacity-100' : 'opacity-10'
        }`}
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(245, 158, 11, 0.15) 0%, rgba(0, 0, 0, 0) 75%)',
        }}
      />

      {/* Top Header Labels */}
      <div className="w-full flex items-center justify-between text-[10px] uppercase font-mono-numbers text-stone-400 tracking-wider z-10">
        <span>Signal / Tuning</span>
        <span className="text-amber-400/90 font-semibold">{isPowerOn ? signal.sUnits : 'OFF'}</span>
      </div>

      {/* Analog Arc Dial SVG */}
      <div className="relative w-full h-[68px] flex items-end justify-center z-10 overflow-hidden">
        <svg viewBox="0 0 200 90" className="w-full h-full">
          {/* Calibrated Arc Scale */}
          <path
            d="M 25 80 A 75 75 0 0 1 175 80"
            fill="none"
            stroke="#44403c"
            strokeWidth="1.5"
          />
          {/* S9+ Over-Signal Arc Highlight */}
          <path
            d="M 125 32 A 75 75 0 0 1 175 80"
            fill="none"
            stroke="#b45309"
            strokeWidth="2.5"
          />

          {/* Scale Tick Marks */}
          {/* S1 */}
          <line x1="33" y1="70" x2="40" y2="66" stroke="#78716c" strokeWidth="1" />
          <text x="40" y="60" fontSize="7" fill="#78716c" textAnchor="middle" fontFamily="monospace">1</text>
          
          {/* S3 */}
          <line x1="56" y1="48" x2="62" y2="46" stroke="#78716c" strokeWidth="1" />
          <text x="63" y="40" fontSize="7" fill="#78716c" textAnchor="middle" fontFamily="monospace">3</text>
          
          {/* S5 */}
          <line x1="84" y1="34" x2="87" y2="30" stroke="#78716c" strokeWidth="1" />
          <text x="88" y="24" fontSize="7" fill="#78716c" textAnchor="middle" fontFamily="monospace">5</text>
          
          {/* S7 */}
          <line x1="116" y1="31" x2="117" y2="25" stroke="#78716c" strokeWidth="1" />
          <text x="117" y="20" fontSize="7" fill="#78716c" textAnchor="middle" fontFamily="monospace">7</text>
          
          {/* S9 */}
          <line x1="144" y1="41" x2="148" y2="36" stroke="#d97706" strokeWidth="1.5" />
          <text x="146" y="30" fontSize="7.5" fill="#d97706" textAnchor="middle" fontWeight="bold" fontFamily="monospace">9</text>
          
          {/* +20dB */}
          <line x1="168" y1="62" x2="173" y2="59" stroke="#ef4444" strokeWidth="1.5" />
          <text x="171" y="52" fontSize="6.5" fill="#ef4444" textAnchor="middle" fontFamily="monospace">+20</text>

          {/* Needle Pivot & Moving Indicator Needle */}
          <g transform={`rotate(${needleAngle}, 100, 85)`} className="transition-transform duration-200 ease-out">
            <line
              x1="100"
              y1="85"
              x2="100"
              y2="15"
              stroke="#f59e0b"
              strokeWidth="1.75"
              strokeLinecap="round"
              className="amber-needle"
            />
            <circle cx="100" cy="85" r="4" fill="#f59e0b" />
          </g>
          <circle cx="100" cy="85" r="2" fill="#1c1917" />
        </svg>
      </div>

      {/* Bottom Status Bar */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono-numbers text-stone-400 z-10 pt-1 border-t border-stone-800/80">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              signal.isLocked && isPowerOn ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-stone-700'
            }`}
          />
          <span className={signal.isLocked && isPowerOn ? 'text-amber-300' : 'text-stone-500'}>
            {signal.isLocked && isPowerOn ? 'CARRIER LOCK' : 'SEEKING'}
          </span>
        </span>
        <span className="text-stone-500">
          Δ {signal.frequencyOffset > 0 ? `+${signal.frequencyOffset}` : signal.frequencyOffset} kHz
        </span>
      </div>
    </div>
  );
};
