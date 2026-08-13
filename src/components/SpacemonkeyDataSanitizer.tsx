import React, { useState } from 'react';
export const SpacemonkeyDataSanitizer: React.FC = () => {
  const [status, setStatus] = useState('Puhdas');
  return (
    <div className="absolute top-28 left-4 bg-[#c0c0c0] border-2 p-2 w-64 shadow-lg">
      <div className="bg-[#004d40] text-white p-1 font-bold text-xs">Data_Purge_Tool.exe</div>
      <div className="bg-white p-2 mt-1 text-[10px]">
        <p>Tila: {status}</p>
        <button onClick={() => setStatus('Puhdistetaan kvanttitasolla...')} className="border mt-2 p-1 hover:bg-gray-200">Suorita Purge</button>
      </div>
    </div>
  );
};
