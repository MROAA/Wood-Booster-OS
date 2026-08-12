import React, { useState } from 'react';
import { cppBridge } from '../kernel/cppBridge';

export const CppBridgePanel: React.FC = () => {
  const [result, setResult] = useState('Valmiina C/C++ vektorihakuun.');

  const handleRunNativeSearch = () => {
    const dummyQuery = [0.8, 0.5, 0.2];
    const dummyMemoryBank = [
      [0.1, 0.1, 0.9],
      [0.7, 0.6, 0.3], // Lähin osuma
      [0.0, 0.0, 0.1]
    ];
    
    const match = cppBridge.executeRAGVectorSearch(dummyQuery, dummyMemoryBank);
    setResult(`⚡ C++ RAG haku valmis! Lähin muistipala löytyi indeksistä: ${match}`);
  };

  return (
    <div style={{ padding: '12px', background: '#09090b', color: '#fafafa', borderRadius: '8px', border: '1px solid #0284c7', fontSize: '12px', fontFamily: "'MS Sans Serif', Tahoma, sans-serif", display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontWeight: 'bold', color: '#38bdf8', textAlign: 'center' }}>⚙️ SPACEMONKEY C/C++ RAG & VECTOR ENGINE</div>

      <button 
        onClick={handleRunNativeSearch}
        style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
      >
        🚀 Suorita natiivi C++ vektorihaku
      </button>

      <div style={{ background: '#121214', color: '#38bdf8', padding: '6px', borderRadius: '4px', fontSize: '11px' }}>
        <b>C/C++ Log:</b> {result}
      </div>
    </div>
  );
};
