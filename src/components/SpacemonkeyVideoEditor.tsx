/**
 * @file SpacemonkeyVideoEditor.tsx
 * @brief Spacemonkey AI Video Editing Suite & Timeline Chronosphere for Win96
 */

import React, { useState } from 'react';

export const SpacemonkeyVideoEditor: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [clipCount, setClipCount] = useState<number>(3);
  const [timelineStatus, setTimelineStatus] = useState<string>('Ready for Quantum Cuts');
  const [activeEffect, setActiveEffect] = useState<string>('None (Raw Feed)');

  const addQuantumCut = () => {
    setClipCount((prev) => prev + 1);
    setTimelineStatus('Inserted AI Auto-Cut at current head');
    setTimeout(() => setTimelineStatus('Ready for Quantum Cuts'), 3000);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    setTimelineStatus(isPlaying ? 'Playback Paused' : 'Rendering Chronosphere Timeline...');
  };

  const applyMatrixFilter = () => {
    setActiveEffect('Matrix Glitch & 528Hz Color Grade');
    setTimelineStatus('Applied Spacemonkey Neural Video Filter');
  };

  return (
    <div className="absolute top-52 left-1/4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-[420px] shadow-2xl font-sans text-xs text-black z-50 select-none">
      <div className="bg-[#4B0082] text-white px-2 py-1 font-bold flex justify-between items-center mb-2 border border-black cursor-move">
        <span>Spacemonkey_Video_Editor.exe</span>
        <span className="flex gap-1">
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">_</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">□</button>
          <button className="bg-[#c0c0c0] text-black px-1 border border-black text-[10px]">X</button>
        </span>
      </div>

      {/* Monitor Display */}
      <div className="bg-black border-2 border-t-black border-l-black border-b-white border-r-white p-2 mb-2">
        <div className="h-36 bg-[#0a0a1a] flex flex-col justify-center items-center text-center relative overflow-hidden border border-purple-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black"></div>
          <span className="text-purple-400 font-mono text-sm font-bold z-10">SPACEMONKEY CHRONOSPHERE</span>
          <span className="text-gray-400 text-[10px] mt-1 z-10">Active Effect: {activeEffect}</span>
          <span className="text-green-400 font-mono text-xs mt-2 z-10 animate-pulse">
            {isPlaying ? '▶ STREAMING TIMELINE (60 FPS)' : '⏸ TIMELINE PAUSED'}
          </span>
        </div>
      </div>

      {/* Timeline Track */}
      <div className="bg-white p-2 border-2 border-t-black border-l-black border-b-white border-r-white mb-2 space-y-1">
        <div className="flex justify-between text-[10px] font-bold text-gray-700">
          <span>Clips in Timeline: {clipCount}</span>
          <span className="text-blue-900">{timelineStatus}</span>
        </div>
        <div className="flex gap-1 h-8 bg-gray-200 p-1 border border-black items-center overflow-x-auto">
          <div className="bg-purple-600 text-white px-2 py-1 text-[10px] font-mono whitespace-nowrap border border-black">Clip_01.mp4</div>
          <div className="bg-indigo-600 text-white px-2 py-1 text-[10px] font-mono whitespace-nowrap border border-black">Spacemonkey_AI_Cut</div>
          <div className="bg-purple-800 text-white px-2 py-1 text-[10px] font-mono whitespace-nowrap border border-black">Altrako_Transition</div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-between gap-1">
        <button 
          onClick={togglePlayback}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button 
          onClick={addQuantumCut}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          AI Auto-Cut
        </button>
        <button 
          onClick={applyMatrixFilter}
          className="flex-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-2 py-1 font-bold active:border-t-black active:border-l-black active:border-b-white active:border-r-white hover:bg-[#d0d0d0]"
        >
          Matrix Grade
        </button>
      </div>
    </div>
  );
};
