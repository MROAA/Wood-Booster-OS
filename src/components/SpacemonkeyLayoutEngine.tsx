import React from 'react';
export const SpacemonkeyLayoutEngine: React.FC = () => {
  return (
    <div className="absolute top-52 left-4 bg-[#c0c0c0] border-2 p-2 w-64 shadow-lg">
      <div className="bg-[#bf360c] text-white p-1 font-bold text-xs">Layout_God_Mode.exe</div>
      <div className="bg-white p-2 mt-1 text-[10px]">
        <p>Nykyinen layout: OPTIMOITU</p>
        <button onClick={() => alert('Järjestelmä on täydellisessä tasapainossa.')} className="border mt-2 p-1 hover:bg-gray-200">Optimoi Työpöytä</button>
      </div>
    </div>
  );
};
