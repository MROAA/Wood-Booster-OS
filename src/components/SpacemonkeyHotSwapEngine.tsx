import React, { useState } from 'react';

export const SpacemonkeyHotSwapEngine: React.FC = () => {
  const [swapState, setSwapState] = useState<string>('Hot-Swap Ready');
  const [injectedCount, setInjectedCount] = useState<number>(14);

  const executeHotSwap = () => {
    setSwapState('Compiling & Injecting React Module...');
    setTimeout(() => {
      setInjectedCount(prev => prev + 1);
      setSwapState('Module Hot-Swapped Successfully');
    }, 2500);
  };

  return (
    <div className="absolute top-[580px] right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#01579b] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Hot_Swap_Engine.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Engine State:</span>
          <span className="text-blue-900 font-bold">{swapState}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Injected Modules:</span>
          <span className="text-green-800 font-mono font-bold">{injectedCount} modules</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={executeHotSwap}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Execute Hot-Swap Inject
        </button>
      </div>
    </div>
  );
};
