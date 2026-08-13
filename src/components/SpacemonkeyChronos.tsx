import React, { useState } from 'react';
export const SpacemonkeyChronos: React.FC = () => {
  const [timeShift, setTimeShift] = useState(0);
  return (
    <div className="absolute top-4 left-4 bg-[#c0c0c0] border-2 p-2 w-64 shadow-lg">
      <div className="bg-[#2e003e] text-white p-1 font-bold text-xs">Chronos_Engine.exe</div>
      <div className="bg-white p-2 mt-1 text-[10px]">
        <p>Aika-avaruuden poikkeama: {timeShift}ms</p>
        <button onClick={() => setTimeShift(prev => prev + 96)} className="border mt-2 p-1 hover:bg-gray-200">Synkronoi Win96</button>
      </div>
    </div>
  );
};
