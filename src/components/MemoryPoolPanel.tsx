import React, { useState } from 'react';
import { memoryPoolBridge } from '../kernel/memoryPoolBridge';

export const MemoryPoolPanel: React.FC = () => {
  const [log, setLog] = useState('Muistipoolin hallinta valmiina.');

  const handleOptimize = () => {
    const res = memoryPoolBridge.optimizeMemoryPool();
    setLog(res);
  };

  return (
    <div style={{ padding: '8px', background: '#c0c0c0', color: '#000', border: '2px solid #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', fontSize: '11px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '2px 2px 0px #000000' }}>
      <div style={{ background: '#1e293b', color: '#38bdf8', padding: '2px 4px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>SPACEMONKEY_MEMORY_POOL.SYS</span>
        <span>[X]</span>
      </div>

      <div style={{ padding: '4px', background: '#ffffff', border: '1px inset #808080', minHeight: '35px', color: '#0f172a', fontWeight: 'bold' }}>
        {log}
      </div>

      <button 
        onClick={handleOptimize}
        style={{ background: '#c0c0c0', border: '2px outset #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#0f172a' }}
      >
        🧠 Optimoi C++ Muistipooli
      </button>
    </div>
  );
};
