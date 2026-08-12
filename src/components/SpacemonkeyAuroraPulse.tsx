import React, { useState } from 'react';

export const SpacemonkeyAuroraPulse: React.FC = () => {
  const [pulseFreq, setPulseFreq] = useState<number>(741);
  const [pulseState, setPulseState] = useState<string>('Aurora Field Locked');

  const triggerPulse = () => {
    setPulseState('Emitting Aurora Pulse to Win96...');
    setPulseFreq(852);
    setTimeout(() => {
      setPulseState('Aurora Field Locked');
      setPulseFreq(741);
    }, 3000);
  };

  return (
    <div className="absolute top-[580px] left-1/3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#00695c] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Aurora_Pulse.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Pulse State:</span>
          <span className="text-teal-900 font-bold">{pulseState}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Frequency:</span>
          <span className="text-purple-900 font-mono font-bold">{pulseFreq} Hz</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={triggerPulse}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Emit Aurora Pulse
        </button>
      </div>
    </div>
  );
};
