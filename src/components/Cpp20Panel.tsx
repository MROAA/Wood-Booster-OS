import React, { useState } from 'react';
import { cpp20Bridge } from '../kernel/cpp20Bridge';

export const Cpp20Panel: React.FC = () => {
  const [log, setLog] = useState('C++20 / C++7 -moottori valmiina.');

  const handleRun = () => {
    const res = cpp20Bridge.runAdvancedEngine();
    setLog(res);
  };

  return (
    <div style={{ padding: '8px', background: '#c0c0c0', color: '#000', border: '2px solid #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', fontSize: '11px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '2px 2px 0px #000000' }}>
      <div style={{ background: '#4a0404', color: '#fff', padding: '2px 4px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>CPP20_VECTOR_ENGINE.SYS</span>
        <span>[X]</span>
      </div>

      <div style={{ padding: '4px', background: '#ffffff', border: '1px inset #808080', minHeight: '30px', color: '#b91c1c' }}>
        {log}
      </div>

      <button 
        onClick={handleRun}
        style={{ background: '#c0c0c0', border: '2px outset #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '4px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        ⚡ Aja C++20 Metaprogramming Sykli
      </button>
    </div>
  );
};
