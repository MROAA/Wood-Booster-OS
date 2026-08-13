import React, { useState } from 'react';

export const WoodBoosterCNC: React.FC = () => {
  const [spindleSpeed, setSpindleSpeed] = useState<number>(24000);
  const [status, setStatus] = useState<string>('Ready for Milling');

  const toggleMilling = () => {
    setStatus((prev) => (prev === 'Ready for Milling' ? 'CNC Milling Active (AI Optimized)' : 'Ready for Milling'));
  };

  return (
    <div className="absolute top-4 left-1/3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#5c4033] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>WoodBooster_CNC_Controller.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">System:</span>
          <span className="text-[#5c4033] font-bold">Wood Booster AI</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Spindle RPM:</span>
          <span className="text-blue-900 font-mono">{spindleSpeed} RPM</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Status:</span>
          <span className="text-green-700 font-bold">{status}</span>
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        <button 
          onClick={toggleMilling}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Toggle CNC
        </button>
        <button 
          onClick={() => setSpindleSpeed(prev => (prev === 24000 ? 18000 : 24000))}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Change RPM
        </button>
      </div>
    </div>
  );
};
