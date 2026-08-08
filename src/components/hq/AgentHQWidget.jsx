import React from 'react';

export const AgentHQWidget = () => {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', padding: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ color: '#38bdf8', marginTop: 0 }}>🤖 Active Autonomous Agents</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0' }}>
        <li style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>ResourceMonitorAgent</span>
          <span style={{ color: '#34d399' }}>RUNNING</span>
        </li>
        <li style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
          <span>LogCleanerAgent</span>
          <span style={{ color: '#34d399' }}>IDLE</span>
        </li>
      </ul>
    </div>
  );
};
