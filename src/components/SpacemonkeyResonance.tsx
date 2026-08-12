import React, { useState } from 'react';
export const SpacemonkeyResonance: React.FC = () => {
  const [freq, setFreq] = useState(432);
  return (
    <div className="absolute top-4 right-1/4 bg-[#c0c0c0] border-2 p-2 w-64 shadow-xl text-xs font-sans">
      <div className="bg-[#5d4037] text-white p-1 font-bold">Resonance_Field.exe</div>
      <div className="bg-white p-2 border mt-1">
        <p className="font-bold">Nykyinen taajuus: {freq} Hz</p>
        <div className="flex gap-1 mt-2">
          <button onClick={() => setFreq(528)} className="border px-1">DNA_Repair</button>
          <button onClick={() => setFreq(432)} className="border px-1">Reset</button>
        </div>
      </div>
    </div>
  );
};
