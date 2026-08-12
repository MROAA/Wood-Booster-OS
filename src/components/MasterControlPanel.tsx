import React, { useState } from 'react';
import { masterAutomation } from '../kernel/masterAutomation';

export const MasterControlPanel: React.FC = () => {
  const [status, setStatus] = useState(masterAutomation.getStatus());
  const [log, setLog] = useState('Valmiina aktivoimaan täysi automaatio.');

  const handleToggle = () => {
    if (status === 'ACTIVE_FULL_AUTOMATION') {
      const res = masterAutomation.stopMasterDaemon();
      setStatus(masterAutomation.getStatus());
      setLog(res);
    } else {
      const res = masterAutomation.startMasterDaemon(10); // Tarkistus 10 min välein
      setStatus(masterAutomation.getStatus());
      setLog(res);
    }
  };

  return (
    <div style={{ padding: '12px', background: '#09090b', color: '#fafafa', borderRadius: '8px', border: '2px solid #22c55e', fontSize: '12px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontWeight: 'bold', color: '#22c55e', textAlign: 'center' }}>🌟 MASTER AUTOMATION AUTOPILOT</div>

      <div style={{ background: '#18181b', padding: '6px', borderRadius: '4px', textAlign: 'center', fontSize: '11px' }}>
        Tila: <span style={{ color: status === 'ACTIVE_FULL_AUTOMATION' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>{status}</span>
      </div>

      <button 
        onClick={handleToggle}
        style={{ background: status === 'ACTIVE_FULL_AUTOMATION' ? '#ef4444' : '#22c55e', color: '#000', border: 'none', padding: '8px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
      >
        {status === 'ACTIVE_FULL_AUTOMATION' ? '⏹️ Pysäytä Autopilotti' : '🚀 Kytke Täysi Autopilotti Päälle'}
      </button>

      <div style={{ background: '#121214', color: '#4ade80', padding: '6px', borderRadius: '4px', fontSize: '11px' }}>
        <b>Autopilot Log:</b> {log}
      </div>
    </div>
  );
};
