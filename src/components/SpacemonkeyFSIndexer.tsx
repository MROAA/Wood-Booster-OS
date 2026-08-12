import React, { useState } from 'react';

export const SpacemonkeyFSIndexer: React.FC = () => {
  const [indexStatus, setIndexStatus] = useState<string>('Filesystem Indexed');
  const [indexedFiles, setIndexedFiles] = useState<number>(42);

  const runReindex = () => {
    setIndexStatus('Re-indexing Win96 Directory Tree...');
    setTimeout(() => {
      setIndexedFiles(prev => prev + 3);
      setIndexStatus('Filesystem Indexed (0 Errors)');
    }, 2500);
  };

  return (
    <div className="absolute top-[680px] right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40 select-none">
      <div className="bg-[#1b5e20] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>FS_Indexer.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>
      <div className="space-y-1 bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white">
        <div className="flex justify-between">
          <span className="font-bold">Index Status:</span>
          <span className="text-green-900 font-bold">{indexStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Tracked Files:</span>
          <span className="text-blue-900 font-mono font-bold">{indexedFiles} items</span>
        </div>
      </div>
      <div className="mt-2">
        <button 
          onClick={runReindex}
          className="w-full bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Reindex Filesystem
        </button>
      </div>
    </div>
  );
};
