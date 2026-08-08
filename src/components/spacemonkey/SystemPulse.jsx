import React, { useState, useEffect } from 'react';
import { altrakoEngine } from '../../services/AltrakoEngine';
import { ResourceMonitorAgent } from '../../services/os/agents/ResourceMonitorAgent';

export const SystemPulse = () => {
  const [health, setHealth] = useState({ status: 'STABLE', message: 'Ladataan...' });
  const [usage, setUsage] = useState(0);

  useEffect(() => {
    setHealth(altrakoEngine.performHealthCheck());
    
    // Päivitetään kuormitus 3 sekunnin välein
    const interval = setInterval(() => {
      setUsage(ResourceMonitorAgent.execute());
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  const isWarning = health.status === 'WARNING' || usage > 90;

  return (
    <div style={{ background: '#111827', border: `1px solid ${isWarning ? '#ef4444' : '#374151'}`, borderRadius: '12px', padding: '1.25rem', color: '#fff' }}>
      <h4 style={{ margin: '0 0 1rem 0', color: '#60a5fa' }}>⚡ System Pulse</h4>
      <div style={{ fontSize: '0.9rem' }}>
        <p>Järjestelmän kuormitus: <strong>{usage}%</strong></p>
        <div style={{ background: '#1f2937', padding: '0.5rem', borderRadius: '4px' }}>
          {health.message}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { altrakoEngine } from '../../services/AltrakoEngine';

export const SystemPulse = () => {
  const [health, setHealth] = useState({ status: 'STABLE', message: 'Ladataan...' });

  useEffect(() => {
    // Haetaan terveydentila Altrakon moottorilta
    const currentHealth = altrakoEngine.performHealthCheck();
    setHealth(currentHealth);
  }, []);

  const isWarning = health.status === 'WARNING';

  return (
    <div style={{ 
      background: '#111827', 
      border: `1px solid ${isWarning ? '#ef4444' : '#374151'}`, 
      borderRadius: '12px', 
      padding: '1.25rem', 
      color: '#fff', 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
    }}>
      <h4 style={{ margin: '0 0 1rem 0', color: isWarning ? '#fca5a5' : '#60a5fa', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>⚡</span> System Pulse {isWarning && '⚠️'}
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1f2937', paddingBottom: '0.4rem' }}>
          <span style={{ color: '#9ca3af' }}>AI Brain</span>
          <span style={{ color: '#34d399', fontWeight: 'bold' }}>11 / 11</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1f2937', paddingBottom: '0.4rem' }}>
          <span style={{ color: '#9ca3af' }}>Architecture</span>
          <span style={{ color: '#34d399', fontWeight: 'bold' }}>100 / 100</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2937', paddingBottom: '0.4rem' }}>
          <span style={{ color: '#9ca3af' }}>Altrako</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: isWarning ? '#ef4444' : '#34d399', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ color: isWarning ? '#fca5a5' : '#34d399', fontWeight: 'bold' }}>
              {isWarning ? 'warning' : 'online'}
            </span>
          </div>
        </div>

        <div style={{ marginTop: '0.5rem', background: '#1f2937', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: isWarning ? '#fca5a5' : '#9ca3af' }}>
          <strong>Health Status:</strong> {health.message}
        </div>
      </div>
    </div>
  );
};
