import React from 'react';
import { AltrakoReflection } from './AltrakoReflection';
import { SystemPulse } from './SystemPulse';

export const AltrakoDashboard = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '1.5rem', 
      padding: '2.5rem', 
      background: '#090d16', 
      minHeight: '100vh', 
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      <div style={{ flex: 1, minWidth: '350px' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ color: '#38bdf8', margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>Altrako 1.0 Command Center</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>Autonominen järjestelmäpeilaus, riskienhallinta ja muistikerros.</p>
        </header>
        <AltrakoReflection />
      </div>
      
      <div style={{ width: '320px' }}>
        <SystemPulse />
      </div>
    </div>
  );
};
