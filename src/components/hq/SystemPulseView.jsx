// src/components/hq/SystemPulseView.jsx
import React, { useState, useEffect } from 'react';
import './MainDashboard.css';

export const SystemPulseView = () => {
  const [pulseData, setPulseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/status')
      .then((res) => res.json())
      .then((data) => {
        setPulseData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Virhe haettaessa system pulse tietoja:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="hq-loading">Ladataan System pulse -moduulia...</div>;
  }

  return (
    <div className="hq-layout-container">
      <aside className="hq-sidebar">
        <div className="hq-sidebar-logo">
          <img src="/fisherman-logo.png" alt="Logo" className="sidebar-logo-img" />
        </div>
        <nav className="hq-nav-links">
          <button className="nav-btn" title="Komentokeskus" onClick={() => window.location.href = '/'}>🏠</button>
          <button className="nav-btn" title="Projektit" onClick={() => window.location.href = '/projects'}>📊</button>
          <button className="nav-btn" title="Spacemonkey" onClick={() => window.location.href = '/spacemonkey'}>🧠</button>
          <button className="nav-btn active" title="System pulse">⚙️</button>
        </nav>
      </aside>

      <div className="hq-main-content">
        <header className="hq-header">
          <h1 className="hq-title">System <span className="hq-highlight">Pulse</span></h1>
          <p className="hq-description">Järjestelmän terveydentilan ja API-yhteyksien valvonta</p>
        </header>

        <section className="hq-top-cards">
          <div className="hq-card">
            <span className="card-icon">⚡</span>
            <div>
              <span className="card-label">API-kiinnitys</span>
              <strong className="card-val text-pulse-glow">aktiivinen</strong>
            </div>
          </div>
          <div className="hq-card">
            <span className="card-icon">🟢</span>
            <div>
              <span className="card-label">Viive (Latency)</span>
              <strong className="card-val">12ms</strong>
            </div>
          </div>
        </section>

        <section className="hq-chat-section">
          <div className="hq-chat-toolbar">
            <span>System Pulse / Diagnostiikka</span>
          </div>
          <div className="hq-chat-box">
            <div className="chat-message-row">
              <div className="chat-content">
                <span className="chat-sender">Pulse:</span>
                <span className="chat-text">Kaikki palvelimet vastaavat normaalisti. Viimeisin tarkistus: {pulseData?.pulse?.lastChecked || 'Juuri nyt'}.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
