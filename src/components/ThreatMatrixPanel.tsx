import React, { useState } from 'react';
import { advancedGuard } from '../kernel/advancedGuard';

export const ThreatMatrixPanel: React.FC = () => {
  const [stats, setStats] = useState({ blocked: 0, status: 'SYSTEM_CLEAN' });

  const runHardenedScan = () => {
    const isSafe = advancedGuard.verifyMemoryState();
    if (!isSafe) {
      setStats({ blocked: stats.blocked + 1, status: 'INTRUSION_DETECTED' });
    } else {
      setStats({ ...stats, status: 'SYSTEM_CLEAN' });
    }
  };

  return (
    <div style={{ padding: '12px', background: '#09090b', color: '#fafafa', borderRadius: '8px', border: '1px solid #7f1d1d', fontSize: '12px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontWeight: 'bold', color: '#f87171', textAlign: 'center' }}>🚨 THREAT MATRIX: HARDENED DEFENSE</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div style={{ background: '#18181b', padding: '6px', borderRadius: '4px' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>ESTETYT UHAT</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>{stats.blocked}</div>
        </div>
        <div style={{ background: '#18181b', padding: '6px', borderRadius: '4px' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>JÄRJESTELMÄN TILA</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#22c55e', marginTop: '4px' }}>{stats.status}</div>
        </div>
      </div>

      <button 
        onClick={runHardenedScan}
        style={{ background: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}
      >
        🛰️ Aktivoi Hardened Memory Scan
      </button>
    </div>
  );
};
