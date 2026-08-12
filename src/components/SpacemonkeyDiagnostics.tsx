import React, { useState } from 'react';

export const SpacemonkeyDiagnostics: React.FC = () => {
  const [scanState, setScanState] = useState<string>('All Systems Nominal');
  const [packetCount, setPacketCount] = useState<number>(1337);

  const runFullScan = () => {
    setScanState('Scanning Win96 Kernel & React Nodes...');
    setTimeout(() => {
      setPacketCount(prev => prev + 42);
      setScanState('All Systems Nominal (100% Secure)');
    }, 3000);
  };

  return (
    <div className="absolute bottom-68 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#000080] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Spacemonkey_Diagnostics.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">System Health:</span>
          <span className="text-green-700 font-bold">{scanState}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Processed Packets:</span>
          <span className="text-purple-900 font-mono font-bold">{packetCount}</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={runFullScan}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Run Full System Scan
        </button>
      </div>
    </div>
  );
};
