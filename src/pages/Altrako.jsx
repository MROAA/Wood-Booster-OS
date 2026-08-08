import React, { useState } from 'react';

export default function AltrakoPage() {
  const [command, setCommand] = useState('');
  const [responseLog, setResponseLog] = useState([
    { sender: 'Altrako', text: 'HEI HEI! Altrako valmiina vahtimaan portteja! 🍌🛡️' }
  ]);
  const [statusInfo, setStatusInfo] = useState({
    mood: 'Hyper-Koodaaja 🚀',
    blockedCount: 42
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    const userMsg = command;
    setCommand('');
    setResponseLog(prev => [...prev, { sender: 'Sinä', text: userMsg }]);

    try {
      const res = await fetch('http://localhost:8002/api/altrako/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userMsg })
      });
      const data = await res.json();

      setStatusInfo({
        mood: data.current_mood,
        blockedCount: data.blocked_count
      });

      setResponseLog(prev => [...prev, { sender: 'Altrako', text: data.reply }]);
    } catch (err) {
      setResponseLog(prev => [...prev, { sender: 'Altrako', text: 'Hups! Yhteys ytimeen pätkäisi, mutta banaani pitää mut pystyssä! 🍌' }]);
    }
  };

  return (
    <div style={{ padding: '2rem', color: '#fff', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🐵 Altrako: Core Guardian & Shield</h1>
      <p style={{ color: '#a0aec0' }}>Järjestelmän impulsiivinen, ystävällinen ja herkeämätön turva-apina.</p>

      {/* Tilapaneeli */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#2d3748', padding: '1rem', borderRadius: '8px', flex: 1 }}>
          <strong>Mieliala:</strong> <span style={{ color: '#68d391' }}>{statusInfo.mood}</span>
        </div>
        <div style={{ background: '#2d3748', padding: '1rem', borderRadius: '8px', flex: 1 }}>
          <strong>Torjuttuja hyökkäyksiä:</strong> <span style={{ color: '#f6ad55' }}>{statusInfo.blockedCount} 🍌</span>
        </div>
      </div>

      {/* Chat / Lokilaatikko */}
      <div style={{ background: '#1a202c', border: '1px solid #4a5568', borderRadius: '8px', height: '350px', overflowY: 'auto', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {responseLog.map((log, index) => (
          <div key={index} style={{ background: log.sender === 'Altrako' ? '#2b6cb0' : '#4a5568', padding: '0.75rem 1rem', borderRadius: '6px', maxWidth: '80%', alignSelf: log.sender === 'Altrako' ? 'flex-start' : 'flex-end' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginBottom: '0.2rem' }}>{log.sender}</span>
            {log.text}
          </div>
        ))}
      </div>

      {/* Syötekenttä */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Testaa Altrakon suojelua tai kokeile esim. 'sudo rm -rf'..."
          style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }}
        />
        <button type="submit" style={{ background: '#319795', color: '#fff', border: 'none', padding: '0 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Komenna 🚀
        </button>
      </form>
    </div>
  );
}
