import React, { useState } from 'react';

export const SpacemonkeyCosmicRelay: React.FC = () => {
  const [relayLink, setRelayLink] = useState<string>('Relay Active: Oulu Node');
  const [packetRate, setPacketRate] = useState<number>(9999);

  const boostRelay = () => {
    setRelayLink('Broadcasting across Nebula Relay...');
    setPacketRate(prev => prev + 1000);
    setTimeout(() => setRelayLink('Relay Active: Oulu Node'), 3000);
  };

  return (
    <div className="absolute top-[480px] right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#006064] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Cosmic_Relay.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Relay State:</span>
          <span className="text-cyan-900 font-bold">{relayLink}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Bandwidth:</span>
          <span className="text-green-800 font-mono font-bold">{packetRate} Bd</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={boostRelay}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Boost Cosmic Relay
        </button>
      </div>
    </div>
  );
};
