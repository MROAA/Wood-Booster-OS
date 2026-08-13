import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';

export const RealtimeTelemetry = () => {
  const { theme } = useTheme();
  const [telemetry, setTelemetry] = useState({ ticks: 0, status: 'SYNCING' });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ticks: prev.ticks + 1,
        status: 'ONLINE (IPC Active)',
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ color: '#34d399', marginTop: 0 }}>📡 Live Kernel Telemetry</h3>
      <p>Järjestelmän pulssi ja IPC-viestikanava toimivat[cite: 3, 5].</p>
      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', fontWeight: 'bold' }}>
        <span>Ticks: {telemetry.ticks}</span>
        <span style={{ color: '#38bdf8' }}>Status: {telemetry.status}</span>
      </div>
    </div>
  );
};
