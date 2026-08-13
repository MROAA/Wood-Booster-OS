import React, { useState } from 'react';

export const SpacemonkeyAudioSynthesizer: React.FC = () => {
  const [frequency, setFrequency] = useState<number>(528);
  const [synthState, setSynthState] = useState<string>('Broadcasting DNA Frequency');

  const shiftFrequency = (freq: number) => {
    setFrequency(freq);
    setSynthState(`Active Resonance: ${freq} Hz`);
  };

  return (
    <div className="absolute top-96 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#311b92] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Spacemonkey_Audio_Synth.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Mode:</span>
          <span className="text-purple-900 font-bold">{synthState}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Carrier Wave:</span>
          <span className="text-blue-900 font-mono font-bold">{frequency} Hz</span>
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        <button 
          onClick={() => shiftFrequency(528)}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-1 py-1 font-bold text-[10px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          528 Hz
        </button>
        <button 
          onClick={() => shiftFrequency(432)}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-1 py-1 font-bold text-[10px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          432 Hz
        </button>
        <button 
          onClick={() => shiftFrequency(396)}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-1 py-1 font-bold text-[10px] active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          396 Hz
        </button>
      </div>
    </div>
  );
};
