import { useEffect, useRef, useState } from 'react';

const SPACEMONKEY_URL = 'http://localhost:8002/api/spacemonkey/process';

export default function SpacemonkeyChatApp() {
  const [messages, setMessages] = useState([
    { sender: 'spacemonkey', text: 'Moi. Kysy mitä vain - vastaan oikean Spacemonkey-ytimen kautta.' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const res = await fetch(SPACEMONKEY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Spacemonkey-ydin vastasi virheellä.');
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'spacemonkey',
          text: data.reply,
          mode: data.system?.personality_profile?.primary_mode,
        },
      ]);
    } catch (_err) {
      setError('Ei saatu yhteyttä Spacemonkey-ytimeen (backend/main.py, portti 8002).');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="chat-app">
      <div className="chat-messages" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-row ${m.sender === 'user' ? 'user' : 'spacemonkey'}`}>
            {m.sender === 'spacemonkey' && m.mode && (
              <div className="chat-mode-label">{m.mode}</div>
            )}
            <div className="chat-bubble">{m.text}</div>
          </div>
        ))}
        {sending && (
          <div className="chat-row spacemonkey">
            <div className="chat-bubble chat-bubble-pending">...</div>
          </div>
        )}
      </div>

      {error && <p className="chat-error">{error}</p>}

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Kirjoita viesti Spacemonkeylle..."
          disabled={sending}
          autoFocus
        />
        <button type="submit" disabled={sending || !input.trim()}>
          Lähetä
        </button>
      </form>
    </div>
  );
}
