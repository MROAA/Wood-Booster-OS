import React, { useState } from 'react';
import { memoryMaintenance } from '../kernel/memoryMaintenance';

export const NeuralMaintenancePanel: React.FC = () => {
  const [log, setLog] = useState('Valmiina optimoimaan vektorimuistia.');

  const handleCompact = () => {
    const res = memoryMaintenance.performCompaction();
    setLog(res);
  };

  return (
    <div style={{ padding: '12px', background: '#09090b', color: '#fafafa', borderRadius: '8px', border: '1px solid #7e22ce', fontSize: '12px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontWeight: 'bold', color: '#c084fc', textAlign: 'center' }}>🧠 NEURAL MAINTENANCE ENGINE</div>
      
      <div style={{ fontSize: '11px', color: '#d4d4d8', marginBottom: '4px' }}>
        Tila: Spacemonkey suorittaa natiivia muistin optimointia C++-tasolla poistaakseen RAG-tietokannan kohinan.
      </div>

      <button 
        onClick={handleCompact}
        style={{ background: '#7e22ce', color: '#fff', border: 'none', padding: '6px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
      >
        🚀 Suorita natiivi muistin tiivistäminen
      </button>

      <div style={{ background: '#121214', color: '#c084fc', padding: '6px', borderRadius: '4px', fontSize: '11px' }}>
        <b>System Log:</b> {log}
      </div>
    </div>
  );
};
