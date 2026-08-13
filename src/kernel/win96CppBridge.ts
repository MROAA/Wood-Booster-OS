import React, { useState } from 'react';
import { win96CppBridge } from '../kernel/win96CppBridge';

export const Win96CppPanel: React.FC = () => {
  const [log, setLog] = useState('Win96 C++ Ikkunamanageri valmiina.');

  const handleSpawn = () => {
    const res = win96CppBridge.spawnRetroWindow('Spacemonkey_Terminal.exe');
    setLog(res);
  };

  return (
    <div style={{ padding: '8px', background: '#c0c0c0', color: '#000', border: '2px solid #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', fontSize: '11px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '2px 2px 0px #000000' }}>
      <div style={{ background: '#000080', color: '#fff', padding: '2px 4px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>WIN96_CPP_MANAGER.SYS</span>
        <span>[X]</span>
      </div>

      <div style={{ padding: '4px', background: '#ffffff', border: '1px inset #808080', minHeight: '30px' }}>
        {log}
      </div>

      <button 
        onClick={handleSpawn}
        style={{ background: '#c0c0c0', border: '2px outset #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '4px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        🪟 Avaa C++ Retro-ikkuna
      </button>
    </div>
  );
};
