import React from 'react';
export const SpacemonkeyNetMonitor: React.FC = () => {
  return (
    <div className="absolute top-52 right-1/4 bg-[#c0c0c0] border-2 p-2 w-64 shadow-xl text-xs font-sans">
      <div className="bg-[#2e7d32] text-white p-1 font-bold">Interstellar_Link.exe</div>
      <div className="bg-white p-2 border mt-1">
        <p>Yhteys: Oulu → Nebula 9</p>
        <div className="w-full bg-gray-300 h-2 mt-2"><div className="bg-green-600 h-full w-[99%]"></div></div>
        <p className="mt-1 text-[10px] text-green-800 italic">Signaali 100% vahva</p>
      </div>
    </div>
  );
};
