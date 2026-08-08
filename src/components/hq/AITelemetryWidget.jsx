import React from 'react';

export const AITelemetryWidget = () => {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ color: '#a855f7', marginTop: 0 }}>🧠 Neural Kernel & LLM Telemetry</h3>
      <p style={{ color: '#cbd5e1' }}>Ytimen sisäinen neuroverkko ja huomiomekanismi (Self-Attention) aktiivisina[cite: 3].</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Vocab & Embedding</span>
          <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#c084fc' }}>512 / 64-dim[cite: 3]</p>
        </div>
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Attention Status</span>
          <p style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#34d399' }}>OPTIMIZED</p>
        </div>
      </div>
    </div>
  );
};
