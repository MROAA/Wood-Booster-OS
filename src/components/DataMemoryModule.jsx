import React, { useState, useEffect } from 'react';

export const DataMemoryModule = () => {
  const [memories, setMemories] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchMemories = () => {
    fetch('http://127.0.0.1:8002/api/data/memories')
      .then(res => res.json())
      .then(d => setMemories(d.memories || []))
      .catch(err => console.error('Tiedonhakuvirhe:', err));
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    fetch('http://127.0.0.1:8002/api/data/memories/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    })
      .then(res => res.json())
      .then(() => {
        setTitle('');
        setContent('');
        fetchMemories();
      })
      .catch(err => console.error('Tallennusvirhe:', err));
  };

  return (
    <div className="bg-[#181a24] p-5 rounded-xl border border-[#282b3d] space-y-4 text-gray-200 mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
        Python Persistent Memory Core
      </h3>

      <form onSubmit={handleSave} className="space-y-3">
        <input
          type="text"
          placeholder="Otsikko / Aihe..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-[#111217] border border-[#282b3d] rounded p-2 text-sm text-white focus:outline-none"
        />
        <textarea
          placeholder="Muistiinpano tai data joka tallennetaan levylle..."
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full bg-[#111217] border border-[#282b3d] rounded p-2 text-sm text-white focus:outline-none h-20"
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded"
        >
          Tallenna muistiin (Python DB)
        </button>
      </form>

      <div className="pt-2 border-t border-[#282b3d]">
        <h4 className="text-xs font-bold text-gray-400 mb-2">Tallennetut muistimerkinnät ({memories.length}):</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {memories.map((m, idx) => (
            <div key={idx} className="bg-[#111217] p-2.5 rounded border border-[#282b3d] text-xs">
              <div className="font-bold text-emerald-400">{m.title}</div>
              <div className="text-gray-300">{m.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
