/**
 * @file TommiWatchdog.tsx
 * @brief Tommi the Orange Cat - Feline Chaos & Memory Guardian Widget
 */

import React, { useState, useEffect } from 'react';

export const TommiWatchdog: React.FC = () => {
  const [purrRate, setPurrRate] = useState<number>(963);
  const [mood, setMood] = useState<string>('Purring happily');
  const [energy, setEnergy] = useState<number>(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) => (prev > 90 ? 95 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const petCat = () => {
    setMood('Extremely pleased. Orange fur glowing.');
    setPurrRate(999);
    setTimeout(() => {
      setMood('Purring happily');
      setPurrRate(963);
    }, 4000);
  };

  return (
    <div 
      onClick={petCat}
      className="absolute bottom-14 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-64 shadow-xl font-sans text-xs text-black z-40 cursor-pointer select-none hover:bg-[#d0d0d0]"
    >
      <div className="bg-[#FF8C00] text-black px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black">
        <span>Tommi (Orange Cat)</span>
        <span className="w-3 h-3 bg-yellow-300 rounded-full inline-block animate-bounce border border-black"></span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Coat:</span>
          <span className="text-[#FF8C00] font-bold">Vivid Ginger / Orange</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">State:</span>
          <span className="text-gray-800">{mood}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Frequency:</span>
          <span className="text-blue-900 font-mono">{purrRate} Hz</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Heap Integrity:</span>
          <span className="text-green-700 font-mono">{energy}% Secure</span>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-gray-600 text-center italic">
        (Click widget to pet Tommi the orange cat)
      </div>
    </div>
  );
};
