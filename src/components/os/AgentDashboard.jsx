import React from 'react';
import { agentManager } from '../../services/os/AgentManager';

export const AgentDashboard = () => {
  return (
    <div style={{ padding: '1rem', color: '#fff' }}>
      <h3 style={{ color: '#10b981' }}>OS Agent Hallinta</h3>
      <button onClick={() => agentManager.runAll()} style={{ background: '#10b981', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer' }}>
        Suorita kaikki agentit manuaalisesti
      </button>
    </div>
  );
};
