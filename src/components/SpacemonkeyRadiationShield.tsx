import React, { useState } from 'react';

export const SpacemonkeyRadiationShield: React.FC = () => {
  const [shieldActive, setShieldActive] = useState<boolean>(true);
  const [radiationLevel, setRadiationLevel] = useState<number>(0.01);

  const toggleShield = () => {
    setShieldActive(!shieldActive);
    setRadiationLevel(shieldActive ? 1.45 : 0.01);
  };

  return (
    <div className="absolute top-[680px] left-1/3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#311b92] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Radiation_Shield.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Shield Status:</span>
          <span className={shieldActive ? 'text-purple-900 font-bold' : 'text-red-700 font-bold'}>
            {shieldActive ? 'SHIELD ONLINE' : 'SHIELD OFFLINE'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Cosmic Flux:</span>
          <span className="text-blue-900 font-mono font-bold">{radiationLevel} mSv</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={toggleShield}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          {shieldActive ? 'Disable Shield' : 'Engage Shield'}
        </button>
      </div>
    </div>
  );
};
