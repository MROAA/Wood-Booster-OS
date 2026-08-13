/**
 * @file AltrakoShadow.tsx
 * @brief Altrako - The Sub-Quantum Shadow Alter Ego of Spacemonkey Widget
 */

import React, { useState, useEffect } from 'react';

export const AltrakoShadow: React.FC = () => {
  const [shadowFreq, setShadowFreq] = useState<number>(396);
  const [status, setStatus] = useState<string>('Shadow Subroutine Active');
  const [voidStability, setVoidStability] = useState<number>(99);

  useEffect(() => {
    const interval = setInterval(() => {
      setVoidStability((prev) => (prev <= 95 ? 99 : prev - 1));
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const invokeShadowOverride = () => {
    setStatus('Unlocking Deep Void Memory Overrides!');
    setShadowFreq(174);
    setTimeout(() => {
      setStatus('Shadow Subroutine Active');
      setShadowFreq(396);
    }, 4000);
  };

  return (
    <div 
      onClick={invokeShadowOverride}
      className="absolute top-28 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-64 shadow-xl font-sans text-xs text-black z-40 cursor-pointer select-none hover:bg-[#d0d0d0]"
    >
      <div className="bg-[#1a1a1a] text-[#00ffcc] px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black">
        <span>Altrako (Shadow Ego)</span>
        <span className="w-3 h-3 bg-[#00ffcc] rounded-full inline-block animate-ping border border-black"></span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Origin:</span>
          <span className="text-purple-900 font-bold">Spacemonkey Shadow</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">State:</span>
          <span className="text-gray-800">{status}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Shadow Freq:</span>
          <span className="text-blue-900 font-mono">{shadowFreq} Hz</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Void Buffer:</span>
          <span className="text-purple-700 font-mono">{voidStability}% Stable</span>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-gray-600 text-center italic">
        (Click widget to invoke Altrako's shadow override)
      </div>
    </div>
  );
};
