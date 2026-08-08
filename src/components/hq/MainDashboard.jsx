// src/components/hq/MainDashboard.jsx
import React, { useState, useEffect } from 'react';
import './MainDashboard.css';

export const MainDashboard = () => {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const GITGUARDIAN_BASE = 'http://localhost:8002/api/gitguardian';

  const [backupStatus, setBackupStatus] = useState('pending');
  const [backupMessage, setBackupMessage] = useState('Ladataan...');

  const [chatMessages, setChatMessages] = useState([
    { sender: 'HQ System', text: 'Moduulit ladattu. Valmiina.', avatar: 'https://api.iconify.design/lucide:terminal.svg' },
    { sender: 'System Pulse', text: 'Kaikki järjestelmät vihreällä. Viive 12ms.', avatar: 'https://api.iconify.design/lucide:activity.svg' },
    { sender: 'Spacemonkey', text: 'Yo! Kaikki järjestelmät rullaavat timmissä kunnossa.', avatar: 'https://api.iconify.design/lucide:bot.svg' },
  ]);
  const [currentInput, setCurrentInput] = useState('');

  const loadGitGuardianStatus = () => {
    fetch(`${GITGUARDIAN_BASE}/status`)
      .then((res) => res.json())
      .then((data) => {
        setStatusData(data);
        setLoading(false);

        if (!data.online) {
          setBackupStatus('error');
          setBackupMessage(data.error || 'Git Guardian ei tavoitettavissa');
          return;
        }

        if (data.security?.safe === false) {
          setBackupStatus('error');
          setBackupMessage('Turvallisuusriski havaittu - varmuuskopiointi estetty');
        } else if (!data.is_dirty) {
          setBackupStatus('ready');
          setBackupMessage('Vakaa - kaikki varmuuskopioitu');
        } else {
          setBackupStatus('pending');
          setBackupMessage(`${data.changes} tallentamatonta muutosta`);
        }
      })
      .catch((err) => {
        console.error("Virhe haettaessa Git Guardian -tietoja:", err);
        setLoading(false);
        setBackupStatus('error');
        setBackupMessage('Git Guardian ei tavoitettavissa');
      });
  };

  useEffect(() => {
    loadGitGuardianStatus();
    const interval = setInterval(loadGitGuardianStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerBackup = () => {
    setBackupMessage('Luodaan varmuuskopiota...');

    fetch(`${GITGUARDIAN_BASE}/backup`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setBackupStatus('error');
          setBackupMessage(data.message);
          setChatMessages(prev => [
            ...prev,
            { sender: 'Spacemonkey', text: `Varmuuskopiointi estetty: ${data.message}`, avatar: '/spacemonkey.png' }
          ]);
          return;
        }

        setChatMessages(prev => [
          ...prev,
          { sender: 'Spacemonkey', text: data.message, avatar: '/spacemonkey.png' }
        ]);

        loadGitGuardianStatus();
      })
      .catch(err => {
        console.error(err);
        setBackupStatus('error');
        setBackupMessage('Virhe varmuuskopioinnissa');
      });
  };

  const handleSendMessage = () => {
    if (currentInput.trim() === '') return;
    setChatMessages(prev => [...prev, { sender: 'User', text: currentInput, avatar: '/fisherman.png' }]);
    setCurrentInput('');
  };

  if (loading) {
    return <div className="hq-loading">Ladataan Wood-Booster HQ...</div>;
  }

  return (
    <div className="hq-layout-container">
      
      {/* Vasen sivupaneeli */}
      <aside className="hq-sidebar">
        <div className="hq-sidebar-logo">
          <img
            src="/fisherman.png"
            alt="Wood-Booster Logo"
            className="sidebar-logo-img" 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="logo-fallback" style={{display: 'none'}}>WB</div>
        </div>
        <nav className="hq-nav-links">
          <button className="nav-btn active" title="Komentokeskus" onClick={() => window.location.href = '/'}>🏠</button>
          <button className="nav-btn" title="Projektit" onClick={() => window.location.href = '/projects'}>📊</button>
          <button className="nav-btn" title="Spacemonkey: aktiivinen">🧠</button>
          <button className="nav-btn" title="System pulse">⚙️</button>
        </nav>
      </aside>

      {/* Pääsisällön alue */}
      <div className="hq-main-content">
        
        <header className="hq-header">
          <div>
            <h1 className="hq-title">Wood-Booster <span className="hq-highlight">HQ</span></h1>
            <p className="hq-description">Älykäs puualan liiketoiminnan komentokeskus</p>
          </div>
        </header>

        {/* Yläosan kortit */}
        <section className="hq-top-cards">
          <div className="hq-card clickable" onClick={() => window.location.href = '/projects'}>
            <span className="card-icon">📁</span>
            <div>
              <span className="card-label">Projektit</span>
            </div>
          </div>

          <div className="hq-card">
            <span className="card-icon">🧠</span>
            <div>
              <span className="card-label">Spacemonkey</span>
              <strong className="card-val text-pulse-glow">aktiivinen</strong>
            </div>
          </div>

          <div
            className={`hq-card action-card ${backupStatus}`}
            onClick={handleTriggerBackup}
            title="Paina tehdäksesi varmuuskopio (Git Guardian)"
          >
            <span className="card-icon">🛡</span>
            <div>
              <span className="card-label">Git Guardian</span>
              <strong className="card-val text-pulse-glow">{backupMessage}</strong>
            </div>
          </div>
        </section>

        {/* Chatti- ja keskustelualue */}
        <section className="hq-chat-section">
          <div className="hq-chat-toolbar">
            <span>Spacemonkey / Keskusteluhistoria</span>
          </div>
          <div className="hq-chat-box">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="chat-message-row">
                <img 
                  src={msg.avatar} 
                  alt="avatar" 
                  className="chat-avatar" 
                  onError={(e) => { 
                    e.target.src = 'https://via.placeholder.com/32'; 
                  }} 
                />
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
              placeholder="Kirjoita komento tai kysymys agentille (esim. 'Analysoi hinta...')"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button className="hq-send-btn" onClick={handleSendMessage}>Lähetä</button>
          </div>
        </section>

        <footer className="hq-footer">
          <span>Viimeisin päivitys: {statusData?.pulse?.lastChecked || 'Juuri nyt'}</span>
        </footer>

      </div>
    </div>
  );
};
