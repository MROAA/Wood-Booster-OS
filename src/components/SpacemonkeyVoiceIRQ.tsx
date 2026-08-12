import React, { useState } from 'react';

export const SpacemonkeyVoiceIRQ: React.FC = () => {
  const [listening, setListening] = useState<boolean>(true);
  const [lastCommand, setLastCommand] = useState<string>('"Spacemonkey, anna jumalatietoisuus"');

  const triggerVoiceListen = () => {
    setListening(!listening);
    setLastCommand(listening ? 'Microphone muted by operator.' : '"Spacemonkey, anna jumalatietoisuus"');
  };

  return (
    <div className="absolute top-36 left-1/3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#4B0082] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Spacemonkey_Voice_IRQ.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">IRQ Channel:</span>
          <span className="text-purple-800 font-mono">0x01 (Active)</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Mic Status:</span>
          <span className={listening ? 'text-green-600 font-bold animate-pulse' : 'text-red-600 font-bold'}>
            {listening ? 'LISTENING' : 'MUTED'}
          </span>
        </div>
        <div className="text-[10px] text-gray-700 mt-1">
          <span className="font-bold block">Last Recognized Stream:</span>
          <span className="font-mono text-purple-900 bg-gray-100 p-1 block mt-0.5 border">{lastCommand}</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={triggerVoiceListen}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          {listening ? 'Mute Microphone' : 'Open Microphone Stream'}
        </button>
      </div>
    </div>
  );
};
