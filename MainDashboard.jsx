// src/components/hq/MainDashboard.jsx
import React, { useState, useEffect } from 'react';
import './MainDashboard.css';

export const MainDashboard = () => {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [backupStatus, setBackupStatus] = useState('pending');
  const [backupMessage, setBackupMessage] = useState('Ei aktiivinen');

  const [chatMessages, setChatMessages] = useState([
    { sender: 'HQ System', text: 'Moduulit ladattu. Valmiina.', avatar: '/fisherman-logo.png' },
    { sender: 'System Pulse', text: 'Kaikki järjestelmät vihreällä. Viive 12ms.', avatar: '/fisherman-logo.png' },
    { sender: 'Spacemonkey', text: 'Yo! Kaikki järjestelmät rullaavat timmissä kunnossa.', avatar: '/spacemonkey-avatar.png' },
  ]);
  const [currentInput, setCurrentInput] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/status')
      .then((res) => res.json())
      .then((data) => {
        setStatusData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Virhe haettaessa HQ status-tietoja:", err);
        setLoading(false);
      });
  }, []);

  const handleTriggerBackup = () => {
    setBackupStatus('pending');
    setBackupMessage('Luodaan varmuuskopiota...');
    
    fetch('http://localhost:5000/api/recovery/snapshot', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setBackupStatus('ready');
        setBackupMessage('Valmis / Varmuuskopioitu');
        setChatMessages(prev => [
          ...prev, 
          { sender: 'Spacemonkey', text: 'Snapshot ja varmuuskopio tehty onnistuneesti!', avatar: '/spacemonkey-avatar.png' }
        ]);
      })
      .catch(err => {
        console.error(err);
        setBackupMessage('Virhe varmuuskopioinnissa');
      });
  };

  const handleSendMessage = () => {
    if (currentInput.trim() === '') return;
    setChatMessages(prev => [...prev, { sender: 'User', text: currentInput, avatar: '/fisherman-logo.png' }]);
    setCurrentInput('');
  };

  if (loading) {
    return <div className="hq-loading">Ladataan Wood-Booster HQ...</div>;
  }

  return (
    <div className="hq-layout-container">
      
      {/* 1. VASEN SIVUPANEELI (Kalastaja-logo) */}
      <aside className="hq-sidebar">
        <div className="hq-sidebar-logo">
          <img src="/fisherman-logo.png" alt="Wood-Booster Logo" className="sidebar-logo-img" />
        </div>
        <nav className="hq-nav-links">
          <button className="nav-btn active" title="Komentokeskus">🏠</button>
          <button className="nav-btn" title="System Pulse & Varmuuskopiot">📊</button>
          <button className="nav-btn" title="AI Agentit">🧠</button>
          <button className="nav-btn" title="Asetukset">⚙️</button>
        </nav>
      </aside>

      {/* PÄÄSISÄLTÖN ALUE */}
      <div className="hq-main-content">
        
        {/* Ylätunniste */}
        <header className="hq-header">
          <div>
            <h1 className="hq-title">Wood-Booster <span className="hq-highlight">HQ</span></h1>
            <p className="hq-description">Älykäs puualan liiketoiminnan komentokeskus</p>
          </div>
        </header>

        {/* 2. YLÄOSAN NAPIT / STATUSKORTIT */}
        <section className="hq-top-cards">
          <div className="hq-card clickable" onClick={() => alert('Siirrytään System Pulse -pääsivulle...')}>
            <span className="card-icon">📊</span>
            <div>
              <span className="card-label">Järjestelmän tila (System Pulse)</span>
              <strong className="card-val healthy">{statusData?.pulse?.status || 'Optimaalinen'}</strong>
            </div>
          </div>

          <div className="hq-card">
            <span className="card-icon">🧠</span>
            <div>
              <span className="card-label">Aktiiviset agentit</span>
              <strong className="card-val">{statusData?.brain?.agentsCount || 5} kpl</strong>
            </div>
          </div>

          <div 
            className={`hq-card action-card ${backupStatus}`} 
            onClick={handleTriggerBackup}
            title="Paina tehdäksesi varmuuskopio / snapshot"
          >
            <span className="card-icon">♻️</span>
            <div>
              <span className="card-label">Palautus & Varmuuskopio</span>
              <strong className="card-val">{backupMessage}</strong>
            </div>
          </div>
        </section>

        {/* 3. KESKUSTELUALUE JA CHAT (Spacemonkey mukana) */}
        <section className="hq-chat-section">
          <div className="hq-chat-toolbar">
            <span>Keskusteluhistoria & Spacemonkey</span>
          </div>
          <div className="hq-chat-box">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="chat-message-row">
                <img src={msg.avatar} alt="avatar" className="chat-avatar" />
                <div className="chat-content">
                  <span className="chat-sender">{msg.sender}:</span>
                  <span className="chat-text">{msg.text}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="hq-input-row">
            <input 
              type="text" 
              className="hq-text-input"
              placeholder="Kirjoita komento tai kysymys Spacemonkeylle..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button className="hq-send-btn" onClick={handleSendMessage}>Lähetä</button>
          </div>
        </section>

        {/* Alatunniste */}
        <footer className="hq-footer">
          <span>Viimeisin päivitys: {statusData?.pulse?.lastChecked || 'Juuri nyt'}</span>
        </footer>

      </div>
    </div>
  );
};
