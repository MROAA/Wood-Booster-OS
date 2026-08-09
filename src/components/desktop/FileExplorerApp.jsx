import { useEffect, useState } from 'react';

const DESKTOP_BASE = 'http://localhost:8002/api/desktop';

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileExplorerApp() {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);

  function loadDirectory(path) {
    setLoading(true);
    setError('');
    setSelectedFile(null);
    setFileContent(null);
    fetch(`${DESKTOP_BASE}/list?path=${encodeURIComponent(path)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.detail) {
          setError(data.detail);
          setEntries([]);
        } else {
          setCurrentPath(data.path);
          setEntries(data.entries);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDirectory('');
  }, []);

  function openEntry(entry) {
    if (entry.type === 'dir') {
      loadDirectory(entry.path);
      return;
    }
    setSelectedFile(entry);
    setFileLoading(true);
    setFileContent(null);
    fetch(`${DESKTOP_BASE}/read?path=${encodeURIComponent(entry.path)}`)
      .then((res) => res.json())
      .then((data) => setFileContent(data))
      .catch((err) => setFileContent({ readable: false, message: err.message }))
      .finally(() => setFileLoading(false));
  }

  function goUp() {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    loadDirectory(parts.join('/'));
  }

  const breadcrumbParts = currentPath ? currentPath.split('/') : [];

  return (
    <div className="explorer-app">
      <div className="explorer-toolbar">
        <button onClick={goUp} disabled={!currentPath} className="explorer-up-btn">
          ↑ Ylös
        </button>
        <span className="explorer-breadcrumb">/{breadcrumbParts.join(' / ')}</span>
      </div>

      <div className="explorer-panes">
        <div className="explorer-pane-list">
          {loading && <p className="explorer-hint">Ladataan...</p>}
          {error && <p className="explorer-error">{error}</p>}

          {!loading && !error && (
            <div className="explorer-entries">
              {entries.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => openEntry(entry)}
                  className={`explorer-entry ${selectedFile?.path === entry.path ? 'selected' : ''}`}
                >
                  <span>
                    {entry.type === 'dir' ? '📁' : '📄'} {entry.name}
                  </span>
                  <span className="explorer-entry-size">{formatSize(entry.size)}</span>
                </button>
              ))}
              {entries.length === 0 && <p className="explorer-hint">Kansio on tyhjä.</p>}
            </div>
          )}
        </div>

        <div className="explorer-pane-preview">
          {!selectedFile && (
            <p className="explorer-hint">Valitse tiedosto vasemmalta esikatsellaksesi sen sisällön.</p>
          )}
          {selectedFile && (
            <>
              <div className="explorer-preview-name">{selectedFile.name}</div>
              {fileLoading && <p className="explorer-hint">Ladataan...</p>}
              {!fileLoading && fileContent && !fileContent.readable && (
                <p className="explorer-hint">{fileContent.message}</p>
              )}
              {!fileLoading && fileContent?.readable && (
                <pre className="explorer-preview-content">{fileContent.content}</pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
