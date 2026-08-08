import React, { useState } from 'react';

/**
 * Spacemonkey Brain Module (E2E Python Connected)
 * Kytketty suoraan Python-taustamoottoriin (portti 8002).
 */
export const SpacemonkeyBrainModule = ({ className = '' }) => {
  const [messages, setMessages] = useState([
    { sender: 'spacemonkey', text: 'Spacemonkey Brain Python Core kytketty ja valmiina.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    // Lisätään käyttäjän viesti ruudulle
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      // 🚀 AITO E2E-KUTSU PYTHON-TAUSTAMOOTTORILLE
      const response = await fetch('http://127.0.0.1:8002/api/spacemonkey/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: userText }),
      });

      if (!response.ok) {
        throw new Error('Yhteysvirhe Python-taustajärjestelmään');
      }

      const data = await response.json();

      // Lisätään Python-moottorin aito vastaus ruudulle
      setMessages((prev) => [
        ...prev,
        { sender: 'spacemonkey', text: data.result }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'spacemonkey', text: 'Virhe: Ei saatu yhteyttä Python-taustamoottoriin.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-[#181a24] border border-[#282b3d] rounded-xl p-5 space-y-4 text-gray-200 ${className}`}>
      {/* Otsikkopalkki */}
      <div className="flex justify-between items-center border-b border-[#282b3d] pb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            SPACEMONKEY BRAIN (PYTHON E2E)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {loading ? 'Processing Python...' : 'Python Engine Connected'}
        </div>
      </div>

      {/* Viestit */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-xl text-sm whitespace-pre-wrap max-w-md ${
              m.sender === 'user' 
                ? 'bg-[#8da35e] text-black font-medium' 
                : 'bg-[#222534] text-gray-200 border border-[#33374d]'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Syötekenttä */}
      <form onSubmit={handleSend} className="flex gap-2 pt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Lähetä komento Python-moottorille..."
          disabled={loading}
          className="flex-1 bg-[#111217] border border-[#282b3d] rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#8da35e] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#8da35e] hover:bg-[#9cb668] text-black font-medium px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Käsittelee...' : 'Lähetä'}
        </button>
      </form>
    </div>
  );
};

export default SpacemonkeyBrainModule;
