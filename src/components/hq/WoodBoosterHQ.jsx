import React, { useState } from 'react';

export const WoodBoosterHQ = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ background: '#0f172a', color: '#f8fafc', padding: '2rem', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#38bdf8' }}>🚀 Wood-Booster HQ</h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setActiveTab('overview')} style={{ background: activeTab === 'overview' ? '#0284c7' : '#1e293b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Yleisnäkymä</button>
          <button onClick={() => setActiveTab('kernel')} style={{ background: activeTab === 'kernel' ? '#0284c7' : '#1e293b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Kernel & DB</button>
          <button onClick={() => setActiveTab('agents')} style={{ background: activeTab === 'agents' ? '#0284c7' : '#1e293b', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Agentit</button>
        </nav>
      </header>

      <main>
        {activeTab === 'overview' && (
          <div>
            <h2>Tervetuloa komentokeskukseen</h2>
            <p>Wood-Booster HQ yhdistää käyttöjärjestelmän, ytimen ja autonomiset agentit yhteen hallintapaneeliin.</p>
          </div>
        )}
        {activeTab === 'kernel' && (
          <div>
            <h2>Ytimen ja tietokannan tila</h2>
            <p>Kernel Master, VFS ja muistinhallinta aktiivisena.</p>
          </div>
        )}
        {activeTab === 'agents' && (
          <div>
            <h2>Agenttien hallinta</h2>
            <p>Autonomiset tausta-agentit valmiina komentoja varten.</p>
          </div>
        )}
      </main>
    </div>
  );
};
