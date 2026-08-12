/**
 * @file FenrirGuard.tsx
 * @brief Fenrir the Grey Wolf - Pack Vanguard & Quantum Boundary Guardian Widget
 */

import React, { useState, useEffect } from 'react';

export const FenrirGuard: React.FC = () => {
  const [howlRate, setHowlRate] = useState<number>(432);
  const [status, setStatus] = useState<string>('Patrolling perimeter');
  const [perimeters, setPerimeters] = useState<number>(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setPerimeters((prev) => (prev < 100 ? 100 : 99));
    }, 4000);
    return () => clearInterval(interval);
  }, void 0);

  const howlAtMoon = () => {
    setStatus('Howling across the quantum network!');
    setHowlRate(528);
    setTimeout(() => {
      setStatus('Patrolling perimeter');
      setHowlRate(432);
    }, 4000);
  };

  return (
    <div 
      onClick={howlAtMoon}
      className="absolute bottom-24 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-64 shadow-xl font-sans text-xs text-black z-40 cursor-pointer select-none hover:bg-[#d0d0d0]"
    >
      <div className="bg-[#606060] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black">
        <span>Fenrir (Grey Wolf)</span>
        <span className="w-3 h-3 bg-gray-300 rounded-full inline-block animate-pulse border border-black"></span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Species:</span>
          <span className="text-gray-700 font-bold">Grey Wolf (#808080)</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">State:</span>
          <span className="text-gray-800">{status}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Howl Frequency:</span>
          <span className="text-blue-900 font-mono">{howlRate} Hz</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Perimeter:</span>
          <span className="text-green-700 font-mono">{perimeters}% Secure</span>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-gray-600 text-center italic">
        (Click widget to make Fenrir howl)
      </div>
    </div>
  );
};
