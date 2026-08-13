import React, { useState } from 'react';

export const SpacemonkeyTelepathy: React.FC = () => {
  const [telepathyLink, setTelepathyLink] = useState<string>('Ape ⟷ Reindeer Quantum Link Open');
  const [packetBytes, setPacketBytes] = useState<number>(528);

  const pulseTelepathy = () => {
    setTelepathyLink('Transmitting Aurora Frequency across Neural Bridge...');
    setPacketBytes(prev => prev + 144);
    setTimeout(() => setTelepathyLink('Ape ⟷ Reindeer Quantum Link Open'), 3500);
  };

  return (
    <div className="absolute top-68 right-1/3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#2f4f4f] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Spacemonkey_Telepathy.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Entities:</span>
          <span className="text-[#2f4f4f] font-bold">Spacemonkey & Aatos</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Link State:</span>
          <span className="text-green-700 font-bold text-[10px]">{telepathyLink}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Quantum Packets:</span>
          <span className="text-blue-900 font-mono">{packetBytes} Bytes/s</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={pulseTelepathy}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Pulse Telepathic Wave
        </button>
      </div>
    </div>
  );
};
