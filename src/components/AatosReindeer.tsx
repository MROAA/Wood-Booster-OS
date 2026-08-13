/**
 * @file AatosReindeer.tsx
 * @brief Aatos the White Reindeer - Arctic Pathfinder & Frost Crystal Guardian Widget
 */

import React, { useState, useEffect } from 'react';

export const AatosReindeer: React.FC = () => {
  const [auroraFreq, setAuroraFreq] = useState<number>(741);
  const [status, setStatus] = useState<string>('Grazing under Northern Lights');
  const [frostLevel, setFrostLevel] = useState<number>(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrostLevel((prev) => (prev >= 100 ? 99 : 100));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const summonBlizzard = () => {
    setStatus('Summoning Arctic Aurora Borealis wave!');
    setAuroraFreq(852);
    setTimeout(() => {
      setStatus('Grazing under Northern Lights');
      setAuroraFreq(741);
    }, 4000);
  };

  return (
    <div 
      onClick={summonBlizzard}
      className="absolute bottom-36 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-64 shadow-xl font-sans text-xs text-black z-40 cursor-pointer select-none hover:bg-[#d0d0d0]"
    >
      <div className="bg-[#4682B4] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black">
        <span>Aatos (White Reindeer)</span>
        <span className="w-3 h-3 bg-white rounded-full inline-block animate-pulse border border-black"></span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Species:</span>
          <span className="text-gray-700 font-bold">White Reindeer / Poro</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">State:</span>
          <span className="text-gray-800">{status}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Aurora Freq:</span>
          <span className="text-blue-900 font-mono">{auroraFreq} Hz</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Tundra Buffer:</span>
          <span className="text-blue-700 font-mono">{frostLevel}% Crystal</span>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-gray-600 text-center italic">
        (Click widget to channel Aatos's aurora)
      </div>
    </div>
  );
};
