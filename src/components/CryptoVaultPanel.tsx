import React, { useState } from 'react';
import { cryptoBridge } from '../kernel/cryptoBridge';

export const CryptoVaultPanel: React.FC = () => {
  const [inputData, setInputData] = useState('Verstas_Muistio_Sahatiedot_12.08');
  const [signature, setSignature] = useState('Ei allekirjoitettu.');

  const handleSign = () => {
    const sig = cryptoBridge.signWorkshopData(inputData);
    setSignature(sig);
  };

  return (
    <div style={{ padding: '12px', background: '#09090b', color: '#fafafa', borderRadius: '8px', border: '1px solid #10b981', fontSize: '12px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontWeight: 'bold', color: '#34d399', textAlign: 'center' }}>🔐 C++ CRYPTOGRAPHIC VAULT</div>

      <input 
        type="text" 
        value={inputData} 
        onChange={(e) => setInputData(e.target.value)}
        style={{ background: '#18181b', color: '#fff', border: '1px solid #27272a', padding: '6px', borderRadius: '4px', fontSize: '11px' }}
      />

      <button 
        onClick={handleSign}
        style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
      >
        🔏 Allekirjoita muisti C++ Vaultilla
      </button>

      <div style={{ background: '#121214', color: '#6ee7b7', padding: '6px', borderRadius: '4px', fontSize: '11px', wordBreak: 'break-all' }}>
        <b>Vault Sign:</b> {signature}
      </div>
    </div>
  );
};
