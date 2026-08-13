import React, { useState } from 'react';

export const SpacemonkeyClockBoost: React.FC = () => {
  const [boostLevel, setBoostLevel] = useState<string>('Standard 999 MHz');
  const [coreTemp, setCoreTemp] = useState<number>(36.6);

  const toggleBoost = () => {
    if (boostLevel.includes('Standard')) {
      setBoostLevel('QUANTUM OVERCLOCK 4320 MHz');
      setCoreTemp(42.0);
    } else {
      setBoostLevel('Standard 999 MHz');
      setCoreTemp(36.6);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#4B0082] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Spacemonkey_Clock_Boost.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Core State:</span>
          <span className="text-purple-900 font-bold">{boostLevel}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Core Temperature:</span>
          <span className="text-red-700 font-mono font-bold">{coreTemp} °C</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={toggleBoost}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Toggle Quantum Overclock
        </svg>
      </div>
    </div>
  );
};
