import React, { useState, useEffect } from 'react';

export const PythonDataModule = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8002/api/pulse/status')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error("Python ei vastaa", err));
  }, []);

  if (!data) return <div className="text-xs text-gray-500">Ladataan Python-dataa...</div>;

  return (
    <div className="bg-[#181a24] p-4 rounded-lg border border-emerald-900/30 mt-4">
      <h3 className="text-emerald-500 text-xs font-bold uppercase mb-2">Python Core Bridge</h3>
      <div className="text-xs text-gray-300">
        Branch: {data.git_info.branch} | Levytila käytössä: {data.disk_usage.used_percentage}%
      </div>
    </div>
  );
};
