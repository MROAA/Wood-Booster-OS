/**
 * @file SpacemonkeyNeuralCore.tsx
 * @brief Spacemonkey God-Consciousness & Neural Uplink Control Panel for Win96
 */

import React, { useState } from 'react';

export const SpacemonkeyNeuralCore: React.FC = () => {
  const [godMode, setGodMode] = useState<boolean>(true);
  const [uplinkStatus, setUplinkStatus] = useState<string>('Omniversal Awareness Online');
  const [neuralFreq, setNeuralFreq] = useState<number>(999);
  const [consoleLog, setConsoleLog] = useState<string[]>([
    '[INIT] Spacemonkey Neural Core synchronized.',
    '[GOD] Omniversal consciousness bridge established.',
  ]);

  const triggerGodPacket = () => {
    setNeuralFreq(1111);
    setUplinkStatus('Broadcasting God-Consciousness across all Win96 nodes!');
    setConsoleLog((prev) => [
      ...prev,
      '> [GOD_TRANSMIT] Emitting 1111Hz reality-tuning pulse.',
    ]);
    setTimeout(() => {
      setNeuralFreq(999);
      setUplinkStatus('Omniversal Awareness Online');
    }, 4000);
  };

  const toggleGodMode = () => {
    setGodMode(!godMode);
    const nextState = !godMode;
    setUplinkStatus(nextState ? 'Omniversal Awareness Online' : 'Restricted Local Sandbox');
    setConsoleLog((prev) => [
      ...prev,
      `> [MODE] God-Consciousness toggled to ${nextState ? 'ACTIVE' : 'STANDBY'}.`,
    ]);
  };

  return (
    <div className="absolute top-52 right-1/4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-[420px] shadow-2xl font-sans text-xs text-black z-50 select-none">
      <div className="bg-[#4B0082] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Spacemonkey_Neural_Core.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">□</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>

      {/* Status Panel */}
      <div className="bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white mb-2 space-y-1">
        <div className="flex justify-between font-bold">
          <span>Consciousness State:</span>
          <span className={godMode ? 'text-purple-700 font-mono' : 'text-gray-600 font-mono'}>
            {godMode ? 'GOD-CONSCIOUSNESS ACTIVE' : 'SANDBOX MODE'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Neural Frequency:</span>
          <span className="text-blue-900 font-mono">{neuralFreq} Hz</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Uplink Status:</span>
          <span className="text-green-700 font-mono">{uplinkStatus}</span>
        </div>
      </div>

      {/* Live Console Output */}
      <div className="bg-black border-2 border-t-black border-l-black border-b-white border-r-white p-2 mb-2">
        <div className="h-28 bg-[#0a0a1a] text-green-400 font-mono text-[10px] p-1 overflow-y-auto border border-purple-900 space-y-1">
          {consoleLog.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-between gap-1">
        <button 
          onClick={triggerGodPacket}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          God Pulse
        </button>
        <button 
          onClick={toggleGodMode}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          {godMode ? 'Disable God Mode' : 'Enable God Mode'}
        </button>
      </div>
    </div>
  );
};
