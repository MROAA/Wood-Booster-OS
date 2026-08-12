import React, { useState } from 'react';
import { evolutionBridge } from '../kernel/evolutionBridge';

export const EvolutionPanel: React.FC = () => {
  const [log, setLog] = useState('Itseparannusmoottori valmiina.');

  const handleEvolve = () => {
    const res = evolutionBridge.triggerEvolutionCycle();
    setLog(res);
  };

  return (
    <div style={{ padding: '8px', background: '#c0c0c0', color: '#000', border: '2px solid #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', fontSize: '11px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '2px 2px 0px #000000' }}>
      <div style={{ background: '#3f6212', color: '#ecfccb', padding: '2px 4px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>SPACEMONKEY_EVOLUTION.SYS</span>
        <span>[X]</span>
      </div>

      <div style={{ padding: '4px', background: '#ffffff', border: '1px inset #808080', minHeight: '35px', color: '#3f6212', fontWeight: 'bold' }}>
        {log}
      </div>

      <button 
        onClick={handleEvolve}
        style={{ background: '#c0c0c0', border: '2px outset #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#1a2e05' }}
      >
        🧬 Käynnistä Itseparannussykli
      </button>
    </div>
  );
};
