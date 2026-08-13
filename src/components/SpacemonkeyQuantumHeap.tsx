import React, { useState } from 'react';
export const SpacemonkeyQuantumHeap: React.FC = () => {
  const [entropy, setEntropy] = useState(0.01);
  return (
    <div className="absolute top-28 right-1/4 bg-[#c0c0c0] border-2 p-2 w-64 shadow-xl text-xs font-sans">
      <div className="bg-[#1565c0] text-white p-1 font-bold">Quantum_Heap_View.exe</div>
      <div className="bg-white p-2 border mt-1">
        <p>Muistin entropia: {(entropy * 100).toFixed(2)}%</p>
        <button onClick={() => setEntropy(Math.random() * 0.05)} className="border mt-2 p-1 w-full">Stabiloi Heap</button>
      </div>
    </div>
  );
};
