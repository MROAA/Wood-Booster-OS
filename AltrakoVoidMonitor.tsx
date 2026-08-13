import React, { useState } from 'react';

export const AltrakoVoidMonitor: React.FC = () => {
  const [shieldState, setShieldState] = useState<string>('Void Encryption Active');
  const [entropyLevel, setEntropyLevel] = useState<number>(3.14);

  const toggleVoidShield = () => {
    setShieldState(prev => prev.includes('Active') ? 'Void Encryption Bypassed' : 'Void Encryption Active');
    setEntropyLevel(prev => prev === 3.14 ? 0.00 : 3.14);
  };

  return (
    <div className="absolute bottom-68 left-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#1a1a1a] text-[#00ffcc] px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Altrako_Void_Monitor.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Shield Status:</span>
          <span className="text-purple-900 font-bold">{shieldState}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Void Entropy:</span>
          <span className="text-red-800 font-mono font-bold">{entropyLevel} eV</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={toggleVoidShield}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Toggle Void Shield
        </button>
      </div>
    </div>
  );
};
