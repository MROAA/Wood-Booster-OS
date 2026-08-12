import React, { useState } from 'react';
import { securitySentinel } from '../kernel/securitySentinel';

export const SecuritySentinelPanel: React.FC = () => {
  const [status, setStatus] = useState('Sentinel valvoo järjestelmää.');
  const [threat, setThreat] = useState(securitySentinel.getThreatStatus());

  const handleScan = () => {
    const res = securitySentinel.inspectSystemIntegrity();
    setStatus(res);
    setThreat(securitySentinel.getThreatStatus());
  };

  return (
    <div style={{ padding: '12px', background: '#09090b', color: '#fafafa', borderRadius: '8px', border: '1px solid #ef4444', fontSize: '12px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontWeight: 'bold', color: '#ef4444', textAlign: 'center' }}>🛡️ SPACEMONKEY SECURITY SENTINEL</div>

      <div style={{ background: '#18181b', padding: '6px', borderRadius: '4px', textAlign: 'center', fontSize: '11px' }}>
        Uhkataso: <span style={{ color: threat === 'LOW' ? '#22c55e' : '#f59e0b', fontWeight: 'bold' }}>{threat}</span>
      </div>

      <button 
        onClick={handleScan}
        style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
      >
        🔒 Suorita tietoturva- ja eheyteilytarkastus
      </button>

      <div style={{ background: '#121214', color: '#fca5a5', padding: '6px', borderRadius: '4px', fontSize: '11px' }}>
        <b>Sentinel Log:</b> {status}
      </div>
    </div>
  );
};
