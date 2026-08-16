import React, { useState, useEffect } from 'react';
import { altrakoEngine } from '../../services/AltrakoEngine';

export const AltrakoReflection = () => {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');

  // Ladataan historia
  useEffect(() => {
    setHistory(altrakoEngine.getMemoryHistory());
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    altrakoEngine.analyze({ decision: input, context: "User Input" });
    setHistory(altrakoEngine.getMemoryHistory());
    setInput('');
  };

  return (
    <div style={{ background: '#1a202c', padding: '1.25rem', borderRadius: '12px', color: '#fff', border: '1px solid #4a5568' }}>
      <h3 style={{ color: '#63b3ed', marginTop: 0 }}>🐵 Altrako Dialogi (v1.0)</h3>
      
      <div style={{ height: '300px', overflowY: 'auto', background: '#2d3748', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        {history.slice().reverse().map((entry, i) => (
          <div key={i} style={{ marginBottom: '1rem', borderBottom: '1px solid #4a5568', paddingBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#a0aec0' }}>{new Date(entry.timestamp).toLocaleTimeString()}</div>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}><strong>SM:</strong> {entry.decision}</div>
            <div style={{ fontSize: '0.85rem', color: '#68d391' }}><strong>Altrako:</strong> {entry.analysis.recommendation}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Syötä päätös..." 
          style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: 'none' }}
        />
        <button style={{ background: '#319795', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }}>Lähetä</button>
      </form>
    </div>
  );
};
