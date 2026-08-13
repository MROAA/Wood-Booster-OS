/**
 * @file SpacemonkeyApe.tsx
 * @brief Spacemonkey the Space Ape - Cosmic Navigator & Voice Interface Widget
 */

import React, { useState, useEffect } from 'react';

export const SpacemonkeyApe: React.FC = () => {
  const [cosmicFreq, setCosmicFreq] = useState<number>(528);
  const [status, setStatus] = useState<string>('In Zero-G Orbit');
  const [orbitAltitude, setOrbitAltitude] = useState<number>(420);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrbitAltitude((prev) => (prev >= 425 ? 420 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const launchBananaSignal = () => {
    setStatus('Broadcasting Cosmic Banana Wave across IRQ 0x01!');
    setCosmicFreq(639);
    setTimeout(() => {
      setStatus('In Zero-G Orbit');
      setCosmicFreq(528);
    }, 4000);
  };

  return (
    <div 
      onClick={launchBananaSignal}
      className="absolute top-4 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-64 shadow-xl font-sans text-xs text-black z-40 cursor-pointer select-none hover:bg-[#d0d0d0]"
    >
      <div className="bg-[#4B0082] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black">
        <span>Spacemonkey (Space Ape)</span>
        <span className="w-3 h-3 bg-purple-400 rounded-full inline-block animate-ping border border-black"></span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Species:</span>
          <span className="text-[#4B0082] font-bold">Space Ape / Avaruusapina</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">State:</span>
          <span className="text-gray-800">{status}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Cosmic Freq:</span>
          <span className="text-blue-900 font-mono">{cosmicFreq} Hz</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Orbit:</span>
          <span className="text-green-700 font-mono">{orbitAltitude} km</span>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-gray-600 text-center italic">
        (Click widget to transmit cosmic signal)
      </div>
    </div>
  );
};
