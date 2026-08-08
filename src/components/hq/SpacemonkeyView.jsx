// src/components/hq/SpacemonkeyView.jsx
import React, { useState, useEffect } from 'react';
import './MainDashboard.css';

export const SpacemonkeyView = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/spacemonkey/status')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Virhe haettaessa Spacemonkey tietoja:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="hq-loading">Ladataan Spacemonkey-moduulia...</div>;
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
          <button className="nav-btn active" title="Spacemonkey">🧠</button>
          <button className="nav-btn" title="System pulse" onClick={() => window.location.href = '/pulse'}>⚙️</button>
        </nav>
      </aside>

      <div className="hq-main-content">
        <header className="hq-header">
          <h1 className="hq-title">Spacemonkey <span className="hq-highlight">Live</span></h1>
          <p className="hq-description">Agentin reaaliaikainen tila, suorituskyky ja lokit</p>
        </header>

        <section className="hq-top-cards">
          <div className="hq-card">
            <span className="card-icon">🧠</span>
            <div>
              <span className="card-label">Agentin tila</span>
              <strong className="card-val text-pulse-glow">aktiivinen</strong>
            </div>
          </div>
          <div className="hq-card">
            <span className="card-icon">⚡</span>
            <div>
              <span className="card-label">Aktiiviset prosessit</span>
              <strong className="card-val">{metrics?.activeProcesses || '3 kpl'}</strong>
            </div>
          </div>
        </section>

        <section className="hq-chat-section">
          <div className="hq-chat-toolbar">
            <span>Spacemonkey / Reaaliaikainen valvonta</span>
          </div>
          <div className="hq-chat-box">
            <div className="chat-message-row">
              <div className="chat-content">
                <span className="chat-sender">System:</span>
                <span className="chat-text">Agentti kuuntelee rajapintoja ja analysoi puutavarahintoja taustalla.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
