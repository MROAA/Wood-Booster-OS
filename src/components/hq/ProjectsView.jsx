// src/components/hq/ProjectsView.jsx
import React, { useState, useEffect } from 'react';
import './MainDashboard.css';

export const ProjectsView = () => {
  const [modules, setModules] = useState({ services: [], backend: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/modules')
      .then((res) => res.json())
      .then((data) => {
        setModules(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Virhe haettaessa moduuleita:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="hq-layout-container">
      <aside className="hq-sidebar">
        <div className="hq-sidebar-logo">
          <img src="/fisherman-logo.png" alt="Logo" className="sidebar-logo-img" />
        </div>
        <nav className="hq-nav-links">
          <button className="nav-btn" title="Komentokeskus" onClick={() => window.location.href = '/'}>🏠</button>
          <button className="nav-btn active" title="Projektit">📊</button>
          <button className="nav-btn" title="Spacemonkey" onClick={() => window.location.href = '/spacemonkey'}>🧠</button>
          <button className="nav-btn" title="System pulse" onClick={() => window.location.href = '/pulse'}>⚙️</button>
        </nav>
      </aside>

      <div className="hq-main-content">
        <header className="hq-header">
          <h1 className="hq-title">Projektinhallinta & <span className="hq-highlight">Moduulit</span></h1>
          <p className="hq-description">Reaaliaikainen näkymä levylä löytyviin services- ja backend-rakenteisiin</p>
        </header>

        <section className="hq-top-cards">
          <div className="hq-card">
            <span className="card-icon">📂</span>
            <div>
              <span className="card-label">Services-kansio</span>
              <strong className="card-val text-pulse-glow">{modules.services.length} tiedostoa/moduulia</strong>
            </div>
          </div>
          <div className="hq-card">
            <span className="card-icon">⚙️</span>
            <div>
              <span className="card-label">Backend-kansio</span>
              <strong className="card-val text-pulse-glow">{modules.backend.length} tiedostoa/moduulia</strong>
            </div>
          </div>
        </section>

        <section className="hq-chat-section">
          <div className="hq-chat-toolbar">
            <span>Levyltä lasketut moduulit</span>
          </div>
          <div className="hq-chat-box">
            <div className="chat-message-row">
              <div className="chat-content">
                <span className="chat-sender">Services:</span>
                <span className="chat-text">{modules.services.join(', ') || 'Ei tiedostoja'}</span>
              </div>
            </div>
            <div className="chat-message-row">
              <div className="chat-content">
                <span className="chat-sender">Backend:</span>
                <span className="chat-text">{modules.backend.join(', ') || 'Ei tiedostoja'}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
