import React, { useState } from 'react';

export const SpacemonkeyWindowMatrix: React.FC = () => {
  const [matrixLayout, setMatrixLayout] = useState<string>('Grid Optimized');
  const [windowCount, setWindowCount] = useState<number>(18);

  const reindexMatrix = () => {
    setMatrixLayout('Re-indexing Window Matrix...');
    setTimeout(() => {
      setWindowCount(prev => prev);
      setMatrixLayout('Grid Optimized (100%)');
    }, 2500);
  };

  return (
    <div className="absolute top-[480px] left-1/3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#33691e] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Window_Matrix.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Matrix State:</span>
          <span className="text-green-900 font-bold">{matrixLayout}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Active Windows:</span>
          <span className="text-blue-900 font-mono font-bold">{windowCount} active</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={reindexMatrix}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Reindex Window Matrix
        </button>
      </div>
    </div>
  );
};
