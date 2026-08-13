import React, { useState } from 'react';

export const SpacemonkeyQuantumCoreFix: React.FC = () => {
  const [coreStatus, setCoreStatus] = useState<string>('Quantum Core Stable');
  const [entropyLevel, setEntropyLevel] = useState<number>(0.002);

  const purgeEntropy = () => {
    setCoreStatus('Purging Quantum Entropy...');
    setTimeout(() => {
      setEntropyLevel(0.000);
      setCoreStatus('Core Fully Synchronized');
    }, 2500);
  };

  return (
    <div className="absolute top-[480px] left-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#4a148c] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Quantum_Core_Fix.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Core State:</span>
          <span className="text-purple-900 font-bold">{coreStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Entropy Index:</span>
          <span className="text-blue-900 font-mono font-bold">{entropyLevel} eV</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={purgeEntropy}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Purge Core Entropy
        </button>
      </div>
    </div>
  );
};
