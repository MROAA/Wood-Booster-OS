import React, { useState, useEffect } from 'react';

export const SpacemonkeyNeuralMesh: React.FC = () => {
  const [synapsesActive, setSynapsesActive] = useState<number>(1024);
  const [meshStatus, setMeshStatus] = useState<string>('Mesh Synchronized');

  useEffect(() => {
    const timer = setInterval(() => {
      setSynapsesActive(prev => (prev === 1024 ? 1048 : 1024));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const overclockMesh = () => {
    setMeshStatus('Overclocking Neural Weights to 9999 Hz!');
    setTimeout(() => setMeshStatus('Mesh Synchronized'), 3500);
  };

  return (
    <div className="absolute top-4 right-1/3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#300030] text-purple-300 px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Spacemonkey_Neural_Mesh.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Mesh Status:</span>
          <span className="text-purple-900 font-bold">{meshStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Active Synapses:</span>
          <span className="text-blue-900 font-mono font-bold">{synapsesActive} nodes</span>
        </div>
        <div className="h-10 bg-[#120024] border border-purple-900 mt-1 flex items-center justify-center">
          <span className="text-purple-300 font-mono text-[10px] animate-pulse">⚡ NEURAL WEIGHTS ACTIVE ⚡</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={overclockMesh}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Overclock Synapses
        </button>
      </div>
    </div>
  );
};
