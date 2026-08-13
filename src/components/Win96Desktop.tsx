/**
 * @file Win96Desktop.tsx
 * @brief Win96 Modular Workspace & Right-Click File Genesis Component
 */

import React, { useState } from 'react';

interface WinFile {
  name: string;
  type: string;
  content: string;
}

export const Win96Desktop: React.FC = () => {
  const [files, setFiles] = useState<WinFile[]>([
    { name: 'readme.txt', type: 'txt', content: 'Welcome to Wood-Booster-OS / Win96 Workspace.' },
    { name: 'manifest.yaml', type: 'yaml', content: 'manifest_tier: Omega-Prime\nguardian: Tommi' }
  ]);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const createNewFile = (type: string) => {
    const fileName = `new_file_${Date.now()}.${type}`;
    const newFile: WinFile = {
      name: fileName,
      type: type,
      content: `// Generated via Spacemonkey & Win96 Right-Click Genesis`
    };
    setFiles([...files, newFile]);
    setContextMenu(null);
  };

  return (
    <div 
      className="w-screen h-screen bg-[#008080] relative overflow-hidden select-none font-sans"
      onContextMenu={handleContextMenu}
      onClick={() => setContextMenu(null)}
    >
      {/* Desktop Grid Icons */}
      <div className="p-4 grid grid-cols-4 gap-4 w-64">
        {files.map((file, idx) => (
          <div key={idx} className="flex flex-col items-center cursor-pointer group p-1 hover:bg-[#005555] rounded">
            <div className="w-10 h-10 bg-gray-200 border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex items-center justify-center text-xs font-bold text-black shadow">
              {file.type.toUpperCase()}
            </div>
            <span className="text-white text-xs mt-1 drop-shadow text-center truncate w-full">{file.name}</span>
          </div>
        ))}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div 
          className="absolute bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black shadow-lg py-1 w-48 text-black text-xs z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <div className="px-3 py-1 font-bold border-b border-gray-400 text-gray-700">New File Genesis</div>
          <div className="px-4 py-1.5 hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => createNewFile('txt')}>Text Document (.txt)</div>
          <div className="px-4 py-1.5 hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => createNewFile('md')}>Markdown Note (.md)</div>
          <div className="px-4 py-1.5 hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => createNewFile('yaml')}>YAML Manifest (.yaml)</div>
          <div className="px-4 py-1.5 hover:bg-[#000080] hover:text-white cursor-pointer" onClick={() => createNewFile('cpp')}>C++ Source (.cpp)</div>
        </div>
      )}

      {/* Win96 Taskbar */}
      <div className="absolute bottom-0 w-full h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center px-2 justify-between shadow-inner">
        <button className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black px-3 py-1 font-bold text-black text-xs flex items-center gap-1 active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
          <span className="w-3 h-3 bg-red-600 inline-block"></span> Start
        </button>
        <div className="border-2 border-t-black border-l-black border-b-white border-r-white px-2 py-0.5 text-black text-xs bg-[#c0c0c0]">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
