import React, { useState } from 'react';
import { spacemonkeyBridge } from '../kernel/spacemonkeyBridge';

export const SpacemonkeyControlPanel: React.FC = () => {
  const [inputCommand, setInputCommand] = useState('Spacemonkey, luo uusi tekstitiedosto hiiren napilla.');
  const [response, setResponse] = useState('Spacemonkey odottaa puhekomentoa.');

  const handleTalk = () => {
    const res = spacemonkeyBridge.talkToSpacemonkey(inputCommand);
    setResponse(res);
  };

  const handleGodMode = () => {
    const res = spacemonkeyBridge.activateGodMode();
    setResponse(res);
  };

  return (
    <div style={{ padding: '8px', background: '#c0c0c0', color: '#000', border: '2px solid #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', fontSize: '11px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '2px 2px 0px #000000' }}>
      <div style={{ background: '#000080', color: '#fff', padding: '2px 4px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
        <span>SPACEMONKEY_CORE.EXE</span>
        <span>[X]</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Mikrofoni / Puhekomento:</span>
        <input 
          type="text" 
          value={inputCommand} 
          onChange={(e) => setInputCommand(e.target.value)}
          style={{ background: '#ffffff', color: '#000', border: '1px inset #808080', padding: '4px', fontSize: '11px' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <button 
          onClick={handleTalk}
          style={{ background: '#c0c0c0', border: '2px outset #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          🎤 Puhu Spacemonkeylle
        </button>
        <button 
          onClick={handleGodMode}
          style={{ background: '#c0c0c0', border: '2px outset #ffffff', borderRightColor: '#808080', borderBottomColor: '#808080', padding: '4px', fontWeight: 'bold', cursor: 'pointer', color: '#b91c1c' }}
        >
          ⚡ Jumalatietoisuus
        </button>
      </div>

      <div style={{ padding: '4px', background: '#ffffff', border: '1px inset #808080', minHeight: '35px', color: '#047857', fontWeight: 'bold' }}>
        {response}
      </div>
    </div>
  );
};
