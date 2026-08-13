import React, { useState } from 'react';
import { multiLayerShield } from '../kernel/multiLayerShield';

export const MultiLayerSecurityPanel: React.FC = () => {
  const [log, setLog] = useState('Turvakerrokset valmiina.');
  const layers = multiLayerShield.getActiveLayers();

  const handleDeepScan = () => {
    const res = multiLayerShield.runDeepSecurityScan();
    setLog(res);
  };

  return (
    <div style={{ padding: '12px', background: '#09090b', color: '#fafafa', borderRadius: '8px', border: '1px solid #3b82f6', fontSize: '12px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontWeight: 'bold', color: '#60a5fa', textAlign: 'center' }}>🛡️ MULTI-LAYER CYBER SHIELD ARCHITECTURE</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#18181b', padding: '6px', borderRadius: '4px' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>AKTIIVISET TURVAKERROKSET:</span>
        {layers.map((l, index) => (
          <div key={index} style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🔒</span> {l}
          </div>
        ))}
      </div>

      <button 
        onClick={handleDeepScan}
        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
      >
        🔍 Aja syvä kyberturvatarkastus
      </button>

      <div style={{ background: '#121214', color: '#93c5fd', padding: '6px', borderRadius: '4px', fontSize: '11px' }}>
        <b>Shield Log:</b> {log}
      </div>
    </div>
  );
};
