import React, { useRef, useEffect } from 'react';

interface OscilloscopeProps {
  analyser: AnalyserNode | null;
  isPowerOn: boolean;
  isLocked: boolean;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ analyser, isPowerOn, isLocked }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser ? analyser.frequencyBinCount : 128;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      // Deep dark phosphor screen background
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, width, height);

      // Fine grid reticle lines (oscilloscope graticule)
      ctx.strokeStyle = 'rgba(68, 64, 60, 0.25)';
      ctx.lineWidth = 1;

      // Horizontal graticule
      const rows = 4;
      for (let i = 1; i < rows; i++) {
        const y = (height / rows) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical graticule
      const cols = 6;
      for (let j = 1; j < cols; j++) {
        const x = (width / cols) * j;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (!isPowerOn) {
        // Flatline centered trace
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        return;
      }

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        // Fallback synthetic subtle noise wave
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = 128 + (Math.random() * 8 - 4);
        }
      }

      // Draw phosphor beam trace
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = isLocked ? '#f59e0b' : '#d97706';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = isLocked ? 8 : 3;

      ctx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyser, isPowerOn, isLocked]);

  return (
    <div className="flex flex-col items-center justify-between p-3 bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden w-full max-w-[280px] h-[140px] shadow-inner">
      <div className="w-full flex items-center justify-between text-[10px] uppercase font-mono-numbers text-stone-400 tracking-wider">
        <span>RF Scope / Audio</span>
        <span className={isLocked && isPowerOn ? 'text-amber-400' : 'text-stone-500'}>
          {isPowerOn ? (isLocked ? 'MODULATION ACTIVE' : 'CARRIER SEARCH') : 'OFF'}
        </span>
      </div>
      <div className="w-full h-[85px] rounded-lg overflow-hidden border border-stone-800/80 bg-stone-950">
        <canvas ref={canvasRef} width={280} height={85} className="w-full h-full block" />
      </div>
      <div className="w-full flex items-center justify-between text-[9px] font-mono-numbers text-stone-500 pt-0.5">
        <span>500 mV/DIV</span>
        <span>20 ms/DIV</span>
      </div>
    </div>
  );
};
