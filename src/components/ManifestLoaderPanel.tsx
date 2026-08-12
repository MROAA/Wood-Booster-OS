import React, { useState } from 'react';
import { manifestParser } from '../kernel/manifestParser';

export const ManifestLoaderPanel: React.FC = () => {
  const [status, setStatus] = useState('Valmiina lataamaan YAML-manifestin.');

  const handleBootFromYaml = () => {
    const mockYaml = `
      system: "Wood-Booster OS"
      autopilot_daemon:
        status: "ENABLED"
    `;
    const res = manifestParser.parseAndBootManifest(mockYaml);
    setStatus(res);
  };

  return (
    <div style={{ padding: '12px', background: '#09090b', color: '#fafafa', borderRadius: '8px', border: '1px solid #f59e0b', fontSize: '12px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontWeight: 'bold', color: '#f59e0b', textAlign: 'center' }}>📜 YAML MANIFEST BOOT LOADER</div>

      <button 
        onClick={handleBootFromYaml}
        style={{ background: '#d97706', color: '#fff', border: 'none', padding: '6px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
      >
        📥 Lataa ja aja järjestelmä YAML-manifestista
      </button>

      <div style={{ background: '#121214', color: '#fcd34d', padding: '6px', borderRadius: '4px', fontSize: '11px' }}>
        <b>Loader Log:</b> {status}
      </div>
    </div>
  );
};
