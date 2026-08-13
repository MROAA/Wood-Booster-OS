import React, { useState } from 'react';

export const SpacemonkeyFileCreator: React.FC = () => {
  const [fileName, setFileName] = useState<string>('New_Document.txt');
  const [createdList, setCreatedList] = useState<string[]>(['Spacemonkey_Log.txt', 'WoodBooster_Specs.md']);

  const createTextFile = () => {
    const newName = `Quantum_Note_${Math.floor(Math.random() * 100)}.txt`;
    setFileName(newName);
    setCreatedList(prev => [newName, ...prev]);
  };

  return (
    <div className="absolute top-36 right-1/3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#000080] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Win96_Context_File_Creator.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Action Trigger:</span>
          <span className="text-blue-900 font-bold">Right-Click Context Menu</span>
        </div>
        <div className="text-[10px] text-gray-700 mt-1">
          <span className="font-bold block">Recent Files Created:</span>
          <div className="bg-gray-100 p-1 border mt-1 space-y-0.5 font-mono text-purple-900 h-14 overflow-y-auto">
            {createdList.map((file, idx) => (
              <div key={idx}>📄 {file}</div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={createTextFile}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Simulate Right-Click: New Text File
        </button>
      </div>
    </div>
  );
};
