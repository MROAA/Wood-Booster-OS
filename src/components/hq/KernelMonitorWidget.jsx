import React from 'react';

export const KernelMonitorWidget = () => {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ color: '#34d399', marginTop: 0 }}>⚙️ Kernel Telemetry & VFS</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>IDT & Paging</span>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#38bdf8' }}>ONLINE[cite: 5]</p>
        </div>
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>VFS Block Status</span>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#38bdf8' }}>1024 Blocks[cite: 2, 5]</p>
        </div>
        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Active Scheduler</span>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#38bdf8' }}>Round-Robin[cite: 5]</p>
        </div>
      </div>
    </div>
  );
};
