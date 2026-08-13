import React, { useState, useEffect } from 'react';

export const SpacemonkeyRadar: React.FC = () => {
  const [anomalyCount, setAnomalyCount] = useState<number>(0);
  const [radarStatus, setRadarStatus] = useState<string>('Scanning Nebula Sectors');

  useEffect(() => {
    const timer = setInterval(() => {
      setAnomalyCount(prev => (prev >= 7 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const sweepRadar = () => {
    setRadarStatus('Deep Space Sweep Complete: Sector Clear');
    setTimeout(() => setRadarStatus('Scanning Nebula Sectors'), 3000);
  };

  return (
    <div className="absolute top-68 left-1/3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#002b36] text-[#2aa198] px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Spacemonkey_Radar.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Radar State:</span>
          <span className="text-[#2aa198] font-bold">{radarStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Detected Anomalies:</span>
          <span className="text-red-700 font-mono font-bold">{anomalyCount}</span>
        </div>
        <div className="h-16 bg-black border border-cyan-900 mt-1 relative flex items-center justify-center overflow-hidden">
          <div className="absolute w-12 h-12 rounded-full border border-cyan-500/50 animate-ping"></div>
          <span className="text-cyan-400 font-mono text-[10px] z-10">★ OULU / WIN96 ORBIT</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={sweepRadar}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Run Deep Sweep
        </button>
      </div>
    </div>
  );
};
