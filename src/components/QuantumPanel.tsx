import React, { useState } from 'react';
import { quantumBridge } from '../kernel/quantumBridge';

export const QuantumPanel: React.FC = () => {
  const [log, setLog] = useState('Kvanttimoottori valmiina.');

  const handleSuperpose = () => {
    const res = quantumBridge.triggerSuperposition();
    setLog(res);
  };

  return (
    <div style={{ padding: '8px', background: '#c0c0c0', color: '#000', border: '2px solid #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', fontSize: '11px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '2px 2px 0px #000000' }}>
      <div style={{ background: '#3b0764', color: '#fff', padding: '2px 4px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>QUANTUM_VECTOR_VAULT.SYS</span>
        <span>[X]</span>
      </div>

      <div style={{ padding: '4px', background: '#ffffff', border: '1px inset #808080', minHeight: '30px', color: '#7e22ce' }}>
        {log}
      </div>

      <button 
        onClick={handleSuperpose}
        style={{ background: '#c0c0c0', border: '2px outset #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '4px', fontWeight: 'bold', cursor: 'pointer' }}
      >
        ⚛️ Kytke Kvanttisuperpositio Päälle
      </button>
    </div>
  );
};
