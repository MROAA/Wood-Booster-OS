import React, { useState } from 'react';

export const WoodBoosterEcoSensor: React.FC = () => {
  const [biomassFlow, setBiomassFlow] = useState<number>(98.5);
  const [sensorStatus, setSensorStatus] = useState<string>('Sensors Calibrated');

  const calibrateSensors = () => {
    setSensorStatus('Recalibrating Laser & Wood Sensors...');
    setTimeout(() => {
      setBiomassFlow(100.0);
      setSensorStatus('Sensors Calibrated');
    }, 2500);
  };

  return (
    <div className="absolute bottom-36 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#5c4033] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>WoodBooster_Eco_Sensor.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Status:</span>
          <span className="text-green-800 font-bold">{sensorStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Biomass Yield:</span>
          <span className="text-blue-900 font-mono font-bold">{biomassFlow}%</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={calibrateSensors}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Calibrate Ecosystem
        </button>
      </div>
    </div>
  );
};
